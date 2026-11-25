import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import StreamerDashboard from './pages/StreamerDashboard';
import CreateEvent from './pages/CreateEvent';
import EventDetails from './pages/EventDetails';
import Watch from './pages/Watch';
import VRViewer from './pages/VRViewer';
import AdminDashboard from './pages/AdminDashboard';
import Publisher from './pages/Publisher';
import Viewer from './pages/Viewer';
import ForgotPassword from './pages/ForgotPassword';
import Events from './pages/Events';
import Profile from './pages/Profile';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-darkerBlue flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-darkerBlue flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'streamer') {
      return <Navigate to="/streamer-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<><Navbar /><Home /></>} />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />

      {/* Protected Routes - User */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Protected Routes - Streamer */}
      <Route 
        path="/streamer-dashboard" 
        element={
          <ProtectedRoute requiredRole="streamer">
            <StreamerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-event" 
        element={
          <ProtectedRoute requiredRole="streamer">
            <CreateEvent />
          </ProtectedRoute>
        } 
      />

      {/* Protected Routes - Admin */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Event Routes (Public but require ticket for watch) */}
      <Route path="/event/:id" element={<><Navbar /><EventDetails /></>} />
      <Route 
        path="/watch/:id" 
        element={
          <ProtectedRoute>
            <Watch />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vr-viewer/:id" 
        element={
          <ProtectedRoute>
            <VRViewer />
          </ProtectedRoute>
        } 
      />

      {/* LiveKit Streaming Routes - Public for testing */}
      <Route path="/publisher/:eventId" element={<Publisher />} />
      <Route path="/viewer/:eventId" element={<Viewer />} />

      {/* Events listing */}
      <Route path="/events" element={<><Navbar /><Events /></>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Navbar /><Profile /></ProtectedRoute>} />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
