import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Trophy, Users, UserCog, Shield,
  MessageSquare, FileText, Settings, LogOut,
  Swords, Building2, HardDriveDownload, Target, Calendar, LayoutTemplate, Smartphone,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { usePermissions } from '../context/PermissionsContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  hide?: boolean;
}

const Sidebar: React.FC = () => {
  const { can, logout } = usePermissions();
  const navigate = useNavigate();

  const navGroups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Compétition',
      items: [
        { path: '/matches',   label: 'Calendrier',   icon: Calendar,  hide: !can('view_matches') && !can('edit_matches') },
        { path: '/leagues',   label: 'Compétitions', icon: Trophy,    hide: !can('manage_teams') },
        { path: '/matchday',  label: 'Match Day',    icon: Swords,    hide: !can('track_live_match') && !can('edit_matches') },
        { path: '/opponents', label: 'Adversaires',  icon: Target,    hide: !can('manage_teams') },
        { path: '/stadiums',  label: 'Stades',       icon: Building2, hide: !can('manage_teams') },
      ],
    },
    {
      title: 'Effectif',
      items: [
        { path: '/players', label: 'Joueurs',          icon: Users,       hide: !can('manage_convocations') },
        { path: '/teams',   label: 'Équipes',          icon: Shield,      hide: !can('manage_teams') },
        { path: '/staff',   label: 'Staff Technique',  icon: UserCog,     hide: !can('manage_roles') },
        { path: '/users',   label: 'Utilisateurs App', icon: Smartphone,  hide: !can('manage_roles') },
      ],
    },
    {
      title: 'Système',
      items: [
        { path: '/messages', label: 'Communication', icon: MessageSquare, count: 3 },
        { path: '/backup',   label: 'Sauvegardes',   icon: HardDriveDownload, hide: !can('manage_backups') },
        { path: '/blog',     label: 'Blog',          icon: FileText },
        { path: '/store',    label: 'Store',         icon: LayoutTemplate },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[72px] lg:w-64 bg-white border-r flex flex-col z-50 transition-all duration-300 overflow-y-auto overflow-hidden">
      {/* Logo */}
      <div className="h-[72px] flex items-center px-6 border-b shrink-0 bg-white sticky top-0 z-10">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <span className="ml-3 font-bold text-lg hidden lg:block text-foreground tracking-tight">
          Fusc<span className="text-primary">Club</span>
        </span>
      </div>

      {/* Navigation principale */}
      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={group.title} className={cn("space-y-1", idx !== 0 && "mt-8")}>
            <h3 className="px-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hidden lg:block">
              {group.title}
            </h3>
            <nav className="space-y-1">
              {group.items.filter(item => !item.hide).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cn("w-5 h-5 shrink-0 transition-transform", !isActive && "group-hover:scale-110")} />
                        <span className="font-bold text-sm hidden lg:block flex-1 text-left">{item.label}</span>

                        {item.count && (
                          <span className="absolute top-2 left-7 lg:static lg:ml-auto bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                            {item.count}
                          </span>
                        )}

                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full hidden lg:block" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Navigation bas */}
      <div className="p-3 border-t space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Settings className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-medium hidden lg:block">Paramètres</span>
        </NavLink>

        {/* Bouton déconnexion (pas un NavLink — déclenche la déconnexion) */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-medium hidden lg:block">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
