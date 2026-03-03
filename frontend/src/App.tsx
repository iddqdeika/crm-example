import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Admin from "./pages/Admin";
import BlogManageEditPage from "./pages/BlogManageEditPage";
import BlogManagePage from "./pages/BlogManagePage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import Campaigns from "./pages/Campaigns";
import CampaignEditPage from "./pages/CampaignEditPage";
import CampaignNewPage from "./pages/CampaignNewPage";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AppHeader from "./components/AppHeader";
import SessionExpiryWarning from "./components/SessionExpiryWarning";
import Profile from "./pages/Profile";
import SignUp from "./pages/SignUp";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function ContentManagerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== "content_manager" && profile?.role !== "admin")
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Campaign routes: only admin and buyer (and standard); content_manager redirected to dashboard. */
function CampaignRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === "content_manager") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <AppHeader />
      {user && <SessionExpiryWarning />}
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <CampaignRoute>
            <Campaigns />
          </CampaignRoute>
        }
      />
      <Route
        path="/campaigns/new"
        element={
          <CampaignRoute>
            <CampaignNewPage />
          </CampaignRoute>
        }
      />
      <Route
        path="/campaigns/:id"
        element={
          <CampaignRoute>
            <CampaignEditPage />
          </CampaignRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/post/:slug" element={<BlogPostPage />} />
      <Route
        path="/blog/manage"
        element={
          <ContentManagerRoute>
            <BlogManagePage />
          </ContentManagerRoute>
        }
      />
      <Route
        path="/blog/manage/new"
        element={
          <ContentManagerRoute>
            <BlogManageEditPage />
          </ContentManagerRoute>
        }
      />
      <Route
        path="/blog/manage/:id"
        element={
          <ContentManagerRoute>
            <BlogManageEditPage />
          </ContentManagerRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
