import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import ArticlePage from './pages/ArticlePage';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import ProfilePage from './pages/ProfilePage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tag/:tag" element={<Home />} />
          <Route path="/login" element={<Auth key="login" />} />
          <Route path="/register" element={<Auth key="register" />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:slug" element={<Editor />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile/:username/favorites" element={<ProfilePage />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
