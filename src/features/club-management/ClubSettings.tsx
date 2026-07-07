import React, { useState, useEffect } from 'react';
import { useClubData } from '../../hooks/useClubData';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Camera, Save, Globe, Building2, Palette, Sparkles, Settings2, ShieldAlert, KeySquare, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { storageService } from '../../services/storageService';
import { Skeleton } from '../../components/ui/skeleton';

const ClubSettings: React.FC = () => {
  const { mainClub, updateMainClub, resetDatabase, isLoading } = useClubData();
  const [activeTab, setActiveTab] = useState<'registry' | 'system'>('registry');

  const [formData, setFormData] = useState({
    club_name: '',
    city: '',
    country: '',
    logo_url: '',
    primary_color: '#e03d3d',
    secondary_color: '#ffffff',
    pagination_limit: 10,
    preferred_view_mode: 'list' as 'grid' | 'list',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (mainClub) {
      setFormData({
        club_name: mainClub.name || '',
        city: mainClub.city || '',
        country: mainClub.country || '',
        logo_url: mainClub.logo_url || '',
        primary_color: mainClub.settings?.primary_color || '#e03d3d',
        secondary_color: mainClub.settings?.secondary_color || '#ffffff',
        pagination_limit: mainClub.settings?.pagination_limit || 10,
        preferred_view_mode: (mainClub.settings?.preferred_view_mode as any) || 'list',
      });
    }
  }, [mainClub]);

  const handleSave = async () => {
    if (!mainClub) return;
    setIsSaving(true);
    try {
      const sanitizedData = {
        club_name: formData.club_name,
        city: formData.city,
        country: formData.country,
        logo_url: formData.logo_url,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        pagination_limit: formData.pagination_limit,
        preferred_view_mode: formData.preferred_view_mode
      };
      await updateMainClub({ id: mainClub.id, data: sanitizedData });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const publicUrl = await storageService.uploadFile(file, 'clubs');
        setFormData({ ...formData, logo_url: publicUrl });
      } catch (error: any) {
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
         <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-12 w-48 rounded-2xl" />
         </div>
         <Skeleton className="h-14 w-64 rounded-2xl" />
         <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <Skeleton className="md:col-span-4 h-64 rounded-[2.5rem]" />
            <div className="md:col-span-8 space-y-8">
               <Skeleton className="h-64 rounded-[2.5rem]" />
               <Skeleton className="h-48 rounded-[2.5rem]" />
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase italic flex items-center gap-2">
            Registre du Club <Sparkles className="w-5 h-5 text-primary" />
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Configurez l'identité légale et visuelle de votre organisation</p>
        </div>
        
        {activeTab === 'registry' && (
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-xl shadow-primary/20 px-8 h-12 rounded-2xl font-black uppercase tracking-widest text-xs">
            <Save className="w-4 h-4" />
            {isSaving ? 'Synchronisation...' : 'Finaliser l\'Enregistrement'}
          </Button>
        )}
      </div>

      <div className="flex gap-4 p-1 bg-secondary/20 rounded-2xl w-fit">
        <Button 
          variant={activeTab === 'registry' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('registry')}
          className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]"
        >
          <Building2 className="w-4 h-4 mr-2" />
          Informations Légales
        </Button>
        <Button 
          variant={activeTab === 'system' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('system')}
          className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Configuration Système
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'registry' ? (
          <motion.div 
            key="registry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Preview Card */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="overflow-hidden border-secondary shadow-2xl relative group bg-white rounded-[2.5rem]">
                <div className="h-24 bg-gradient-to-br from-primary to-primary/60 relative overflow-hidden" />
                <CardContent className="pt-0 pb-10 px-6 text-center -mt-12 relative z-10">
                  <div className="inline-block relative mb-4">
                    <div className="w-24 h-24 rounded-[2rem] bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden">
                      {(formData.logo_url && formData.logo_url !== 'null') ? (
                        <img key={formData.logo_url} src={formData.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.club_name || 'FC')}&background=0D8ABC&color=fff&size=150`} alt="Logo" className="w-full h-full object-contain rounded-[2rem]" />
                      )}
                    </div>
                    <Badge className="absolute -bottom-2 right-1/2 translate-x-1/2 px-4 py-1 shadow-md border-2 border-white bg-primary text-[10px] font-black uppercase italic tracking-widest">
                      {formData.city || 'SIÈGE'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase italic truncate px-2">{formData.club_name || 'Nom du Club'}</h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 opacity-60">
                      <Globe className="w-3 h-3" /> {formData.country || 'Pays'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuration Form */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="border shadow-sm rounded-[2.5rem] overflow-hidden">
                <CardHeader className="border-b bg-secondary/10 p-8">
                  <CardTitle className="text-lg flex items-center gap-3 font-black uppercase tracking-tighter">
                    <Building2 className="w-6 h-6 text-primary" /> Informations Fondamentales
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom Complet du Club</label>
                      <Input value={formData.club_name} onChange={(e) => setFormData({ ...formData, club_name: e.target.value })} className="h-12 rounded-xl bg-secondary/30 border-secondary font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ville du Siège</label>
                      <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-12 rounded-xl bg-secondary/30 border-secondary font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pays</label>
                      <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="h-12 rounded-xl bg-secondary/30 border-secondary font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identité Visuelle (Logo/Écusson)</label>
                      <label htmlFor="logo-upload" className="flex items-center justify-between h-12 px-6 rounded-xl bg-secondary/30 border-2 border-dashed border-secondary cursor-pointer font-bold text-sm">
                        <span>{isUploading ? 'Chargement...' : 'Changer l\'Écusson'}</span>
                        <Camera className="w-5 h-5 text-primary" />
                        <input type="file" id="logo-upload" hidden accept="image/*" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm rounded-[2.5rem] overflow-hidden">
                <CardHeader className="border-b bg-secondary/10 p-8">
                  <CardTitle className="text-lg flex items-center gap-3 font-black uppercase tracking-tighter">
                    <Palette className="w-6 h-6 text-primary" /> Charte Graphique
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-center gap-4">
                      <input type="color" value={formData.primary_color} onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })} className="w-14 h-14 rounded-xl cursor-pointer border-none shadow-lg" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Couleur Primaire</p>
                        <code className="text-xs font-bold opacity-60 uppercase">{formData.primary_color}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <input type="color" value={formData.secondary_color} onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })} className="w-14 h-14 rounded-xl cursor-pointer border-none shadow-lg" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Couleur Secondaire</p>
                        <code className="text-xs font-bold opacity-60 uppercase">{formData.secondary_color}</code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="system"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <Card className="border shadow-sm rounded-[2.5rem] overflow-hidden">
               <CardHeader className="border-b bg-secondary/10 p-8">
                  <CardTitle className="text-lg flex items-center gap-3 font-black uppercase tracking-tighter">
                    <Settings2 className="w-6 h-6 text-primary" /> Preferences Système
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-10 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-secondary pb-12">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-primary" />
                        <h4 className="text-sm font-black uppercase tracking-tight">Mode d'affichage</h4>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Choisissez comment parcourir vos données par défaut.</p>
                      <div className="flex bg-secondary/30 p-1.5 rounded-2xl border w-fit">
                         <Button 
                           variant={formData.preferred_view_mode === 'list' ? 'default' : 'ghost'} 
                           size="sm"
                           onClick={() => setFormData({...formData, preferred_view_mode: 'list'})}
                           className="h-9 px-6 rounded-xl font-black uppercase tracking-widest text-[9px]"
                         >Liste</Button>
                         <Button 
                           variant={formData.preferred_view_mode === 'grid' ? 'default' : 'ghost'} 
                           size="sm"
                           onClick={() => setFormData({...formData, preferred_view_mode: 'grid'})}
                           className="h-9 px-6 rounded-xl font-black uppercase tracking-widest text-[9px]"
                         >Grille</Button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        <h4 className="text-sm font-black uppercase tracking-tight">Pagination</h4>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Nombre d'enregistrements par page.</p>
                      <select 
                        value={formData.pagination_limit}
                        onChange={(e) => setFormData({...formData, pagination_limit: parseInt(e.target.value)})}
                        className="h-12 w-48 rounded-xl bg-secondary/30 border-secondary font-black text-sm px-4 focus:ring-2 ring-primary/20 appearance-none cursor-pointer"
                      >
                         {[5, 10, 15, 20, 25, 50].map(v => <option key={v} value={v}>{v} par page</option>)}
                      </select>
                   </div>
                </div>

                <div className="flex justify-end">
                   <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-xl shadow-primary/20 px-8 h-12 rounded-2xl font-black uppercase tracking-widest text-xs">
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Mise à jour...' : 'Enregistrer les préférences'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 shadow-sm rounded-[2.5rem] overflow-hidden">
              <CardHeader className="border-b bg-destructive/5 p-8">
                <CardTitle className="text-lg flex items-center gap-3 font-black uppercase tracking-tighter text-destructive">
                  <ShieldAlert className="w-6 h-6" /> Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-3xl bg-white/50 border border-destructive/10 text-destructive-foreground">
                  <div className="space-y-1">
                    <h4 className="text-lg font-black uppercase tracking-tight text-destructive">Réinitialiser la Base de Données</h4>
                    <p className="text-sm font-medium text-muted-foreground max-w-md">Cela supprimera définitivement tous les Joueurs, le Staff, les matchs et la configuration. Cette action est irréversible.</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-destructive/20 hover:scale-105 transition-all"
                    onClick={async () => {
                      if (window.confirm("ÊTES-VOUS ABSOLUMENT SÛR ? Cela effacera TOUTES les données du système.")) {
                        if (window.confirm("CONFIRMEZ UNE DERNIÈRE FOIS : Cette action est IRRÉVERSIBLE.")) {
                          try {
                            await resetDatabase();
                          } catch (e: any) {
                            console.error(e);
                          }
                        }
                      }
                    }}
                  >
                    Tout effacer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ClubSettings;
