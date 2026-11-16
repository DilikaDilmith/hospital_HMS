import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaFlask, FaVial } from 'react-icons/fa';

function LabStaffDashboard() {
    const [stats, setStats] = useState({ pendingLabTests: 0, totalPatients: 0 });

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
                <h2 className="text-3xl font-extrabold text-gray-800">Laboratory Dashboard</h2>
                <p className="text-gray-500 mt-1">Welcome to the lab. Here is your workload for today.</p>
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