import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';
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
import Orders from './pages/Orders';
import CheckoutStatus from './pages/CheckoutStatus';

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
      <Route path="/orders" element={<ProtectedRoute><Navbar /><Orders /></ProtectedRoute>} />
      <Route path="/checkout/status" element={<ProtectedRoute><Navbar /><CheckoutStatus /></ProtectedRoute>} />
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
