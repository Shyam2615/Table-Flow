'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function LeavesPage() {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ employeeId: '', startDate: '', endDate: '', reason: '', type: 'casual' });
    const [toast, setToast] = useState(null);

    const loadData = async () => {
        const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
        const [leavesRes, empRes] = await Promise.all([
            API.get(`/leaves/restaurant/${rest._id}`),
            API.get(`/employees/restaurant/${rest._id}`)
        ]);
        return { restaurant: rest, leaves: leavesRes.data, employees: empRes.data };
    };

    useEffect(() => {
        loadData().then((data) => { setRestaurant(data.restaurant); setLeaves(data.leaves); setEmployees(data.employees); }).catch(() => {});
    }, [user]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const handleSubmit = async () => {
        try {
            await API.post('/leaves', { ...form, restaurantId: restaurant._id });
            showToast('Leave request submitted');
            setShowModal(false);
            const data = await loadData();
            setRestaurant(data.restaurant); setLeaves(data.leaves); setEmployees(data.employees);
        } catch (err) { showToast('Failed', 'error'); }
    };

    const updateStatus = async (id, status) => {
        await API.put(`/leaves/${id}`, { status });
        showToast(`Leave ${status}`);
        const data = await loadData();
        setRestaurant(data.restaurant); setLeaves(data.leaves); setEmployees(data.employees);
    };

    const statusBadge = (status) => {
        const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
        return <span className={`badge ${map[status]}`}>{status}</span>;
    };

    const typeBadge = (type) => {
        const map = { sick: 'badge-danger', casual: 'badge-info', earned: 'badge-success', unpaid: 'badge-warning' };
        return <span className={`badge ${map[type]}`}>{type}</span>;
    };

    return (
        <div className="fade-in">
            {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
            <div className="page-header-flex">
                <div>
                    <h1 className="page-title">Leave Requests</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage employee leave applications</p>
                </div>
                <button onClick={() => { setForm({ employeeId: '', startDate: '', endDate: '', reason: '', type: 'casual' }); setShowModal(true); }} className="btn btn-primary">+ Apply Leave</button>
            </div>

            <div className="table-container responsive-table">
                <table>
                    <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {leaves.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No leave requests</td></tr>
                        ) : leaves.map(leave => (
                            <tr key={leave._id}>
                                <td data-label="Employee" style={{ fontWeight: 600 }}>{leave.employeeId?.name || 'N/A'}</td>
                                <td data-label="Type">{typeBadge(leave.type)}</td>
                                <td data-label="From">{leave.startDate}</td>
                                <td data-label="To">{leave.endDate}</td>
                                <td data-label="Reason" style={{ maxWidth: 200, color: 'var(--text-secondary)' }}>{leave.reason}</td>
                                <td data-label="Status">{statusBadge(leave.status)}</td>
                                <td data-label="Actions">
                                    {leave.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => updateStatus(leave._id, 'approved')} className="btn btn-success btn-sm">Approve</button>
                                            <button onClick={() => updateStatus(leave._id, 'rejected')} className="btn btn-danger btn-sm">Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Apply Leave</h2><button onClick={() => setShowModal(false)} className="btn btn-ghost">✕</button></div>
                        <div className="modal-body">
                            <div className="input-group"><label>Employee</label>
                                <select className="select" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                                    <option value="">Select employee</option>
                                    {employees.map(e => <option key={e._id} value={e._id}>{e.name} - {e.position}</option>)}
                                </select>
                            </div>
                            <div className="input-group"><label>Leave Type</label>
                                <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="casual">Casual</option><option value="sick">Sick</option><option value="earned">Earned</option><option value="unpaid">Unpaid</option>
                                </select>
                            </div>
                            <div className="grid-2">
                                <div className="input-group"><label>Start Date</label><input type="date" className="input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                                <div className="input-group"><label>End Date</label><input type="date" className="input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
                            </div>
                            <div className="input-group"><label>Reason</label><textarea className="input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} /></div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleSubmit} className="btn btn-primary">Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
