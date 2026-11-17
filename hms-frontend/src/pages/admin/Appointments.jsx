import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaCalendarCheck, 
    FaPlus, 
    FaSearch, 
    FaSync, 
    FaExclamationCircle, 
    FaUserInjured, 
    FaUserMd, 
    FaClock, 
    FaStethoscope, 
    FaSpinner 
} from 'react-icons/fa';
import AddAppointmentModal from '../../components/admin/AddAppointmentModal';

function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchAppointments = async () => {
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
            const response = await axios.get('http://localhost:8080/api/appointments', config);
            setAppointments(Array.isArray(response.data) ? response.data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            let msg = 'Failed to load appointments from the database.';
            if (!err.response) {
                msg = 'Backend server is unreachable at http://localhost:8080. Please ensure your Spring Boot application is running.';
            } else if (err.response.status === 403) {
                msg = 'Access Forbidden (403): You do not have permission to view appointments. Please re-login with an authorized account.';
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
        fetchAppointments();
    }, []);

    // Filter appointments by search query and status filter
    const filteredAppointments = appointments.filter((appt) => {
        const query = searchQuery.toLowerCase().trim();
        
        // Status filter check
        if (statusFilter !== 'ALL') {
            const apptStatus = (appt.status || '').toUpperCase();
            if (apptStatus !== statusFilter) return false;
        }

        if (!query) return true;

        const patientName = appt.patient ? `${appt.patient.firstName || ''} ${appt.patient.lastName || ''}`.toLowerCase() : '';
        const patientNic = appt.patient?.nic?.toLowerCase() || '';
        const doctorName = appt.doctor ? `${appt.doctor.firstName || ''} ${appt.doctor.lastName || ''}`.toLowerCase() : '';
        const doctorSpec = appt.doctor?.specialization?.toLowerCase() || '';
        const reason = (appt.reason || '').toLowerCase();
        const status = (appt.status || '').toLowerCase();
        const idStr = String(appt.id);

        return patientName.includes(query) || 
               patientNic.includes(query) || 
               doctorName.includes(query) || 
               doctorSpec.includes(query) || 
               reason.includes(query) || 
               status.includes(query) || 
               idStr.includes(query);
    });

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        if (s === 'SCHEDULED' || s === 'BOOKED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    SCHEDULED
                </span>
            );
        } else if (s === 'CONFIRMED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    CONFIRMED
                </span>
            );
        } else if (s === 'CHECKED_IN') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    CHECKED IN
                </span>
            );
        } else if (s === 'IN_PROGRESS') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    IN PROGRESS
                </span>
            );
        } else if (s === 'COMPLETED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    COMPLETED
                </span>
            );
        } else if (s === 'CANCELLED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    CANCELLED
                </span>
            );
        } else if (s === 'NO_SHOW') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    NO SHOW
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    {status || 'SCHEDULED'}
                </span>
            );
        }
    };

    const handleCheckIn = async (id) => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.put(`http://localhost:8080/api/appointments/${id}/check-in`, {}, config);
            fetchAppointments();
        } catch (err) {
            console.error('Error checking in appointment:', err);
            alert('Failed to check in appointment.');
        }
    };

    const handleComplete = async (id) => {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.put(`http://localhost:8080/api/appointments/${id}/complete`, {}, config);
            alert('Appointment completed! Consultation fee has been automatically added to the patient\'s active Invoice.');
            fetchAppointments();
        } catch (err) {
            console.error('Error completing appointment:', err);
            alert('Failed to complete appointment.');
        }
    };

    // Calculate status counts
    const bookedCount = appointments.filter(a => (a.status || '').toUpperCase() === 'BOOKED').length;
    const completedCount = appointments.filter(a => (a.status || '').toUpperCase() === 'COMPLETED').length;
    const cancelledCount = appointments.filter(a => (a.status || '').toUpperCase() === 'CANCELLED').length;

    return (
        <div>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaCalendarCheck className="text-blue-600"/> Appointment Management
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        View, schedule, and track patient consultations. Total: <span className="font-semibold text-blue-600">{appointments.length}</span>
                    </p>
                </div>
                
                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={fetchAppointments}
                        title="Refresh Appointments"
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                    >
                        <FaSync size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition"
                    >
                        <FaPlus size={12} /> Book Appointment
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
                            onClick={fetchAppointments}
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

            {/* Search and Filters Bar */}
            <div className="mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search appointments by patient, doctor, reason, status, or ID..."
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-1.5 py-0.5"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Status Filter Badges */}
                <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
                    <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                            statusFilter === 'ALL'
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        All ({appointments.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('BOOKED')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                            statusFilter === 'BOOKED'
                                ? 'bg-white text-emerald-600 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Booked ({bookedCount})
                    </button>
                    <button
                        onClick={() => setStatusFilter('COMPLETED')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                            statusFilter === 'COMPLETED'
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Completed ({completedCount})
                    </button>
                    <button
                        onClick={() => setStatusFilter('CANCELLED')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                            statusFilter === 'CANCELLED'
                                ? 'bg-white text-rose-600 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Cancelled ({cancelledCount})
                    </button>
                </div>
            </div>

            {/* Appointments Table Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Appt ID</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Patient</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Doctor</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Date & Time</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Reason / Notes</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-gray-500">
                                        <FaSpinner className="animate-spin inline mr-2 text-blue-600" size={24} />
                                        Loading appointment records...
                                    </td>
                                </tr>
                            ) : filteredAppointments.length > 0 ? (
                                filteredAppointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-blue-50/40 transition duration-150">
                                        <td className="p-4 text-sm font-semibold text-gray-700">
                                            #{appt.id}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                                                    <FaUserInjured size={13} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {appt.patient 
                                                            ? `${appt.patient.firstName || ''} ${appt.patient.lastName || ''}`.trim() 
                                                            : 'Unassigned Patient'}
                                                    </div>
                                                    {appt.patient?.nic && (
                                                        <div className="text-xs text-gray-400">
                                                            NIC: {appt.patient.nic}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                                                    <FaUserMd size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {appt.doctor 
                                                            ? `Dr. ${appt.doctor.firstName || ''} ${appt.doctor.lastName || ''}`.trim() 
                                                            : 'Unassigned Doctor'}
                                                    </div>
                                                    {appt.doctor?.specialization && (
                                                        <span className="inline-block text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5 border border-emerald-100">
                                                            {appt.doctor.specialization}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <FaClock className="text-gray-400 flex-shrink-0" size={13} />
                                                <span className="font-medium">{formatDateTime(appt.appointmentDateTime)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(appt.status)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-start gap-2 max-w-xs text-sm text-gray-600">
                                                <FaStethoscope className="text-blue-500 mt-0.5 flex-shrink-0" size={13} />
                                                <span className="line-clamp-2" title={appt.reason || 'No consultation notes'}>
                                                    {appt.reason || 'Routine consultation'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {((appt.status || '').toUpperCase() === 'SCHEDULED' || (appt.status || '').toUpperCase() === 'BOOKED' || (appt.status || '').toUpperCase() === 'CONFIRMED') && (
                                                    <button
                                                        onClick={() => handleCheckIn(appt.id)}
                                                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                                        title="Check In Patient"
                                                    >
                                                        Check In
                                                    </button>
                                                )}
                                                {(appt.status || '').toUpperCase() === 'CHECKED_IN' && (
                                                    <button
                                                        onClick={() => handleComplete(appt.id)}
                                                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                                        title="Complete Consultation & Auto-Bill"
                                                    >
                                                        Complete & Bill
                                                    </button>
                                                )}
                                                {(appt.status || '').toUpperCase() === 'COMPLETED' && (
                                                    <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                                        Billed
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <FaCalendarCheck size={44} className="mb-3 text-gray-300" />
                                            <p className="text-base font-semibold text-gray-700">
                                                {searchQuery || statusFilter !== 'ALL' 
                                                    ? 'No matching appointments found' 
                                                    : 'No appointments scheduled in the database yet'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 max-w-sm">
                                                {searchQuery || statusFilter !== 'ALL'
                                                    ? 'Try adjusting your search terms or filter selection to find what you are looking for.'
                                                    : 'Click the "Book Appointment" button above to schedule your first patient visit.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <AddAppointmentModal 
                    onClose={() => setShowModal(false)} 
                    onAppointmentAdded={fetchAppointments} 
                />
            )}
        </div>
    );
}

export default Appointments;
