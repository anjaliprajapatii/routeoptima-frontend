import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ✅ GLOBAL URL DEFINITION
const API_BASE_URL = "https://routeoptima-backend.onrender.com";

// --- 1. ICON FIX (Standard Leaflet Fix) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- 2. PACKAGE ORDER ICON (Box) ---
const packageIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png', 
  iconSize: [35, 35],
  popupAnchor: [0, -15]
});

const DeliveryMap = ({ adminEmail }) => { // ✅ Prop added to receive email
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, visible: 0 });

  useEffect(() => {
    const fetchData = async () => {
      if (!adminEmail) return; // Wait if email is not yet available
      try {
        // ✅ LOGIC FIX: Using Isolated URL with adminEmail
        const res = await axios.get(`${API_BASE_URL}/api/orders/my-orders?adminEmail=${adminEmail}`);
        
        // 1. Only get Active Orders (Not Delivered)
        const activeOrders = res.data.filter(o => o.status !== 'DELIVERED');
        
        // 2. Count how many have valid locations
        const validLocationCount = activeOrders.filter(o => 
            (o.dropLat && o.dropLat !== 0) || (o.pickupLat && o.pickupLat !== 0)
        ).length;

        setStats({ total: activeOrders.length, visible: validLocationCount });
        setOrders(activeOrders);

      } catch (error) {
        console.error("Error fetching orders for map:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Live update every 5 seconds
    return () => clearInterval(interval);
  }, [adminEmail]); // ✅ Dependency added

  return (
    <div style={{ position: 'relative', height: "100%", width: "100%", borderRadius:'12px', overflow:'hidden', border:'2px solid #2563eb' }}>
      
      {/* --- DEBUG PANEL --- */}
      <div style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 999,
          background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold'
      }}>
          <div style={{color: '#2563eb'}}>📦 Active Orders: {stats.total}</div>
          <div style={{color: stats.visible === 0 ? 'red' : 'green'}}>
              📍 On Map: {stats.visible}
          </div>
          {stats.visible === 0 && stats.total > 0 && (
              <div style={{color: 'red', marginTop: '5px', fontSize: '10px'}}>
                  ⚠️ Waiting for Driver to set location!
              </div>
          )}
      </div>

      <MapContainer center={[19.0760, 72.8777]} zoom={11} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; RouteOptima'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {orders.map(order => {
            // --- COORDINATE LOGIC ---
            // Priority: Drop Location -> Pickup Location
            const lat = order.dropLat && order.dropLat !== 0 ? order.dropLat : order.pickupLat;
            const lng = order.dropLng && order.dropLng !== 0 ? order.dropLng : order.pickupLng;

            // If No Location, Skip this marker
            if (!lat || lat === 0 || !lng || lng === 0) return null;

            return (
                <Marker 
                  key={order.id} 
                  position={[lat, lng]} 
                  icon={packageIcon}
                >
                  <Popup>
                    <div style={{minWidth:'180px', fontFamily: 'Arial, sans-serif'}}>
                        {/* Header */}
                        <div style={{background: '#2563eb', color:'white', padding:'5px', borderRadius:'4px 4px 0 0', textAlign:'center'}}>
                            📦 Order #{order.id}
                        </div>
                        
                        <div style={{padding:'10px'}}>
                            {/* Customer Info */}
                            <p style={{margin:'0 0 5px 0', fontSize:'14px', fontWeight:'bold'}}>
                                👤 {order.customerName}
                            </p>
                            <p style={{margin:'0 0 8px 0', fontSize:'12px', color:'#555'}}>
                                📍 {order.address}
                            </p>
                            <hr style={{border:'0', borderTop:'1px solid #eee', margin:'5px 0'}}/>

                            {/* Driver Status Logic */}
                            {order.assignedDriver ? (
                                <div style={{background:'#dcfce7', color:'#166534', padding:'5px', borderRadius:'4px', fontSize:'12px', fontWeight:'bold', textAlign:'center'}}>
                                    🚚 Driver: {order.assignedDriver.name}
                                </div>
                            ) : (
                                <div style={{background:'#ffedd5', color:'#c2410c', padding:'5px', borderRadius:'4px', fontSize:'12px', fontWeight:'bold', textAlign:'center'}}>
                                    ⚠️ Unassigned
                                </div>
                            )}
                        </div>
                    </div>
                  </Popup>
                </Marker>
            );
        })}
      </MapContainer>
    </div>
  );
};

export default DeliveryMap;