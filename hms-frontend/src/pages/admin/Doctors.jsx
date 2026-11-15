import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserMd, FaPlus } from 'react-icons/fa';
import AddDoctorModal from '../../components/admin/AddDoctorModal';

function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchDoctors = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/doctors', config);
            setDoctors(response.data);
        } catch (error) {
            console.error("Error fetching doctors:", error);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaUserMd className="text-blue-600"/> Doctor Management
                </h2>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <FaPlus /> Add Doctor
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">ID</th>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Specialization</th>
                            <th className="p-4 font-semibold text-gray-600">Phone</th>
                            <th className="p-4 font-semibold text-gray-600">Department</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.length > 0 ? (
                            doctors.map((doc) => (
                                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-4 text-gray-700">#{doc.id}</td>
                                    <td className="p-4 text-gray-800 font-medium">Dr. {doc.firstName} {doc.lastName}</td>
                                    <td className="p-4 text-gray-600">{doc.specialization}</td>
                                    <td className="p-4 text-gray-600">{doc.phoneNumber}</td>
                                    <td className="p-4 text-gray-600">{doc.department ? doc.department.name : 'N/A'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500">
                                    No doctors found. Click "Add Doctor" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <AddDoctorModal 
                    onClose={() => setShowModal(false)} 
                    onDoctorAdded={fetchDoctors} 
                />
            )}
        </div>
    );
}

export default Doctors;