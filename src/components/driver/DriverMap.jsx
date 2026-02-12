import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// --- ICONS ---
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7541/7541900.png',
  iconSize: [45, 45],
  iconAnchor: [22, 22],
  popupAnchor: [0, -20],
});

const houseIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// --- ROUTING (Blue Line) ---
const RoutingControl = ({ driverLoc, destLoc }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !driverLoc || !destLoc) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(driverLoc.lat, driverLoc.lng),
        L.latLng(destLoc.lat, destLoc.lng)
      ],
      routeWhileDragging: false,
      show: false, 
      addWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#2563eb', weight: 6, opacity: 0.8 }]
      },
      createMarker: () => null
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, driverLoc, destLoc]);

  return null;
};

// --- MAIN MAP ---
const DriverMap = ({ location, currentOrder }) => {
  const center = location ? [location.lat, location.lng] : [19.0760, 72.8777];
  
  // Destination
  const destLoc = currentOrder && currentOrder.pickupLat
    ? { lat: currentOrder.pickupLat, lng: currentOrder.pickupLng } 
    : null;

  return (
    <div style={{ width: '100%', height: '100%', zIndex: 1 }}>
      <MapContainer center={center} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        {/* --- DRIVER MARKER (With Real Data) --- */}
        {location && (
          <Marker position={[location.lat, location.lng]} icon={truckIcon}>
            <Popup className="custom-popup">
               <div style={{textAlign:'center'}}>
                 <strong style={{color:'#ea580c'}}>YOU (Driver)</strong><br/>
                 <span style={{fontSize:'11px'}}>Moving...</span>
               </div>
            </Popup>
          </Marker>
        )}

        {/* --- CUSTOMER MARKER (With Real Database Data) --- */}
        {destLoc && (
          <Marker position={[destLoc.lat, destLoc.lng]} icon={houseIcon}>
            <Popup className="custom-popup">
               <div style={{minWidth:'150px'}}>
                 <strong style={{color:'#2563eb', fontSize:'14px'}}>
                    {currentOrder.customerName || "Customer"}
                 </strong>
                 <br/>
                 <span style={{fontSize:'12px', fontWeight:'600'}}>
                    {currentOrder.customerPhone}
                 </span>
                 <hr style={{margin:'5px 0', border:'0.5px solid #eee'}}/>
                 <div style={{fontSize:'11px', color:'#475569'}}>
                    {currentOrder.address}
                 </div>
                 <div style={{marginTop:'5px', fontWeight:'bold', fontSize:'11px'}}>
                    📦 {currentOrder.items}
                 </div>
               </div>
            </Popup>
          </Marker>
        )}

        {/* Route */}
        {location && destLoc && (
          <RoutingControl driverLoc={location} destLoc={destLoc} />
        )}
      </MapContainer>
    </div>
  );
};

export default DriverMap;