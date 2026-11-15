import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBuilding, FaPlus } from 'react-icons/fa';
import AddDepartmentModal from '../../components/admin/AddDepartmentModal';

function Departments() {
    const [departments, setDepartments] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchDepartments = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/departments', config);
            setDepartments(response.data);
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaBuilding className="text-blue-600"/> Department Management
                </h2>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <FaPlus /> Add Department
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">ID</th>
                            <th className="p-4 font-semibold text-gray-600">Department Name</th>
                            <th className="p-4 font-semibold text-gray-600">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.length > 0 ? (
                            departments.map((dept) => (
                                <tr key={dept.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-4 text-gray-700">#{dept.id}</td>
                                    <td className="p-4 text-gray-800 font-medium">{dept.name}</td>
                                    <td className="p-4 text-gray-600">{dept.description}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="p-8 text-center text-gray-500">
                                    No departments found. Click "Add Department".
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <AddDepartmentModal 
                    onClose={() => setShowModal(false)} 
                    onDepartmentAdded={fetchDepartments} 
                />
            )}
        </div>
    );
}

export default Departments;