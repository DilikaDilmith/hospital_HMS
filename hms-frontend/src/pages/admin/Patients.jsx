import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaUserInjured, FaSearch, FaSpinner, FaExclamationCircle, FaSync, FaFolderOpen } from 'react-icons/fa';
import AddPatientModal from '../../components/admin/AddPatientModal';
import PatientDocumentsModal from '../../components/admin/PatientDocumentsModal';

function Patients() {
    const [patients, setPatients] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedPatientForDocs, setSelectedPatientForDocs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchPatients = async () => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication token not found. Please log in.');
            setLoading(false);
            return;
        }

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        try {
            const response = await axios.get('http://localhost:8080/api/patients', config);
            setPatients(Array.isArray(response.data) ? response.data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching patients:", err);
            let msg = 'Failed to load patients from the database.';
            if (!err.response) {
                msg = 'Backend server is unreachable at http://localhost:8080. Please start or restart your Spring Boot application.';
            } else if (err.response.status === 403) {
                msg = 'Access Forbidden (403): Receptionist authority is not active. Please restart the Spring Boot backend so the updated permissions take effect.';
            } else if (err.response.data?.message) {
                msg = err.response.data.message;
            } else if (typeof err.response.data === 'string') {
                msg = err.response.data;
            }
            setError(msg);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    // Filter patients by name, NIC, or phone
    const filteredPatients = patients.filter((p) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
        const nic = (p.nic || '').toLowerCase();
        const phone = (p.phoneNumber || '').toLowerCase();
        const address = (p.address || '').toLowerCase();
        return fullName.includes(query) || nic.includes(query) || phone.includes(query) || address.includes(query);
    });

    return (
        <div>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUserInjured className="text-blue-600"/> Patient Management
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        View, search, and register hospital patients. Total: <span className="font-semibold text-blue-600">{patients.length}</span>
                    </p>
                </div>
                
                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={fetchPatients}
                        title="Refresh List"
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                    >
                        <FaSync size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition"
                    >
                        <FaPlus size={12} /> Register Patient
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                        <FaExclamationCircle className="mt-0.5 text-red-500 flex-shrink-0" size={16} />
                        <div>
                            <span className="font-semibold">Error: </span> {error}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <button 
                            onClick={fetchPatients}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition"
                        >
                            Retry
                        </button>
                        <button 
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('role');
                                window.location.href = '/';
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition whitespace-nowrap"
                        >
                            Log Out & Log In
                        </button>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-4 relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients by name, NIC, phone number, or address..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Patients Table Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">ID</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Patient Name</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">NIC</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Age</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Date of Birth</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Gender</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Phone</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Address</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="p-12 text-center text-gray-500">
                                        <FaSpinner className="animate-spin inline mr-2 text-blue-600" size={20} />
                                        Loading patients from database...
                                    </td>
                                </tr>
                            ) : filteredPatients.length > 0 ? (
                                filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-blue-50/40 transition">
                                        <td className="p-4 text-xs font-bold text-gray-500">#{patient.id}</td>
                                        <td className="p-4 text-sm text-gray-900 font-semibold">
                                            {patient.firstName} {patient.lastName}
                                        </td>
                                        <td className="p-4 text-xs font-mono">
                                            {patient.nic ? (
                                                <span className="text-gray-700">{patient.nic}</span>
                                            ) : (
                                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                                                    No NIC
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs font-semibold text-gray-800">
                                            {patient.age !== null && patient.age !== undefined ? (
                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] font-bold">
                                                    {patient.age} yrs
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-gray-600">{patient.dateOfBirth || '-'}</td>
                                        <td className="p-4 text-xs">
                                            <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                                                patient.gender === 'Male' ? 'bg-blue-100 text-blue-800' :
                                                patient.gender === 'Female' ? 'bg-pink-100 text-pink-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {patient.gender}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-gray-700 font-medium">{patient.phoneNumber}</td>
                                        <td className="p-4 text-xs text-gray-500 max-w-xs truncate">{patient.address || '-'}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setSelectedPatientForDocs(patient)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                                                title="View & Upload Patient Documents"
                                            >
                                                <FaFolderOpen size={13} />
                                                <span>Documents</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="p-12 text-center text-gray-500">
                                        {searchQuery ? (
                                            <div>
                                                <p className="font-semibold text-gray-700">No matching patients found.</p>
                                                <p className="text-xs text-gray-400 mt-1">Try a different name, NIC, or phone query.</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <FaUserInjured className="mx-auto text-gray-300 mb-2" size={36} />
                                                <p className="font-semibold text-gray-700">No patients registered in the database yet.</p>
                                                <p className="text-xs text-gray-400 mt-1">Click the "Register Patient" button to add your first patient.</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Patient Modal */}
            {showModal && (
                <AddPatientModal 
                    onClose={() => setShowModal(false)} 
                    onPatientAdded={fetchPatients} 
                />
            )}

            {/* Patient Documents Modal */}
            {selectedPatientForDocs && (
                <PatientDocumentsModal
                    patient={selectedPatientForDocs}
                    onClose={() => setSelectedPatientForDocs(null)}
                />
            )}
        </div>
    );
}

export default Patients;
