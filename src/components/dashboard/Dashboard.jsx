import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span>📍</span> RouteOptima
        </div>
        <nav>
          <a href="#" className="active">📊 Dashboard</a>
          <a href="#">📦 Orders</a>
          <a href="#">🚚 Drivers</a>
          <a href="#">🗺️ Map View</a>
          <a href="#">⚙️ Settings</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header>
          <h2>Dashboard</h2>
          <div className="user-profile">👤 Admin</div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="card">
            <h3>Active Orders</h3>
            <div className="number">42</div>
          </div>
          <div className="card">
            <h3>Available Drivers</h3>
            <div className="number">18</div>
          </div>
          <div className="card">
            <h3>Avg. Delivery Time</h3>
            <div className="number">25m</div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="orders-section">
          <h3>Recent Orders</h3>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Last Update</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#12345</td>
                <td>Dec 4, 2025</td>
                <td><span className="badge pending">Pending</span></td>
                <td>65m</td>
              </tr>
              <tr>
                <td>#12346</td>
                <td>Dec 4, 2025</td>
                <td><span className="badge assigned">Assigned</span></td>
                <td>25m</td>
              </tr>
              <tr>
                <td>#12347</td>
                <td>Dec 4, 2025</td>
                <td><span className="badge delivered">Delivered</span></td>
                <td>12m</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;