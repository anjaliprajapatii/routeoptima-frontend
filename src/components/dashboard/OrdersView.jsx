import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaPlus, FaBox, FaMapMarkerAlt, FaPhoneAlt, FaEdit, FaExchangeAlt, FaTimes, FaSave } from 'react-icons/fa';
import './OrdersView.css'; 

const OrdersView = () => {
  const [orders, setOrders] = useState([]);
  
  // --- STATE FOR MODALS ---
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Form State
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', address: '', items: '', price: ''
  });

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('https://routeoptima-backend.onrender.com/api/orders/my-orders?adminEmail=${user.email}');
      setOrders(res.data);
    } catch (err) { console.error("Error loading orders"); }
  };

  // --- GEOCODING (Smart Address Fix) ---
  const getCoordinatesForAddress = async (address) => {
      try {
          let query = `${address}, India`; 
          let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
          let res = await axios.get(url);
          
          if (res.data && res.data.length > 0) {
              return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
          }
          // Fallback logic
          const knownAreas = ["Nalasopara", "Vasai", "Virar", "Mumbai", "Thane"];
          const foundArea = knownAreas.find(area => address.toLowerCase().includes(area.toLowerCase()));
          if (foundArea) {
              url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(foundArea + ", Maharashtra")}&limit=1`;
              res = await axios.get(url);
              if (res.data && res.data.length > 0) return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
          }
          return null;
      } catch (error) { return null; }
  };

  // --- CREATE ORDER ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsGeocoding(true);
    try {
      const coords = await getCoordinatesForAddress(form.address);
      const defaultLat = 19.4184; 
      const defaultLng = 72.8168;
      const finalLat = coords ? coords.lat : defaultLat;
      const finalLng = coords ? coords.lng : defaultLng;

      if (!coords) alert("⚠️ Exact location not found. Using Nalasopara center point.");

      const payload = { ...form, pickupLat: finalLat, pickupLng: finalLng, dropLat: finalLat, dropLng: finalLng }; 
      await axios.post('https://routeoptima-backend.onrender.com/api/orders/create', payload);
      alert("✅ Order Created!");
      setForm({ customerName: '', customerPhone: '', address: '', items: '', price: '' });
      fetchOrders(); 
    } catch (err) { alert("Failed to create order"); } finally { setIsGeocoding(false); }
  };

  // ==================================================
  // 1. OPEN ASSIGN MODAL (FIXED)
  // ==================================================
  const handleOpenAssign = async (order, reassign = false) => {
      console.log("Opening Assign Modal for Order:", order.id); // Debug Log
      
      setSelectedOrder(order);
      setShowAssignModal(true); // ✅ This opens the popup
      setIsReassigning(reassign);
      setLoadingDrivers(true);
      
      try {
          // Fetch drivers list
          const res = await axios.get(`https://routeoptima-backend.onrender.com/api/orders/${order.id}/available-drivers`);
          console.log("Drivers Found:", res.data); // Debug Log
          setAvailableDrivers(res.data);
      } catch (err) {
          console.error(err);
          alert("Error fetching drivers. Check Backend Console.");
      } finally {
          setLoadingDrivers(false);
      }
  };

  // ==================================================
  // 2. EXECUTE ASSIGNMENT (FIXED)
  // ==================================================
  const assignDriver = async (driverId) => {
      if(!selectedOrder) return;
      
      try {
          const endpoint = isReassigning 
             ? `https://routeoptima-backend.onrender.com/api/orders/reassign/${selectedOrder.id}/${driverId}`
             : `https://routeoptima-backend.onrender.com/api/orders/assign/${selectedOrder.id}/${driverId}`;
          
          await axios.put(endpoint);
          
          alert("✅ Driver Assigned Successfully!");
          setShowAssignModal(false); // Close Modal
          fetchOrders(); // Refresh Table
      } catch (err) {
          alert("Failed to assign driver. " + (err.response?.data || ""));
      }
  };

  // --- EDIT & DELETE ---
  const handleOpenEdit = (order) => {
      setSelectedOrder(order);
      setForm({ customerName: order.customerName, customerPhone: order.customerPhone, address: order.address, items: order.items, price: order.price });
      setShowEditModal(true);
  };
  const saveEdit = async (e) => {
      e.preventDefault();
      try {
          await axios.put(`https://routeoptima-backend.onrender.com/api/orders/update/${selectedOrder.id}`, form);
          alert("✅ Order Updated!");
          setShowEditModal(false);
          fetchOrders();
          setForm({ customerName: '', customerPhone: '', address: '', items: '', price: '' });
      } catch (err) { alert("Update Failed"); }
  };
  const handleDelete = async (id) => {
    if(window.confirm("Delete order?")) {
        await axios.delete(`https://routeoptima-backend.onrender.com/api/orders/delete/${id}`);
        fetchOrders();
    }
  };

  return (
    <div className="card-box">
      <div className="card-header-simple">
        <h3><FaBox /> Order Management</h3>
      </div>
      
      {/* FORM */}
      <div className="form-container">
        <h5 className="form-title">Create New Order</h5>
        <form onSubmit={handleCreate} className="smart-form">
          <div className="input-group"><input placeholder="Name" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} required /></div>
          <div className="input-group"><input placeholder="Phone" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} required /></div>
          <div className="input-group" style={{flex: 2}}><input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required /></div>
          <div className="input-group"><input placeholder="Items" value={form.items} onChange={e => setForm({...form, items: e.target.value})} required /></div>
          <div className="input-group"><input placeholder="Price" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
          <button type="submit" className="btn-primary" disabled={isGeocoding}>{isGeocoding ? "Locating..." : <><FaPlus/> Add Order</>}</button>
        </form>
      </div>

      {/* TABLE */}
      <div className="table-responsive">
        <table className="orders-table">
          <thead>
            <tr><th className='orders-tables'>ID</th><th>Customer</th><th>Status</th><th>Driver</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td >#{order.id}</td>
                <td><strong>{order.customerName}</strong><br/><small style={{color:'#64748b'}}>{order.address}</small></td>
                <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                <td>
                   {order.assignedDriver ? (
                      <div className="driver-assigned-box">
                          <span>🚚 {order.assignedDriver.name}</span>
                          {order.status !== 'DELIVERED' && <button onClick={() => handleOpenAssign(order, true)} className="btn-icon-swap" title="Change"><FaExchangeAlt /></button>}
                      </div>
                   ) : <span className="driver-unassigned">Unassigned</span>}
                </td>
                <td className="action-cell">
                   {order.status === 'PENDING' && <button onClick={() => handleOpenAssign(order, false)} className="btn-assign">Assign</button>}
                   <button onClick={() => handleOpenEdit(order)} className="btn-icon-edit"><FaEdit/></button>
                   <button onClick={() => handleDelete(order.id)} className="btn-icon-delete"><FaTrash/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================================== */}
      {/* 🟢 ASSIGN DRIVER MODAL (THE FIX) */}
      {/* ================================== */}
      {showAssignModal && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <div className="modal-header">
                      <h4>{isReassigning ? "Change Driver" : "Select Driver"}</h4>
                      <button onClick={() => setShowAssignModal(false)} className="close-btn"><FaTimes/></button>
                  </div>
                  <div className="modal-body">
                      {loadingDrivers ? <p className="loading-text">Finding nearby drivers...</p> : (
                          availableDrivers.length === 0 ? 
                          <div className="no-drivers">
                              <p>⚠️ No Available Drivers Found.</p>
                              <small>Check if drivers are "Available" in their app.</small>
                          </div> : (
                              <div className="driver-list">
                                  {availableDrivers.map((driver, index) => (
                                      <div key={driver.id} className="driver-item" onClick={() => assignDriver(driver.id)}>
                                          <div className="driver-info">
                                              <span className="d-name">{driver.name}</span>
                                              <span className="d-dist">📍 {driver.distanceKm} km away</span>
                                              {index === 0 && <span className="tag-best">BEST MATCH</span>}
                                          </div>
                                          <button className="btn-select">Select</button>
                                      </div>
                                  ))}
                              </div>
                          )
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <div className="modal-header"><h4>Edit Order</h4><button onClick={() => setShowEditModal(false)} className="close-btn"><FaTimes/></button></div>
                  <div className="modal-body p-20">
                      <form onSubmit={saveEdit} className="edit-form-stack">
                          <label>Name</label><input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} />
                          <label>Phone</label><input value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} />
                          <label>Address</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                          <label>Items</label><input value={form.items} onChange={e => setForm({...form, items: e.target.value})} />
                          <label>Price</label><input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                          <button type="submit" className="btn-save"><FaSave/> Save Changes</button>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default OrdersView;