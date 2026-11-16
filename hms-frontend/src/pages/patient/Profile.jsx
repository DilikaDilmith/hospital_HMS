import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaIdCard, FaBirthdayCake, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

function PatientProfile() {
    const [user, setUser] = useState(null);
    const [patient, setPatient] = useState(null);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchProfile = async () => {
            // 1. Get User Data
            const userRes = await axios.get('http://localhost:8080/api/users/profile', config);
            setUser(userRes.data);

            // 2. Get Patient Data (Match by name)
            const patRes = await axios.get('http://localhost:8080/api/patients', config);
            const currentPatient = patRes.data.find(p => 
                `${p.firstName} ${p.lastName}` === userRes.data.fullName
            );
            if (currentPatient) setPatient(currentPatient);
        };
        fetchProfile();
    }, []);

    if (!user) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-cyan-600 h-32"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-center md:justify-start -mt-12 mb-4">
                        <div className="bg-white p-2 rounded-full">
                            <FaUser className="text-gray-300" size={80} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{user.fullName}</h3>
                    <p className="text-cyan-600 font-semibold flex items-center gap-2 mt-1">
                        Patient
                    </p>
                    
                    {patient ? (
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <FaIdCard className="text-gray-400" />
                                <div><p className="text-xs text-gray-500">NIC</p><p className="text-gray-800 font-medium">{patient.nic}</p></div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <FaBirthdayCake className="text-gray-400" />
                                <div><p className="text-xs text-gray-500">Date of Birth</p><p className="text-gray-800 font-medium">{patient.dateOfBirth}</p></div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <FaPhone className="text-gray-400" />
                                <div><p className="text-xs text-gray-500">Phone</p><p className="text-gray-800 font-medium">{patient.phoneNumber}</p></div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3 md:col-span-2">
                                <FaMapMarkerAlt className="text-gray-400" />
                                <div><p className="text-xs text-gray-500">Address</p><p className="text-gray-800 font-medium">{patient.address}</p></div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 bg-yellow-50 text-yellow-700 p-4 rounded-lg">
                            Your detailed medical profile (NIC, DOB, etc.) has not been created by the reception yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default PatientProfile;
