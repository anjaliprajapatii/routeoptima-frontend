import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

// Icons
const truckIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/7541/7541900.png', iconSize: [45, 45] });
const houseIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619153.png', iconSize: [40, 40] });

// Click Handler: Driver can set location manually
const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    contextmenu: (e) => onMapClick(e.latlng.lat, e.latlng.lng), // Long press or right click
  });
  return null;
};

// Routing: Pickup to Drop
const Routing = ({ start, end }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !start || !end || end.lat === 0) return;
    const control = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      lineOptions: { styles: [{ color: '#2563eb', weight: 6 }] },
      createMarker: () => null,
      show: false
    }).addTo(map);
    return () => map.removeControl(control);
  }, [map, start, end]);
  return null;
};

const DriverMap = ({ location, currentOrder, onLocationUpdate }) => {
  const center = location ? [location.lat, location.lng] : [19.0760, 72.8777];
  const pickup = currentOrder ? { lat: currentOrder.pickupLat, lng: currentOrder.pickupLng } : null;
  const drop = currentOrder && currentOrder.dropLat !== 0 ? { lat: currentOrder.dropLat, lng: currentOrder.dropLng } : null;

  return (
    <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapEvents onMapClick={onLocationUpdate} />
      {location && <Marker position={[location.lat, location.lng]} icon={truckIcon} />}
      {drop && (
        <Marker position={[drop.lat, drop.lng]} icon={houseIcon}>
          <Popup>Drop: {currentOrder.customerName}</Popup>
        </Marker>
      )}
      {pickup && drop && <Routing start={pickup} end={drop} />}
    </MapContainer>
  );
};

export default DriverMap;