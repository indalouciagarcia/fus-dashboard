import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Users, UserCog, Shield, UserCheck,
  FileText, Settings, LogOut, Activity,
  Swords, Building2, Target, Calendar, LayoutTemplate,
  X, ChevronLeft, ChevronDown, Sparkles, UserPlus, Compass
} from 'lucide-react';
import { cn } from '../lib/utils';
import { usePermissions } from '../context/PermissionsContext';

interface SubNavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  hide?: boolean;
}

interface NavCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  items: SubNavItem[];
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onMobileClose,
  collapsed = false,
  onToggleCollapse,
}) => {
  const { logout, can } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Groupes de navigation hiérarchiques
  const navCategories: NavCategory[] = [
    {
      id: 'competition',
      title: 'Compétition & Matchs',
      icon: Trophy,
      items: [
        { path: '/matches',   label: 'Calendrier',   icon: Calendar },
        ...(can('track_live_match') ? [{ path: '/matchday',  label: 'Match Day',    icon: Swords }] : []),
        ...(can('manage_teams') ? [
          { path: '/leagues',   label: 'Compétitions', icon: Trophy },
          { path: '/opponents', label: 'Adversaires',  icon: Target },
          { path: '/stadiums',  label: 'Stades',       icon: Building2 },
        ] : []),
      ],
    },
    {
      id: 'effectif',
      title: 'Effectif & Sportif',
      icon: Users,
      items: [
        { path: '/players',  label: 'Joueurs',          icon: Users },
        ...(can('manage_teams') ? [{ path: '/teams', label: 'Équipes', icon: Shield }] : []),
        ...(can('manage_roles') ? [{ path: '/staff', label: 'Staff Technique', icon: UserCog }] : []),
        { path: '/arbitres', label: 'Arbitres',         icon: UserCheck },
      ],
    },
    {
      id: 'recruitment',
      title: 'Recrutement & Détection',
      icon: Compass,
      items: [
        { path: '/recruitment?tab=kanban',       label: 'Pipeline Kanban',     icon: LayoutTemplate },
        { path: '/recruitment?tab=candidates',   label: 'Fiches & Tuteurs',    icon: UserPlus },
        { path: '/recruitment?tab=scouts',       label: 'Cellule Scouts',      icon: UserCheck },
        { path: '/recruitment?tab=observations', label: 'Observations Matchs', icon: FileText },
        { path: '/recruitment?tab=sessions',     label: 'Planning des Tests',  icon: Calendar },
        { path: '/recruitment?tab=evaluations',  label: 'Évaluations (1–10)',  icon: Sparkles },
        { path: '/recruitment?tab=compare',      label: 'Comparateur Radar',   icon: Swords },
      ],
    },
    {
      id: 'system',
      title: 'Système & Contenu',
      icon: LayoutTemplate,
      items: [
        { path: '/blog',     label: 'Blog',          icon: FileText },
        { path: '/store',    label: 'Store',         icon: LayoutTemplate },
        ...(can('manage_users') ? [{ path: '/users', label: 'Utilisateurs', icon: Shield }] : []),
        { path: '/logs',     label: 'Logs & Audit',  icon: Activity },
      ],
    },
  ];

  // État des catégories ouvertes (accordéon)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    // Par défaut, ouvrir la catégorie correspondant à la route actuelle
    const initial: Record<string, boolean> = {
      competition: true,
      effectif: true,
      recruitment: true,
      system: true,
    };
    return initial;
  });

  // Détecter et ouvrir automatiquement la catégorie contenant la route active
  useEffect(() => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const fullCurrent = `${currentPath}${currentSearch}`;

    navCategories.forEach((cat) => {
      const isInside = cat.items.some(item => {
        if (item.path.includes('?')) {
          return fullCurrent === item.path || (currentPath === '/recruitment' && item.path.startsWith('/recruitment'));
        }
        return currentPath === item.path || (currentPath.startsWith(item.path) && item.path !== '/');
      });

      if (isInside) {
        setOpenCategories(prev => ({ ...prev, [cat.id]: true }));
      }
    });
  }, [location.pathname, location.search]);

  // Basculer l'ouverture/fermeture d'une catégorie et naviguer si fermeture
  const toggleCategory = (categoryId: string) => {
    const willOpen = !openCategories[categoryId];
    setOpenCategories(prev => ({
      ...prev,
      [categoryId]: willOpen,
    }));

    // Si on ouvre la catégorie et qu'on n'est pas déjà dedans, naviguer vers le premier élément
    if (willOpen) {
      const cat = navCategories.find(c => c.id === categoryId);
      if (cat && cat.items.length > 0 && !isCategoryActive(cat)) {
        navigate(cat.items[0].path);
      }
    }
  };

  // Detect mobile/tablet viewport
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
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    try {
      const { AuditLogger } = await import('../services/auditLogger');
      await AuditLogger.closeSession();
    } catch (_) {}
    await logout();
    navigate('/login');
  };

  const isItemActive = (itemPath: string) => {
    if (itemPath.includes('?')) {
      const [path, search] = itemPath.split('?');
      return location.pathname === path && location.search === `?${search}`;
    }
    return location.pathname === itemPath;
  };

  const isCategoryActive = (category: NavCategory) => {
    return category.items.some(item => isItemActive(item.path));
  };

  const isDashboardActive = location.pathname === '/' || location.pathname === '/dashboard';

  const renderNavList = (isCollapsedMode = false) => (
    <div className="space-y-4">
      {/* Primary Dashboard Link */}
      <div className="mb-2">
        <NavLink
          to="/dashboard"
          onClick={() => isMobile && onMobileClose?.()}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group relative text-xs font-bold shadow-sm",
            isDashboardActive
              ? "bg-primary text-white shadow-md font-black"
              : "text-slate-700 hover:bg-slate-100",
            isCollapsedMode && "justify-center px-2 py-2.5"
          )}
          title={isCollapsedMode ? "Tableau de Bord" : undefined}
        >
          <LayoutDashboard className={cn(
            "w-4 h-4 shrink-0 transition-transform",
            !isDashboardActive && "group-hover:scale-110 text-primary"
          )} />

          {!isCollapsedMode && (
            <span className="truncate flex-1 text-left tracking-wide">
              Tableau de Bord
            </span>
          )}

          {!isCollapsedMode && (
            <span className={cn(
              "text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md",
              isDashboardActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
            )}>
              Live
            </span>
          )}

          {isDashboardActive && !isCollapsedMode && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
          )}
        </NavLink>
      </div>

      {navCategories.map((category) => {
        const isOpen = !!openCategories[category.id];
        const CategoryIcon = category.icon;
        const hasActiveSubItem = isCategoryActive(category);

        return (
          <div key={category.id} className="space-y-1">
            {/* Header de la Catégorie (Cliquable pour Accordéon) */}
            <button
              type="button"
              onClick={() => {
                if (!isCollapsedMode) {
                  toggleCategory(category.id);
                }
              }}
              title={isCollapsedMode ? category.title : undefined}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 group",
                hasActiveSubItem
                  ? "text-primary bg-primary/5 font-extrabold"
                  : "text-muted-foreground/80 hover:text-foreground hover:bg-slate-100/70",
                isCollapsedMode && "justify-center px-2 py-2.5"
              )}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <CategoryIcon className={cn(
                  "w-4 h-4 shrink-0 transition-transform duration-200",
                  hasActiveSubItem ? "text-primary" : "text-muted-foreground",
                  !isCollapsedMode && "group-hover:scale-110"
                )} />
                {!isCollapsedMode && (
                  <span className="truncate text-[11px] font-black">{category.title}</span>
                )}
              </div>

              {!isCollapsedMode && (
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground/60 transition-transform duration-300",
                    isOpen ? "rotate-0" : "-rotate-90"
                  )}
                />
              )}
            </button>

            {/* Sous-catégories Dépliables */}
            {(!isCollapsedMode ? isOpen : true) && (
              <div className={cn(
                "space-y-1 transition-all duration-300",
                !isCollapsedMode && "pl-3 ml-2 border-l-2 border-slate-100"
              )}>
                {category.items.map((item) => {
                  const ItemIcon = item.icon;
                  const active = isItemActive(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => isMobile && onMobileClose?.()}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 group relative text-xs font-semibold",
                        active
                          ? "bg-primary/10 text-primary shadow-sm font-bold"
                          : "text-slate-600 hover:bg-secondary hover:text-foreground",
                        isCollapsedMode && "justify-center px-2 py-2.5"
                      )}
                      title={isCollapsedMode ? item.label : undefined}
                    >
                      <ItemIcon className={cn(
                        "w-4 h-4 shrink-0 transition-transform",
                        !active && "group-hover:scale-110"
                      )} />
                      
                      {!isCollapsedMode && (
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      )}

                      {item.count !== undefined && !isCollapsedMode && (
                        <span className="ml-auto bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                          {item.count}
                        </span>
                      )}

                      {active && !isCollapsedMode && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

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
      <div className="flex-1 overflow-y-auto py-5 px-3 custom-scrollbar">
        {renderNavList(false)}
      </div>

      {/* Navigation bas */}
      <div className="p-3 border-t space-y-1 bg-white">
        <NavLink
          to="/settings"
          onClick={() => isMobile && onMobileClose?.()}
          className={({ isActive }) => cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-xs font-semibold",
            isActive
              ? "bg-primary/10 text-primary font-bold"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Settings className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="block">Paramètres</span>
        </NavLink>

        <button
          onClick={() => {
            handleLogout();
            if (isMobile) onMobileClose?.();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-xs font-semibold text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="block">Déconnexion</span>
        </button>
      </div>
    </>
  );

  // Desktop sidebar
  const desktopSidebar = (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-white border-r hidden md:flex flex-col z-50 transition-all duration-300 overflow-y-auto overflow-hidden",
      collapsed ? "w-[72px]" : "w-[72px] lg:w-64"
    )}>
      {/* Header Logo & Collapse Button */}
      <div className="h-[72px] flex items-center px-4 border-b shrink-0 bg-white sticky top-0 z-10">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <span className={cn(
          "ml-3 font-bold text-lg text-foreground tracking-tight transition-all duration-300",
          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-0 w-0 overflow-hidden lg:opacity-100 lg:w-auto"
        )}>
          Fusc<span className="text-primary">Club</span>
        </span>

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
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto py-5 px-3 custom-scrollbar">
        {renderNavList(collapsed)}
      </div>

      {/* Footer Settings & Logout */}
      <div className="p-3 border-t space-y-1 bg-white">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group text-xs font-semibold",
            isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Paramètres" : undefined}
        >
          <Settings className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
          <span className={cn(
            "transition-all duration-300",
            collapsed ? "opacity-0 w-0 overflow-hidden hidden" : "opacity-100 block"
          )}>Paramètres</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group text-xs font-semibold text-muted-foreground hover:bg-red-50 hover:text-red-600",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Déconnexion" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
          <span className={cn(
            "transition-all duration-300",
            collapsed ? "opacity-0 w-0 overflow-hidden hidden" : "opacity-100 block"
          )}>Déconnexion</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {desktopSidebar}

      {mobileOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed left-0 top-0 h-full w-72 sm:w-80 bg-white border-r flex flex-col z-50 lg:hidden shadow-2xl">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export const MobileMenuButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
    aria-label="Ouvrir le menu"
  >
    <ChevronLeft className="w-5 h-5 text-foreground rotate-180" />
  </button>
);

export default Sidebar;
