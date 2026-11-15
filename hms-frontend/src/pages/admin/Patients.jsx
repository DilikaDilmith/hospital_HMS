import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaUserInjured } from 'react-icons/fa';
import AddPatientModal from '../../components/admin/AddPatientModal';

function Patients() {
    const [patients, setPatients] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchPatients = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/patients', config);
            setPatients(response.data);
        } catch (error) {
            console.error("Error fetching patients:", error);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaUserInjured className="text-blue-600"/> Patient Management
                </h2>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <FaPlus /> Add Patient
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">ID</th>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">NIC</th>
                            <th className="p-4 font-semibold text-gray-600">DOB</th>
                            <th className="p-4 font-semibold text-gray-600">Gender</th>
                            <th className="p-4 font-semibold text-gray-600">Phone</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.length > 0 ? (
                            patients.map((patient) => (
                                <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-4 text-gray-700">#{patient.id}</td>
                                    <td className="p-4 text-gray-800 font-medium">{patient.firstName} {patient.lastName}</td>
                                    <td className="p-4 text-gray-600">{patient.nic}</td>
                                    <td className="p-4 text-gray-600">{patient.dateOfBirth}</td>
                                    <td className="p-4 text-gray-600">{patient.gender}</td>
                                    <td className="p-4 text-gray-600">{patient.phoneNumber}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    No patients found. Click "Add Patient" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <AddPatientModal 
                    onClose={() => setShowModal(false)} 
                    onPatientAdded={fetchPatients} 
                />
            )}
        </div>
    );
}

export default Patients;