import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAnonymous, RequireAuth } from './auth/RequireAuth';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

import { HomePage } from './features/home/HomePage';
import { AuthPage } from './features/auth/AuthPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { EditorPage } from './features/editor/EditorPage';
import { ArticlePage } from './features/article/ArticlePage';
import { ProfilePage } from './features/profile/ProfilePage';
import { ProfileArticles } from './features/profile/components/ProfileArticles';
import { ProfileFavorites } from './features/profile/components/ProfileFavorites';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tag/:tag" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <RequireAnonymous>
                <AuthPage authType="login" />
              </RequireAnonymous>
            }
          />
          <Route
            path="/register"
            element={
              <RequireAnonymous>
                <AuthPage authType="register" />
              </RequireAnonymous>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/editor"
            element={
              <RequireAuth>
                <EditorPage />
              </RequireAuth>
            }
          />
          <Route
            path="/editor/:slug"
            element={
              <RequireAuth>
                <EditorPage />
              </RequireAuth>
            }
          />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/profile/:username" element={<ProfilePage />}>
            <Route index element={<ProfileArticles />} />
            <Route path="favorites" element={<ProfileFavorites />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}
