import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaThLarge, FaBox, FaUsers, FaMap, FaSearch, FaBell, FaPlus, 
  FaSignOutAlt, FaBars, FaTimes, FaTruck, FaMoneyBillWave, FaCalendarAlt 
} from 'react-icons/fa';

import './AdminDashboard.css';
import OrdersView from './OrdersView';
import DriversView from './DriversView';
import DeliveryMap from '../DeliveryMap'; 

// ✅ LOGIC FIX 1: Centralized API URL
const API_BASE_URL = "https://routeoptima-backend.onrender.com";

const Placeholder = ({ title }) => (
  <div className="p-20 text-center text-muted" style={{padding:'40px', color:'#94a3b8'}}>
    {title} Module Loaded
  </div>
);

const AdminDashboard = ({ user, onLogout }) => {
  if (!user) return <div className="loading-screen">Loading Dashboard...</div>;

  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [recentOrders, setRecentOrders] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, activeDrivers: 0, pendingOrders: 0, revenue: 0 });
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    setCurrentDate(date);
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // ✅ LOGIC FIX 2: Template Literals (Backticks) for all fetch calls
      const ordersRes = await axios.get(`${API_BASE_URL}/api/orders/my-orders?adminEmail=${user.email}`).catch(() => ({ data: [] }));
      const allOrders = ordersRes.data || [];
      
      const driversRes = await axios.get(`${API_BASE_URL}/api/auth/my-drivers?adminEmail=${user.email}`).catch(() => ({ data: [] }));
      const drivers = driversRes.data || []; 
      
      const totalRev = allOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0);

      setStats({
        totalOrders: allOrders.length,
        activeDrivers: drivers.filter(d => !d.isAvailable).length,
        pendingOrders: allOrders.filter(o => o.status !== 'DELIVERED').length,
        revenue: totalRev
      });
      setRecentOrders(allOrders.slice(-6).reverse());
    } catch (err) { 
        console.error("Dashboard Logic Error:", err); 
    }
  };

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.split(' ');
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="admin-container">
      <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand-section">
          <h2>Route<span className="brand-blue">Optima</span></h2>
          <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}><FaTimes /></button>
        </div>
        <nav className="menu-list">
          {/* Menu items click logic fixed to match state */}
          {['Dashboard', 'Orders', 'Drivers', 'MapView'].map((item) => (
             <div key={item} className={`menu-item ${activeMenu === item ? 'active' : ''}`} onClick={() => { setActiveMenu(item); setIsSidebarOpen(false); }}>
                {item === 'Dashboard' && <FaThLarge />}
                {item === 'Orders' && <FaBox />}
                {item === 'Drivers' && <FaUsers />}
                {item === 'MapView' && <FaMap />}
                <span>{item}</span>
             </div>
          ))}
        </nav>
        <div className="sidebar-footer">
            <button onClick={onLogout} className="logout-btn-red"><FaSignOutAlt /> Sign Out</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="top-header">
           <div className="header-left">
              <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}><FaBars /></button>
              <h1>{activeMenu}</h1>
           </div>
           <div className="profile-initials">{getInitials(user.name)}</div>
        </header>

        <div className="content-body">
            {activeMenu === 'Dashboard' && (
              <div className="dashboard-home">
                  <div className="stats-grid">
                     <div className="stat-card"><h3>{stats.totalOrders}</h3><p>Total Orders</p></div>
                     <div className="stat-card"><h3>{stats.pendingOrders}</h3><p>Pending</p></div>
                     <div className="stat-card"><h3>{stats.activeDrivers}</h3><p>Live Drivers</p></div>
                     <div className="stat-card"><h3>₹{stats.revenue.toLocaleString()}</h3><p>Total Revenue</p></div>
                  </div>
                  {/* Activity Table can be added here if needed */}
              </div>
            )}

            {/* ✅ LOGIC FIX 3: Passing required user/email props to child views */}
            {activeMenu === 'Orders' && (OrdersView ? <OrdersView user={user} /> : <Placeholder title="Orders" />)}
            {activeMenu === 'Drivers' && (DriversView ? <DriversView adminEmail={user.email} /> : <Placeholder title="Drivers" />)}
            {activeMenu === 'MapView' && (DeliveryMap ? <DeliveryMap adminEmail={user.email} /> : <Placeholder title="Map" />)}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;