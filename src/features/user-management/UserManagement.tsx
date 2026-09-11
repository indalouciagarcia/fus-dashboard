import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../context/PermissionsContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Search, 
  Trash2, 
  Edit2, 
  X,
  ShieldCheck,
  Loader2,
  Lock,
  Eye,
  Camera,
  Upload,
  LayoutGrid,
  List,
  Briefcase,
  Layers,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditLogger } from '../../services/auditLogger';
import { PLAYER_CATEGORIES } from '../../constants';

interface SystemUser {
  id: string;
  email: string;
  full_name: string | null;
  system_role: string;
  job_title?: string | null;
  is_active: boolean;
  avatar_url?: string | null;
  categories: string[];
  phone_number?: string | null;
  permissions_overrides?: Record<string, boolean>;
}

const SYSTEM_ROLES = [
  { value: 'super_admin', label: 'Super Administrateur' },
  { value: 'admin', label: 'Administrateur' }
];

const JOB_TITLE_SUGGESTIONS = [
  'Directeur Technique',
  'Entraîneur Principal',
  'Entraîneur Adjoint',
  'Entraîneur des Gardiens',
  'Préparateur Physique',
  'Analyste Vidéo',
  'Médecin',
  'Infirmier',
  'Kinésithérapeute',
  'Scout',
  'Recruteur'
];

const AVAILABLE_PERMISSIONS = [
  { key: 'schedule_match', label: 'Planification des matchs' },
  { key: 'modify_match', label: 'Modification des matchs' },
  { key: 'postpone_match', label: 'Reporter un match' },
  { key: 'change_formation', label: 'Changement du système de jeu' },
  { key: 'live_tracking', label: 'Live Tracking' },
  { key: 'evaluate_players', label: 'Évaluation des joueurs' },
  { key: 'surclass_players', label: 'Surclassement des joueurs' },
  { key: 'medical_records', label: 'Dossier Médical & Blessures' },
  { key: 'manage_recruitment', label: 'Détection & Recrutement' }
];

const AGE_CATEGORIES = PLAYER_CATEGORIES;

const UserManagement: React.FC = () => {
  const { authState, can } = usePermissions();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list'|'grid'>('list');
  const [modalMode, setModalMode] = useState<'none' | 'create' | 'edit' | 'view'>('none');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dbErrors, setDbErrors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    system_role: 'admin',
    job_title: '',
    avatar_url: '' as string | null,
    categories: [] as string[],
    team_ids: [] as string[],
    permissions_overrides: {} as Record<string, boolean>
  });

  const [availableTeams, setAvailableTeams] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data } = await supabase.from('teams').select('id, name, category');
      if (data) setAvailableTeams(data);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' 
                            || (selectedCategoryFilter === 'global' && (!u.categories || u.categories.length === 0))
                            || (u.categories && u.categories.includes(selectedCategoryFilter));
    return matchesSearch && matchesCategory;
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase.rpc('get_all_users');
      if (error) throw error;

      // Fetch all profiles via Edge Function (service_role) to bypass RLS and get job_title/phone_number
      const { data: session } = await supabase.auth.getSession();
      const efRes = await fetch('https://fuhrxfhszttvpkmjydca.supabase.co/functions/v1/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`
        },
        body: JSON.stringify({ action: 'get_all_profiles' })
      });

      const avatarMap = new Map();
      const jobTitleMap = new Map();
      const phoneMap = new Map();

      if (efRes.ok) {
        const efData = await efRes.json();
        efData.profiles?.forEach((p: any) => {
          if (p.avatar_url) avatarMap.set(p.id, p.avatar_url);
          if (p.job_title) jobTitleMap.set(p.id, p.job_title);
          if (p.phone_number) phoneMap.set(p.id, p.phone_number);
        });
      } else {
        // Fallback: direct query (works only for own profile due to RLS)
        const { data: rawProfiles } = await supabase.from('user_profiles').select('id, avatar_url, job_title, system_role, phone_number');
        rawProfiles?.forEach(p => {
           if (p.avatar_url) avatarMap.set(p.id, p.avatar_url);
           if (p.job_title) jobTitleMap.set(p.id, p.job_title);
           if (p.phone_number) phoneMap.set(p.id, p.phone_number);
        });
      }

      const { data: catAssignments, error: catError } = await supabase
        .from('user_category_assignments')
        .select('*');

      if (catError) console.warn('Cat assignments query warning:', catError);

      const { data: permAssignments } = await supabase
        .from('user_permissions_overrides')
        .select('*');

      const mappedUsers = profiles?.map((p: any) => {
        const userPerms: Record<string, boolean> = {};
        permAssignments?.filter(pa => pa.user_id === p.id).forEach(pa => {
          userPerms[pa.permission_id] = true;
        });

        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name || 'Utilisateur',
          avatar_url: p.avatar_url || avatarMap.get(p.id),
          system_role: p.system_role || 'viewer',
          // job_title: prioritize from Edge Function (service_role read), then RPC (after migration), then null
          job_title: jobTitleMap.get(p.id) || p.job_title || null,
          phone_number: phoneMap.get(p.id) || p.phone_number || null,
          is_active: p.is_active,
          categories: catAssignments?.filter(c => c.user_id === p.id).map(c => c.category) || [],
          permissions_overrides: userPerms
        };
      }) || [];

      setUsers(mappedUsers as any);
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur de chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if ((formData.system_role === 'coach' || formData.system_role === 'assistant_coach') && formData.categories.length === 0) {
      toast.error("Vous devez assigner au moins une catégorie pour un coach ou un entraîneur adjoint.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch('https://fuhrxfhszttvpkmjydca.supabase.co/functions/v1/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'create',
          ...formData,
          club_id: authState.user?.default_club_id
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erreur de création.");
      }

      let createdAvatarUrl = null;
      if (avatarFile && result.user?.id) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${result.user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('staff').upload(fileName, avatarFile);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('staff').getPublicUrl(fileName);
          createdAvatarUrl = publicUrl;
        }
      }

      // Update user_profiles table with job_title, phone_number & avatar_url
      if (result.user?.id) {
        await supabase
          .from('user_profiles')
          .update({ 
            job_title: formData.job_title || null,
            phone_number: formData.phone_number || null,
            system_role: formData.system_role,
            ...(createdAvatarUrl ? { avatar_url: createdAvatarUrl } : {})
          })
          .eq('id', result.user.id);
      }

      // Save permissions overrides
      if (result.user?.id) {
        const permsToInsert = Object.keys(formData.permissions_overrides)
          .filter(key => formData.permissions_overrides[key])
          .map(key => ({ user_id: result.user!.id, permission_id: key }));
        
        if (permsToInsert.length > 0) {
          await supabase.from('user_permissions_overrides').insert(permsToInsert);
        }
      }

      toast.success("Utilisateur créé avec succès !");
      AuditLogger.logCreate(
        'USERS',
        'USER',
        result.user?.id || 'new-user',
        formData,
        `Création du compte utilisateur ${formData.full_name || formData.email} (${formData.system_role})`
      );


      setModalMode('none');
      setFormData({ email: '', password: '', full_name: '', phone_number: '', system_role: 'admin', job_title: '', avatar_url: null, categories: [], team_ids: [], permissions_overrides: {} });
      setAvatarFile(null);
      setAvatarPreview(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      setDbErrors([]);
      if (!selectedUserId) return;
      if ((formData.system_role === 'coach' || formData.system_role === 'assistant_coach') && formData.categories.length === 0) {
        toast.error("Vous devez assigner au moins une catégorie pour un coach ou un entraîneur adjoint.");
        return;
      }
      
      setIsSubmitting(true);
      let finalAvatarUrl = formData.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${selectedUserId}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('staff').upload(fileName, avatarFile);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('staff').getPublicUrl(fileName);
          finalAvatarUrl = publicUrl;
        }
      }

      const { data: session } = await supabase.auth.getSession();

      // Update via Edge Function (service_role) to bypass RLS — handles job_title, phone_number, system_role
      const efResponse = await fetch('https://fuhrxfhszttvpkmjydca.supabase.co/functions/v1/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'update',
          user_id: selectedUserId,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone_number: formData.phone_number || null,
          system_role: formData.system_role,
          job_title: formData.job_title || null,
          avatar_url: finalAvatarUrl,
          categories: formData.categories,
          club_id: authState.user?.default_club_id
        })
      });

      const efResult = await efResponse.json();
      if (!efResponse.ok) {
        setDbErrors(prev => [...prev, `Erreur Profil (EF): ${efResult.error || 'Erreur inconnue'}`]);
      }

      // Fallback direct update for avatar_url if EF doesn't handle it
      if (finalAvatarUrl) {
        await supabase
          .from('user_profiles')
          .update({ avatar_url: finalAvatarUrl })
          .eq('id', selectedUserId);
      }

      const { error: delError } = await supabase.from('user_permissions_overrides').delete().eq('user_id', selectedUserId);
      if (delError) {
        setDbErrors(prev => [...prev, `Erreur Suppression Permissions: ${delError.message}`]);
      }

      const permsToInsert = Object.keys(formData.permissions_overrides)
        .filter(key => formData.permissions_overrides[key])
        .map(key => ({ user_id: selectedUserId, permission_id: key }));
      
      if (permsToInsert.length > 0) {
        const { error: permError } = await supabase.from('user_permissions_overrides').insert(permsToInsert);
        if (permError) {
           setDbErrors(prev => [...prev, `Erreur Insertion Permissions: ${permError.message}`]);
           toast.error("Les permissions n'ont pas pu être sauvegardées dans la base de données.");
        }
      }

      if (dbErrors.length === 0) {
        toast.success("Utilisateur mis à jour avec succès !");
        AuditLogger.logUpdate(
          'USERS',
          'USER',
          selectedUserId,
          {},
          formData,
          `Mise à jour du compte utilisateur ${formData.full_name || formData.email}`
        );
        
        const channel = supabase.channel(`user-cats-${selectedUserId}`);
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'categories_updated',
              payload: {},
            });
            setTimeout(() => {
              supabase.removeChannel(channel);
            }, 1000);
          }
        });

        setModalMode('none');
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise à jour.");
    } finally {
      setIsSubmitting(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  const handleDeleteUser = async (id: string, name?: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir désactiver ce compte ?`)) return;
    const oldUser = users.find(u => u.id === id);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', id);
        
      if (error) throw error;
      toast.success("Utilisateur désactivé avec succès.");
      AuditLogger.logDelete(
        'USERS',
        'USER',
        id,
        oldUser || null,
        `Désactivation du compte utilisateur ${oldUser?.full_name || oldUser?.email || id}`
      );
      fetchUsers();
    } catch (err: any) {
      toast.error("Erreur lors de la désactivation.");
    }
  };

  const openEditMode = (user: SystemUser) => {
    setSelectedUserId(user.id);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      phone_number: user.phone_number || '',
      system_role: (user.system_role || 'viewer').toLowerCase(),
      job_title: user.job_title || '',
      avatar_url: user.avatar_url || null,
      categories: user.categories || [],
      team_ids: [],
      permissions_overrides: user.permissions_overrides || {} 
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setDbErrors([]);
    setModalMode('edit');
  };

  const openViewMode = (user: SystemUser) => {
    setSelectedUserId(user.id);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      phone_number: user.phone_number || '',
      system_role: (user.system_role || 'viewer').toLowerCase(),
      job_title: user.job_title || '',
      avatar_url: user.avatar_url || null,
      categories: user.categories || [],
      team_ids: [],
      permissions_overrides: user.permissions_overrides || {}
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setModalMode('view');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) 
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const togglePermission = (permKey: string) => {
    setFormData(prev => ({
      ...prev,
      permissions_overrides: {
        ...prev.permissions_overrides,
        [permKey]: !prev.permissions_overrides[permKey]
      }
    }));
  };

  if (!can('manage_users')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
         <Lock className="w-16 h-16 text-muted-foreground mb-4 opacity-40" />
         <h2 className="text-xl font-bold text-muted-foreground">Accès Refusé</h2>
         <p className="text-sm text-muted-foreground opacity-60">Vous n'avez pas les droits pour gérer les utilisateurs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase italic flex items-center gap-2">
              Gestion des Utilisateurs & Périmètres <ShieldCheck className="w-6 h-6 text-primary" />
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
               Création de comptes par le Super Admin, attribution des intitulés de poste et des périmètres d'accès
            </p>
         </div>
         <Button onClick={() => {
           setFormData({ email: '', password: '', full_name: '', phone_number: '', system_role: 'admin', job_title: '', avatar_url: null, categories: [], team_ids: [], permissions_overrides: {} });
           setAvatarFile(null);
           setAvatarPreview(null);
           setModalMode('create');
         }} className="gap-2 shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs uppercase tracking-wider rounded-xl">
           <UserPlus className="w-4 h-4" /> Nouvel Utilisateur
         </Button>
      </div>

      {/* Filter and View Toggles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Rechercher par nom, email, fonction..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-card border-border rounded-xl font-medium"
              />
            </div>

            <select 
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="h-11 px-4 rounded-xl border border-border bg-card text-xs font-bold text-foreground outline-none shrink-0 cursor-pointer"
            >
              <option value="all">Toutes catégories</option>
              <option value="global">Accès Global</option>
              {AGE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div className="hidden sm:flex bg-secondary/30 rounded-xl border border-border p-1 shrink-0">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
      </div>

      {/* Main Content: Users List or Grid */}
      <AnimatePresence mode="wait">
        {modalMode === 'none' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map(u => (
            <div key={u.id} className="bg-card rounded-3xl p-6 shadow-sm border border-border flex flex-col items-center text-center relative group hover:shadow-md hover:border-primary/30 transition-all duration-300">
              <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3 shadow-sm ring-2 ring-primary/20 shrink-0">
                <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'U')}&background=random&color=fff`} alt={u.full_name || ''} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-black text-foreground truncate w-full px-2">{u.full_name}</h3>
              <p className="text-xs text-muted-foreground truncate w-full mb-2 px-2 font-medium">{u.email}</p>
              
              {/* Job Title Badge */}
              {u.job_title && (
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase mb-2">
                   <Briefcase className="w-3 h-3 shrink-0" />
                   <span className="truncate">{u.job_title}</span>
                </div>
              )}

              <Badge variant="outline" className="text-[9px] uppercase font-bold border-border text-muted-foreground mb-3">
                 {u.system_role.replace('_', ' ')}
              </Badge>
              
              <div className="flex flex-wrap gap-1 justify-center mb-4 min-h-[24px]">
                {u.categories && u.categories.length > 0 ? (
                  u.categories.map(cat => (
                    <Badge key={cat} variant="secondary" className="text-[9px] font-bold bg-secondary text-secondary-foreground">{cat}</Badge>
                  ))
                ) : (
                  <span className="text-[9px] text-muted-foreground italic font-medium">Périmètre Global</span>
                )}
              </div>

              {/* Permissions (Grid) */}
              <div className="flex flex-wrap gap-1 justify-center mb-4 min-h-[24px]">
                 {u.system_role === 'super_admin' ? (
                   <span className="text-[9px] text-muted-foreground italic font-medium">Toutes les permissions</span>
                 ) : u.permissions_overrides && Object.keys(u.permissions_overrides).length > 0 ? (
                   Object.keys(u.permissions_overrides).map(pKey => {
                     const pLabel = AVAILABLE_PERMISSIONS.find(ap => ap.key === pKey)?.label || pKey;
                     return <Badge key={pKey} variant="outline" className="text-[9px] font-bold border-border text-foreground">{pLabel}</Badge>;
                   })
                 ) : (
                   <span className="text-[9px] text-muted-foreground italic font-medium">— Aucune permission spécifique</span>
                 )}
              </div>

              <div className="flex gap-2 w-full justify-center mt-auto pt-3 border-t border-border">
                 <button onClick={() => openViewMode(u)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors" title="Aperçu">
                   <Eye className="w-4 h-4" />
                 </button>
                 <button onClick={() => openEditMode(u)} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors" title="Modifier">
                   <Edit2 className="w-4 h-4" />
                 </button>
                 <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors" title="Désactiver">
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground font-medium italic">
              Aucun utilisateur trouvé.
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/20 border-b border-border">
                <tr>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Utilisateur</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Intitulé de Poste</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rôle Système</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Périmètre Catégories</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Permissions Spécifiques</th>
                  <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/10 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shadow-sm overflow-hidden shrink-0 border border-border">
                          <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'U')}&background=random&color=fff`} alt={u.full_name || ''} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {u.job_title ? (
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                            <Briefcase className="w-3.5 h-3.5 shrink-0" />
                            <span>{u.job_title}</span>
                         </div>
                      ) : (
                         <span className="text-xs text-muted-foreground italic font-medium">— Non spécifié</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold border-border text-foreground">
                         {u.system_role.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                       {u.categories && u.categories.length > 0 ? (
                         <div className="flex flex-wrap gap-1">
                           {u.categories.map(cat => (
                             <Badge key={cat} variant="secondary" className="text-[9px] font-bold bg-secondary text-secondary-foreground">{cat}</Badge>
                           ))}
                         </div>
                       ) : (
                         <span className="text-xs text-muted-foreground italic font-medium">Accès Global</span>
                       )}
                    </td>
                    <td className="py-4 px-6">
                       {u.system_role === 'super_admin' ? (
                         <span className="text-xs text-muted-foreground italic">— Toutes les permissions</span>
                       ) : u.permissions_overrides && Object.keys(u.permissions_overrides).length > 0 ? (
                         <div className="flex flex-wrap gap-1 max-w-[200px]">
                           {Object.keys(u.permissions_overrides).map(pKey => {
                             const pLabel = AVAILABLE_PERMISSIONS.find(ap => ap.key === pKey)?.label || pKey;
                             return <Badge key={pKey} variant="outline" className="text-[9px] font-bold border-border text-foreground">{pLabel}</Badge>;
                           })}
                         </div>
                       ) : (
                         <span className="text-xs text-muted-foreground italic font-medium">— Aucune</span>
                       )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openViewMode(u)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="Détails">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditMode(u)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Modifier">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Désactiver">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground font-medium italic">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
          </motion.div>
        ) : (
          /* User Modal (Create / Edit / View) */
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto">
             <Card className="border border-border shadow-2xl rounded-3xl overflow-hidden bg-card text-card-foreground">
                <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/20">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20">
                         <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="text-lg font-black uppercase text-foreground">
                           {modalMode === 'create' ? 'Création de Compte Utilisateur' : modalMode === 'edit' ? 'Modification du Compte' : 'Fiche Utilisateur & Périmètres'}
                         </h3>
                         <p className="text-xs text-muted-foreground font-medium">Définissez l'intitulé de poste, le rôle et le périmètre d'accès</p>
                      </div>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => setModalMode('none')} className="rounded-xl"><X className="w-5 h-5" /></Button>
                </div>
                <CardContent className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                   <div className="space-y-4">
                     
                     <div className="flex flex-col items-center justify-center gap-3 pb-4">
                        <div className="w-24 h-24 rounded-2xl bg-secondary/50 overflow-hidden border-2 border-dashed border-primary/30 relative group flex items-center justify-center shadow-md">
                          {avatarPreview || formData.avatar_url ? (
                            <img src={avatarPreview || formData.avatar_url || ''} className="w-full h-full object-cover" alt="Avatar" />
                          ) : (
                            <Camera className="w-8 h-8 text-muted-foreground opacity-60" />
                          )}
                          
                          {modalMode !== 'view' && (
                            <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-bold gap-1">
                              <Upload className="w-4 h-4" />
                              <span>Charger</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          Photo de Profil Officielle
                        </div>
                     </div>

                     {/* Nom Complet */}
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom & Prénom</label>
                       <Input disabled={modalMode === 'view'} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Ex: Walid Regragui" className="bg-secondary/30 border-transparent focus:bg-background h-11 rounded-xl font-medium" />
                     </div>

                     {/* Email */}
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adresse Email</label>
                       <Input disabled={modalMode === 'view'} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="coach@club.com" className="bg-secondary/30 border-transparent focus:bg-background h-11 rounded-xl font-medium" />
                     </div>

                     {/* Numéro de téléphone */}
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Numéro de Téléphone</label>
                       <Input disabled={modalMode === 'view'} type="tel" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} placeholder="+212 600-000000" className="bg-secondary/30 border-transparent focus:bg-background h-11 rounded-xl font-medium" />
                     </div>

                     {/* Password */}
                     {modalMode !== 'view' && (
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                           {modalMode === 'edit' ? 'Nouveau mot de passe (Optionnel)' : 'Mot de passe initial'}
                         </label>
                         <Input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={modalMode === 'edit' ? "Laissez vide pour conserver le mot de passe actuel" : "Saisissez le mot de passe..."} className="bg-secondary/30 border-transparent focus:bg-background h-11 rounded-xl font-medium font-mono" />
                       </div>
                     )}

                      {/* Rôle Système (Au-dessus de l'intitulé de poste) */}
                      <div className="space-y-1.5 pt-2 border-t border-border">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> Rôle Système *
                        </label>
                        <select 
                          disabled={modalMode === 'view'}
                          value={formData.system_role || 'admin'} 
                          onChange={e => setFormData({...formData, system_role: e.target.value})}
                          className="w-full h-11 px-3 rounded-xl bg-secondary/30 border border-transparent focus:border-primary focus:bg-background text-xs font-bold text-foreground outline-none"
                        >
                          {SYSTEM_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>

                      {/* Intitulé de Poste / Fonction */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                           <Briefcase className="w-3.5 h-3.5" /> Intitulé de Poste / Fonction Officielle
                        </label>
                        <div className="relative">
                          <Input 
                            list="job-titles"
                            disabled={modalMode === 'view'}
                            value={formData.job_title || ''} 
                            onChange={e => {
                              const title = e.target.value;
                              setFormData({ ...formData, job_title: title });
                            }}
                            placeholder="Ex: Chef de projet..."
                            className="bg-secondary/30 border-transparent focus:bg-background h-11 rounded-xl font-medium text-xs w-full"
                          />
                          <datalist id="job-titles">
                            {JOB_TITLE_SUGGESTIONS.map(title => (
                              <option key={title} value={title} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                     {/* Scope & Permissions Section */}
                     <div className="space-y-4 pt-4 border-t border-border">
                       {/* Catégories */}
                       <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-primary block mb-2 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" /> Périmètre Catégories (U7 à PRO)
                         </label>
                         <div className="flex flex-wrap gap-1.5">
                           {AGE_CATEGORIES.map(cat => (
                             <button
                               key={cat}
                               type="button"
                               disabled={modalMode === 'view'}
                               onClick={() => toggleCategory(cat)}
                               className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition-all ${
                                 formData.categories.includes(cat) 
                                   ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                                   : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                               } disabled:opacity-70 disabled:cursor-not-allowed`}
                             >
                               {cat}
                             </button>
                           ))}
                         </div>
                       </div>

                       {/* Permissions Spécifiques */}
                       <div>
                         {formData.system_role === 'super_admin' ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center mt-2">
                               <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                               <span className="text-xs font-black text-emerald-700 uppercase">Accès Total</span>
                               <p className="text-[10px] font-bold text-emerald-600 mt-1">Le Super Administrateur a tous les accès.</p>
                            </div>
                         ) : (
                            <>
                              {formData.system_role === 'medical' && (
                                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center mb-3">
                                  <span className="text-xs font-black text-teal-800 uppercase flex items-center justify-center gap-1.5">
                                    🩺 Pôle Médical & Santé
                                  </span>
                                  <p className="text-[10px] font-semibold text-teal-700 mt-0.5">Accès dédié aux fiches médicales, bilans physiques et déclarations de blessures.</p>
                                </div>
                              )}
                              {formData.system_role === 'scout' && (
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center mb-3">
                                  <span className="text-xs font-black text-purple-800 uppercase flex items-center justify-center gap-1.5">
                                    🔍 Cellule Recrutement & Détection
                                  </span>
                                  <p className="text-[10px] font-semibold text-purple-700 mt-0.5">Accès dédié à la prospection, aux fiches de détection et au pipeline candidats.</p>
                                </div>
                              )}
                              {formData.system_role === 'technical_director' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center mb-3">
                                  <span className="text-xs font-black text-amber-800 uppercase flex items-center justify-center gap-1.5">
                                    ⭐ Direction Technique
                                  </span>
                                  <p className="text-[10px] font-semibold text-amber-700 mt-0.5">Supervision globale, méthodologie sportive et analyse croisée de toutes les catégories.</p>
                                </div>
                              )}
                              <label className="text-[10px] font-black uppercase tracking-widest text-primary block mb-2 flex items-center gap-1.5">
                                 <Key className="w-3.5 h-3.5" /> Permissions Spécifiques
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {AVAILABLE_PERMISSIONS.map(perm => (
                                  <button
                                    key={perm.key}
                                    type="button"
                                    disabled={modalMode === 'view'}
                                    onClick={() => togglePermission(perm.key)}
                                    className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition-all ${
                                      formData.permissions_overrides[perm.key] 
                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' 
                                        : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                                  >
                                    {perm.label}
                                  </button>
                                ))}
                              </div>
                            </>
                         )}
                       </div>
                     </div>
                   </div>
                   
                   {/* Modal Action Buttons */}
                   <div className="pt-4 flex gap-3 border-t border-border">
                     <Button type="button" variant="ghost" className="flex-1 rounded-xl font-bold text-xs" onClick={() => setModalMode('none')}>
                       {modalMode === 'view' ? 'Fermer' : 'Annuler'}
                     </Button>
                     {modalMode !== 'view' && (
                       <Button type="button" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95" onClick={modalMode === 'create' ? handleCreateUser : handleUpdateUser} disabled={isSubmitting}>
                         {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (modalMode === 'create' ? 'Créer le Compte' : 'Enregistrer les Modifications')}
                       </Button>
                     )}
                   </div>
                </CardContent>
             </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
