import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarCheck, FaPlus } from 'react-icons/fa';
import AddAppointmentModal from '../../components/admin/AddAppointmentModal';

function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchAppointments = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/appointments', config);
            setAppointments(response.data);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaCalendarCheck className="text-blue-600"/> Appointment Management
                </h2>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <FaPlus /> Book Appointment
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">ID</th>
                            <th className="p-4 font-semibold text-gray-600">Patient</th>
                            <th className="p-4 font-semibold text-gray-600">Doctor</th>
                            <th className="p-4 font-semibold text-gray-600">Date & Time</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600">Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length > 0 ? (
                            appointments.map((appt) => (
                                <tr key={appt.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-4 text-gray-700">#{appt.id}</td>
                                    <td className="p-4 text-gray-800 font-medium">
                                        {appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : 'Unknown'}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {appt.doctor ? `Dr. ${appt.doctor.firstName} ${appt.doctor.lastName}` : 'Unknown'}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {new Date(appt.appointmentDateTime).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                            {appt.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{appt.reason}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    No appointments found. Click "Book Appointment".
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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