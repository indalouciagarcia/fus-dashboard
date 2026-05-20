import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell, ChevronDown, Settings, Calendar,
  Search, LogOut, Shield, User, Radio, Swords,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { usePermissions, ROLE_LABELS, getPrimaryRole } from '../context/PermissionsContext';
import { useMatches } from '../hooks/useMatches';
import { useClubData } from '../hooks/useClubData';

interface HeaderProps {
  title: string;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  super_admin:        'text-red-600 bg-red-50 border-red-200',
  club_admin:         'text-purple-600 bg-purple-50 border-purple-200',
  technical_director: 'text-blue-600 bg-blue-50 border-blue-200',
  coach:              'text-green-600 bg-green-50 border-green-200',
  assistant_coach:    'text-teal-600 bg-teal-50 border-teal-200',
  match_operator:     'text-orange-600 bg-orange-50 border-orange-200',
  viewer:             'text-slate-600 bg-slate-50 border-slate-200',
};

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { authState, logout } = usePermissions();
  const navigate = useNavigate();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen]       = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si clic hors du composant
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  // Données affichées
  const email       = authState.email ?? '';
  const displayName = email.split('@')[0] ?? 'Utilisateur';
  const primaryRole = getPrimaryRole(authState.roles);
  const roleLabel   = ROLE_LABELS[primaryRole] ?? primaryRole;
  const roleBadge   = ROLE_BADGE_COLORS[primaryRole] ?? ROLE_BADGE_COLORS.viewer;
  const avatarUrl   = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1d4ed8&color=fff&size=100`;

  const { matches } = useMatches();
  const { opponentClubs } = useClubData();

  // Date courante formatée
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayStr = new Date().toLocaleDateString('en-CA');

  const todayMatch = matches.find(m =>
    m.match_date === todayStr &&
    (m.status === 'scheduled' || m.status === 'live')
  );
  const opponent = todayMatch ? opponentClubs.find(c => c.id === todayMatch.opponent_id) : null;

  return (
    <header className="fixed top-0 right-0 h-[72px] left-[72px] lg:left-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b flex items-center px-6 z-40 transition-all duration-300">
      {/* Titre + date / match du jour */}
      <div className="flex-1 flex flex-col">
        <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
        {todayMatch && opponent ? (
          <button
            onClick={() => navigate('/matchday')}
            className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
          >
            {todayMatch.status === 'live' ? (
              <span className="flex items-center gap-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full animate-pulse">
                <Radio className="w-2 h-2" /> LIVE
              </span>
            ) : (
              <Swords className="w-3 h-3 text-primary" />
            )}
            <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
              {todayMatch.status === 'live' ? 'En cours' : 'Match ce soir'}
            </span>
            <span className="text-[11px] font-bold text-muted-foreground">vs {opponent.name}</span>
            {todayMatch.match_time && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{todayMatch.match_time}</span>
            )}
            <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 underline underline-offset-2 group-hover:text-primary transition-colors">
              → Live Tracking
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
            <Calendar className="w-3 h-3" />
            <span className="capitalize">{today}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Recherche */}
        <div className={cn(
          "relative hidden md:flex items-center rounded-xl bg-secondary transition-all duration-300 overflow-hidden",
          isSearchFocused ? "w-80 ring-2 ring-primary/20 bg-white" : "w-64"
        )}>
          <Search className={cn(
            "absolute left-3 w-4 h-4 transition-colors",
            isSearchFocused ? "text-primary" : "text-muted-foreground"
          )} />
          <input
            type="text"
            placeholder="Rechercher…"
            className="w-full h-10 pl-10 pr-4 bg-transparent outline-none text-sm"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>

        {/* Notifications */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="relative group rounded-xl">
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
          </Button>
        </div>

        <div className="h-8 w-px bg-border mx-1" />

        {/* Profil utilisateur + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-3 pl-1 group cursor-pointer rounded-xl hover:bg-secondary px-3 py-2 transition-colors"
          >
            {/* Nom + rôle (masqué sur mobile) */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-foreground leading-none mb-1">
                {displayName}
              </span>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border",
                roleBadge,
              )}>
                {roleLabel}
              </span>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform overflow-hidden">
              <img src={avatarUrl} className="w-full h-full object-cover" alt={displayName} />
            </div>

            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              dropdownOpen && "rotate-180"
            )} />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* En-tête dropdown */}
              <div className="px-4 py-3 bg-secondary/50 border-b">
                <p className="text-sm font-semibold text-foreground truncate">{email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield className="w-3 h-3 text-muted-foreground" />
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    ROLE_BADGE_COLORS[primaryRole]?.split(' ')[0] ?? 'text-slate-600',
                  )}>
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2">
                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Paramètres du club
                </Link>

                <button
                  disabled
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  <User className="w-4 h-4" />
                  Mon profil
                  <span className="ml-auto text-[10px] bg-muted rounded px-1.5 py-0.5">bientôt</span>
                </button>
              </div>

              <div className="border-t p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
