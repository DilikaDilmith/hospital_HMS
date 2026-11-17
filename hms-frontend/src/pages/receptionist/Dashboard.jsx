import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaCalendarPlus, FaMoneyBill, FaUserCircle, FaBed } from 'react-icons/fa';

function ReceptionistDashboard() {
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
            <div className="mb-8 bg-gradient-to-r from-pink-600 to-rose-500 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <FaUserCircle size={60} className="text-pink-200" />
                    <div>
                        <h2 className="text-2xl font-extrabold">
                            Welcome, {user ? user.fullName : 'Receptionist'}
                        </h2>
                        <p className="text-pink-100 text-sm mt-1">
                            Logged in as: <span className="font-bold text-white bg-pink-700 px-2 py-0.5 rounded">{user ? user.role : '...'}</span>
                        </p>
                    </div>
                </div>
                <Link to="/profile" className="bg-white text-pink-600 px-5 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-md">
                    View Full Profile
                </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <Link to="/receptionist/patients" className="bg-blue-600 text-white rounded-xl p-6 shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all h-40">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold">Register Patient</h3>
                        <FaUserPlus size={30} className="opacity-70" />
                    </div>
                    <p className="text-sm opacity-90 mt-4">Add new patients to the system.</p>
                </Link>

                <Link to="/receptionist/appointments" className="bg-green-600 text-white rounded-xl p-6 shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all h-40">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold">Book Appointment</h3>
                        <FaCalendarPlus size={30} className="opacity-70" />
                    </div>
                    <p className="text-sm opacity-90 mt-4">Schedule a doctor consultation.</p>
                </Link>

                <Link to="/receptionist/billing" className="bg-red-500 text-white rounded-xl p-6 shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all h-40">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold">Billing & Invoices</h3>
                        <FaMoneyBill size={30} className="opacity-70" />
                    </div>
                    <p className="text-sm opacity-90 mt-4">Generate invoices and record payments.</p>
                </Link>

                <Link to="/receptionist/inpatient" className="bg-purple-600 text-white rounded-xl p-6 shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all h-40">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold">Inpatient & Beds</h3>
                        <FaBed size={30} className="opacity-70" />
                    </div>
                    <p className="text-sm opacity-90 mt-4">Admit patients & check bed availability.</p>
                </Link>
            </div>
        </div>
    );
}
export default ReceptionistDashboard;