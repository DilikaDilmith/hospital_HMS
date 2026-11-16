import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaFlask, FaVial, FaUserCircle } from 'react-icons/fa';

function LabStaffDashboard() {
    const [stats, setStats] = useState({ pendingLabTests: 0, totalPatients: 0 });
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/dashboard', config);
                setStats(response.data);
            } catch (error) { console.error(error); }
        };

        const fetchUser = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/users/profile', config);
                setUser(res.data);
            } catch (error) { console.error(error); }
        };

        fetchStats();
        fetchUser();
    }, []);

    return (
        <div className="pb-10">
            {/* Profile Banner */}
            <div className="mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <FaUserCircle size={60} className="text-purple-200" />
                    <div>
                        <h2 className="text-2xl font-extrabold">
                            Welcome, {user ? user.fullName : 'Lab Staff'}
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">
                            Logged in as: <span className="font-bold text-white bg-purple-700 px-2 py-0.5 rounded">{user ? user.role : '...'}</span>
                        </p>
                    </div>
                </div>
                <Link to="/profile" className="bg-white text-purple-700 px-5 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-md">
                    View Full Profile
                </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <Link to="/lab/tests" className="bg-yellow-500 text-white rounded-xl p-6 shadow-lg flex justify-between items-center hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-sm opacity-80 uppercase">Pending Lab Tests</p>
                        <h3 className="text-5xl font-bold mt-2">{stats.pendingLabTests}</h3>
                        <p className="text-sm mt-2 opacity-90">Click here to process results</p>
                    </div>
                    <FaFlask size={50} className="opacity-50" />
                </Link>
                <div className="bg-blue-600 text-white rounded-xl p-6 shadow-lg flex justify-between items-center">
                    <div>
                        <p className="text-sm opacity-80 uppercase">Total Patients</p>
                        <h3 className="text-5xl font-bold mt-2">{stats.totalPatients}</h3>
                    </div>
                    <FaVial size={50} className="opacity-50" />
                </div>
            </div>
        </div>
    );
}
export default LabStaffDashboard;