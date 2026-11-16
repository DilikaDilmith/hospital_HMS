import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaCalendarCheck, FaFlask, FaUserInjured } from 'react-icons/fa';

function DoctorDashboard() {
    const [stats, setStats] = useState({ totalPatients: 0, totalAppointments: 0, pendingLabTests: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await axios.get('http://localhost:8080/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
                setStats(response.data);
            } catch (error) { console.error(error); }
        };
        fetchStats();
    }, []);

    return (
        <div className="pb-10">
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800">Doctor Dashboard</h2>
                <p className="text-gray-500 mt-1">Here is your clinical overview for today.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Link to="/doctor/appointments" className="bg-green-600 text-white rounded-xl p-6 shadow-lg flex justify-between items-center hover:-translate-y-1 transition-all">
                    <div><p className="text-sm opacity-80 uppercase">My Appointments</p><h3 className="text-4xl font-bold mt-2">{stats.totalAppointments}</h3></div>
                    <FaCalendarCheck size={40} className="opacity-50" />
                </Link>
                <Link to="/doctor/lab-requests" className="bg-yellow-500 text-white rounded-xl p-6 shadow-lg flex justify-between items-center hover:-translate-y-1 transition-all">
                    <div><p className="text-sm opacity-80 uppercase">My Lab Requests</p><h3 className="text-4xl font-bold mt-2">{stats.pendingLabTests}</h3></div>
                    <FaFlask size={40} className="opacity-50" />
                </Link>
                <div className="bg-blue-600 text-white rounded-xl p-6 shadow-lg flex justify-between items-center">
                    <div><p className="text-sm opacity-80 uppercase">Total Patients</p><h3 className="text-4xl font-bold mt-2">{stats.totalPatients}</h3></div>
                    <FaUserInjured size={40} className="opacity-50" />
                </div>
            </div>
        </div>
    );
}
export default DoctorDashboard;