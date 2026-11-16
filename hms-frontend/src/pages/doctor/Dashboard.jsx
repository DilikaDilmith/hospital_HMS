import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaCalendarCheck, FaFlask, FaUserInjured, FaUserCircle } from 'react-icons/fa';

function DoctorDashboard() {
    const [stats, setStats] = useState({ totalPatients: 0, totalAppointments: 0, pendingLabTests: 0 });
    const [user, setUser] = useState(null); // State to hold logged-in doctor's info

    useEffect(() => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Fetch Dashboard Stats
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/dashboard', config);
                setStats(response.data);
            } catch (error) { 
                console.error("Error fetching stats:", error); 
            }
        };

        // 2. Fetch User Profile Details
        const fetchUser = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/users/profile', config);
                setUser(res.data);
            } catch (error) {
                console.error("Error fetching profile", error);
            }
        };

        fetchStats();
        fetchUser();
    }, []);

    return (
        <div className="pb-10">
            {/* 1. Profile Banner (Welcome Section) */}
            <div className="mb-8 bg-gradient-to-r from-green-600 to-teal-500 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <FaUserCircle size={60} className="text-green-200" />
                    <div>
                        <h2 className="text-2xl font-extrabold">
                            Welcome back, {user ? user.fullName : 'Doctor'}
                        </h2>
                        <p className="text-green-100 text-sm mt-1">
                            Logged in as: <span className="font-bold text-white bg-green-700 px-2 py-0.5 rounded">{user ? user.role : '...'}</span>
                        </p>
                    </div>
                </div>
                
                {/* Button to go to Profile Page */}
                <Link 
                    to="/profile" 
                    className="bg-white text-green-700 px-5 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-md"
                >
                    View Full Profile
                </Link>
            </div>
            
            {/* 2. Statistics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                
                <Link to="/doctor/appointments" className="bg-green-600 text-white rounded-xl p-6 shadow-lg flex justify-between items-center hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-sm opacity-80 uppercase">My Appointments</p>
                        <h3 className="text-4xl font-bold mt-2">{stats.totalAppointments}</h3>
                    </div>
                    <FaCalendarCheck size={40} className="opacity-50" />
                </Link>

                <Link to="/doctor/lab-requests" className="bg-yellow-500 text-white rounded-xl p-6 shadow-lg flex justify-between items-center hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-sm opacity-80 uppercase">My Lab Requests</p>
                        <h3 className="text-4xl font-bold mt-2">{stats.pendingLabTests}</h3>
                    </div>
                    <FaFlask size={40} className="opacity-50" />
                </Link>

                <div className="bg-blue-600 text-white rounded-xl p-6 shadow-lg flex justify-between items-center">
                    <div>
                        <p className="text-sm opacity-80 uppercase">Total Patients</p>
                        <h3 className="text-4xl font-bold mt-2">{stats.totalPatients}</h3>
                    </div>
                    <FaUserInjured size={40} className="opacity-50" />
                </div>
                
            </div>
        </div>
    );
}

export default DoctorDashboard;