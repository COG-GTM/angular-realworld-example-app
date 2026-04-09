import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { Home } from "./pages/Home";
import { Auth } from "./pages/Auth";
import { ArticlePage } from "./pages/ArticlePage";
import { Editor } from "./pages/Editor";
import { Settings } from "./pages/Settings";
import { Profile } from "./pages/Profile";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();

  if (authState === "loading") {
    return null;
  }

  if (authState !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();

  if (authState === "loading") {
    return null;
  }

  if (authState === "authenticated") {
    return <Navigate to="/" replace />;
  }

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
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/:username/favorites" element={<Profile />} />
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:slug"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route path="/article/:slug" element={<ArticlePage />} />
      </Routes>
      <Footer />
    </>
  );
}
