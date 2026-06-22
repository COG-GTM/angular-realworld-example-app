import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './auth/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Article } from './pages/Article';
import { Editor } from './pages/Editor';
import { Profile } from './pages/Profile';
import { ProfileArticles } from './pages/ProfileArticles';
import { ProfileFavorites } from './pages/ProfileFavorites';
import { Settings } from './pages/Settings';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireAnonymous({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export function App() {
  const { initialized } = useAuth();

  return (
    <>
      <Header />

      {initialized && (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tag/:tag" element={<Home />} />
          <Route
            path="/login"
            element={
              <RequireAnonymous>
                <Auth />
              </RequireAnonymous>
            }
          />
          <Route
            path="/register"
            element={
              <RequireAnonymous>
                <Auth />
              </RequireAnonymous>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route path="/profile/:username" element={<Profile />}>
            <Route index element={<ProfileArticles />} />
            <Route path="favorites" element={<ProfileFavorites />} />
          </Route>
          <Route
            path="/editor"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route
            path="/editor/:slug"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route path="/article/:slug" element={<Article />} />
        </Routes>
      )}

      <Footer />
    </>
  );
}
