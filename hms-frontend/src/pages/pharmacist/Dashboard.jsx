import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaPrescription, FaPills, FaUserCircle } from 'react-icons/fa';

function PharmacistDashboard() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const fetchUser = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/users/profile', config);
                setUser(res.data);
            } catch (error) { console.error(error); }
        };
        fetchUser();
    }, []);

    return (
        <div className="pb-10">
            {/* Profile Banner */}
            <div className="mb-8 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <FaUserCircle size={60} className="text-orange-200" />
                    <div>
                        <h2 className="text-2xl font-extrabold">
                            Welcome, {user ? user.fullName : 'Pharmacist'}
                        </h2>
                        <p className="text-orange-100 text-sm mt-1">
                            Logged in as: <span className="font-bold text-white bg-orange-700 px-2 py-0.5 rounded">{user ? user.role : '...'}</span>
                        </p>
                    </div>
                </div>
                <Link to="/profile" className="bg-white text-orange-600 px-5 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-md">
                    View Full Profile
                </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <Link to="/pharmacist/prescriptions" className="bg-teal-600 text-white rounded-xl p-6 shadow-lg flex justify-between items-center hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-sm opacity-80 uppercase">Process Prescriptions</p>
                        <h3 className="text-2xl font-bold mt-2">Dispense Medicines</h3>
                        <p className="text-xs text-teal-100 mt-1">Review active prescriptions & dispense with FEFO batch deduction</p>
                    </div>
                    <FaPrescription size={50} className="opacity-50" />
                </Link>
                <Link to="/pharmacist/batches" className="bg-blue-600 text-white rounded-xl p-6 shadow-lg flex justify-between items-center hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-sm opacity-80 uppercase">Inventory & Batches</p>
                        <h3 className="text-2xl font-bold mt-2">Manage Batches</h3>
                        <p className="text-xs text-blue-100 mt-1">Check stock levels, batch numbers & earliest expiry dates</p>
                    </div>
                    <FaPills size={50} className="opacity-50" />
                </Link>
            </div>
        </div>
    );
}
export default PharmacistDashboard;