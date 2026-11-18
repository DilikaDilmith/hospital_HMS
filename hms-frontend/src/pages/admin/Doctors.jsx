import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserMd, FaPlus, FaEdit, FaTrash, FaClock, FaCalendarAlt } from 'react-icons/fa';
import AddDoctorModal from '../../components/admin/AddDoctorModal';
import EditDoctorModal from '../../components/admin/EditDoctorModal';

function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDoctorForEdit, setSelectedDoctorForEdit] = useState(null);
    const [statusBanner, setStatusBanner] = useState({ type: '', message: '' });
    const [deletingId, setDeletingId] = useState(null);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchDoctors = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/doctors', config);
            setDoctors(response.data);
        } catch (error) {
            console.error("Error fetching doctors:", error);
            setStatusBanner({
                type: 'error',
                message: 'Failed to fetch doctor list. Please verify network connection.'
            });
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const formatDays = (daysStr) => {
        if (!daysStr) return 'Mon-Fri';
        const dayMap = {
            'MONDAY': 'Mon', 'TUESDAY': 'Tue', 'WEDNESDAY': 'Wed', 'THURSDAY': 'Thu',
            'FRIDAY': 'Fri', 'SATURDAY': 'Sat', 'SUNDAY': 'Sun'
        };
        const parts = daysStr.split(',').map(d => d.trim().toUpperCase());
        if (parts.length === 7) return 'All Days';
        if (parts.length === 5 && !parts.includes('SATURDAY') && !parts.includes('SUNDAY')) return 'Mon - Fri';
        return parts.map(p => dayMap[p] || p).join(', ');
    };

    const formatHours = (start, end) => {
        const s = start ? start.substring(0, 5) : '08:00';
        const e = end ? end.substring(0, 5) : '17:00';
        return `${s} - ${e}`;
    };

    const handleDeleteDoctor = async (doc) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete Dr. ${doc.firstName} ${doc.lastName}? This action cannot be undone.`
        );
        if (!confirmed) return;

        setDeletingId(doc.id);
        setStatusBanner({ type: '', message: '' });

        try {
            await axios.delete(`http://localhost:8080/api/doctors/${doc.id}`, config);
            setStatusBanner({
                type: 'success',
                message: `Dr. ${doc.firstName} ${doc.lastName} was deleted successfully.`
            });
            fetchDoctors();
        } catch (error) {
            console.error("Error deleting doctor:", error);
            const errMsg =
                (typeof error.response?.data === 'string' ? error.response.data : null) ||
                error.response?.data?.message ||
                "Failed to delete doctor.";
            setStatusBanner({
                type: 'error',
                message: errMsg
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUserMd className="text-blue-600"/> Doctor Management
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Manage doctor profiles, departments, consultation fees, and working hours.
                    </p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition shadow-sm"
                >
                    <FaPlus /> Add Doctor
                </button>
            </div>

            {statusBanner.message && (
                <div className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-between ${
                    statusBanner.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                    <span>{statusBanner.message}</span>
                    <button 
                        onClick={() => setStatusBanner({ type: '', message: '' })}
                        className="font-bold ml-2 hover:opacity-80"
                    >
                        &times;
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">ID</th>
                            <th className="p-4 font-semibold text-gray-600">Doctor Name</th>
                            <th className="p-4 font-semibold text-gray-600">Specialization</th>
                            <th className="p-4 font-semibold text-gray-600">Department</th>
                            <th className="p-4 font-semibold text-gray-600">Contact</th>
                            <th className="p-4 font-semibold text-gray-600">Fee (LKR)</th>
                            <th className="p-4 font-semibold text-gray-600">Availability</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.length > 0 ? (
                            doctors.map((doc) => (
                                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-4 text-gray-500 font-mono text-xs">#{doc.id}</td>
                                    <td className="p-4 text-gray-800 font-medium">
                                        Dr. {doc.firstName} {doc.lastName}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                                            {doc.specialization}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {doc.department ? doc.department.name : <span className="text-gray-400 italic">None</span>}
                                    </td>
                                    <td className="p-4 text-gray-600 text-xs">
                                        <div>{doc.phoneNumber}</div>
                                        {doc.email && <div className="text-gray-400">{doc.email}</div>}
                                    </td>
                                    <td className="p-4 text-gray-800 font-medium text-xs">
                                        LKR {doc.consultationFee ? doc.consultationFee.toFixed(2) : '1,500.00'}
                                    </td>
                                    <td className="p-4 text-gray-600 text-xs">
                                        <div className="flex items-center gap-1 font-medium text-gray-700">
                                            <FaCalendarAlt className="text-indigo-500" size={11} />
                                            <span>{formatDays(doc.availableDays)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                                            <FaClock className="text-gray-400" size={11} />
                                            <span>{formatHours(doc.availableTimeStart, doc.availableTimeEnd)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedDoctorForEdit(doc)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                                                title="Edit Doctor Details & Availability"
                                            >
                                                <FaEdit size={12} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDoctor(doc)}
                                                disabled={deletingId === doc.id}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                                                title="Delete Doctor"
                                            >
                                                <FaTrash size={12} />
                                                <span>{deletingId === doc.id ? 'Deleting...' : 'Delete'}</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="p-8 text-center text-gray-500">
                                    No doctors found. Click "Add Doctor" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Doctor Modal */}
            {showAddModal && (
                <AddDoctorModal 
                    onClose={() => setShowAddModal(false)} 
                    onDoctorAdded={() => {
                        fetchDoctors();
                        setStatusBanner({ type: 'success', message: 'Doctor registered successfully!' });
                    }} 
                />
            )}

            {/* Edit Doctor Modal */}
            {selectedDoctorForEdit && (
                <EditDoctorModal
                    doctor={selectedDoctorForEdit}
                    onClose={() => setSelectedDoctorForEdit(null)}
                    onDoctorUpdated={(updatedDoc) => {
                        fetchDoctors();
                        setStatusBanner({ 
                            type: 'success', 
                            message: `Dr. ${updatedDoc.firstName} ${updatedDoc.lastName}'s profile & availability updated successfully!` 
                        });
                    }}
                />
            )}
        </div>
    );
}

export default Doctors;
