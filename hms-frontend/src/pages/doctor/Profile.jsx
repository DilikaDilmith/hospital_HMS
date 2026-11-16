import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserMd, FaEnvelope, FaPhone, FaStethoscope, FaBuilding } from 'react-icons/fa';

function DoctorProfile() {
    const [user, setUser] = useState(null);
    const [doctor, setDoctor] = useState(null);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchProfile = async () => {
            // 1. Get User Data
            const userRes = await axios.get('http://localhost:8080/api/users/profile', config);
            setUser(userRes.data);

            // 2. Get Doctor Data (Match by email or name)
            const docRes = await axios.get('http://localhost:8080/api/doctors', config);
            const currentDoctor = docRes.data.find(d => 
                d.email === userRes.data.username || 
                `${d.firstName} ${d.lastName}` === userRes.data.fullName
            );
            if (currentDoctor) setDoctor(currentDoctor);
        };
        fetchProfile();
    }, []);

    if (!user || !doctor) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-green-600 h-32"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-center md:justify-start -mt-12 mb-4">
                        <div className="bg-white p-2 rounded-full">
                            <FaUserMd className="text-gray-300" size={80} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Dr. {doctor.firstName} {doctor.lastName}</h3>
                    <p className="text-green-600 font-semibold flex items-center gap-2 mt-1">
                        <FaStethoscope /> {doctor.specialization}
                    </p>
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                            <FaEnvelope className="text-gray-400" />
                            <div><p className="text-xs text-gray-500">Email</p><p className="text-gray-800 font-medium">{doctor.email}</p></div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                            <FaPhone className="text-gray-400" />
                            <div><p className="text-xs text-gray-500">Phone</p><p className="text-gray-800 font-medium">{doctor.phoneNumber}</p></div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                            <FaBuilding className="text-gray-400" />
                            <div><p className="text-xs text-gray-500">Department</p><p className="text-gray-800 font-medium">{doctor.department ? doctor.department.name : 'N/A'}</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default DoctorProfile;