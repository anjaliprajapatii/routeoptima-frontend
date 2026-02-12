import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// --- IMPORTS ---
import Login from './components/login/Login';
import AdminDashboard from './components/dashboard/AdminDashboard';
import DriverDashboard from './components/driver/DriverDashboard';

function App() {
  // 1. User State (LocalStorage Persistence)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('routeOptimaUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 2. Login Handler
  const handleLogin = (userData) => {
    console.log("Logged In:", userData);
    setUser(userData);
    localStorage.setItem('routeOptimaUser', JSON.stringify(userData));
  };

  // 3. Logout Handler
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('routeOptimaUser');
    window.location.href = "/"; // Force refresh to clear state
  };

  return (
    <Router>
      <Routes>
        
        {/* =========================================================
            1. PUBLIC DRIVER APP ROUTE
            (Open this in Incognito / New Tab / Mobile)
            URL: http://localhost:5173/driver
           ========================================================= */}
        <Route path="/driver" element={<DriverDashboard onLogout={handleLogout} />} />


        {/* =========================================================
            2. ADMIN DASHBOARD ROUTE
            (Protected - Only for Admin)
            URL: http://localhost:5173/admin
           ========================================================= */}
        <Route 
          path="/admin" 
          element={
            user && user.role === "ADMIN" ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          } 
        />


        {/* =========================================================
            3. MAIN LOGIN ROUTE
            URL: http://localhost:5173/
           ========================================================= */}
        <Route 
          path="/" 
          element={
            !user ? (
              <Login onLogin={handleLogin} />
            ) : user.role === "ADMIN" ? (
              <Navigate to="/admin" />
            ) : (
              // If a driver logs in via main page, send them to app
              <Navigate to="/driver" />
            )
          } 
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}

export default App;