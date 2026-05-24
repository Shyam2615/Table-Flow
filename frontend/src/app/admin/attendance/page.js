'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function AttendancePage() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [toast, setToast] = useState(null);

    const loadData = async () => {
        const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
        const [empRes, attRes] = await Promise.all([
            API.get(`/employees/restaurant/${rest._id}`),
            API.get(`/attendance/restaurant/${rest._id}?date=${selectedDate}`)
        ]);
        return { restaurant: rest, employees: empRes.data.filter(e => e.status === 'active'), attendance: attRes.data };
    };

    useEffect(() => {
        loadData().then((data) => { setRestaurant(data.restaurant); setEmployees(data.employees); setAttendance(data.attendance); }).catch(() => {});
    }, [user, selectedDate]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const markAttendance = async (employeeId, status) => {
        const existing = attendance.find(a => a.employeeId?._id === employeeId || a.employeeId === employeeId);
        try {
            if (existing) {
                await API.put(`/attendance/${existing._id}`, { status, checkIn: status === 'present' ? '09:00' : '', checkOut: '' });
            } else {
                await API.post('/attendance', {
                    employeeId, restaurantId: restaurant._id, date: selectedDate,
                    status, checkIn: status === 'present' ? '09:00' : '', checkOut: ''
                });
            }
            showToast('Attendance marked');
            const data = await loadData();
            setRestaurant(data.restaurant); setEmployees(data.employees); setAttendance(data.attendance);
        } catch (err) { showToast('Failed', 'error'); }
    };

    const getAttendanceStatus = (empId) => {
        const record = attendance.find(a => (a.employeeId?._id || a.employeeId) === empId);
        return record?.status || 'not-marked';
    };

    const statusColors = { present: 'badge-success', absent: 'badge-danger', 'half-day': 'badge-warning', late: 'badge-info', 'not-marked': 'badge-neutral' };

    return (
        <div className="fade-in">
            {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
            <div className="page-header-flex">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Mark daily attendance for your team</p>
                </div>
                <input type="date" className="input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: 200 }} />
            </div>

            <div className="table-container responsive-table">
                <table>
                    <thead><tr><th>Employee</th><th>Position</th><th>Department</th><th>Status</th><th>Mark Attendance</th></tr></thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No active employees</td></tr>
                        ) : employees.map(emp => (
                            <tr key={emp._id}>
                                <td data-label="Employee" style={{ fontWeight: 600 }}>{emp.name}</td>
                                <td data-label="Position">{emp.position}</td>
                                <td data-label="Department"><span className={`badge badge-info`}>{emp.department}</span></td>
                                <td data-label="Status"><span className={`badge ${statusColors[getAttendanceStatus(emp._id)]}`}>{getAttendanceStatus(emp._id)}</span></td>
                                <td data-label="Mark Attendance">
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {['present', 'absent', 'half-day', 'late'].map(s => (
                                            <button key={s} onClick={() => markAttendance(emp._id, s)}
                                                className={`btn btn-sm ${getAttendanceStatus(emp._id) === s ? 'btn-primary' : 'btn-secondary'}`}
                                                style={{ textTransform: 'capitalize', fontSize: '0.8rem', padding: '6px 10px' }}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="grid-4" style={{ marginTop: 32 }}>
                {['present', 'absent', 'half-day', 'late'].map(s => (
                    <div key={s} className="stat-card">
                        <div className="stat-value">{attendance.filter(a => a.status === s).length}</div>
                        <div className="stat-label" style={{ textTransform: 'capitalize' }}>{s}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
