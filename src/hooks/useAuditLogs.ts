import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AuditLogger } from '../services/auditLogger';
import type { UserSession, AuditLog, AuditAction, AuditModule, AuditOutcome } from '../types/audit';

export interface AuditFilters {
  searchTerm: string;
  userId: string;
  sessionId: string;
  action: string;
  module: string;
  status: string;
  entityType: string;
  startDate: string;
  endDate: string;
  ipAddress: string;
}

export const useAuditLogs = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<AuditFilters>({
    searchTerm: '',
    userId: 'ALL',
    sessionId: 'ALL',
    action: 'ALL',
    module: 'ALL',
    status: 'ALL',
    entityType: 'ALL',
    startDate: '',
    endDate: '',
    ipAddress: '',
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch User Sessions
      const { data: dbSessions, error: sessErr } = await supabase
        .from('user_sessions')
        .select('*')
        .order('login_at', { ascending: false });

      // 2. Fetch Audit Logs
      const { data: dbLogs, error: logsErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      const localLogs = AuditLogger.getLocalCachedLogs();
      const localSessions = AuditLogger.getLocalCachedSessions();

      const combinedLogs: AuditLog[] = [
        ...(dbLogs || []),
        ...localLogs.filter(l => !(dbLogs || []).some(dbL => dbL.id === l.id))
      ];

      const combinedSessions: UserSession[] = [
        ...(dbSessions || []),
        ...localSessions.filter(s => !(dbSessions || []).some(dbS => dbS.session_id === s.session_id))
      ];

      // Reconstitution automatique des sessions pour chaque session_id présent dans les logs mais absent des sessions
      const existingSessionIds = new Set(combinedSessions.map(s => s.session_id));
      combinedLogs.forEach(log => {
        if (log.session_id && !existingSessionIds.has(log.session_id)) {
          existingSessionIds.add(log.session_id);
          const sessionEvents = combinedLogs.filter(l => l.session_id === log.session_id);
          const oldestEvent = sessionEvents[sessionEvents.length - 1] || log;
          const newestEvent = sessionEvents[0] || log;

          combinedSessions.push({
            id: log.session_id,
            session_id: log.session_id,
            user_id: log.user_id,
            user_email: log.user_email || 'Utilisateur',
            user_role: log.user_role || 'super_admin',
            ip_address: log.ip_address || '127.0.0.1 (Local)',
            user_agent: log.user_agent || '',
            device: '💻 Ordinateur (Mac)',
            status: 'ACTIVE',
            login_at: oldestEvent.created_at,
            logout_at: null,
            last_activity_at: newestEvent.created_at,
            created_at: oldestEvent.created_at,
            event_count: sessionEvents.length
          });
        }
      });

      // Calculate event counts per session
      const countMap = new Map<string, number>();
      combinedLogs.forEach(l => {
        if (l.session_id) {
          countMap.set(l.session_id, (countMap.get(l.session_id) || 0) + 1);
        }
      });

      const enrichedSessions = combinedSessions.map(s => ({
        ...s,
        event_count: countMap.get(s.session_id) || s.event_count || 0
      }));

      setSessions(enrichedSessions);
      setLogs(combinedLogs);
    } catch (err) {
      console.warn('Fallback to cached audit logs:', err);
      setLogs(AuditLogger.getLocalCachedLogs());
      setSessions(AuditLogger.getLocalCachedSessions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchSearch = filters.searchTerm === '' ||
        (s.session_id && s.session_id.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (s.user_email && s.user_email.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (s.ip_address && s.ip_address.includes(filters.searchTerm));

      const matchUser = filters.userId === 'ALL' || s.user_id === filters.userId || s.user_email === filters.userId;
      const matchStatus = filters.status === 'ALL' || s.status === filters.status;
      const matchIp = !filters.ipAddress || (s.ip_address && s.ip_address.includes(filters.ipAddress));

      const matchStart = !filters.startDate || new Date(s.login_at) >= new Date(filters.startDate);
      const matchEnd = !filters.endDate || new Date(s.login_at) <= new Date(filters.endDate + 'T23:59:59');

      return matchSearch && matchUser && matchStatus && matchIp && matchStart && matchEnd;
    });
  }, [sessions, filters]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = filters.searchTerm === '' ||
        l.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        l.action.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        l.module.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (l.user_email && l.user_email.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (l.session_id && l.session_id.toLowerCase().includes(filters.searchTerm.toLowerCase()));

      const matchUser = filters.userId === 'ALL' || l.user_id === filters.userId || l.user_email === filters.userId;
      const matchSession = filters.sessionId === 'ALL' || l.session_id === filters.sessionId;
      const matchAction = filters.action === 'ALL' || l.action === filters.action;
      const matchModule = filters.module === 'ALL' || l.module === filters.module;
      const matchStatus = filters.status === 'ALL' || l.status === filters.status;
      const matchEntity = filters.entityType === 'ALL' || l.entity_type === filters.entityType;

      const matchStart = !filters.startDate || new Date(l.created_at) >= new Date(filters.startDate);
      const matchEnd = !filters.endDate || new Date(l.created_at) <= new Date(filters.endDate + 'T23:59:59');

      return matchSearch && matchUser && matchSession && matchAction && matchModule && matchStatus && matchEntity && matchStart && matchEnd;
    });
  }, [logs, filters]);

  // Selected session timeline events
  const selectedSessionEvents = useMemo(() => {
    if (!selectedSessionId) return [];
    return logs
      .filter(l => l.session_id === selectedSessionId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [logs, selectedSessionId]);

  const selectedSessionDetails = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessions.find(s => s.session_id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  return {
    sessions: filteredSessions,
    allSessions: sessions,
    logs: filteredLogs,
    allLogs: logs,
    loading,
    filters,
    setFilters,
    selectedSessionId,
    setSelectedSessionId,
    selectedSessionEvents,
    selectedSessionDetails,
    refresh: fetchData,
  };
};
