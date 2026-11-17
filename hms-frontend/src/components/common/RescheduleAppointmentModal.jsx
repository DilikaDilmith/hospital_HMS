import { useState } from 'react';
import axios from 'axios';
import { FaTimes, FaCalendarAlt, FaUserMd, FaClock } from 'react-icons/fa';

function RescheduleAppointmentModal({ appointment, onClose, onRescheduled }) {
    const [newDateTime, setNewDateTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Format current date for min attribute (cannot reschedule to the past)
    const now = new Date();
    const currentIsoString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newDateTime) {
            setError('Please select a valid future date and time.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            let formattedTime = newDateTime;
            if (formattedTime.length === 16) {
                formattedTime += ':00';
            }

            const response = await axios.put(
                `http://localhost:8080/api/appointments/${appointment.id}/reschedule`,
                { appointmentDateTime: formattedTime },
                config
            );

            if (onRescheduled) {
                onRescheduled(response.data);
            }
            onClose();
        } catch (err) {
            console.error('Error rescheduling appointment:', err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to reschedule appointment.';
            setError(msg);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-cyan-200">
                            <FaCalendarAlt size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Reschedule Appointment</h3>
                            <p className="text-xs text-blue-200">Select a new date and time slot</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-sm">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    {/* Current Appointment Summary */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-500">Appointment ID:</span>
                            <span className="font-bold text-gray-800">#{appointment.id}</span>
                        </div>
                        {appointment.doctor && (
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-500">Doctor:</span>
                                <span className="font-semibold text-blue-700 flex items-center gap-1">
                                    <FaUserMd size={12} /> Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-500">Current Slot:</span>
                            <span className="text-gray-700 font-medium">
                                {new Date(appointment.appointmentDateTime).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* New Date & Time Picker */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FaClock className="text-indigo-600" /> New Date & Time *
                        </label>
                        <input
                            type="datetime-local"
                            min={currentIsoString}
                            value={newDateTime}
                            onChange={(e) => {
                                setNewDateTime(e.target.value);
                                if (error) setError('');
                            }}
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-gray-800 transition"
                        />
                        <span className="text-[11px] text-gray-400 mt-1 block">
                            Slot must be in the future and available for the assigned doctor.
                        </span>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newDateTime}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
                        >
                            {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RescheduleAppointmentModal;
