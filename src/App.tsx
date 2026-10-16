import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/RouteGuards';
import { AppShell } from './components/layout/AppShell';
import { TeamLayout } from './components/layout/TeamLayout';
import { ToastProvider } from './components/ui';
import { createQueryClient } from './lib/queryClient';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { TeamsPage } from './pages/TeamsPage';
import { StandupPage } from './pages/StandupPage';
import { BoardPage } from './pages/BoardPage';
import { ActivityPage } from './pages/ActivityPage';
import { SummaryPage } from './pages/SummaryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/teams" replace />} />
            <Route element={<PublicOnlyRoute />}>
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              <Route path="/t/:teamId" element={<TeamLayout />}>
                <Route index element={<Navigate to="standup" replace />} />
                <Route path="standup" element={<StandupPage />} />
                <Route path="board" element={<BoardPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="summary" element={<SummaryPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage embedded />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
