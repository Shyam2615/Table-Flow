'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function PayrollPage() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    const loadData = async () => {
        const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
        const [empRes, attRes] = await Promise.all([
            API.get(`/employees/restaurant/${rest._id}`),
            API.get(`/attendance/restaurant/${rest._id}`)
        ]);
        return { employees: empRes.data, attendance: attRes.data };
    };

    useEffect(() => {
        loadData().then((data) => { setEmployees(data.employees); setAttendance(data.attendance); }).catch(() => {});
    }, [user, selectedMonth]);

    const getEmployeeAttendance = (empId) => {
        const monthRecords = attendance.filter(a =>
            (a.employeeId?._id || a.employeeId) === empId && a.date?.startsWith(selectedMonth)
        );
        const present = monthRecords.filter(r => r.status === 'present').length;
        const halfDay = monthRecords.filter(r => r.status === 'half-day').length;
        const absent = monthRecords.filter(r => r.status === 'absent').length;
        return { present, halfDay, absent, total: monthRecords.length };
    };

    const calculatePay = (emp) => {
        const att = getEmployeeAttendance(emp._id);
        const dailyRate = emp.salary / 30;
        const earned = (att.present * dailyRate) + (att.halfDay * dailyRate * 0.5);
        return { ...att, dailyRate: Math.round(dailyRate), earned: Math.round(earned), salary: emp.salary };
    };

    const totalPayroll = employees.reduce((s, emp) => s + calculatePay(emp).earned, 0);

    return (
        <div className="fade-in">
            <div className="page-header-flex">
                <div>
                    <h1 className="page-title">Payroll</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Monthly salary breakdown based on attendance</p>
                </div>
                <input type="month" className="input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ width: 200 }} />
            </div>

            <div className="grid-3" style={{ marginBottom: 32 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.15)' }}>💰</div>
                    <div className="stat-value">₹{totalPayroll.toLocaleString()}</div>
                    <div className="stat-label">Total Payroll</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>👥</div>
                    <div className="stat-value">{employees.filter(e => e.status === 'active').length}</div>
                    <div className="stat-label">Active Employees</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>📊</div>
                    <div className="stat-value">{employees.length > 0 ? Math.round(totalPayroll / employees.length).toLocaleString() : 0}</div>
                    <div className="stat-label">Avg. Pay</div>
                </div>
            </div>

            <div className="table-container responsive-table">
                <table>
                    <thead>
                        <tr><th>Employee</th><th>Position</th><th>Base Salary</th><th>Present</th><th>Half Day</th><th>Absent</th><th>Earned</th></tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No employees</td></tr>
                        ) : employees.map(emp => {
                            const pay = calculatePay(emp);
                            return (
                                <tr key={emp._id}>
                                    <td data-label="Employee">
                                        <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                                    </td>
                                    <td data-label="Position">{emp.position}</td>
                                    <td data-label="Base Salary">₹{emp.salary?.toLocaleString()}</td>
                                    <td data-label="Present"><span className="badge badge-success">{pay.present}</span></td>
                                    <td data-label="Half Day"><span className="badge badge-warning">{pay.halfDay}</span></td>
                                    <td data-label="Absent"><span className="badge badge-danger">{pay.absent}</span></td>
                                    <td data-label="Earned" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>₹{pay.earned.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
