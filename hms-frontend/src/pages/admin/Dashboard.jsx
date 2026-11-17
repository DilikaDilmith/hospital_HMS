import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaUserInjured, 
    FaCalendarCheck, 
    FaFlask, 
    FaMoneyBillWave, 
    FaUserMd, 
    FaBuilding, 
    FaPills, 
    FaMoneyBill,
    FaUserCircle,
    FaBed,
    FaUserTie,
    FaExclamationTriangle,
    FaCheckCircle,
    FaBoxes,
    FaChartPie,
    FaChartBar,
    FaChartLine
} from 'react-icons/fa';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';

function AdminDashboard() {
    // State to hold dashboard statistics and reports
    const [stats, setStats] = useState({
        totalPatients: 0,
        totalAppointments: 0,
        todaysAppointments: 0,
        totalLabRequests: 0,
        pendingLabTests: 0,
        lowStockMedicines: 0,
        totalRevenue: 0,
        totalBilledRevenue: 0,
        totalDoctors: 0,
        totalEmployees: 0,
        staffPresentToday: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        availableBeds: 0,
        categoryRevenue: [],
        appointmentStats: [],
        wardOccupancy: [],
        monthlyRevenue: []
    });

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const CATEGORY_COLORS = {
        CONSULTATION: '#3B82F6', // Blue
        LAB: '#8B5CF6',          // Purple
        PHARMACY: '#10B981',     // Emerald
        WARD: '#F59E0B',         // Amber
        OTHER: '#6B7280'         // Gray
    };

    const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];

    useEffect(() => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Fetch aggregated stats & reports
                const statsRes = await axios.get('http://localhost:8080/api/dashboard/stats', config);
                setStats(statsRes.data);

                // 2. Fetch logged in user profile
                const userRes = await axios.get('http://localhost:8080/api/users/profile', config);
                setUser(userRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Format currency
    const formatLKR = (val) => `LKR ${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="pb-16 max-w-7xl mx-auto">
            {/* 1. Welcome & Profile Banner */}
            <div className="mb-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <FaUserCircle size={56} className="text-blue-300" />
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">
                            Hospital Administration Portal
                        </h2>
                        <p className="text-blue-200 text-sm mt-1">
                            Welcome back, <span className="font-bold text-white">{user ? user.fullName : 'Administrator'}</span> 
                            {' '}• Role: <span className="font-bold text-white bg-blue-600/80 px-2 py-0.5 rounded text-xs">ADMIN</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <Link 
                        to="/admin/staff" 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-md flex items-center gap-2"
                    >
                        <FaUserTie /> Staff & Attendance
                    </Link>
                    <Link 
                        to="/profile" 
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-md"
                    >
                        My Profile
                    </Link>
                </div>
            </div>

            {/* 2. Top Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                
                {/* Total Revenue (Paid) Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs uppercase font-extrabold text-emerald-200 tracking-wider">Total Revenue (Paid)</p>
                            <h3 className="text-3xl font-black mt-2 tracking-tight">
                                {formatLKR(stats.totalRevenue)}
                            </h3>
                            <p className="text-xs text-emerald-100 mt-2 font-medium">
                                Total Billed: {formatLKR(stats.totalBilledRevenue)}
                            </p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                            <FaMoneyBillWave size={26} />
                        </div>
                    </div>
                </div>

                {/* Total Patients Card */}
                <Link to="/admin/patients" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Total Patients</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-2">{stats.totalPatients}</h3>
                            <span className="text-xs text-blue-600 font-semibold mt-2 inline-block group-hover:underline">
                                View patient directory &rarr;
                            </span>
                        </div>
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition">
                            <FaUserInjured size={24} />
                        </div>
                    </div>
                </Link>

                {/* Today's Appointments Card (SRS Section 7) */}
                <Link to="/admin/appointments" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-indigo-500 hover:shadow-md transition group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Today's Appointments</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-2">{stats.todaysAppointments ?? stats.totalAppointments}</h3>
                            <span className="text-xs text-indigo-600 font-semibold mt-2 inline-block group-hover:underline">
                                {stats.totalAppointments} Total Scheduled &rarr;
                            </span>
                        </div>
                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition">
                            <FaCalendarCheck size={24} />
                        </div>
                    </div>
                </Link>

                {/* Lab Requests Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Lab Requests</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-2">{stats.totalLabRequests}</h3>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    stats.pendingLabTests > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                    {stats.pendingLabTests} Pending
                                </span>
                            </div>
                        </div>
                        <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
                            <FaFlask size={24} />
                        </div>
                    </div>
                </div>

            </div>

            {/* 3. Operational Pulse Metrics (Low stock alert, Bed occupancy, Staff attendance) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                
                {/* Low Stock Medicine Alert */}
                <Link 
                    to="/admin/batches"
                    className={`rounded-2xl p-5 border transition flex items-center justify-between ${
                        stats.lowStockMedicines > 0 
                            ? 'bg-rose-50 border-rose-200 hover:border-rose-400' 
                            : 'bg-white border-gray-100 hover:border-emerald-300'
                    }`}
                >
                    <div>
                        <div className="flex items-center gap-2">
                            {stats.lowStockMedicines > 0 ? (
                                <FaExclamationTriangle className="text-rose-500 animate-pulse" />
                            ) : (
                                <FaCheckCircle className="text-emerald-500" />
                            )}
                            <p className="text-xs uppercase font-bold text-gray-600">Low Stock Medicines</p>
                        </div>
                        <h4 className={`text-2xl font-black mt-2 ${stats.lowStockMedicines > 0 ? 'text-rose-600' : 'text-gray-800'}`}>
                            {stats.lowStockMedicines} {stats.lowStockMedicines === 1 ? 'Drug Alert' : 'Drug Alerts'}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.lowStockMedicines > 0 ? 'Requires immediate stock batch reorder' : 'All pharmaceuticals adequately stocked'}
                        </p>
                    </div>
                    <div className={`p-3 rounded-2xl ${stats.lowStockMedicines > 0 ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                        <FaPills size={24} />
                    </div>
                </Link>

                {/* Inpatient Bed Occupancy */}
                <Link 
                    to="/admin/inpatient"
                    className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-purple-400 transition flex items-center justify-between"
                >
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Inpatient Bed Occupancy</p>
                        <h4 className="text-2xl font-black text-gray-900 mt-2">
                            {stats.occupiedBeds} / {stats.totalBeds} <span className="text-sm font-normal text-gray-500">Beds Occupied</span>
                        </h4>
                        <p className="text-xs text-purple-600 font-semibold mt-1">
                            {stats.availableBeds} beds currently available for admission
                        </p>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                        <FaBed size={24} />
                    </div>
                </Link>

                {/* Staff Attendance Pulse */}
                <Link 
                    to="/admin/staff"
                    className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-indigo-400 transition flex items-center justify-between"
                >
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Staff Present Today</p>
                        <h4 className="text-2xl font-black text-gray-900 mt-2">
                            {stats.staffPresentToday} / {stats.totalEmployees} <span className="text-sm font-normal text-gray-500">Personnel</span>
                        </h4>
                        <p className="text-xs text-indigo-600 font-semibold mt-1">
                            {stats.totalDoctors} Active Doctors on call
                        </p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <FaUserTie size={24} />
                    </div>
                </Link>

            </div>

            {/* 4. Visual Reports & Analytics (Recharts Section) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                
                {/* Chart 1: Revenue by Category */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                                <FaChartPie className="text-blue-600" /> Revenue by Billing Category
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Itemized distribution across Consultation, Lab, Pharmacy & Ward</p>
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.categoryRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `LKR ${val}`} />
                                <Tooltip 
                                    formatter={(val) => [`LKR ${Number(val).toLocaleString()}`, 'Total Amount']}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                    {stats.categoryRevenue.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Monthly Paid Revenue Trend */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                                <FaChartLine className="text-emerald-600" /> Monthly Revenue Trend (Paid)
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Collections from finalized paid invoices over past 6 months</p>
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `LKR ${val}`} />
                                <Tooltip 
                                    formatter={(val) => [`LKR ${Number(val).toLocaleString()}`, 'Revenue']}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 3: Appointment Status Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                                <FaChartBar className="text-indigo-600" /> Appointments by Status
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Workflow stages from scheduled to completion</p>
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.appointmentStats} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#6B7280' }} angle={-15} textAnchor="end" />
                                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                                <Tooltip 
                                    formatter={(val) => [val, 'Count']}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                                />
                                <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 4: Ward Bed Occupancy Breakdown */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                                <FaBed className="text-purple-600" /> Ward Bed Availability Breakdown
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Occupied versus available beds per specialized ward</p>
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.wardOccupancy} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="wardName" tick={{ fontSize: 11, fill: '#6B7280' }} angle={-10} textAnchor="end" />
                                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                                />
                                <Legend />
                                <Bar dataKey="occupiedBeds" name="Occupied Beds" fill="#EC4899" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="availableBeds" name="Available Beds" fill="#10B981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* 5. Quick Management Navigation Grid */}
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Hospital Management Modules</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* Manage Patients */}
                <Link to="/admin/patients" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition group">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
                        <FaUserInjured size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">Patients</h4>
                        <p className="text-xs text-gray-500">Register & manage patients</p>
                    </div>
                </Link>

                {/* Manage Doctors */}
                <Link to="/admin/doctors" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow-md transition group">
                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                        <FaUserMd size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">Doctors</h4>
                        <p className="text-xs text-gray-500">Profiles & consultation fees</p>
                    </div>
                </Link>

                {/* Manage Departments */}
                <Link to="/admin/departments" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-purple-500 hover:shadow-md transition group">
                    <div className="bg-purple-100 text-purple-600 p-3 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                        <FaBuilding size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">Departments</h4>
                        <p className="text-xs text-gray-500">Hospital specialties & units</p>
                    </div>
                </Link>

                {/* Manage Appointments */}
                <Link to="/admin/appointments" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-orange-500 hover:shadow-md transition group">
                    <div className="bg-orange-100 text-orange-600 p-3 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition">
                        <FaCalendarCheck size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">Appointments</h4>
                        <p className="text-xs text-gray-500">Schedule & complete visits</p>
                    </div>
                </Link>

                {/* Manage Staff HR */}
                <Link to="/admin/staff" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition group">
                    <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                        <FaUserTie size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">Staff HR & Attendance</h4>
                        <p className="text-xs text-gray-500">Employees, roster & checks</p>
                    </div>
                </Link>

                {/* Inpatient & Beds */}
                <Link to="/admin/inpatient" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-purple-500 hover:shadow-md transition group">
                    <div className="bg-purple-100 text-purple-600 p-3 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                        <FaBed size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">Inpatient & Beds</h4>
                        <p className="text-xs text-gray-500">Admissions, wards & discharge</p>
                    </div>
                </Link>

                {/* Pharmacy Batches */}
                <Link to="/admin/batches" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-teal-500 hover:shadow-md transition group">
                    <div className="bg-teal-100 text-teal-600 p-3 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition">
                        <FaBoxes size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">Pharmacy Batches</h4>
                        <p className="text-xs text-gray-500">FEFO batches & inventory</p>
                    </div>
                </Link>

                {/* Billing System */}
                <Link to="/admin/billing" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-red-500 hover:shadow-md transition group">
                    <div className="bg-red-100 text-red-600 p-3 rounded-xl group-hover:bg-red-500 group-hover:text-white transition">
                        <FaMoneyBill size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">Itemized Billing</h4>
                        <p className="text-xs text-gray-500">Invoices & payments</p>
                    </div>
                </Link>

            </div>
        </div>
    );
}

export default AdminDashboard;
