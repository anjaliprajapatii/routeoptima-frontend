import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserPlus, FaTrash, FaEdit, FaTruck, FaMobileAlt, FaEnvelope, FaTimes } from 'react-icons/fa';

const DriversView = ({ adminEmail }) => {
  const [drivers, setDrivers] = useState([]);
  
  // Form State
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [currentDriverId, setCurrentDriverId] = useState(null);

  // --- 1. READ: Fetch Drivers ---
  useEffect(() => {
    if (adminEmail) fetchDrivers();
  }, [adminEmail]);

  const fetchDrivers = async () => {
    try {
      const res = await axios.get(`https://routeoptima-backend.onrender.com/api/auth/my-drivers?adminEmail=${adminEmail}`);
      setDrivers(res.data);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  // --- 2. CREATE & UPDATE HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.name || !form.email || !form.mobile) {
        alert("Please fill in Name, Email and Mobile Number.");
        return;
    }

    try {
        if (isEditing) {
            // Update Logic
            await axios.put(`https://routeoptima-backend.onrender.com/api/auth/update-driver/${currentDriverId}`, {
                name: form.name,
                email: form.email,
                mobile: form.mobile,
                password: form.password 
            });
            alert("✅ Driver Updated Successfully!");
        } else {
            // Create Logic
            await axios.post("https://routeoptima-backend.onrender.com/api/auth/add-driver", { 
                adminEmail: adminEmail, 
                driverName: form.name,
                driverEmail: form.email,
                driverPassword: form.password,
                mobile: form.mobile // Mandatory
            });
            alert("✅ Driver Added Successfully!");
        }
        
        // Reset Form & Refresh List
        resetForm();
        fetchDrivers();

    } catch (err) {
        // Safe Error Handling
        const errMsg = err.response?.data || "Server Error. Check Backend Console.";
        alert("Action Failed: " + errMsg);
        console.error(err);
    }
  };

  // --- 3. DELETE HANDLER ---
  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to remove this driver?")) {
        try {
            await axios.delete(`https://routeoptima-backend.onrender.com/api/auth/delete-driver/${id}`);
            fetchDrivers();
        } catch (err) {
            alert("Delete Failed!");
        }
    }
  };

  // --- HELPER: START EDITING ---
  const handleEditClick = (driver) => {
      setIsEditing(true);
      setCurrentDriverId(driver.id);
      setForm({
          name: driver.name,
          email: driver.email,
          mobile: driver.mobile || '',
          password: '' 
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- HELPER: CANCEL EDIT ---
  const resetForm = () => {
      setIsEditing(false);
      setCurrentDriverId(null);
      setForm({ name: '', email: '', password: '', mobile: '' });
  };

  return (
    <div className="card-box">
      <div className="card-header">
        <h3><FaTruck /> Driver Management</h3>
        <p style={{fontSize:'13px', color:'#64748b', margin:0}}> Manage your delivery fleet and their assignments.</p>
      </div>
      
      {/* --- FORM SECTION --- */}
      <div className="form-container">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', borderBottom:'1px solid #f1f5f9', paddingBottom:'10px'}}>
            <h5 className="form-title" style={{margin:0, border:0}}>
                {isEditing ? `Edit Driver (ID: ${currentDriverId})` : "Register New Driver"}
            </h5>
            
            {isEditing && (
                <button onClick={resetForm} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'13px', fontWeight:'600'}}>
                    <FaTimes /> Cancel Edit
                </button>
            )}
        </div>

        <form onSubmit={handleSubmit} className="smart-form">
          <div className="input-group">
            <input placeholder="Driver Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          
          <div className="input-group">
            <input placeholder="Mobile Number" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} required />
          </div>

          <div className="input-group">
            <input placeholder="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          
          <div className="input-group">
            <input 
                placeholder={isEditing ? "New Password (Optional)" : "Password"} 
                type="text" 
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
                required={!isEditing} 
            />
          </div>
          
          <button type="submit" className="btn-primary">
            {isEditing ? <><FaEdit/> Update Driver</> : <><FaUserPlus/> Add Driver</>}
          </button>
        </form>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="table-responsive">
        <table className="orders-table">
            <thead>
                <tr>
                    <th style={{width: '25%'}}>Driver Details</th>
                    <th style={{width: '30%'}}>Contact Info</th>
                    <th style={{width: '20%'}}>Current Status</th>
                    <th style={{width: '15%'}}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {drivers.map(d => (
                    <tr key={d.id} style={{backgroundColor: currentDriverId === d.id ? '#f8fafc' : 'transparent', transition: 'background 0.3s'}}>
                        <td>
                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:'14px', fontWeight:'bold'}}>
                                    {d.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <strong style={{color:'#1e293b'}}>{d.name}</strong><br/>
                                    <span style={{fontSize:'11px', color:'#94a3b8', fontWeight:'500'}}>ID: #{d.id}</span>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#64748b'}}>
                                    <FaEnvelope size={12} color="#94a3b8"/> {d.email}
                                </div>
                                <div style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#64748b'}}>
                                    <FaMobileAlt size={12} color="#94a3b8"/> {d.mobile || "N/A"}
                                </div>
                            </div>
                        </td>
                        <td>
                          <span className={`status-badge ${d.isAvailable ? 'delivered' : 'pending'}`}>
                            {d.isAvailable ? "Available" : "On Duty"}
                          </span>
                          {/* Show Current Order ID if busy */}
                          {!d.isAvailable && d.currentOrderId && (
                              <div style={{fontSize:'10px', marginTop:'4px', color:'#ea580c'}}>
                                  Processing: {d.currentOrderId}
                              </div>
                          )}
                        </td>
                        <td>
                            <div style={{display:'flex', gap:'8px'}}>
                                <button onClick={() => handleEditClick(d)} className="btn-icon-edit" title="Edit">
                                    <FaEdit size={14}/>
                                </button>
                                <button onClick={() => handleDelete(d.id)} className="btn-icon-delete" title="Delete">
                                    <FaTrash size={14}/>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                {drivers.length === 0 && (
                    <tr>
                        <td colSpan="4" className="text-center" style={{padding:'40px', color:'#94a3b8'}}>
                            <FaTruck size={30} style={{marginBottom:'10px', opacity:0.5}}/><br/>
                            No Drivers Found. Register a new driver above.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriversView;