import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './core/auth/UserProvider';
import { Header } from './core/layout/Header';
import { Footer } from './core/layout/Footer';
import { HomePage } from './features/article/pages/home/HomePage';
import { ArticlePage } from './features/article/pages/article/ArticlePage';
import { EditorPage } from './features/article/pages/editor/EditorPage';
import { AuthPage } from './core/auth/AuthPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ProfilePage } from './features/profile/pages/profile/ProfilePage';
import { ProfileArticles } from './features/profile/components/ProfileArticles';
import { ProfileFavorites } from './features/profile/components/ProfileFavorites';
import { RequireAuth } from './core/auth/RequireAuth';
import { RequireUnauth } from './core/auth/RequireUnauth';

function App() {
  return (
    <UserProvider>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tag/:tag" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <RequireUnauth>
              <AuthPage />
            </RequireUnauth>
          }
        />
        <Route
          path="/register"
          element={
            <RequireUnauth>
              <AuthPage />
            </RequireUnauth>
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
        <Route path="/profile/:username" element={<ProfilePage />}>
          <Route index element={<ProfileArticles />} />
          <Route path="favorites" element={<ProfileFavorites />} />
        </Route>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </UserProvider>
  );
}

export default App;
