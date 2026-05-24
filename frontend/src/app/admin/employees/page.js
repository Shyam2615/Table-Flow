'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function EmployeesPage() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', position: '', department: 'service', salary: '', address: '', emergencyContact: '' });

    const loadData = async () => {
        const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
        const { data } = await API.get(`/employees/restaurant/${rest._id}`);
        return { restaurant: rest, employees: data };
    };

    useEffect(() => {
        loadData().then((data) => { setRestaurant(data.restaurant); setEmployees(data.employees); }).catch(() => {});
    }, [user]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', email: '', phone: '', position: '', department: 'service', salary: '', address: '', emergencyContact: '' });
        setShowModal(true);
    };

    const openEdit = (emp) => {
        setEditing(emp);
        setForm({ name: emp.name, email: emp.email, phone: emp.phone, position: emp.position, department: emp.department, salary: emp.salary, address: emp.address, emergencyContact: emp.emergencyContact });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editing) {
                await API.put(`/employees/${editing._id}`, form);
                showToast('Employee updated!');
            } else {
                await API.post('/employees', { ...form, restaurantId: restaurant._id });
                showToast('Employee added!');
            }
            setShowModal(false);
            const data = await loadData();
            setRestaurant(data.restaurant); setEmployees(data.employees);
        } catch (err) { showToast('Failed', 'error'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this employee?')) return;
        await API.delete(`/employees/${id}`);
        showToast('Employee removed');
        const data = await loadData();
        setRestaurant(data.restaurant); setEmployees(data.employees);
    };

    const toggleStatus = async (emp) => {
        const newStatus = emp.status === 'active' ? 'inactive' : 'active';
        await API.put(`/employees/${emp._id}`, { status: newStatus });
        const data = await loadData();
        setRestaurant(data.restaurant); setEmployees(data.employees);
    };

    const deptColors = { kitchen: 'badge-danger', service: 'badge-info', management: 'badge-primary', cleaning: 'badge-warning', security: 'badge-neutral' };

    return (
        <div className="fade-in">
            {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
            <div className="page-header-flex">
                <div>
                    <h1 className="page-title">Employees</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{employees.length} team members</p>
                </div>
                <button onClick={openAdd} className="btn btn-primary">+ Add Employee</button>
            </div>

            <div className="table-container responsive-table">
                <table>
                    <thead><tr><th>Name</th><th>Position</th><th>Department</th><th>Phone</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No employees added yet</td></tr>
                        ) : employees.map(emp => (
                            <tr key={emp._id}>
                                <td data-label="Name">
                                    <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                                </td>
                                <td data-label="Position">{emp.position}</td>
                                <td data-label="Department"><span className={`badge ${deptColors[emp.department] || 'badge-neutral'}`}>{emp.department}</span></td>
                                <td data-label="Phone">{emp.phone}</td>
                                <td data-label="Salary" style={{ fontWeight: 600 }}>₹{emp.salary?.toLocaleString()}</td>
                                <td data-label="Status">
                                    <button onClick={() => toggleStatus(emp)} className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ cursor: 'pointer', border: 'none' }}>
                                        {emp.status}
                                    </button>
                                </td>
                                <td data-label="Actions">
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => openEdit(emp)} className="btn btn-ghost btn-sm">✏️</button>
                                        <button onClick={() => handleDelete(emp._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Employee' : 'Add Employee'}</h2>
                            <button onClick={() => setShowModal(false)} className="btn btn-ghost">✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="grid-2">
                                <div className="input-group"><label>Full Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                                <div className="input-group"><label>Email</label><input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                            </div>
                            <div className="grid-2">
                                <div className="input-group"><label>Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                <div className="input-group"><label>Position</label><input className="input" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="e.g. Head Chef" /></div>
                            </div>
                            <div className="grid-2">
                                <div className="input-group"><label>Department</label>
                                    <select className="select" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                                        <option value="kitchen">Kitchen</option><option value="service">Service</option>
                                        <option value="management">Management</option><option value="cleaning">Cleaning</option><option value="security">Security</option>
                                    </select>
                                </div>
                                <div className="input-group"><label>Salary (₹/month)</label><input type="number" className="input" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                            </div>
                            <div className="input-group"><label>Address</label><input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                            <div className="input-group"><label>Emergency Contact</label><input className="input" value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} /></div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleSave} className="btn btn-primary">{editing ? 'Update' : 'Add Employee'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
