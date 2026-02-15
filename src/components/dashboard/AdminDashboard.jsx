import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaThLarge, FaBox, FaUsers, FaMap, FaSearch, FaBell, FaPlus, 
  FaSignOutAlt, FaBars, FaTimes, FaTruck, FaMoneyBillWave, FaCalendarAlt 
} from 'react-icons/fa';

import './AdminDashboard.css';

// --- SAFE IMPORTS ---
import OrdersView from './OrdersView';
import DriversView from './DriversView';
import DeliveryMap from '../DeliveryMap'; 

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
      // ✅ URL UPDATED
      const ordersRes = await axios.get(`https://routeoptima-backend.onrender.com/api/orders/my-orders?adminEmail=${user.email}`).catch(() => ({ data: [] }));
      const allOrders = ordersRes.data || [];
      const driversRes = await axios.get(`https://routeoptima-backend.onrender.com/api/auth/my-drivers?adminEmail=${user.email}`).catch(() => ({ data: [] }));
      const drivers = driversRes.data || []; 
      const totalRev = allOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0);

      setStats({
        totalOrders: allOrders.length,
        activeDrivers: drivers.filter(d => !d.isAvailable).length,
        pendingOrders: allOrders.filter(o => o.status !== 'DELIVERED').length,
        revenue: totalRev
      });
      setRecentOrders(allOrders.slice(-6).reverse());
    } catch (err) { console.log("Using fallback data"); }
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
          <h2>
             <img src="/location_icon.png" alt="" className="brand-icon-img" onError={(e) => {e.target.style.display='none'}} />
             Route<span className="brand-blue">Optima</span>
          </h2>
          <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}><FaTimes /></button>
        </div>
        <nav className="menu-list">
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
           <div className="user-info-box">
              <small>Logged in as</small>
              <strong>{user.name}</strong>
           </div>
           <button onClick={onLogout} className="logout-btn-red">
             <FaSignOutAlt /> <span>Sign Out</span>
           </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="top-header">
          <div className="header-left">
             <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}><FaBars /></button>
             <h1>{activeMenu}</h1>
          </div>
          <div className="header-right">
             <div className="search-bar">
                <FaSearch className="search-icon" style={{color:'#94a3b8'}} />
                <input type="text" placeholder="Search orders, drivers..." />
             </div>
             <div className="notif-wrapper">
                 <button className="icon-btn"><FaBell /></button>
                 {stats.pendingOrders > 0 && <span className="notif-dot"></span>}
             </div>
             <div className="profile-initials">{getInitials(user.name)}</div>
          </div>
        </header>

        <div className="content-body">
           {activeMenu === 'Dashboard' && (
              <div className="dashboard-home">
                 <div className="welcome-banner">
                    <div className="banner-content">
                       <h1>Welcome back, {user.name.split(' ')[0]}!</h1>
                       <p>You have <span className="highlight-text">{stats.pendingOrders} pending deliveries</span> today.</p>
                    </div>
                    <div className="banner-actions">
                       <div className="date-pill"><FaCalendarAlt /> {currentDate}</div>
                       <button className="btn-white" onClick={() => setActiveMenu('Orders')}><FaPlus /> Create New Order</button>
                    </div>
                 </div>
                 <div className="stats-grid">
                    <div className="stat-card">
                       <div className="stat-icon blue-bg"><FaBox /></div>
                       <div className="stat-info"><p>Total Orders</p><h3>{stats.totalOrders}</h3></div>
                    </div>
                    <div className="stat-card">
                       <div className="stat-icon orange-bg"><FaTruck /></div>
                       <div className="stat-info"><p>Pending</p><h3>{stats.pendingOrders}</h3></div>
                    </div>
                    <div className="stat-card">
                       <div className="stat-icon green-bg"><FaUsers /></div>
                       <div className="stat-info"><p>Active Drivers</p><h3>{stats.activeDrivers}</h3></div>
                    </div>
                    <div className="stat-card">
                       <div className="stat-icon purple-bg"><FaMoneyBillWave /></div>
                       <div className="stat-info"><p>Revenue</p><h3>₹{stats.revenue.toLocaleString()}</h3></div>
                    </div>
                 </div>
                 <div className="content-split">
                    <div className="card-box orders-box">
                       <div className="card-header-compact">
                          <h3>Recent Activity</h3>
                          <button className="btn-text-link" onClick={() => setActiveMenu('Orders')}>View All →</button>
                       </div>
                       <div className="table-responsive">
                           <table className="orders-table">
                              <thead><tr><th>Order ID</th><th>Customer</th><th>Status</th><th className="text-right">Amount</th></tr></thead>
                              <tbody>
                                 {recentOrders.map(order => (
                                    <tr key={order.id}>
                                       <td className="fw-bold" style={{color:'var(--primary)'}}>#{order.id}</td>
                                       <td>
                                          <div className="cust-name">{order.customerName}</div>
                                          <div className="cust-sub">{order.address?.substring(0, 20)}...</div>
                                       </td>
                                       <td><span className={`status-pill ${order.status?.toLowerCase()}`}>{order.status}</span></td>
                                       <td className="text-right fw-bold">₹{order.price}</td>
                                    </tr>
                                 ))}
                                 {recentOrders.length === 0 && <tr><td colSpan="4" className="text-center">No recent activity</td></tr>}
                              </tbody>
                           </table>
                       </div>
                    </div>
                    <div className="card-box map-box">
                       <div className="card-header-compact"><h3>Live Fleet Map</h3></div>
                       <div className="map-wrapper-small">
                          {DeliveryMap ? <DeliveryMap adminEmail={user.email} /> : <Placeholder title="Map" />}
                       </div>
                    </div>
                 </div>
              </div>
           )}
           {activeMenu === 'Orders' && (OrdersView ? <OrdersView /> : <Placeholder title="Orders" />)}
           {activeMenu === 'Drivers' && (DriversView ? <DriversView adminEmail={user.email} /> : <Placeholder title="Drivers" />)}
           {activeMenu === 'MapView' && (DeliveryMap ? <div className="full-map-container"><DeliveryMap adminEmail={user.email} /></div> : <Placeholder title="Map" />)}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;