import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaCalendarPlus, FaNotesMedical, FaFlask, FaUserCircle, FaCalendarCheck, FaTimesCircle } from 'react-icons/fa';

function PatientDashboard() {
    const [user, setUser] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [cancelMsg, setCancelMsg] = useState('');
    const [cancelError, setCancelError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchAppointments = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/appointments/my', config);
            setAppointments(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoadingAppointments(false);
        }
    };

    // Fetch the logged-in user's profile details and appointments
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/users/profile', config);
                setUser(res.data);
            } catch (error) {
                console.error("Error fetching profile", error);
            }
        };
        fetchUser();
        fetchAppointments();
    }, []);

    const handleCancelAppointment = async (id) => {
        if (!window.confirm(`Are you sure you want to cancel appointment #${id}?`)) {
            return;
        }
        setCancelMsg('');
        setCancelError('');
        try {
            await axios.put(`http://localhost:8080/api/appointments/${id}/cancel`, {}, config);
            setCancelMsg(`Appointment #${id} has been cancelled successfully. Your time slot has been released.`);
            fetchAppointments();
        } catch (err) {
            console.error("Error cancelling appointment:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to cancel appointment.';
            setCancelError(msg);
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        if (s === 'SCHEDULED' || s === 'BOOKED') {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Scheduled</span>;
        }
        if (s === 'CONFIRMED') {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Confirmed</span>;
        }
        if (s === 'CHECKED_IN') {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Checked In</span>;
        }
        if (s === 'COMPLETED') {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">Completed</span>;
        }
        if (s === 'CANCELLED') {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">Cancelled</span>;
        }
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    };

    return (
        <div className="pb-10">
            {/* 1. Profile Banner (Welcome Section) */}
            <div className="mb-8 bg-gradient-to-r from-cyan-600 to-blue-500 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <FaUserCircle size={60} className="text-cyan-200" />
                    <div>
                        <h2 className="text-2xl font-extrabold">
                            Welcome, {user ? user.fullName : 'Loading...'}
                        </h2>
                        <p className="text-cyan-100 text-sm mt-1">
                            You are logged in as a <span className="font-bold text-white">{user ? user.role : '...'}</span>
                        </p>
                    </div>
                </div>
                
                {/* Button to go to Profile Page */}
                <Link 
                    to="/profile" 
                    className="bg-white text-blue-600 px-5 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-md"
                >
                    View Full Profile
                </Link>
            </div>

            {/* Notification Messages */}
            {cancelMsg && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex justify-between items-center">
                    <span>{cancelMsg}</span>
                    <button onClick={() => setCancelMsg('')} className="font-bold text-emerald-700 hover:text-emerald-900">&times;</button>
                </div>
            )}
            {cancelError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex justify-between items-center">
                    <span>{cancelError}</span>
                    <button onClick={() => setCancelError('')} className="font-bold text-rose-700 hover:text-rose-900">&times;</button>
                </div>
            )}
            
            {/* 2. Quick Action Cards */}
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                
                {/* Book Appointment Card */}
                <Link to="/patient/book-appointment" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition group flex flex-col items-center text-center">
                    <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                        <FaCalendarPlus size={30} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Book Appointment</h3>
                    <p className="text-sm text-gray-500">Schedule a consultation with one of our expert doctors.</p>
                </Link>

                {/* View Medical Records Card */}
                <Link to="/patient/medical-records" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-green-500 hover:shadow-md transition group flex flex-col items-center text-center">
                    <div className="bg-green-100 text-green-600 p-4 rounded-full mb-4 group-hover:bg-green-600 group-hover:text-white transition">
                        <FaNotesMedical size={30} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Medical Records</h3>
                    <p className="text-sm text-gray-500">View your past diagnoses and prescribed medications.</p>
                </Link>

                {/* View Lab Results Card */}
                <Link to="/patient/lab-results" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-yellow-500 hover:shadow-md transition group flex flex-col items-center text-center">
                    <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full mb-4 group-hover:bg-yellow-500 group-hover:text-white transition">
                        <FaFlask size={30} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Lab Results</h3>
                    <p className="text-sm text-gray-500">Check the results of your laboratory tests.</p>
                </Link>
            </div>

            {/* 3. My Appointments Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaCalendarCheck className="text-blue-600" /> My Consultations & Appointments
                    </h3>
                    <Link
                        to="/patient/book-appointment"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        + Book Another
                    </Link>
                </div>

                {loadingAppointments ? (
                    <div className="py-8 text-center text-gray-400 text-sm">Loading your consultations...</div>
                ) : appointments.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-sm">
                        You have no scheduled consultations yet. Use the "Book Appointment" button above to schedule your visit.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase bg-gray-50">
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Doctor</th>
                                    <th className="p-3">Date & Time</th>
                                    <th className="p-3">Reason / Notes</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((appt) => {
                                    const canCancel = (appt.status || '').toUpperCase() === 'SCHEDULED' || (appt.status || '').toUpperCase() === 'CONFIRMED';
                                    return (
                                        <tr key={appt.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="p-3 font-medium text-gray-700">#{appt.id}</td>
                                            <td className="p-3 font-semibold text-gray-900">
                                                {appt.doctor ? `Dr. ${appt.doctor.firstName} ${appt.doctor.lastName}` : 'Assigned Doctor'}
                                                {appt.doctor?.specialization && (
                                                    <span className="block text-xs font-normal text-gray-500">{appt.doctor.specialization}</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-gray-600 text-xs">
                                                {new Date(appt.appointmentDateTime).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-gray-600 text-xs max-w-xs truncate" title={appt.reason}>
                                                {appt.reason || 'General consultation'}
                                            </td>
                                            <td className="p-3 text-center">
                                                {getStatusBadge(appt.status)}
                                            </td>
                                            <td className="p-3 text-center">
                                                {canCancel ? (
                                                    <button
                                                        onClick={() => handleCancelAppointment(appt.id)}
                                                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition"
                                                        title="Cancel this appointment"
                                                    >
                                                        Cancel
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PatientDashboard;
