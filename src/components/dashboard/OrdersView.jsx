import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaPlus, FaBox, FaEdit, FaExchangeAlt, FaTimes, FaSave } from 'react-icons/fa';
import './OrdersView.css';

const OrdersView = ({ user }) => { // ✅ Prop received here
    const [orders, setOrders] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);
    const [isReassigning, setIsReassigning] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

    const [form, setForm] = useState({
        customerName: '', customerPhone: '', address: '', items: '', price: ''
    });

    useEffect(() => { 
        if (user?.email) fetchOrders(); 
    }, [user]);

    const fetchOrders = async () => {
        try {
            // ✅ Fixed: Template literal and variable
            const res = await axios.get(`https://routeoptima-backend.onrender.com/api/orders/my-orders?adminEmail=${user.email}`);
            setOrders(res.data);
        } catch (err) { console.error("Error loading orders"); }
    };

    const getCoordinatesForAddress = async (address) => {
        try {
            let query = `${address}, India`;
            let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
            let res = await axios.get(url);
            if (res.data && res.data.length > 0) {
                return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
            }
            return null;
        } catch (error) { return null; }
    };

    // ==========================================
    // 🟢 VALIDATION LOGIC
    // ==========================================
    const validateForm = () => {
        const { customerName, customerPhone, address, items, price } = form;
        
        if (!customerName || !customerPhone || !address || !items || !price) {
            alert("⚠️ Please fill all fields.");
            return false;
        }
        if (customerPhone.length !== 10 || isNaN(customerPhone)) {
            alert("⚠️ Please enter a valid 10-digit phone number.");
            return false;
        }
        if (Number(price) <= 0) {
            alert("⚠️ Price must be greater than 0.");
            return false;
        }
        return true;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        
        // Run Validation
        if (!validateForm()) return;

        setIsGeocoding(true);
        try {
            const coords = await getCoordinatesForAddress(form.address);
            const dropLat = coords ? coords.lat : 0;
            const dropLng = coords ? coords.lng : 0;

            const payload = {
                ...form,
                adminEmail: user.email,
                pickupLat: 19.2307,
                pickupLng: 72.8567,
                dropLat: dropLat,
                dropLng: dropLng
            };

            await axios.post('https://routeoptima-backend.onrender.com/api/orders/create', payload);
            alert("✅ Order Created Successfully!");
            setForm({ customerName: '', customerPhone: '', address: '', items: '', price: '' });
            fetchOrders();
        } catch (err) { 
            alert("Failed to create order"); 
        } finally { 
            setIsGeocoding(false); 
        }
    };

    const assignDriver = async (driverId) => {
        if (!selectedOrder) return;
        try {
            const endpoint = isReassigning
                ? `https://routeoptima-backend.onrender.com/api/orders/reassign/${selectedOrder.id}/${driverId}`
                : `https://routeoptima-backend.onrender.com/api/orders/assign/${selectedOrder.id}/${driverId}`;

            await axios.put(endpoint);
            alert("✅ Driver Assigned!");
            setShowAssignModal(false);
            fetchOrders();
        } catch (err) { alert("Failed to assign driver."); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete order?")) {
            await axios.delete(`https://routeoptima-backend.onrender.com/api/orders/delete/${id}`);
            fetchOrders();
        }
    };

    // --- HELPER FOR OPENING MODAL ---
    const handleOpenAssign = async (order, reassign = false) => {
        setSelectedOrder(order);
        setShowAssignModal(true);
        setIsReassigning(reassign);
        setLoadingDrivers(true);
        try {
            const res = await axios.get(`https://routeoptima-backend.onrender.com/api/orders/${order.id}/available-drivers`);
            setAvailableDrivers(res.data);
        } catch (err) { alert("Error fetching drivers."); }
        finally { setLoadingDrivers(false); }
    };

    return (
        <div className="card-box">
            <div className="card-header-simple">
                <h3><FaBox /> Order Management</h3>
            </div>

            <div className="form-container">
                <h5 className="form-title">Create New Order</h5>
                <form onSubmit={handleCreate} className="smart-form">
                    <div className="input-group">
                        <input placeholder="Name" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <input placeholder="Phone (10 digits)" maxLength="10" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value.replace(/\D/g,'') })} />
                    </div>
                    <div className="input-group" style={{ flex: 2 }}>
                        <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <input placeholder="Items" value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <input placeholder="Price" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    </div>
                    <button type="submit" className="btn-primary" disabled={isGeocoding}>
                        {isGeocoding ? "Locating..." : <><FaPlus /> Add Order</>}
                    </button>
                </form>
            </div>

            <div className="table-responsive">
                <table className="orders-table">
                    <thead>
                        <tr><th>ID</th><th>Customer</th><th>Status</th><th>Driver</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td>#{order.id}</td>
                                <td><strong>{order.customerName}</strong><br /><small>{order.address}</small></td>
                                <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                                <td>
                                    {order.assignedDriver ? (
                                        <div className="driver-assigned-box">
                                            <span>🚚 {order.assignedDriver.name}</span>
                                            {order.status !== 'DELIVERED' && 
                                                <button onClick={() => handleOpenAssign(order, true)} className="btn-icon-swap"><FaExchangeAlt /></button>
                                            }
                                        </div>
                                    ) : <span className="driver-unassigned">Unassigned</span>}
                                </td>
                                <td className="action-cell">
                                    {order.status === 'PENDING' && <button onClick={() => handleOpenAssign(order, false)} className="btn-assign">Assign</button>}
                                    <button onClick={() => handleDelete(order.id)} className="btn-icon-delete"><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ASSIGN MODAL */}
            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>Select Driver</h4>
                            <button onClick={() => setShowAssignModal(false)} className="close-btn"><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            {loadingDrivers ? <p>Finding drivers...</p> : (
                                <div className="driver-list">
                                    {availableDrivers.map(driver => (
                                        <div key={driver.id} className="driver-item" onClick={() => assignDriver(driver.id)}>
                                            <span>{driver.name} (📍 {driver.distanceKm} km)</span>
                                            <button className="btn-select">Select</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersView;