import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RequireAuth, RedirectIfAuthenticated } from './components/RouteGuards';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { SettingsPage } from './pages/SettingsPage';
import { EditorPage } from './pages/EditorPage';
import { ArticlePage } from './pages/ArticlePage';
import { ProfilePage } from './pages/ProfilePage';
import { ProfileArticles } from './pages/ProfileArticles';
import { ProfileFavorites } from './pages/ProfileFavorites';

/**
 * Replaces the Angular `AppComponent` + `app.routes.ts`. URL structure is
 * preserved 1:1 with the original Angular routing.
 */
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tag/:tag" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <AuthPage key="login" />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfAuthenticated>
                <AuthPage key="register" />
              </RedirectIfAuthenticated>
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
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
