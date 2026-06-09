import { Navigate, Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { useUser } from './context/UserContext';
import { Article } from './pages/Article';
import { Auth } from './pages/Auth';
import { Editor } from './pages/Editor';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import type { ReactNode } from 'react';

function RequireAuth({ children }: { children: ReactNode }) {
  const { authState } = useUser();
  if (authState === 'loading') return null;
  if (authState !== 'authenticated') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireGuest({ children }: { children: ReactNode }) {
  const { authState } = useUser();
  if (authState === 'loading') return null;
  if (authState === 'authenticated') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tag/:tag" element={<Home />} />
        <Route
          path="/login"
          element={
            <RequireGuest>
              <Auth mode="login" />
            </RequireGuest>
          }
        />
        <Route
          path="/register"
          element={
            <RequireGuest>
              <Auth mode="register" />
            </RequireGuest>
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
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/:username/favorites" element={<Profile />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}
