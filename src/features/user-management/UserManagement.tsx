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
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SystemUser {
  id: string;
  email: string;
  full_name: string | null;
  system_role: string;
  is_active: boolean;
  avatar_url?: string | null;
  categories: string[];
}

const SYSTEM_ROLES = [
  { value: 'super_admin', label: 'Super Administrateur' },
  { value: 'technical_director', label: 'Directeur Technique' },
  { value: 'coach', label: 'Coach' },
  { value: 'assistant_coach', label: 'Entraîneur Adjoint' },
  { value: 'staff', label: 'Staff' }
];

const AGE_CATEGORIES = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U19', 'U21', 'SENIOR'];

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
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    system_role: 'coach',
    avatar_url: '' as string | null,
    categories: [] as string[]
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
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

      const { data: rawProfiles } = await supabase.from('user_profiles').select('id, avatar_url');
      const avatarMap = new Map();
      rawProfiles?.forEach(p => {
         avatarMap.set(p.id, p.avatar_url);
      });

      const { data: catAssignments, error: catError } = await supabase
        .from('user_category_assignments')
        .select('*');

      if (catError) throw catError;

      const mappedUsers = profiles?.map((p: any) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name || 'Utilisateur',
        avatar_url: p.avatar_url || avatarMap.get(p.id),
        system_role: p.system_role || 'viewer',
        is_active: p.is_active,
        categories: catAssignments?.filter(c => c.user_id === p.id).map(c => c.category) || []
      })) || [];

      setUsers(mappedUsers as any);
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur de chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
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

      if (avatarFile && result.user?.id) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${result.user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('staff').upload(fileName, avatarFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('staff').getPublicUrl(fileName);
        await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('id', result.user.id);
      }

      toast.success("Utilisateur créé avec succès !");
      setModalMode('none');
      setFormData({ email: '', password: '', full_name: '', system_role: 'coach', avatar_url: null, categories: [] });
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
    if (!selectedUserId) return;
    setIsSubmitting(true);
    try {
      let finalAvatarUrl = formData.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${selectedUserId}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('staff').upload(fileName, avatarFile);
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('staff').getPublicUrl(fileName);
        finalAvatarUrl = publicUrl;
      }

      const { data: session } = await supabase.auth.getSession();
      const response = await fetch('https://fuhrxfhszttvpkmjydca.supabase.co/functions/v1/create-user', {
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
          system_role: formData.system_role,
          avatar_url: finalAvatarUrl,
          categories: formData.categories,
          club_id: authState.user?.default_club_id
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erreur de mise à jour.");
      }

      toast.success("Utilisateur mis à jour avec succès !");
      setModalMode('none');
      fetchUsers();
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
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', id);
        
      if (error) throw error;
      toast.success("Utilisateur désactivé avec succès.");
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
      system_role: (user.system_role || 'viewer').toLowerCase(),
      avatar_url: user.avatar_url || null,
      categories: user.categories || []
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setModalMode('edit');
  };

  const openViewMode = (user: SystemUser) => {
    setSelectedUserId(user.id);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      system_role: (user.system_role || 'viewer').toLowerCase(),
      avatar_url: user.avatar_url || null,
      categories: user.categories || []
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

  if (!can('manage_users')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
         <Lock className="w-16 h-16 text-slate-300 mb-4" />
         <h2 className="text-xl font-bold text-slate-500">Accès Refusé</h2>
         <p className="text-sm text-slate-400">Vous n'avez pas les droits pour gérer les utilisateurs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase italic flex items-center gap-2">
              Gestion des Utilisateurs <ShieldCheck className="w-6 h-6 text-primary" />
            </h2>
            <p className="text-muted-foreground text-sm font-medium">Administration des accès et des rôles</p>
         </div>
         <Button onClick={() => {
           setFormData({ email: '', password: '', full_name: '', system_role: 'coach', avatar_url: null, categories: [] });
           setAvatarFile(null);
           setAvatarPreview(null);
           setModalMode('create');
         }} className="gap-2 shadow-lg shadow-primary/20">
           <UserPlus className="w-4 h-4" /> Nouvel Utilisateur
         </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                placeholder="Rechercher un utilisateur..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-white border-slate-200 shadow-sm rounded-xl focus:ring-primary focus:border-primary"
              />
            </div>

            <select 
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm min-w-[180px] cursor-pointer"
            >
              <option value="all">Toutes catégories</option>
              <option value="global">Global (Sans cat.)</option>
              {AGE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div className="hidden sm:flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 shrink-0">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>
      </div>

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
            <div key={u.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center relative group hover:shadow-md transition-all duration-300">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 shadow-sm ring-4 ring-slate-50">
                <img src={u.avatar_url || ''} alt={u.full_name || ''} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-slate-800 truncate w-full px-2">{u.full_name}</h3>
              <p className="text-xs text-slate-500 truncate w-full mb-3 px-2">{u.email}</p>
              <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary bg-primary/5 mb-4">
                 {u.system_role.replace('_', ' ')}
              </Badge>
              
              <div className="flex flex-wrap gap-1 justify-center mb-6 min-h-[24px]">
                {u.categories && u.categories.length > 0 ? (
                  u.categories.map(cat => (
                    <Badge key={cat} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">{cat}</Badge>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Global</span>
                )}
              </div>

              <div className="flex gap-2 w-full justify-center mt-auto pt-4 border-t border-slate-100">
                 <button onClick={() => openViewMode(u)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                   <Eye className="w-5 h-5" />
                 </button>
                 <button onClick={() => openEditMode(u)} className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                   <Edit2 className="w-5 h-5" />
                 </button>
                 <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                   <Trash2 className="w-5 h-5" />
                 </button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              Aucun utilisateur trouvé.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Utilisateur</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Rôle</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Catégories (Scope)</th>
                  <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                          <img src={u.avatar_url || ''} alt={u.full_name || ''} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{u.full_name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary bg-primary/5">
                         {u.system_role.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                       {u.categories && u.categories.length > 0 ? (
                         <div className="flex flex-wrap gap-1">
                           {u.categories.map(cat => (
                             <Badge key={cat} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200">{cat}</Badge>
                           ))}
                         </div>
                       ) : (
                         <span className="text-xs text-slate-400 italic">Global</span>
                       )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openViewMode(u)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Détails">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditMode(u)} className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Désactiver">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
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
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto">
             <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                   <h3 className="text-lg font-black uppercase">
                     {modalMode === 'create' ? 'Créer un compte' : modalMode === 'edit' ? 'Modifier le compte' : 'Détails du compte'}
                   </h3>
                   <Button variant="ghost" size="icon" onClick={() => setModalMode('none')} className="rounded-full"><X className="w-5 h-5" /></Button>
                </div>
                <CardContent className="p-6 space-y-6">
                   <div className="space-y-4">
                     
                     <div className="flex flex-col items-center justify-center gap-3 pb-4">
                        <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-2 border-dashed border-slate-300 relative group flex items-center justify-center">
                          {avatarPreview || formData.avatar_url ? (
                            <img src={avatarPreview || formData.avatar_url || ''} className="w-full h-full object-cover" alt="Avatar" />
                          ) : (
                            <Camera className="w-8 h-8 text-slate-400" />
                          )}
                          
                          {modalMode !== 'view' && (
                            <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <Upload className="w-5 h-5 mb-1" />
                              <span className="text-[10px] font-bold uppercase">Modifier</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 text-center">
                          Photo de profil (Optionnel)
                        </div>
                     </div>

                     <div>
                       <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Nom Complet</label>
                       <Input disabled={modalMode === 'view'} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Ex: Walid Regragui" />
                     </div>
                     <div>
                       <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Email</label>
                       <Input disabled={modalMode === 'view'} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="coach@club.com" />
                     </div>
                     {modalMode !== 'view' && (
                       <div>
                         <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                           {modalMode === 'edit' ? 'Nouveau mot de passe (Optionnel)' : 'Mot de passe temporaire'}
                         </label>
                         <Input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={modalMode === 'edit' ? "Laissez vide pour ne changer que le reste" : "Générer ou saisir..."} />
                       </div>
                     )}
                     <div>
                       <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Rôle Système</label>
                       <select 
                         disabled={modalMode === 'view'}
                         value={formData.system_role} 
                         onChange={e => setFormData({...formData, system_role: e.target.value})}
                         className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-500"
                       >
                         {SYSTEM_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                       </select>
                     </div>

                     {(formData.system_role === 'coach' || formData.system_role === 'assistant_coach') && (
                       <div className="space-y-2 pt-4 border-t border-slate-100">
                         <label className="text-xs font-bold uppercase text-slate-500 block">Catégories Assignées</label>
                         <div className="flex flex-wrap gap-2">
                           {AGE_CATEGORIES.map(cat => (
                             <button
                               key={cat}
                               disabled={modalMode === 'view'}
                               onClick={() => toggleCategory(cat)}
                               className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                                 formData.categories.includes(cat) 
                                   ? 'bg-primary text-white border-primary shadow-md' 
                                   : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50'
                               } disabled:opacity-70 disabled:cursor-not-allowed`}
                             >
                               {cat}
                             </button>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                   
                   <div className="pt-4 flex gap-3">
                     <Button variant="outline" className="flex-1" onClick={() => setModalMode('none')}>
                       {modalMode === 'view' ? 'Fermer' : 'Annuler'}
                     </Button>
                     {modalMode !== 'view' && (
                       <Button className="flex-1" onClick={modalMode === 'create' ? handleCreateUser : handleUpdateUser} disabled={isSubmitting}>
                         {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (modalMode === 'create' ? 'Créer le compte' : 'Sauvegarder')}
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
