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
    FaMoneyBill 
} from 'react-icons/fa';

function AdminDashboard() {
    // State to hold dashboard statistics
    const [stats, setStats] = useState({
        totalPatients: 0,
        totalAppointments: 0,
        pendingLabTests: 0,
        totalRevenue: 0
    });

    // Fetch data from backend when component loads
    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await axios.get('http://localhost:8080/api/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching dashboard stats", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="pb-10">
            {/* 1. Welcome Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800">Admin Dashboard</h2>
                <p className="text-gray-500 mt-1">
                    Logged in as: <span className="font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">ADMIN</span>
                </p>
            </div>
            
            {/* 2. Statistics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                
                {/* Total Patients Card */}
                <Link to="/admin/patients" className="bg-blue-600 text-white rounded-xl p-6 shadow-lg flex justify-between items-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                    <div>
                        <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Total Patients</p>
                        <h3 className="text-4xl font-bold mt-2">{stats.totalPatients}</h3>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-full bg-opacity-50">
                        <FaUserInjured size={30} />
                    </div>
                </Link>

                {/* Appointments Card */}
                <Link to="/admin/appointments" className="bg-green-600 text-white rounded-xl p-6 shadow-lg flex justify-between items-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                    <div>
                        <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Appointments</p>
                        <h3 className="text-4xl font-bold mt-2">{stats.totalAppointments}</h3>
                    </div>
                    <div className="bg-green-500 p-3 rounded-full bg-opacity-50">
                        <FaCalendarCheck size={30} />
                    </div>
                </Link>

                {/* Total Revenue Card */}
                <div className="bg-red-500 text-white rounded-xl p-6 shadow-lg flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Total Revenue</p>
                        <h3 className="text-3xl font-bold mt-2">LKR {stats.totalRevenue.toFixed(2)}</h3>
                    </div>
                    <div className="bg-red-400 p-3 rounded-full bg-opacity-50">
                        <FaMoneyBillWave size={30} />
                    </div>
                </div>

                {/* Pending Lab Tests Card */}
                <div className="bg-yellow-500 text-white rounded-xl p-6 shadow-lg flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Lab Requests</p>
                        <h3 className="text-4xl font-bold mt-2">{stats.pendingLabTests}</h3>
                    </div>
                    <div className="bg-yellow-400 p-3 rounded-full bg-opacity-50">
                        <FaFlask size={30} />
                    </div>
                </div>
            </div>

            {/* 3. Quick Actions Section */}
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Quick Management Actions</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* Manage Patients */}
                <Link to="/admin/patients" className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition group">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                        <FaUserInjured size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">Manage Patients</h4>
                        <p className="text-xs text-gray-500">Add, view, and update patient records</p>
                    </div>
                </Link>

                {/* Manage Doctors */}
                <Link to="/admin/doctors" className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-green-500 hover:shadow-md transition group">
                    <div className="bg-green-100 text-green-600 p-3 rounded-lg group-hover:bg-green-600 group-hover:text-white transition">
                        <FaUserMd size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">Manage Doctors</h4>
                        <p className="text-xs text-gray-500">Register doctors and assign departments</p>
                    </div>
                </Link>

                {/* Manage Departments */}
                <Link to="/admin/departments" className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-purple-500 hover:shadow-md transition group">
                    <div className="bg-purple-100 text-purple-600 p-3 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
                        <FaBuilding size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">Departments</h4>
                        <p className="text-xs text-gray-500">Create and manage hospital departments</p>
                    </div>
                </Link>

                {/* Manage Appointments */}
                <Link to="/admin/appointments" className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-orange-500 hover:shadow-md transition group">
                    <div className="bg-orange-100 text-orange-600 p-3 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition">
                        <FaCalendarCheck size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">Appointments</h4>
                        <p className="text-xs text-gray-500">Book and manage patient appointments</p>
                    </div>
                </Link>

                {/* Manage Pharmacy */}
                <Link to="/admin/pharmacy" className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-teal-500 hover:shadow-md transition group">
                    <div className="bg-teal-100 text-teal-600 p-3 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition">
                        <FaPills size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">Pharmacy Inventory</h4>
                        <p className="text-xs text-gray-500">Manage medicine stock and expiry dates</p>
                    </div>
                </Link>

                {/* Manage Billing */}
                <Link to="/admin/billing" className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-red-500 hover:shadow-md transition group">
                    <div className="bg-red-100 text-red-600 p-3 rounded-lg group-hover:bg-red-500 group-hover:text-white transition">
                        <FaMoneyBill size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">Billing System</h4>
                        <p className="text-xs text-gray-500">Generate invoices and record payments</p>
                    </div>
                </Link>

            </div>
        </div>
    );
}

export default AdminDashboard;