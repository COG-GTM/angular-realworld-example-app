import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RequireAnon, RequireAuth } from './components/guards';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Article } from './pages/Article';
import { Editor } from './pages/Editor';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { ProfileArticles } from './pages/ProfileArticles';
import { ProfileFavorites } from './pages/ProfileFavorites';

export function App() {
  return (
    <AuthProvider>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tag/:tag" element={<Home />} />

        <Route
          path="/login"
          element={
            <RequireAnon>
              <Auth />
            </RequireAnon>
          }
        />
        <Route
          path="/register"
          element={
            <RequireAnon>
              <Auth />
            </RequireAnon>
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
      </Routes>

      <Footer />
    </AuthProvider>
  );
}
