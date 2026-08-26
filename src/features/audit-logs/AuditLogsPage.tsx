import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Laptop, 
  Activity, 
  RefreshCw, 
  Sparkles, 
  Download, 
  Eye, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  FileJson,
  Layers,
  FileText
} from 'lucide-react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { SessionTimelineModal } from './components/SessionTimelineModal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import type { UserSession, AuditLog } from '../../types/audit';

export const AuditLogsPage: React.FC = () => {
  const {
    sessions,
    logs,
    loading,
    filters,
    setFilters,
    selectedSessionId,
    setSelectedSessionId,
    selectedSessionEvents,
    selectedSessionDetails,
    refresh
  } = useAuditLogs();

  const [activeTab, setActiveTab] = useState<'sessions' | 'logs'>('sessions');
  const [selectedLogForModal, setSelectedLogForModal] = useState<AuditLog | null>(null);

  const calculateDuration = (startStr: string, endStr: string | null) => {
    const start = new Date(startStr).getTime();
    const end = endStr ? new Date(endStr).getTime() : Date.now();
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    if (diffMins > 60) {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
    return `${diffMins}m ${diffSecs}s`;
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Audit_Logs_FUS_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'LOGOUT':
        return 'bg-secondary text-muted-foreground border-border';
      case 'CREATE':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'UPDATE':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'DELETE':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="space-y-8 pb-20 overflow-visible">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground uppercase italic flex items-center gap-2">
            Administration → Logs & Audit <Sparkles className="w-6 h-6 text-primary" />
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Traçabilité professionnelle des sessions, historique des modifications et événements du back-office
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={refresh}
            variant="outline"
            size="icon"
            className="w-11 h-11 rounded-xl shrink-0"
            title="Rafraîchir les logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </Button>

          <Button
            onClick={handleExportJSON}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20"
          >
            <Download className="w-4 h-4" /> Exporter JSON
          </Button>
        </div>
      </div>

      {/* Tabs Selection */}
      <div className="flex items-center gap-2 p-1.5 bg-secondary/30 rounded-2xl border border-border w-fit">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'sessions'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" /> Sessions Utilisateurs ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'logs'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="w-4 h-4" /> Événements d'Audit ({logs.length})
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            placeholder="Rechercher par utilisateur, session_id, action, IP, description..."
            className="pl-10 h-11 bg-secondary/30 border-transparent focus:bg-background transition-all rounded-xl font-medium"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar w-full lg:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground mr-1 shrink-0" />

          {/* Action Filter */}
          {activeTab === 'logs' && (
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="h-9 px-3 bg-secondary/50 text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest rounded-lg border-none outline-none cursor-pointer"
            >
              <option value="ALL">ACTION: TOUTES</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="VIEW">VIEW</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="EXPORT">EXPORT</option>
            </select>
          )}

          {/* Module Filter */}
          {activeTab === 'logs' && (
            <select
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              className="h-9 px-3 bg-secondary/50 text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest rounded-lg border-none outline-none cursor-pointer"
            >
              <option value="ALL">MODULE: TOUS</option>
              <option value="AUTH">AUTH</option>
              <option value="USERS">USERS</option>
              <option value="TEAMS">TEAMS</option>
              <option value="PLAYERS">PLAYERS</option>
              <option value="ARBITRES">ARBITRES</option>
              <option value="MATCHES">MATCHES</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          )}

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="h-9 px-3 bg-secondary/50 text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest rounded-lg border-none outline-none cursor-pointer"
          >
            <option value="ALL">STATUT: TOUS</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="LOGGED_OUT">LOGGED_OUT</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>

          {/* Date Picker Start */}
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="h-9 px-2 bg-secondary/50 text-muted-foreground text-xs font-bold rounded-lg border-none outline-none cursor-pointer"
            title="Date de début"
          />

          {/* Date Picker End */}
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="h-9 px-2 bg-secondary/50 text-muted-foreground text-xs font-bold rounded-lg border-none outline-none cursor-pointer"
            title="Date de fin"
          />
        </div>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm font-medium">Chargement des données d'audit...</p>
        </div>
      ) : activeTab === 'sessions' ? (
        /* TAB 1: SESSIONS LIST */
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/20 border-b border-border">
                <tr>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session ID</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Utilisateur</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connexion / Déconnexion</th>
                  <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Durée</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">IP & Appareil</th>
                  <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Événements</th>
                  <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</th>
                  <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.length > 0 ? (
                  sessions.map((s) => (
                    <tr key={s.session_id} className="hover:bg-secondary/10 transition-colors group">
                      <td className="py-4 px-6 font-mono text-xs font-bold text-primary">
                        {s.session_id}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-sm text-foreground">{s.user_email || 'Anonyme'}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">{s.user_role || 'Membre'}</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-muted-foreground">
                        <div>In: <strong className="text-foreground">{new Date(s.login_at).toLocaleString('fr-FR')}</strong></div>
                        {s.logout_at && <div>Out: {new Date(s.logout_at).toLocaleString('fr-FR')}</div>}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-xs text-foreground">
                        {calculateDuration(s.login_at, s.logout_at)}
                      </td>
                      <td className="py-4 px-6 text-xs text-muted-foreground">
                        <div className="font-bold text-foreground">{s.device || 'Desktop'}</div>
                        <div className="font-mono text-[10px]">{s.ip_address}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-black text-xs">
                          {s.event_count || 0}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-secondary text-muted-foreground border-border'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          onClick={() => setSelectedSessionId(s.session_id)}
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-xs font-bold gap-1.5 hover:bg-primary hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5" /> Timeline
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs italic">
                      Aucune session trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: GRANULAR AUDIT LOGS */
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/20 border-b border-border">
                <tr>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Horodatage</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action & Module</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Utilisateur</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</th>
                  <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Modifications</th>
                  <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/10 transition-colors group">
                      <td className="py-4 px-6 font-mono text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getActionBadgeClass(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">{log.module}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-xs text-foreground">{log.user_email || 'Système'}</div>
                        <div className="font-mono text-[9px] text-primary">{log.session_id}</div>
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-foreground max-w-md">
                        {log.description}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {(log.old_values || log.new_values) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                            <FileJson className="w-3 h-3" /> Diff JSON
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-600 border-red-500/30'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs italic">
                      Aucun événement d'audit enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Session Timeline Modal */}
      <SessionTimelineModal
        isOpen={!!selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
        session={selectedSessionDetails}
        events={selectedSessionEvents}
      />
    </div>
  );
};

export default AuditLogsPage;
