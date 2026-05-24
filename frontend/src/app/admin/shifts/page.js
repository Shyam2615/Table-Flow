'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ShiftsPage() {
    const { user } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ employeeId: '', day: 'monday', startTime: '09:00', endTime: '17:00', role: '' });
    const [toast, setToast] = useState(null);

    const loadData = async () => {
        const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
        const [shiftsRes, empRes] = await Promise.all([
            API.get(`/shifts/restaurant/${rest._id}`),
            API.get(`/employees/restaurant/${rest._id}`)
        ]);
        return { restaurant: rest, shifts: shiftsRes.data, employees: empRes.data };
    };

    useEffect(() => {
        loadData().then((data) => { setRestaurant(data.restaurant); setShifts(data.shifts); setEmployees(data.employees); }).catch(() => {});
    }, [user]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const handleSave = async () => {
        try {
            await API.post('/shifts', { ...form, restaurantId: restaurant._id });
            showToast('Shift scheduled!');
            setShowModal(false);
            const data = await loadData();
            setRestaurant(data.restaurant); setShifts(data.shifts); setEmployees(data.employees);
        } catch (err) { showToast('Failed', 'error'); }
    };

    const handleDelete = async (id) => {
        await API.delete(`/shifts/${id}`);
        showToast('Shift removed');
        const data = await loadData();
        setRestaurant(data.restaurant); setShifts(data.shifts); setEmployees(data.employees);
    };

    return (
        <div className="fade-in">
            {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
            <div className="page-header-flex">
                <div>
                    <h1 className="page-title">Shift Schedule</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Plan and manage employee shifts</p>
                </div>
                <button onClick={() => { setForm({ employeeId: '', day: 'monday', startTime: '09:00', endTime: '17:00', role: '' }); setShowModal(true); }} className="btn btn-primary">+ Add Shift</button>
            </div>

            {/* Weekly Grid View */}
            <div className="shifts-grid">
                {DAYS.map(day => (
                    <div key={day} className="card" style={{ minHeight: 200 }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                            <h4 style={{ textTransform: 'capitalize', fontSize: '0.9rem', fontWeight: 700 }}>{day}</h4>
                        </div>
                        <div style={{ padding: 8 }}>
                            {shifts.filter(s => s.day === day).map(shift => (
                                <div key={shift._id} style={{ padding: '8px 10px', background: 'var(--primary-glow)', borderRadius: 'var(--radius-sm)', marginBottom: 6, fontSize: '0.8rem' }}>
                                    <div style={{ fontWeight: 600 }}>{shift.employeeId?.name || 'N/A'}</div>
                                    <div style={{ color: 'var(--text-muted)' }}>{shift.startTime} - {shift.endTime}</div>
                                    <button onClick={() => handleDelete(shift._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', marginTop: 4 }}>Remove</button>
                                </div>
                            ))}
                            {shifts.filter(s => s.day === day).length === 0 && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: 8, textAlign: 'center' }}>No shifts</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Schedule Shift</h2><button onClick={() => setShowModal(false)} className="btn btn-ghost">✕</button></div>
                        <div className="modal-body">
                            <div className="input-group"><label>Employee</label>
                                <select className="select" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                                    <option value="">Select employee</option>
                                    {employees.map(e => <option key={e._id} value={e._id}>{e.name} - {e.position}</option>)}
                                </select>
                            </div>
                            <div className="input-group"><label>Day</label>
                                <select className="select" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>
                                    {DAYS.map(d => <option key={d} value={d} style={{ textTransform: 'capitalize' }}>{d}</option>)}
                                </select>
                            </div>
                            <div className="grid-2">
                                <div className="input-group"><label>Start Time</label><input type="time" className="input" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></div>
                                <div className="input-group"><label>End Time</label><input type="time" className="input" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></div>
                            </div>
                            <div className="input-group"><label>Role (optional)</label><input className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Floor Manager" /></div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleSave} className="btn btn-primary">Schedule</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
