import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaCalendarPlus, FaNotesMedical, FaFlask, FaUserCircle } from 'react-icons/fa';

function PatientDashboard() {
    const [user, setUser] = useState(null);

    // Fetch the logged-in user's profile details
    useEffect(() => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const fetchUser = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/users/profile', config);
                setUser(res.data);
            } catch (error) {
                console.error("Error fetching profile", error);
            }
        };
        fetchUser();
    }, []);

    return (
        <div className="pb-10">
            {/* 1. Profile Banner (Welcome Section) */}
            <div className="mb-8 bg-gradient-to-r from-cyan-600 to-blue-500 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <FaUserCircle size={60} className="text-cyan-200" />
                    <div>
                        <h2 className="text-2xl font-extrabold">
                            Welcome, {user ? user.fullName : 'Loading...'}
                        </h2>
                        <p className="text-cyan-100 text-sm mt-1">
                            You are logged in as a <span className="font-bold text-white">{user ? user.role : '...'}</span>
                        </p>
                    </div>
                </div>
                
                {/* Button to go to Profile Page */}
                <Link 
                    to="/profile" 
                    className="bg-white text-blue-600 px-5 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-md"
                >
                    View Full Profile
                </Link>
            </div>
            
            {/* 2. Quick Action Cards */}
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Book Appointment Card */}
                <Link to="/patient/book-appointment" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition group flex flex-col items-center text-center">
                    <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                        <FaCalendarPlus size={30} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Book Appointment</h3>
                    <p className="text-sm text-gray-500">Schedule a consultation with one of our expert doctors.</p>
                </Link>

                {/* View Medical Records Card */}
                <Link to="/patient/medical-records" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-green-500 hover:shadow-md transition group flex flex-col items-center text-center">
                    <div className="bg-green-100 text-green-600 p-4 rounded-full mb-4 group-hover:bg-green-600 group-hover:text-white transition">
                        <FaNotesMedical size={30} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Medical Records</h3>
                    <p className="text-sm text-gray-500">View your past diagnoses and prescribed medications.</p>
                </Link>

                {/* View Lab Results Card */}
                <Link to="/patient/lab-results" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-yellow-500 hover:shadow-md transition group flex flex-col items-center text-center">
                    <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full mb-4 group-hover:bg-yellow-500 group-hover:text-white transition">
                        <FaFlask size={30} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Lab Results</h3>
                    <p className="text-sm text-gray-500">Check the results of your laboratory tests.</p>
                </Link>
            </div>
        </div>
    );
}

export default PatientDashboard;
