import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarCheck, FaNotesMedical, FaFlask, FaUserShield, FaSearch, FaFilter, FaCheckCircle, FaClock, FaFolderOpen } from 'react-icons/fa';
import AddEMRModal from '../../components/doctor/AddEMRModal';
import AddLabTestModal from './AddLabTestModal';
import PatientDocumentsModal from '../../components/admin/PatientDocumentsModal';

function DoctorAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedPatientForDocs, setSelectedPatientForDocs] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    
    // Modals state
    const [showEMRModal, setShowEMRModal] = useState(false);
    const [showLabModal, setShowLabModal] = useState(false);
    const [toast, setToast] = useState({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            // Priority endpoint: /api/appointments/doctor/my (enforces doctor data isolation)
            let response;
            try {
                response = await axios.get('http://localhost:8080/api/appointments/doctor/my', config);
            } catch (err) {
                // Fallback to /api/appointments (backend automatically restricts doctors to their own)
                response = await axios.get('http://localhost:8080/api/appointments', config);
            }
            setAppointments(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching doctor appointments:", error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleOpenEMR = (appointment) => {
        setSelectedAppointment(appointment);
        setShowEMRModal(true);
    };

    const handleOpenLabTest = (appointment) => {
        setSelectedAppointment(appointment);
        setShowLabModal(true);
    };

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        setUpdatingId(appointmentId);
        try {
            await axios.put(`http://localhost:8080/api/appointments/${appointmentId}/status`, {
                status: newStatus
            }, config);
            await fetchAppointments();
        } catch (error) {
            console.error("Failed to update status:", error);
            alert(error.response?.data || "Failed to update appointment status.");
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Confirmed</span>;
            case 'CHECKED_IN':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">Checked In</span>;
            case 'IN_PROGRESS':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">In Consultation</span>;
            case 'COMPLETED':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">Completed</span>;
            case 'CANCELLED':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Cancelled</span>;
            default:
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Scheduled</span>;
        }
    };

    const filteredAppointments = appointments.filter(appt => {
        const patientName = appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}`.toLowerCase() : '';
        const reason = (appt.reason || '').toLowerCase();
        const matchesSearch = patientName.includes(searchTerm.toLowerCase()) || 
                              reason.includes(searchTerm.toLowerCase()) || 
                              String(appt.id).includes(searchTerm);
        const matchesStatus = statusFilter === 'ALL' || appt.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaCalendarCheck className="text-blue-600"/> My Appointments
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Manage consultations, electronic medical records, and diagnostic tests</p>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold shadow-sm">
                    <FaUserShield className="text-emerald-600" />
                    <span>Doctor Privacy Isolation: Showing Only Your Booked Patients</span>
                </div>
            </div>

            {/* Notification Toast */}
            {toast.text && (
                <div className={`p-4 rounded-2xl flex justify-between items-center text-xs sm:text-sm shadow-sm border animate-in fade-in duration-200 ${
                    toast.type === 'error' 
                        ? 'bg-rose-50 text-rose-800 border-rose-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                    <div className="flex items-center gap-2.5">
                        <FaCheckCircle className="text-emerald-500 text-base flex-shrink-0" />
                        <span className="font-semibold">{toast.text}</span>
                    </div>
                    <button 
                        onClick={() => setToast({ type: '', text: '' })} 
                        className="font-bold text-gray-400 hover:text-gray-700 text-base leading-none p-1"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="relative w-full sm:w-72">
                    <FaSearch className="absolute left-3.5 top-3 text-gray-400 text-xs" />
                    <input
                        type="text"
                        placeholder="Search by patient name, reason, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <FaFilter className="text-gray-400 text-xs" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="CHECKED_IN">Checked In</option>
                        <option value="IN_PROGRESS">In Consultation</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">ID</th>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Patient</th>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Date & Time</th>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Reason</th>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                                            <FaClock className="animate-spin text-blue-600" /> Loading your schedule...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAppointments.length > 0 ? (
                                filteredAppointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-gray-50/80 transition">
                                        <td className="p-4 text-xs font-bold text-gray-600">#{appt.id}</td>
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-900 text-sm">
                                                {appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : 'Walk-in / Unregistered'}
                                            </div>
                                            {appt.patient?.phoneNumber && (
                                                <div className="text-xs text-gray-500">{appt.patient.phoneNumber}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-gray-600 font-medium">
                                            {new Date(appt.appointmentDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            <div className="text-gray-400">
                                                {new Date(appt.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(appt.status)}
                                        </td>
                                        <td className="p-4 text-xs text-gray-600 max-w-xs truncate">
                                            {appt.reason || 'General Consultation'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                                                    <select
                                                        disabled={updatingId === appt.id}
                                                        value={appt.status || 'SCHEDULED'}
                                                        onChange={(e) => handleStatusUpdate(appt.id, e.target.value)}
                                                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-700 focus:outline-none"
                                                    >
                                                        <option value="SCHEDULED">Scheduled</option>
                                                        <option value="CONFIRMED">Confirmed</option>
                                                        <option value="CHECKED_IN">Checked In</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="COMPLETED">Completed</option>
                                                        <option value="CANCELLED">Cancelled</option>
                                                    </select>
                                                )}

                                                {/* Add EMR Record Button */}
                                                <button 
                                                    onClick={() => handleOpenEMR(appt)}
                                                    className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition text-xs font-semibold border border-blue-200 hover:border-blue-600 shadow-sm"
                                                    title="Add Electronic Medical Record"
                                                >
                                                    <FaNotesMedical /> EMR
                                                </button>
                                                
                                                {/* Request Lab Test Button */}
                                                <button 
                                                    onClick={() => handleOpenLabTest(appt)}
                                                    className="bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition text-xs font-semibold border border-amber-200 hover:border-amber-600 shadow-sm"
                                                    title="Order Diagnostic Lab Test"
                                                >
                                                    <FaFlask /> Lab Test
                                                </button>

                                                {/* Patient Medical Documents Modal Button */}
                                                {appt.patient && (
                                                    <button 
                                                        onClick={() => setSelectedPatientForDocs(appt.patient)}
                                                        className="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition text-xs font-semibold border border-purple-200 hover:border-purple-600 shadow-sm"
                                                        title="View & Upload Patient Medical Documents"
                                                    >
                                                        <FaFolderOpen /> Docs
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-gray-500">
                                        <FaCalendarCheck className="mx-auto text-3xl text-gray-300 mb-2" />
                                        <p className="font-semibold text-gray-700 text-sm">No appointments found</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {searchTerm || statusFilter !== 'ALL'
                                                ? 'Try clearing your search or status filter.'
                                                : 'You currently have no patient appointments booked under your profile.'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showEMRModal && selectedAppointment && (
                <AddEMRModal 
                    appointment={selectedAppointment}
                    onClose={() => setShowEMRModal(false)} 
                    onRecordAdded={() => {
                        const patName = selectedAppointment.patient ? `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}` : 'patient';
                        setToast({ type: 'success', text: `Medical record (EMR) successfully saved for ${patName}!` });
                        fetchAppointments();
                    }} 
                />
            )}

            {showLabModal && selectedAppointment && (
                <AddLabTestModal 
                    appointment={selectedAppointment}
                    onClose={() => setShowLabModal(false)} 
                    onTestRequested={() => {
                        const patName = selectedAppointment.patient ? `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}` : 'patient';
                        setToast({ type: 'success', text: `Diagnostic laboratory test successfully ordered for ${patName}!` });
                        fetchAppointments();
                    }} 
                />
            )}

            {selectedPatientForDocs && (
                <PatientDocumentsModal 
                    patient={selectedPatientForDocs}
                    onClose={() => setSelectedPatientForDocs(null)}
                />
            )}
        </div>
    );
}

export default DoctorAppointments;
