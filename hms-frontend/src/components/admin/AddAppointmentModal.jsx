import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaCalendarPlus, 
    FaTimes, 
    FaUserInjured, 
    FaUserMd, 
    FaClock, 
    FaStethoscope, 
    FaSpinner, 
    FaExclamationCircle,
    FaCheckCircle
} from 'react-icons/fa';

function AddAppointmentModal({ onClose, onAppointmentAdded }) {
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [appointmentData, setAppointmentData] = useState({
        patientId: '',
        doctorId: '',
        appointmentDateTime: '',
        reason: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            const currentToken = localStorage.getItem('token');
            const authConfig = { headers: { Authorization: `Bearer ${currentToken}` } };
            try {
                const [pRes, dRes] = await Promise.all([
                    axios.get('http://localhost:8080/api/patients', authConfig),
                    axios.get('http://localhost:8080/api/doctors', authConfig)
                ]);
                setPatients(Array.isArray(pRes.data) ? pRes.data : []);
                setDoctors(Array.isArray(dRes.data) ? dRes.data : []);
                setIsLoadingData(false);
            } catch (err) {
                console.error("Error fetching data for appointment modal:", err);
                setIsLoadingData(false);
                setError("Failed to load patients or doctors from backend. Please ensure the backend is running.");
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setAppointmentData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!appointmentData.patientId) {
            setError('Please select a patient.');
            return;
        }

        if (!appointmentData.doctorId) {
            setError('Please select a doctor.');
            return;
        }

        if (!appointmentData.appointmentDateTime) {
            setError('Please select appointment date and time.');
            return;
        }

        if (!appointmentData.reason.trim()) {
            setError('Please enter a reason for the consultation.');
            return;
        }

        setIsSubmitting(true);
        const currentToken = localStorage.getItem('token');
        const authConfig = { headers: { Authorization: `Bearer ${currentToken}` } };

        try {
            const payload = {
                appointmentDateTime: appointmentData.appointmentDateTime,
                status: 'SCHEDULED',
                reason: appointmentData.reason.trim(),
                patient: { id: parseInt(appointmentData.patientId, 10) },
                doctor: { id: parseInt(appointmentData.doctorId, 10) }
            };

            await axios.post('http://localhost:8080/api/appointments', payload, authConfig);
            setIsSubmitting(false);
            onAppointmentAdded();
            onClose();
        } catch (err) {
            setIsSubmitting(false);
            console.error("Error adding appointment:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to book appointment. Please check details and try again.';
            setError(msg);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <FaCalendarPlus className="text-blue-600" /> Book New Appointment
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Schedule a clinical consultation for a patient</p>
                    </div>
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                        <FaExclamationCircle className="mt-0.5 flex-shrink-0 text-red-500" />
                        <div>{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6">
                    {isLoadingData ? (
                        <div className="py-12 text-center text-gray-500">
                            <FaSpinner className="animate-spin inline mr-2 text-blue-600" size={24} />
                            Loading patient & doctor directories...
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Patient & Doctor Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Select Patient */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <FaUserInjured className="text-blue-600" /> Select Patient *
                                    </label>
                                    <select
                                        name="patientId"
                                        value={appointmentData.patientId}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                                    >
                                        <option value="">-- Choose Patient --</option>
                                        {patients.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.firstName} {p.lastName} {p.nic ? `(NIC: ${p.nic})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {patients.length === 0 && (
                                        <p className="text-[11px] text-amber-600 mt-1">
                                            No patients found. Please register a patient first.
                                        </p>
                                    )}
                                </div>

                                {/* Select Doctor */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <FaUserMd className="text-blue-600" /> Select Doctor *
                                    </label>
                                    <select
                                        name="doctorId"
                                        value={appointmentData.doctorId}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                                    >
                                        <option value="">-- Choose Doctor --</option>
                                        {doctors.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                Dr. {d.firstName} {d.lastName} ({d.specialization || 'General'})
                                            </option>
                                        ))}
                                    </select>
                                    {doctors.length === 0 && (
                                        <p className="text-[11px] text-amber-600 mt-1">
                                            No active doctors found in system.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <FaClock className="text-blue-600" /> Date & Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="appointmentDateTime"
                                        value={appointmentData.appointmentDateTime}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <FaCheckCircle className="text-emerald-600" /> Booking Status
                                    </label>
                                    <div className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-emerald-800 font-semibold flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        BOOKED (Confirmed Consultation)
                                    </div>
                                </div>
                            </div>

                            {/* Reason for Visit */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <FaStethoscope className="text-blue-600" /> Reason for Consultation *
                                </label>
                                <textarea
                                    name="reason"
                                    value={appointmentData.reason}
                                    onChange={handleChange}
                                    placeholder="e.g. Routine general checkup, persistent fever & cough, blood pressure follow-up..."
                                    rows={3}
                                    required
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-2xs resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoadingData}
                            className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <FaSpinner className="animate-spin" size={14} /> Scheduling...
                                </>
                            ) : (
                                'Confirm Appointment'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddAppointmentModal;
