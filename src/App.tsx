import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header, Footer } from './components';

const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Settings = lazy(() => import('./pages/Settings'));
const Editor = lazy(() => import('./pages/Editor'));
const Article = lazy(() => import('./pages/Article'));
const Profile = lazy(() => import('./pages/Profile'));

function Loader() {
  return <div className="container page">Loading...</div>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tag/:tag" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/editor/:slug" element={<Editor />} />
        <Route path="/article/:slug" element={<Article />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/:username/favorites" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <AppRoutes />
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
