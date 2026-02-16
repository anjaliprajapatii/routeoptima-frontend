import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DriverMap from './DriverMap'; 
import { FaPhoneAlt, FaLocationArrow, FaCheckCircle, FaBox, FaUserCircle, FaMapMarkerAlt, FaSignOutAlt } from 'react-icons/fa';
import './DriverDashboard.css';

const DriverDashboard = ({ onLogout }) => {
  const [driverId, setDriverId] = useState(''); 
  const [status, setStatus] = useState("OFFLINE");
  const [location, setLocation] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [debugMsg, setDebugMsg] = useState(""); 

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

  // --- 2. GPS TRACKING ---
  const startTracking = (id) => {
    if (!navigator.geolocation) return alert("❌ No GPS Support");
    navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        try {
           await axios.put(`${API_BASE_URL}/api/driver/update-location/${id}`, {
             latitude: lat,
             longitude: lng
           });
           checkAssignedOrder(id); 
        } catch (err) { console.error("Location Update Error", err); }
      },
      (err) => setDebugMsg("⚠️ GPS Signal Lost"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- 3. SYNC ORDER ---
  const checkAssignedOrder = async (id = driverId) => {
      if (!id) return;
      try {
          const res = await axios.get(`${API_BASE_URL}/api/driver/${id}/current-order`);
          setCurrentOrder(res.data || null);
      } catch (err) { console.error("Sync Error"); }
  };

  useEffect(() => {
      let interval;
      if(status === 'ONLINE' && driverId) {
          checkAssignedOrder(driverId);
          interval = setInterval(() => checkAssignedOrder(driverId), 5000);
      }
      return () => clearInterval(interval);
  }, [status, driverId]);

  // --- 4. MANUAL LOCATION UPDATE ---
  const handleManualLocationUpdate = async (lat, lng) => {
    if (!currentOrder) return;
    if (window.confirm("📍 Confirm: Set this exact point as the Customer's Drop Location?")) {
        setIsLoading(true); 
        try {
            await axios.put(`${API_BASE_URL}/api/orders/update-coords/${currentOrder.id}`, {
                dropLat: lat,
                dropLng: lng
            });
            alert("✅ Location Saved!");
            checkAssignedOrder(); 
        } catch (err) { alert("❌ Failed to update."); }
        finally { setIsLoading(false); } 
    }
  };

  // --- 5. ACTIONS ---
  const goOnline = async () => {
    if (!driverId || driverId <= 0) return alert("⚠️ Enter a valid Driver ID");
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

  const handleComplete = async () => {
      if(!window.confirm("✅ Confirm: Delivered package?")) return;
      setIsLoading(true); 
      try {
          await axios.put(`${API_BASE_URL}/api/orders/complete/${currentOrder.id}`);
          alert("🎉 Order Delivered!");
          setCurrentOrder(null);
          checkAssignedOrder(driverId);
      } catch(err) { alert("❌ Error completing order."); }
      finally { setIsLoading(false); } 
  };

  const handleLogout = () => {
      if(window.confirm("Go Offline?")) {
        localStorage.removeItem('driverId');
        localStorage.removeItem('driverStatus');
        onLogout();
      }
  };

  return (
    <div className="driver-app">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      <div className="map-container">
          <DriverMap location={location} currentOrder={currentOrder} onLocationUpdate={handleManualLocationUpdate} />
      </div>

      <div className="mobile-header">
          <div className="status-pill">
              <div className={`dot ${status === 'ONLINE' ? 'green' : 'red'}`}></div>
              <span>{status}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
              <span>Logout</span> <FaSignOutAlt />
          </button>
      </div>

      <div className="bottom-sheet">
          {status === 'OFFLINE' ? (
              <div className="control-group">
                  <h3>Welcome Partner 👋</h3>
                  <div className="input-row">
                      <FaUserCircle className="icon-grey" size={20}/>
                      <input type="number" value={driverId} onChange={e => setDriverId(e.target.value)} placeholder="Driver ID" />
                  </div>
                  <button className="btn-go" onClick={goOnline}>GO ONLINE</button>
              </div>
          ) : currentOrder ? (
              <div className="order-panel slide-up">
                  <h2 className="customer-name">{currentOrder.customerName}</h2>
                  <div className="order-details-box">
                      <div className="detail-item">
                          <FaMapMarkerAlt className="icon-red"/>
                          <div className="text-col">
                              <label>DROP ADDRESS</label>
                              <p>{currentOrder.address}</p>
                              {(!currentOrder.dropLat || currentOrder.dropLat === 0) && (
                                <small style={{color: '#e11d48', fontWeight: 'bold'}}>⚠️ Long-press map to fix location!</small>
                              )}
                          </div>
                      </div>
                  </div>
                  <div className="action-grid">
                      <button className="btn-action call" onClick={() => window.location.href=`tel:${currentOrder.customerPhone}`}><FaPhoneAlt /> Call</button>
                      
                      {/* ✅ FIXED NAVIGATION URL BELOW */}
                      <button className="btn-action nav" onClick={() => {
                        const url = currentOrder.dropLat 
                          ? `https://www.google.com/maps/dir/?api=1&origin=${currentOrder.pickupLat},${currentOrder.pickupLng}&destination=${currentOrder.dropLat},${currentOrder.dropLng}&travelmode=driving` 
                          : `https://www.google.com/maps/dir/?api=1&origin=${currentOrder.pickupLat},${currentOrder.pickupLng}&destination=${encodeURIComponent(currentOrder.address)}&travelmode=driving`;
                        window.open(url, '_blank');
                      }}><FaLocationArrow /> Navigate</button>

                  </div>
                  <button className="btn-complete" onClick={handleComplete}><FaCheckCircle /> COMPLETE DELIVERY</button>
              </div>
          ) : (
              <div className="control-group">
                   <div className="searching-animation"><div className="pulse-ring"></div><FaLocationArrow className="pulse-icon"/></div>
                   <h3>Waiting for Orders...</h3>
              </div>
          )}
      </div>
    </div>
  );
};

export default DriverDashboard;