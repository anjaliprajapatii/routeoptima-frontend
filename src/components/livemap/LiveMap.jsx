import React from 'react';
import './LiveMap.css';

const LiveMap = () => {
  return (
    <div className="map-wrapper">
      {/* Header Overlay */}
      <div className="map-header">
        <div className="logo">📍 RouteOptima</div>
        <div className="profile-icon">👤</div>
      </div>

      {/* Map Area (Placeholder for actual map) */}
      <div className="map-background">
        {/* Is div me real map aayega (Google Maps/Leaflet) */}
        <div className="route-line-visual">
            (Map Display Area)
        </div>
      </div>

      {/* Floating Order Card */}
      <div className="order-details-card">
        <div className="card-header">
          <h4>Order #12345 Details</h4>
        </div>
        <div className="driver-info">
          <p><strong>Driver:</strong> Rahul K.</p>
          <p><strong>ETA:</strong> 5 mins</p>
        </div>
        <button className="contact-btn">Contact Driver</button>
      </div>
    </div>
  );
};

export default LiveMap;