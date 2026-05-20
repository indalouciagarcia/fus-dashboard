import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

import { queryClient } from './lib/queryClient';
import { ClubProvider } from './context/ClubContext';
import { PermissionsProvider } from './context/PermissionsContext';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import DevRoleSwitcher from './components/dev/DevRoleSwitcher';
import PlaceholderPage from './components/layout/PlaceholderPage';

// Pages publiques (auth)
import LoginPage from './features/auth/LoginPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';

// Pages protégées
import MatchManagementPage from './features/match-management/MatchManagementPage';
import MatchDayPage from './features/match-management/MatchDayPage';
import PlayerManagement from './features/people-management/PlayerManagement';
import StaffManagement from './features/people-management/StaffManagement';
import LeagueManagement from './features/league-management/LeagueManagement';
import ClubSettings from './features/club-management/ClubSettings';
import OpponentClubs from './features/club-management/OpponentClubs';
import TeamManagement from './features/squad-management/TeamManagement';
import StadiumManagement from './features/club-management/StadiumManagement';
import BackupPage from './features/backup-management/BackupPage';
import BlogManagement from './features/blog-management/BlogManagement';
import StoreManagement from './features/store-management/StoreManagement';
import UserManagement from './features/people-management/UserManagement';

const pageTitles: Record<string, string> = {
  '/matches':    'Centre de Matchs',
  '/matchday':   'Jour de Match',
  '/players':    'Effectif Joueurs',
  '/teams':      'Unités d\'Équipe',
  '/staff':      'Staff Technique',
  '/leagues':    'Compétitions',
  '/opponents':  'Base Adversaires',
  '/stadiums':   'Gestion Stades',
  '/messages':   'Communications',
  '/settings':   'Paramètres Club',
  '/backup':     'Centre de Sauvegarde',
  '/blog':       'Blog & Actus',
  '/store':      'Store & Marketing',
  '/users':      'Utilisateurs App',
};

// -------------------------------------------------------
// Layout principal (authentifié)
// -------------------------------------------------------

const AppContent: React.FC = () => {
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || 'Tableau de Bord';

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />
      <Header title={currentTitle} />

      <main className="pl-[72px] lg:pl-64 pt-[72px] transition-all duration-300">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Routes location={location}>
                <Route path="/"          element={<Navigate to="/matches" replace />} />
                <Route path="/matches"   element={<MatchManagementPage />} />
                <Route path="/matchday"  element={
                  <ProtectedRoute requiredPermission="track_live_match">
                    <MatchDayPage />
                  </ProtectedRoute>
                } />
                <Route path="/players"   element={<PlayerManagement />} />
                <Route path="/teams"     element={
                  <ProtectedRoute requiredPermission="manage_teams">
                    <TeamManagement />
                  </ProtectedRoute>
                } />
                <Route path="/staff"     element={
                  <ProtectedRoute requiredPermission="manage_roles">
                    <StaffManagement />
                  </ProtectedRoute>
                } />
                <Route path="/leagues"   element={
                  <ProtectedRoute requiredPermission="manage_teams">
                    <LeagueManagement />
                  </ProtectedRoute>
                } />
                <Route path="/opponents" element={
                  <ProtectedRoute requiredPermission="manage_teams">
                    <OpponentClubs />
                  </ProtectedRoute>
                } />
                <Route path="/stadiums"  element={
                  <ProtectedRoute requiredPermission="manage_teams">
                    <StadiumManagement />
                  </ProtectedRoute>
                } />
                <Route path="/settings"  element={
                  <ProtectedRoute requiredPermission="manage_roles">
                    <ClubSettings />
                  </ProtectedRoute>
                } />
                <Route path="/backup"    element={
                  <ProtectedRoute requiredPermission="manage_backups">
                    <BackupPage />
                  </ProtectedRoute>
                } />
                <Route path="/blog"      element={<BlogManagement />} />
                <Route path="/store"     element={<StoreManagement />} />
                <Route path="/users"     element={
                  <ProtectedRoute requiredPermission="manage_roles">
                    <UserManagement />
                  </ProtectedRoute>
                } />

                {/* Stubs */}
                <Route path="/messages"   element={<PlaceholderPage name="Team Communications" />} />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <DevRoleSwitcher />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
};

// -------------------------------------------------------
// Root
// -------------------------------------------------------

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PermissionsProvider>
        <BrowserRouter>
          <Routes>
            {/* Routes publiques — accessibles sans session */}
            <Route path="/login"            element={<LoginPage />} />
            <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
            <Route path="/reset-password"   element={<ResetPasswordPage />} />

            {/* Toutes les autres routes sont protégées */}
            <Route path="/*" element={
              <ProtectedRoute>
                <ClubProvider>
                  <AppContent />
                </ClubProvider>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </PermissionsProvider>
    </QueryClientProvider>
  );
}

export default App;
