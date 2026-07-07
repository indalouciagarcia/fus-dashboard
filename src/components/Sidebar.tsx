import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy, Users, UserCog, Shield,
  FileText, Settings, LogOut,
  Swords, Building2, Target, Calendar, LayoutTemplate, Smartphone,
  Menu, X, ChevronLeft,
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

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose, collapsed = false, onToggleCollapse }) => {
  const { logout, can } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/tablet viewport (below lg breakpoint where sidebar is hidden)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const navGroups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Compétition',
      items: [
        { path: '/matches',   label: 'Calendrier',   icon: Calendar },
        { path: '/leagues',   label: 'Compétitions', icon: Trophy },
        { path: '/matchday',  label: 'Match Day',    icon: Swords },
        { path: '/opponents', label: 'Adversaires',  icon: Target },
        { path: '/stadiums',  label: 'Stades',       icon: Building2 },
      ],
    },
    {
      title: 'Effectif',
      items: [
        { path: '/players', label: 'Joueurs',          icon: Users },
        { path: '/teams',   label: 'Équipes',          icon: Shield },
        { path: '/staff',   label: 'Staff Technique',  icon: UserCog },
      ],
    },
    {
      title: 'Système',
      items: [
        { path: '/blog',     label: 'Blog',          icon: FileText },
        { path: '/store',    label: 'Store',         icon: LayoutTemplate },
        ...(can('manage_users') ? [{ path: '/users', label: 'Utilisateurs', icon: Shield }] : []),
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      {/* Mobile Close Button */}
      {isMobile && (
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors lg:hidden"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      )}

      {/* Logo */}
      <div className="h-[72px] flex items-center px-6 border-b shrink-0 bg-white sticky top-0 z-10">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <span className="ml-3 font-bold text-lg block text-foreground tracking-tight">
          Fusc<span className="text-primary">Club</span>
        </span>
      </div>

      {/* Navigation principale */}
      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={group.title} className={cn("space-y-1", idx !== 0 && "mt-8")}>
            <h3 className="px-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              {group.title}
            </h3>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => isMobile && onMobileClose?.()}
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
                        <span className="font-bold text-sm block flex-1 text-left">{item.label}</span>

                        {item.count && (
                          <span className="static ml-auto bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                            {item.count}
                          </span>
                        )}

                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full" />
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
          onClick={() => isMobile && onMobileClose?.()}
          className={({ isActive }) => cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Settings className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-medium block">Paramètres</span>
        </NavLink>

        {/* Bouton déconnexion (pas un NavLink — déclenche la déconnexion) */}
        <button
          onClick={() => {
            handleLogout();
            if (isMobile) onMobileClose?.();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-medium block">Déconnexion</span>
        </button>
      </div>
    </>
  );

  // Desktop sidebar - icône seule sur tablette (md), expansible sur desktop (lg+)
  const desktopSidebar = (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-white border-r hidden md:flex flex-col z-50 transition-all duration-300 overflow-y-auto overflow-hidden",
      // Tablette (md < lg) : toujours icône. Desktop (lg+) : respect collapsed
      collapsed ? "w-[72px]" : "w-[72px] lg:w-64"
    )}>
      <div className="h-[72px] flex items-center px-4 border-b shrink-0 bg-white sticky top-0 z-10">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <span className={cn(
          "ml-3 font-bold text-lg text-foreground tracking-tight transition-all duration-300",
          // Cacher le texte sur tablette et quand collapsed sur desktop
          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-0 w-0 overflow-hidden lg:opacity-100 lg:w-auto"
        )}>
          Fusc<span className="text-primary">Club</span>
        </span>

        {/* Toggle button — visible seulement sur desktop (lg+) */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "ml-auto p-1.5 rounded-lg hover:bg-secondary transition-all duration-300 hidden lg:flex",
            collapsed ? "opacity-100" : "opacity-60 hover:opacity-100"
          )}
          title={collapsed ? "Développer" : "Réduire"}
        >
          <ChevronLeft className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-300",
            collapsed && "rotate-180"
          )} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={group.title} className={cn("space-y-1", idx !== 0 && "mt-8")}>
            <h3 className={cn(
              "px-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-all duration-300",
              collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
            )}>
              {group.title}
            </h3>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cn("w-5 h-5 shrink-0 transition-transform", !isActive && "group-hover:scale-110")} />
                        <span className={cn(
                          "font-bold text-sm flex-1 text-left transition-all duration-300",
                          collapsed ? "opacity-0 w-0 overflow-hidden hidden" : "opacity-100 block"
                        )}>{item.label}</span>

                        {item.count && (
                          <span className={cn(
                            "bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm transition-all duration-300",
                            collapsed ? "absolute -top-1 -right-1" : "static ml-auto"
                          )}>
                            {item.count}
                          </span>
                        )}

                        {isActive && !collapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full" />
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

      <div className="p-3 border-t space-y-1">
        <NavLink
          to="/settings"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Paramètres" : undefined}
        >
          <Settings className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
          <span className={cn(
            "font-medium transition-all duration-300",
            collapsed ? "opacity-0 w-0 overflow-hidden hidden" : "opacity-100 block"
          )}>Paramètres</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-muted-foreground hover:bg-red-50 hover:text-red-600",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Déconnexion" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
          <span className={cn(
            "font-medium transition-all duration-300",
            collapsed ? "opacity-0 w-0 overflow-hidden hidden" : "opacity-100 block"
          )}>Déconnexion</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      {desktopSidebar}

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileClose}
          />
          {/* Mobile/Tablet sidebar - wider on tablet for better usability */}
          <aside className="fixed left-0 top-0 h-full w-72 sm:w-80 bg-white border-r flex flex-col z-50 lg:hidden shadow-2xl">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

// Mobile menu button component for Header
export const MobileMenuButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
    aria-label="Ouvrir le menu"
  >
    <Menu className="w-5 h-5 text-foreground" />
  </button>
);

export default Sidebar;
