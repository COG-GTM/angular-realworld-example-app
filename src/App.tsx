import { useRef, type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Article } from './pages/Article';
import { Editor } from './pages/Editor';
import { Settings } from './pages/Settings';
import { Profile } from './pages/profile/Profile';
import { ProfileArticles } from './pages/profile/ProfileArticles';
import { ProfileFavorites } from './pages/profile/ProfileFavorites';

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth();
  // Only guard at entry: if the user was authenticated when this route mounted,
  // a later mid-session logout (e.g. a background 401) should not yank them off
  // the page before the triggering action can surface its error. This mirrors
  // Angular, where route guards run on navigation rather than reactively.
  const wasAuthenticated = useRef(isAuthenticated);
  if (isAuthenticated) {
    wasAuthenticated.current = true;
  }
  return isAuthenticated || wasAuthenticated.current ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export function App() {
  const { authState } = useAuth();

  return (
    <>
      <Header />

      {authState !== 'loading' && (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tag/:tag" element={<Home />} />
          <Route
            path="/login"
            element={
              <GuestOnly>
                <Auth key="login" />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <Auth key="register" />
              </GuestOnly>
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
          <Route path="/profile/:username" element={<Profile />}>
            <Route index element={<ProfileArticles />} />
            <Route path="favorites" element={<ProfileFavorites />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      <Footer />
    </>
  );
}
