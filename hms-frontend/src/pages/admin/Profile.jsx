import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserCircle, FaEnvelope, FaUserShield } from 'react-icons/fa';

function AdminProfile() {
    const [user, setUser] = useState(null);
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchProfile = async () => {
            const res = await axios.get('http://localhost:8080/api/users/profile', config);
            setUser(res.data);
        };
        fetchProfile();
    }, []);

    if (!user) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-blue-600 h-32"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-center md:justify-start -mt-12 mb-4">
                        <FaUserCircle className="text-gray-300 bg-white rounded-full" size={100} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{user.fullName}</h3>
                    <p className="text-blue-600 font-semibold flex items-center gap-2 mt-1">
                        <FaUserShield /> System Administrator
                    </p>
                    
                    <div className="mt-8 bg-gray-50 p-6 rounded-xl">
                        <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">Account Details</h4>
                        <div className="flex items-center gap-4 mb-3">
                            <FaEnvelope className="text-blue-500" />
                            <span className="text-gray-700"><b>Username:</b> {user.username}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <FaUserShield className="text-green-500" />
                            <span className="text-gray-700"><b>Status:</b> {user.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default AdminProfile;