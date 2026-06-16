import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AlbumDetail from './pages/AlbumDetail';
import PhotoDetail from './pages/PhotoDetail';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Slideshow from './pages/Slideshow';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="loading">加载中</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/albums/:id/slideshow" element={<Slideshow />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/albums/:id" element={<AlbumDetail />} />
        <Route path="/photos/:id" element={<PhotoDetail />} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
