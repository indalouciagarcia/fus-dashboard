import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell, ChevronDown, Settings, Calendar,
  Search, LogOut, Shield, User, Radio, Swords,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { usePermissions } from '../context/PermissionsContext';
import { useMatches } from '../hooks/useMatches';
import { useClubData } from '../hooks/useClubData';
import { MobileMenuButton } from './Sidebar';

interface HeaderProps {
  title: string;
  onMobileMenuClick?: () => void;
  sidebarCollapsed?: boolean;
}



const Header: React.FC<HeaderProps> = ({ title, onMobileMenuClick, sidebarCollapsed = false }) => {
  const { authState, logout } = usePermissions();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const displayName = authState.user?.full_name || email.split('@')[0] || 'Utilisateur';
  const roleLabel   = authState.user?.system_role === 'super_admin' ? 'Super Admin' : (authState.user?.system_role || 'Membre');
  const roleBadge   = 'text-slate-600 bg-slate-50 border-slate-200';
  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1d4ed8&color=fff&size=100`;
  const avatarUrl   = authState.user?.avatar_url || defaultAvatarUrl;

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
    <header className={cn(
      "fixed top-0 right-0 h-[72px] left-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b flex items-center px-3 sm:px-4 lg:px-6 z-40 transition-all duration-300",
      // md+ : sidebar icône (72px) toujours présente
      "md:left-[72px]",
      // lg+ : sidebar pleine largeur ou collapsed
      sidebarCollapsed ? "lg:left-[72px]" : "lg:left-64"
    )}>
      {/* Menu burger — uniquement sous md (mobile), la sidebar est visible sur tablette */}
      {onMobileMenuClick && (
        <div className="md:hidden">
          <MobileMenuButton onClick={onMobileMenuClick} />
        </div>
      )}

      {/* Titre + date / match du jour */}
      <div className="flex-1 flex flex-col min-w-0 ml-2 lg:ml-0">
        <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight truncate">{title}</h1>
        {todayMatch && opponent ? (
          <button
            onClick={() => navigate('/matchday')}
            className="flex items-center gap-1.5 sm:gap-2 group hover:opacity-80 transition-opacity overflow-hidden"
          >
            {todayMatch.status === 'live' ? (
              <span className="flex items-center gap-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                <Radio className="w-2 h-2" /> LIVE
              </span>
            ) : (
              <Swords className="w-3 h-3 text-primary shrink-0" />
            )}
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-foreground truncate">
              {todayMatch.status === 'live' ? 'En cours' : 'Match ce soir'}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground truncate hidden sm:inline">vs {opponent.name}</span>
            {todayMatch.match_time && (
              <span className="text-[9px] sm:text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">{todayMatch.match_time}</span>
            )}
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-primary/60 underline underline-offset-2 group-hover:text-primary transition-colors shrink-0 hidden md:inline">
              → Live
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] sm:text-[11px] font-medium uppercase tracking-wider">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="capitalize truncate">{today}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Recherche - hidden on small mobile */}
        <div className={cn(
          "relative hidden sm:flex items-center rounded-xl bg-secondary transition-all duration-300 overflow-hidden",
          isSearchFocused ? "w-48 md:w-64 lg:w-80 ring-2 ring-primary/20 bg-white" : "w-32 md:w-48 lg:w-64"
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

        {/* Notifications - simplified on mobile */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="relative group rounded-xl h-9 w-9 sm:h-10 sm:w-10">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
          </Button>
        </div>

        <div className="h-6 sm:h-8 w-px bg-border mx-0.5 sm:mx-1" />

        {/* Profil utilisateur + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 sm:gap-3 pl-1 group cursor-pointer rounded-xl hover:bg-secondary px-2 sm:px-3 py-1.5 sm:py-2 transition-colors"
          >
            {/* Nom + rôle (masqué sur mobile) */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-foreground leading-none mb-1 truncate max-w-[120px]">
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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
              <img src={avatarUrl} className="w-full h-full object-cover" alt={displayName} />
            </div>

            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform hidden sm:block",
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
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
