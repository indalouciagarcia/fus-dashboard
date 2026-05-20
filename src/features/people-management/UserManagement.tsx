import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getMyClubId } from '../../services/_helpers';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { PLAYER_CATEGORIES } from '../../constants';
import { Pencil, Trash2, Plus, Copy, Check, RefreshCw, Eye, EyeOff, ArrowLeft, KeyRound, MessageCircle, Mail, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────

type PermLevel = 'viewer' | 'reporter' | 'editor' | 'live_tracker';
type AppAction = 'report' | 'edit' | 'live_track';

interface ClubUser {
  id: string;
  supabase_user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  categories: string[];
  permission_level: PermLevel;
  allowed_actions?: AppAction[] | null;
  is_active: boolean;
}

// Cherche l'ID Supabase Auth d'un user par email (fallback si supabase_user_id manquant)
const findAuthUserIdByEmail = async (email: string, serviceKey: string): Promise<string | null> => {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users?search=${encodeURIComponent(email)}&per_page=10`,
    { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const users: any[] = data?.users ?? data ?? [];
  return users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
};

// Réinitialise le mot de passe — cherche par email si l'ID est absent ou invalide
const resetPasswordViaAdmin = async (
  supabaseUserId: string | null,
  email: string,
  newPassword: string
) => {
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY manquant dans .env');

  let userId = supabaseUserId;

  const tryReset = async (id: string) =>
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });

  // Tentative 1 : avec l'ID stocké
  if (userId) {
    const res = await tryReset(userId);
    if (res.ok) return; // succès
  }

  // Tentative 2 : recherche par email
  userId = await findAuthUserIdByEmail(email, serviceKey);
  if (!userId) throw new Error('Utilisateur introuvable dans Supabase Auth');

  const res2 = await tryReset(userId);
  if (!res2.ok) {
    const err = await res2.json();
    throw new Error(err.msg || err.error_description || 'Erreur réinitialisation');
  }
};

const ACTION_LABELS: Record<AppAction, string> = {
  report:     'Reporter',
  edit:       'Modifier',
  live_track: 'Lancer le live',
};

const ACTIONS: AppAction[] = ['report', 'edit', 'live_track'];

const actionsToPermissionLevel = (actions: AppAction[]): PermLevel => {
  if (actions.includes('edit')) return 'editor';
  if (actions.includes('live_track')) return 'live_tracker';
  if (actions.includes('report')) return 'reporter';
  return 'viewer';
};

const permissionLevelToActions = (level: PermLevel): AppAction[] => {
  if (level === 'editor') return ['report', 'edit', 'live_track'];
  if (level === 'live_tracker') return ['live_track'];
  if (level === 'reporter') return ['report'];
  return [];
};

const getUserActions = (user: Pick<ClubUser, 'allowed_actions' | 'permission_level'>): AppAction[] =>
  Array.isArray(user.allowed_actions) && user.allowed_actions.length > 0
    ? user.allowed_actions
    : permissionLevelToActions(user.permission_level);

const genPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// ─── Indicateur d'étapes ──────────────────────────────────

const STEPS = [
  { n: 1, label: 'Identité' },
  { n: 2, label: 'Email'    },
  { n: 3, label: 'Accès'    },
];

const StepBar: React.FC<{ current: number }> = ({ current }) => (
  <div className="flex items-center gap-0 mb-8">
    {STEPS.map((s, i) => (
      <React.Fragment key={s.n}>
        <div className="flex flex-col items-center gap-1">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
            current > s.n  ? 'bg-emerald-500 border-emerald-500 text-white' :
            current === s.n ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-110' :
                              'bg-white border-slate-200 text-slate-300'
          }`}>
            {current > s.n ? <Check className="w-4 h-4" /> : s.n}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:block ${current === s.n ? 'text-primary' : 'text-slate-400'}`}>
            {s.label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${current > s.n ? 'bg-emerald-400' : 'bg-slate-200'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Wizard création ──────────────────────────────────────

interface WizardProps { onBack: () => void; onSaved: () => void; }

const CreateWizard: React.FC<WizardProps> = ({ onBack, onSaved }) => {
  const [step, setStep] = useState(1);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [phone,    setPhone]    = useState('');

  // Step 2
  const [email,      setEmail]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [clubUserId, setClubUserId] = useState('');

  // Step 4
  const [categories,  setCategories]  = useState<string[]>([]);
  const [actions,     setActions]     = useState<AppAction[]>([]);
  const [password,    setPassword]    = useState(genPassword);
  const [showPwd,     setShowPwd]     = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [finalizing,  setFinalizing]  = useState(false);

  const toggleCat = (c: string) =>
    setCategories(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const toggleAction = (action: AppAction) =>
    setActions(prev => prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]);

  const copyPwd = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendByEmail = () => {
    const subject = encodeURIComponent('Vos identifiants FuscClub App');
    const body = encodeURIComponent(
      `Bonjour ${fullName},\n\nVoici vos identifiants pour accéder à fus-app :\n\nEmail : ${email}\nMot de passe : ${password}\n\nConnectez-vous et changez votre mot de passe à la première connexion.`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const sendWhatsApp = () => {
    const msg = encodeURIComponent(
      `Bonjour ${fullName} 👋\n\nVoici vos identifiants FuscClub App :\n📧 Email : ${email}\n🔑 Mot de passe : ${password}\n\nConnectez-vous et changez votre mot de passe à la 1ère connexion.`
    );
    const ph = phone.replace(/\s/g, '').replace(/^\+/, '');
    window.open(ph ? `https://wa.me/${ph}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank');
  };

  // Étape 2 → crée le compte Supabase + sauvegarde dans club_users
  const handleCreateAccount = async () => {
    if (!email.trim()) { toast.error('Entrez un email'); return; }
    setSending(true);
    try {
      const clubId = await getMyClubId();

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, data: { full_name: fullName } }),
      });
      const signupData = await res.json();
      if (!res.ok) throw new Error(signupData.msg || signupData.error_description || 'Erreur création compte');
      const supId = signupData?.id ?? signupData?.user?.id ?? null;

      const payload: Record<string, unknown> = {
        club_id: clubId, full_name: fullName, phone: phone || null,
        email: email.trim().toLowerCase(), categories: [], permission_level: 'viewer',
      };
      if (supId) payload.supabase_user_id = supId;

      const { data: inserted, error } = await supabase.from('club_users').insert(payload).select('id').single();
      if (error) {
        if (error.message?.includes('supabase_user_id')) {
          delete payload.supabase_user_id;
          const { data: ins2, error: e2 } = await supabase.from('club_users').insert(payload).select('id').single();
          if (e2) throw e2;
          setClubUserId(ins2?.id ?? '');
        } else throw error;
      } else {
        setClubUserId(inserted?.id ?? '');
      }
      setStep(3);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  // Étape 3 → finalise : catégories + permission
  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const { error } = await supabase.from('club_users').update({
        categories, permission_level: actionsToPermissionLevel(actions), allowed_actions: actions, must_change_password: true,
        updated_at: new Date().toISOString(),
      }).eq('id', clubUserId);
      if (error) throw error;
      toast.success('Utilisateur créé et activé !');
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setFinalizing(false);
    }
  };

  const field = (label: string, node: React.ReactNode) => (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</label>
      {node}
    </div>
  );

  const inp = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-primary outline-none font-medium text-sm transition-colors" />
  );

  return (
    <div className="max-w-lg space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour à la liste
      </button>
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight italic">Nouvel utilisateur</h1>
        <p className="text-sm text-muted-foreground mt-1">Créer un accès fus-app</p>
      </div>

      <StepBar current={step} />

      <div className="bg-white rounded-2xl border shadow-sm p-8 space-y-6">

        {/* ── STEP 1 : Identité ── */}
        {step === 1 && (<>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">👤</div>
            <h2 className="font-black text-lg uppercase tracking-tight">Identité</h2>
          </div>
          {field('Nom complet *', inp({ type:'text', value: fullName, onChange: e => setFullName(e.target.value), placeholder:'Youssef Benali' }))}
          {field('Téléphone', inp({ type:'tel', value: phone, onChange: e => setPhone(e.target.value), placeholder:'+212 6 00 00 00 00' }))}
          <Button
            onClick={() => { if (!fullName.trim()) { toast.error('Nom obligatoire'); return; } setStep(2); }}
            className="w-full h-12 rounded-xl bg-slate-950 hover:bg-black text-white font-black uppercase tracking-widest text-xs"
          >
            Suivant →
          </Button>
        </>)}

        {/* ── STEP 2 : Email ── */}
        {step === 2 && (<>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Mail className="w-5 h-5 text-primary" /></div>
            <h2 className="font-black text-lg uppercase tracking-tight">Email</h2>
          </div>
          {field('Adresse email *', inp({ type:'email', value: email, onChange: e => setEmail(e.target.value), placeholder:'youssef@fusclub.ma', autoFocus: true }))}
          <div className="bg-slate-50 border rounded-xl p-4 text-[12px] text-slate-600 font-medium leading-relaxed">
            Le compte sera créé avec le mot de passe généré. Vous l'enverrez à l'utilisateur à l'étape suivante.
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="h-12 px-6 rounded-xl font-bold">← Retour</Button>
            <Button onClick={handleCreateAccount} disabled={sending} className="flex-1 h-12 rounded-xl bg-slate-950 hover:bg-black text-white font-black uppercase tracking-widest text-xs gap-2">
              {sending ? 'Création...' : 'Créer le compte →'}
            </Button>
          </div>
        </>)}

        {/* ── STEP 3 : Accès ── */}
        {step === 3 && (<>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><KeyRound className="w-5 h-5 text-primary" /></div>
            <h2 className="font-black text-lg uppercase tracking-tight">Accès & Envoi des identifiants</h2>
          </div>

          {/* Récap */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700">✓ Compte créé</p>
            <p className="text-[12px] text-emerald-600 font-medium">
              <strong>{fullName}</strong> · {email}
            </p>
          </div>

          {/* Catégories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Catégories</label>
              {categories.length > 0 && (
                <button onClick={() => setCategories([])} className="text-[11px] font-bold text-red-400 hover:text-red-600">Tout effacer</button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(PLAYER_CATEGORIES as readonly string[]).map(cat => {
                const active = categories.includes(cat);
                return (
                  <button key={cat} type="button" onClick={() => toggleCat(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border-2 transition-all ${active ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50'}`}>
                    {active && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}{cat}
                  </button>
                );
              })}
            </div>
          </div>

          {field('Actions autorisées', (
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map(action => {
                const active = actions.includes(action);
                return (
                  <button key={action} type="button" onClick={() => toggleAction(action)}
                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${active ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50'}`}>
                    {active && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}{ACTION_LABELS[action]}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Mot de passe */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Mot de passe généré</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 h-12 px-4 rounded-xl border-2 border-primary/30 bg-primary/5 font-mono text-sm font-bold">
                <span className="flex-1 truncate">{showPwd ? password : '••••••••••••'}</span>
                <button type="button" onClick={() => setShowPwd(v => !v)} className="text-slate-400 hover:text-slate-600 shrink-0">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="button" onClick={copyPwd}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${copied ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-slate-200 hover:border-primary text-slate-400 hover:text-primary'}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => { setPassword(genPassword()); setCopied(false); }}
                className="w-12 h-12 rounded-xl border-2 border-slate-200 hover:border-primary text-slate-400 hover:text-primary flex items-center justify-center shrink-0 transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {/* Envoi */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={sendByEmail}
                className="flex items-center gap-2 h-10 px-4 rounded-xl border-2 border-slate-200 hover:border-primary text-slate-500 hover:text-primary text-[11px] font-black uppercase tracking-widest transition-all">
                <Mail className="w-3.5 h-3.5" /> Envoyer par email
              </button>
              <button type="button" onClick={sendWhatsApp}
                className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-[11px] font-black uppercase tracking-widest transition-all">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
            </div>
          </div>

          <Button onClick={handleFinalize} disabled={finalizing}
            className="w-full h-12 rounded-xl bg-slate-950 hover:bg-black text-white font-black uppercase tracking-widest text-xs gap-2">
            <ShieldCheck className="w-4 h-4" /> {finalizing ? 'Activation...' : 'Finaliser et activer le compte'}
          </Button>
        </>)}

      </div>
    </div>
  );
};

// ─── Form page (édition uniquement) ──────────────────────

interface FormPageProps {
  user: ClubUser;
  onBack: () => void;
  onSaved: () => void;
}

const FormPage: React.FC<FormPageProps> = ({ user, onBack, onSaved }) => {
  const isEdit = true;

  const [fullName,  setFullName]  = useState(user?.full_name ?? '');
  const [email,     setEmail]     = useState(user?.email ?? '');
  const [phone,     setPhone]     = useState(user?.phone ?? '');
  const [categories, setCategories] = useState<string[]>(user?.categories ?? []);
  const [actions,    setActions]    = useState<AppAction[]>(getUserActions(user));

  const toggleCategory = (cat: string) =>
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  const toggleAction = (action: AppAction) =>
    setActions(prev => prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]);
  const [password,    setPassword]    = useState(genPassword);
  const [showPwd,     setShowPwd]     = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [saving,      setSaving]      = useState(false);
  // Pour l'édition : nouveau mot de passe optionnel
  const [newPwd,      setNewPwd]      = useState('');
  const [showNewPwd,  setShowNewPwd]  = useState(false);
  const [copiedNew,   setCopiedNew]   = useState(false);
  const [resetting,   setResetting]   = useState(false);

  const copyNewPwd = () => {
    navigator.clipboard.writeText(newPwd);
    setCopiedNew(true);
    setTimeout(() => setCopiedNew(false), 2000);
  };

  const sendWhatsApp = (pwd: string) => {
    const msg = encodeURIComponent(
      `Bonjour ${user?.full_name ?? fullName},\n\nVoici vos identifiants pour accéder à l'application FuscClub :\n\n📧 Email : ${user?.email ?? email}\n🔑 Mot de passe : ${pwd}\n\nTéléchargez l'application et connectez-vous avec ces identifiants.\nVous serez invité à changer votre mot de passe à la première connexion.`
    );
    const phone = user?.phone?.replace(/\s/g, '').replace(/^\+/, '') ?? '';
    const url = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  const handleResetPassword = async () => {
    if (!newPwd) { setNewPwd(genPassword()); return; }
    setResetting(true);
    try {
      // Passe l'ID ET l'email — cherche par email si l'ID est absent/invalide
      await resetPasswordViaAdmin(user.supabase_user_id, user.email, newPwd);
      await supabase.from('club_users').update({ must_change_password: true }).eq('id', user.id);
      toast.success('Mot de passe réinitialisé ✓');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResetting(false);
    }
  };

  const copyPwd = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error('Nom et email sont obligatoires');
      return;
    }
    setSaving(true);
    try {
      const clubId = await getMyClubId();

      if (isEdit) {
        const { error } = await supabase
          .from('club_users')
          .update({
            full_name:        fullName,
            email:            email.toLowerCase().trim(),
            phone:            phone || null,
            categories:       categories,
            permission_level: actionsToPermissionLevel(actions),
            allowed_actions:  actions,
            updated_at:       new Date().toISOString(),
          })
          .eq('id', user!.id);
        if (error) throw error;
        toast.success('Utilisateur mis à jour');
      } else {
        // Créer le compte Supabase Auth via fetch() direct
        // → aucun GoTrueClient secondaire, session admin intacte
        const signupRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              email:    email.trim().toLowerCase(),
              password: password,
              data:     { full_name: fullName },
            }),
          }
        );
        if (!signupRes.ok) {
          const err = await signupRes.json();
          throw new Error(err.msg || err.error_description || 'Erreur création compte');
        }
        const signupData = await signupRes.json();
        const supabaseUserId = signupData?.id ?? signupData?.user?.id ?? null;

        // Payload de base — supabase_user_id ajouté seulement si la colonne existe
        const insertPayload: Record<string, unknown> = {
          club_id:          clubId,
          full_name:        fullName,
          email:            email.trim().toLowerCase(),
          phone:            phone || null,
          categories:       categories,
          permission_level: actionsToPermissionLevel(actions),
          allowed_actions:  actions,
        };
        if (supabaseUserId) insertPayload.supabase_user_id = supabaseUserId;

        const { error } = await supabase.from('club_users').insert(insertPayload);
        if (error) {
          // Si la colonne n'existe pas encore, réessayer sans elle
          if (error.message?.includes('supabase_user_id')) {
            delete insertPayload.supabase_user_id;
            const { error: e2 } = await supabase.from('club_users').insert(insertPayload);
            if (e2) throw e2;
          } else {
            throw error;
          }
        }
        navigator.clipboard.writeText(password);
        toast.success('Utilisateur créé — mot de passe copié !');
      }

      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-8">
      {/* Back */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight italic">
          {isEdit ? 'Modifier' : 'Nouvel utilisateur'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit ? `Modification de ${user!.full_name}` : 'Créer un accès fus-app'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-8 space-y-6">

        {/* Nom */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nom complet *</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Youssef Benali"
            className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-primary outline-none font-medium text-sm transition-colors"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">Email *</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="youssef@fusclub.ma"
            disabled={isEdit}
            className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-primary outline-none font-medium text-sm transition-colors disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        {/* Téléphone */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">Téléphone</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+212 6 00 00 00 00"
            className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 focus:border-primary outline-none font-medium text-sm transition-colors"
          />
        </div>

        {/* Catégories — multi-sélection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Catégories
            </label>
            {categories.length > 0 && (
              <button
                type="button"
                onClick={() => setCategories([])}
                className="text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                Tout désélectionner
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(PLAYER_CATEGORIES as readonly string[]).map(cat => {
              const active = categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                    active
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50 hover:text-primary'
                  }`}
                >
                  {active && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                  {cat}
                </button>
              );
            })}
          </div>
          {categories.length > 0 && (
            <p className="text-[11px] text-primary font-bold">
              {categories.length} catégorie{categories.length > 1 ? 's' : ''} sélectionnée{categories.length > 1 ? 's' : ''} : {categories.join(', ')}
            </p>
          )}
        </div>

        {/* Actions autorisées */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">Actions autorisées</label>
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map(action => {
              const active = actions.includes(action);
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => toggleAction(action)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                    active
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50 hover:text-primary'
                  }`}
                >
                  {active && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                  {ACTION_LABELS[action]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mot de passe — création seulement */}
        {!isEdit && (
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Mot de passe</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 h-12 px-4 rounded-xl border-2 border-primary/30 bg-primary/5 font-mono text-sm font-bold">
                <span className="flex-1 truncate">{showPwd ? password : '••••••••••••'}</span>
                <button type="button" onClick={() => setShowPwd(v => !v)} className="text-slate-400 hover:text-slate-600 shrink-0">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="button" onClick={copyPwd}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${copied ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-slate-200 hover:border-primary text-slate-400 hover:text-primary'}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => { setPassword(genPassword()); setCopied(false); }}
                className="w-12 h-12 rounded-xl border-2 border-slate-200 hover:border-primary text-slate-400 hover:text-primary flex items-center justify-center shrink-0 transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-amber-600 font-bold">⚠ Copiez ce mot de passe et communiquez-le à l'utilisateur.</p>
            {/* WhatsApp — création */}
            <button
              type="button"
              onClick={() => sendWhatsApp(password)}
              className="flex items-center gap-2 mt-1 text-[12px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Envoyer via WhatsApp
            </button>
          </div>
        )}

        {/* ── Regénérer mot de passe — édition seulement ── */}
        {isEdit && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <KeyRound className="w-3.5 h-3.5" /> Réinitialiser le mot de passe
            </label>

            {!newPwd ? (
              <button
                type="button"
                onClick={() => setNewPwd(genPassword())}
                className="flex items-center gap-2 h-11 px-5 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary text-slate-400 hover:text-primary text-xs font-bold transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Générer un nouveau mot de passe
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-3 h-12 px-4 rounded-xl border-2 border-primary/30 bg-primary/5 font-mono text-sm font-bold">
                    <span className="flex-1 truncate">{showNewPwd ? newPwd : '••••••••••••'}</span>
                    <button type="button" onClick={() => setShowNewPwd(v => !v)} className="text-slate-400 hover:text-slate-600 shrink-0">
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="button" onClick={copyNewPwd}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${copiedNew ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-slate-200 hover:border-primary text-slate-400 hover:text-primary'}`}>
                    {copiedNew ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => { setNewPwd(genPassword()); setCopiedNew(false); }}
                    className="w-12 h-12 rounded-xl border-2 border-slate-200 hover:border-primary text-slate-400 hover:text-primary flex items-center justify-center shrink-0 transition-all">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetting}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-60"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {resetting ? 'Application...' : 'Appliquer le mot de passe'}
                  </button>
                  <button
                    type="button"
                    onClick={() => sendWhatsApp(newPwd)}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Envoyer WhatsApp
                  </button>
                  <button type="button" onClick={() => setNewPwd('')} className="text-slate-400 hover:text-red-500 text-xs font-bold transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-xl font-bold">
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 h-12 rounded-xl bg-slate-950 hover:bg-black text-white font-black uppercase tracking-widest text-xs">
          {saving ? 'Enregistrement...' : isEdit ? 'Sauvegarder' : 'Créer'}
        </Button>
      </div>
    </div>
  );
};

// ─── Liste ────────────────────────────────────────────────

const UserManagement: React.FC = () => {
  const [users,   setUsers]   = useState<ClubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState<'list' | 'create' | ClubUser>('list');
  const [search,  setSearch]  = useState('');

  const load = async () => {
    // Attendre que la session soit prête avant de requêter
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('club_users')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (!error) setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    await supabase.from('club_users').update({ is_active: false }).eq('id', id);
    toast.success('Utilisateur supprimé');
    load();
  };

  // ── Création : wizard 4 étapes ────────────────────────
  if (page === 'create') {
    return (
      <CreateWizard
        onBack={() => setPage('list')}
        onSaved={() => { setPage('list'); load(); }}
      />
    );
  }

  // ── Édition : formulaire classique ───────────────────
  if (page !== 'list') {
    return (
      <FormPage
        user={page as ClubUser}
        onBack={() => setPage('list')}
        onSaved={() => { setPage('list'); load(); }}
      />
    );
  }

  // ── Liste ──────────────────────────────────────────────
  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic">Utilisateurs App</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => setPage('create')}
          className="h-11 px-6 rounded-xl bg-slate-950 hover:bg-black text-white font-black uppercase tracking-widest text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Créer un utilisateur
        </Button>
      </div>

      {/* Recherche */}
      <input
        type="text"
        placeholder="Rechercher par nom ou email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm h-11 px-4 rounded-xl border-2 border-slate-200 focus:border-primary outline-none font-medium text-sm transition-colors"
      />

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="font-bold text-lg">Aucun utilisateur</p>
          <p className="text-sm mt-1">Créez le premier avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Nom</th>
                <th className="text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Email</th>
                <th className="text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Téléphone</th>
                <th className="text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Catégorie</th>
                <th className="text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hidden lg:table-cell">Actions</th>
                <th className="px-5 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-bold">{u.full_name}</td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{u.email}</td>
                  <td className="px-5 py-4 text-slate-500 hidden md:table-cell">{u.phone ?? '—'}</td>
                  <td className="px-5 py-4">
                    {u.categories?.length > 0
                      ? <div className="flex flex-wrap gap-1">
                          {u.categories.map(c => (
                            <span key={c} className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-md">{c}</span>
                          ))}
                        </div>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {getUserActions(u).length > 0
                        ? getUserActions(u).map(action => (
                            <span key={action} className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">
                              {ACTION_LABELS[action]}
                            </span>
                          ))
                        : <span className="text-slate-300 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setPage(u)}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.full_name)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
