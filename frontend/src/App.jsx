import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import InspectorDashboard from './pages/InspectorDashboard';
import GovtDashboard from './pages/GovtDashboard';

const PrivateRoute = ({ children, roleRequired }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roleRequired && user.role !== roleRequired) {
    if (user.role === 'owner') return <Navigate to="/owner" replace />;
    if (user.role === 'inspector') return <Navigate to="/inspector" replace />;
    if (user.role === 'govt') return <Navigate to="/govt" replace />;
  }
  return <SocketProvider>{children}</SocketProvider>;
};

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
        
        <Route path="/owner" element={<PrivateRoute roleRequired="owner"><OwnerDashboard /></PrivateRoute>} />
        
        <Route path="/inspector" element={<PrivateRoute roleRequired="inspector"><InspectorDashboard /></PrivateRoute>} />
        
        <Route path="/govt" element={<PrivateRoute roleRequired="govt"><GovtDashboard /></PrivateRoute>} />
        
        <Route path="/" element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
