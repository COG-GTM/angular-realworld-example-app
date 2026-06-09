import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GuestRoute, RequireAuth } from './components/guards';

// Lazy-loaded pages (replaces Angular's lazy-loaded route components).
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Article = lazy(() => import('./pages/Article'));
const Editor = lazy(() => import('./pages/Editor'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfileArticles = lazy(() => import('./pages/ProfileArticles'));
const ProfileFavorites = lazy(() => import('./pages/ProfileFavorites'));

function Layout() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tag/:tag" element={<Home />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Auth />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Auth />
            </GuestRoute>
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
      </Route>
    </Routes>
  );
}
