import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { UserProvider } from './core/auth/user-context';
import { RequireAuth } from './core/router/require-auth';
import { RedirectIfAuthenticated } from './core/router/redirect-if-authenticated';
import { Header } from './core/layout/header';
import { Footer } from './core/layout/footer';
import { Home } from './features/article/pages/home';
import { ArticlePage } from './features/article/pages/article';
import { Editor } from './features/article/pages/editor';
import { AuthPage } from './features/auth/auth-page';
import { Settings } from './features/settings/settings';
import { ProfilePage } from './features/profile/pages/profile';
import { ProfileArticles } from './features/profile/components/profile-articles';
import { ProfileFavorites } from './features/profile/components/profile-favorites';

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tag/:tag" element={<Home />} />
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <AuthPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfAuthenticated>
                <AuthPage />
              </RedirectIfAuthenticated>
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
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
