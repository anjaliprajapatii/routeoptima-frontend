import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DriverMap from './DriverMap'; 
import { FaPhoneAlt, FaLocationArrow, FaCheckCircle, FaBox, FaUserCircle, FaMapMarkerAlt, FaSignOutAlt } from 'react-icons/fa';
import './DriverDashboard.css';

const DriverDashboard = ({ onLogout }) => {
  // --- STATE ---
  const [driverId, setDriverId] = useState(''); 
  const [status, setStatus] = useState("OFFLINE");
  const [location, setLocation] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugMsg, setDebugMsg] = useState(""); 

  // URL Variable for easy maintenance
  const API_BASE_URL = "https://routeoptima-backend.onrender.com";

  // --- 1. AUTO-RESUME ---
  useEffect(() => {
    const savedId = localStorage.getItem('driverId');
    const savedStatus = localStorage.getItem('driverStatus');

    if (savedId && savedStatus === 'ONLINE') {
        setDriverId(savedId);
        setStatus('ONLINE');
        startTracking(savedId);
    }
  }, []);

  // --- 2. GPS TRACKING HELPER ---
  const startTracking = (id) => {
    if (!navigator.geolocation) return alert("❌ No GPS Support");

    navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });

        try {
           // ✅ URL UPDATED TO RENDER
           await axios.put(`${API_BASE_URL}/api/driver/update-location/${id}`, {
             latitude: lat,
             longitude: lng
           });
           
           checkAssignedOrder(id); 
        } catch (err) { console.error("Location Error", err); }
      },
      (err) => { 
          console.error("GPS Error", err);
          setDebugMsg("⚠️ GPS Signal Lost");
      },
      { enableHighAccuracy: true }
    );
  };

  // --- 3. GO ONLINE ACTION ---
  const goOnline = () => {
    if (!driverId || driverId <= 0) return alert("⚠️ Please Enter a Valid Driver ID");
    
    setIsLoading(true);
    setStatus("LOCATING...");
    
    localStorage.setItem('driverId', driverId);
    localStorage.setItem('driverStatus', 'ONLINE');

    setTimeout(() => {
        setStatus("ONLINE");
        setIsLoading(false);
        startTracking(driverId);
    }, 1000); 
  };

  // --- 4. CHECK ORDER ---
  const checkAssignedOrder = async (id = driverId) => {
      if (!id) return;
      try {
          // ✅ URL UPDATED TO RENDER
          const res = await axios.get(`${API_BASE_URL}/api/driver/${id}/current-order`);
          if (res.data) {
              setCurrentOrder(res.data);
          } else {
              setCurrentOrder(null);
          }
      } catch (err) { console.error("Sync Error"); }
  };

  useEffect(() => {
      let interval;
      if(status === 'ONLINE' && driverId) {
          checkAssignedOrder(driverId);
          interval = setInterval(() => checkAssignedOrder(driverId), 4000);
      }
      return () => clearInterval(interval);
  }, [status, driverId]);

  // --- ACTIONS ---
  
  const handleCall = () => {
      if (!currentOrder?.customerPhone) return alert("No phone number found");
      window.location.href = `tel:${currentOrder.customerPhone}`;
  };

  const handleNavigate = () => {
      if (!currentOrder) return;
      if (currentOrder.address) {
          const encodedAddress = encodeURIComponent(currentOrder.address);
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
          window.open(googleMapsUrl, '_blank');
          return;
      }

      const lat = currentOrder.dropLat || currentOrder.pickupLat; 
      const lng = currentOrder.dropLng || currentOrder.pickupLng;

      if (lat && lng) {
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
          window.open(googleMapsUrl, '_blank'); 
      } else {
          alert("❌ Error: No Address or GPS coordinates found!");
      }
  };

  const handleComplete = async () => {
      if(!window.confirm("✅ Confirm: Have you handed over the package?")) return;
      
      try {
          // ✅ URL UPDATED TO RENDER
          await axios.put(`${API_BASE_URL}/api/orders/complete/${currentOrder.id}`);
          alert("🎉 Great Job! Order Delivered.");
          setCurrentOrder(null);
          checkAssignedOrder(driverId);
      } catch(err) {
          alert("❌ Error completing order. Please try again.");
      }
  };

  // --- 5. LOGOUT (Properly Cleaned) ---
  const handleLogout = () => {
      if(window.confirm("Are you sure you want to go offline?")) {
        localStorage.removeItem('driverId');
        localStorage.removeItem('driverStatus');
        onLogout(); // Calls the parent logout function
      }
  };

  return (
    <div className="driver-app">
      <div className="map-container">
          <DriverMap location={location} currentOrder={currentOrder} />
      </div>

      <div className="mobile-header">
          <div className="status-pill">
              <div className={`dot ${status === 'ONLINE' ? 'green' : 'red'}`}></div>
              <span>{status}</span>
          </div>
          {/* ✅ FIXED LOGOUT BUTTON */}
          <button onClick={handleLogout} className="logout-btn">
              <span>Logout</span>
              <FaSignOutAlt />
          </button>
      </div>

      {status === 'LOCATING...' && (
          <div className="loading-banner">📡 Connecting to GPS...</div>
      )}

      <div className="bottom-sheet">
          {status === 'OFFLINE' && (
              <div className="control-group">
                  <div className="welcome-text">
                      <h3>Welcome Partner 👋</h3>
                      <p>Enter your ID to start earning.</p>
                  </div>
                  <div className="input-row">
                      <FaUserCircle className="icon-grey" size={20}/>
                      <input 
                        type="number" 
                        value={driverId} 
                        onChange={e => setDriverId(e.target.value)} 
                        placeholder="Driver ID (e.g. 1)"
                      />
                  </div>
                  <button className="btn-go" onClick={goOnline}>
                      GO ONLINE
                  </button>
              </div>
          )}

          {status === 'ONLINE' && !currentOrder && (
              <div className="control-group">
                   <div className="searching-animation">
                       <div className="pulse-ring"></div>
                       <FaLocationArrow className="pulse-icon"/>
                   </div>
                   <h3>Searching for Orders...</h3>
                   <p className="hint-text">Stay in high demand areas for better matching.</p>
                   <div className="driver-info-sm">
                       Driver ID: <strong>{driverId}</strong>
                   </div>
              </div>
          )}

          {currentOrder && (
              <div className="order-panel slide-up">
                  <div className="sheet-handle"></div>
                  
                  <div className="order-info-header">
                      <div>
                          <h2 className="customer-name">{currentOrder.customerName}</h2>
                          <span className="order-id">Order #{currentOrder.id} • <span className="live-tag">LIVE</span></span>
                      </div>
                      <div className="price-tag">₹{currentOrder.price}</div>
                  </div>

                  <div className="order-details-box">
                      <div className="detail-item">
                          <FaMapMarkerAlt className="icon-red"/>
                          <div className="text-col">
                              <label>DROP LOCATION</label>
                              <p>{currentOrder.address}</p>
                          </div>
                      </div>
                      <div className="detail-item">
                          <FaBox className="icon-orange"/>
                          <div className="text-col">
                              <label>ITEMS</label>
                              <p>{currentOrder.items}</p>
                          </div>
                      </div>
                  </div>

                  <div className="action-grid">
                      <button className="btn-action call" onClick={handleCall}>
                          <FaPhoneAlt /> Call
                      </button>
                      <button className="btn-action nav" onClick={handleNavigate}>
                          <FaLocationArrow /> Navigate
                      </button>
                  </div>

                  <button className="btn-complete" onClick={handleComplete}>
                      <FaCheckCircle /> SWIPE TO COMPLETE
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};

export default DriverDashboard;