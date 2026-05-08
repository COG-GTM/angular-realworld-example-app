import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Settings } from './pages/Settings';
import { Editor } from './pages/Editor';
import { Article } from './pages/Article';
import { Profile } from './pages/Profile';
import { ProfileArticles } from './pages/ProfileArticles';
import { ProfileFavorites } from './pages/ProfileFavorites';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tag/:tag" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:slug" element={<Editor />} />
          <Route path="/article/:slug" element={<Article />} />
          <Route path="/profile/:username" element={<Profile />}>
            <Route index element={<ProfileArticles />} />
            <Route path="favorites" element={<ProfileFavorites />} />
          </Route>
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
