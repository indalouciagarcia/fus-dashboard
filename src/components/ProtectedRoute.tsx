import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePermissions } from '../context/PermissionsContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Permission requise pour accéder à la route (optionnel) */
  requiredPermission?: string;
  /** Route de redirection si permission insuffisante (défaut : '/') */
  fallback?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  fallback = '/',
}) => {
  const { authState, can } = usePermissions();
  const location = useLocation();

  // Chargement initial de la session
  if (authState.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Vérification de la session…</p>
      </div>
    );
  }

  // Non authentifié → page de connexion (avec retour après login)
  if (!authState.isAuthenticated) {
    if (import.meta.env.DEV) {
      return <>{children}</>;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Permission insuffisante → tableau de bord
  if (requiredPermission && !can(requiredPermission)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
