import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { RequireAuth } from './components/RequireAuth';

const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfileArticles = lazy(() => import('./pages/ProfileArticles'));
const ProfileFavorites = lazy(() => import('./pages/ProfileFavorites'));
const Editor = lazy(() => import('./pages/Editor'));
const Article = lazy(() => import('./pages/Article'));

export function App() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tag/:tag" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
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
          {/* The Angular router renders nothing for unmatched routes; keep the same behaviour. */}
          <Route path="*" element={null} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}
