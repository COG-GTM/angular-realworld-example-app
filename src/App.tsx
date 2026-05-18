import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RequireAuth, RequireUnauth } from './components/RequireAuth';
import { Home } from './features/article/pages/Home';
import { ArticlePage } from './features/article/pages/ArticlePage';
import { Editor } from './features/article/pages/Editor';
import { AuthPage } from './features/auth/AuthPage';
import { Settings } from './features/settings/Settings';
import { ProfilePage } from './features/profile/pages/ProfilePage';
import { ProfileArticles } from './features/profile/components/ProfileArticles';
import { ProfileFavorites } from './features/profile/components/ProfileFavorites';

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
            <RequireUnauth>
              <AuthPage key="login" />
            </RequireUnauth>
          }
        />
        <Route
          path="/register"
          element={
            <RequireUnauth>
              <AuthPage key="register" />
            </RequireUnauth>
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
        <Route path="/article/:slug" element={<ArticlePage />} />
        <Route path="/profile/:username" element={<ProfilePage />}>
          <Route index element={<ProfileArticles />} />
          <Route path="favorites" element={<ProfileFavorites />} />
        </Route>
      </Routes>
      <Footer />
    </>
  );
}
