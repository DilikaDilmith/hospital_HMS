import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarCheck, FaNotesMedical, FaFlask } from 'react-icons/fa';
import AddEMRModal from '../../components/doctor/AddEMRModal';
import AddLabTestModal from './AddLabTestModal';

function DoctorAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    
    // Modals state
    const [showEMRModal, setShowEMRModal] = useState(false);
    const [showLabModal, setShowLabModal] = useState(false);

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

    const handleOpenEMR = (appointment) => {
        setSelectedAppointment(appointment);
        setShowEMRModal(true);
    };

    const handleOpenLabTest = (appointment) => {
        setSelectedAppointment(appointment);
        setShowLabModal(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaCalendarCheck className="text-blue-600"/> My Appointments
                </h2>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">ID</th>
                            <th className="p-4 font-semibold text-gray-600">Patient</th>
                            <th className="p-4 font-semibold text-gray-600">Date & Time</th>
                            <th className="p-4 font-semibold text-gray-600">Reason</th>
                            <th className="p-4 font-semibold text-gray-600">Action</th>
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
                                        {new Date(appt.appointmentDateTime).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-gray-600">{appt.reason}</td>
                                    <td className="p-4 flex gap-2">
                                        {/* Add Record Button */}
                                        <button 
                                            onClick={() => handleOpenEMR(appt)}
                                            className="bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1 rounded-lg flex items-center gap-2 transition text-sm font-medium"
                                        >
                                            <FaNotesMedical /> EMR
                                        </button>
                                        
                                        {/* Request Lab Test Button */}
                                        <button 
                                            onClick={() => handleOpenLabTest(appt)}
                                            className="bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white px-3 py-1 rounded-lg flex items-center gap-2 transition text-sm font-medium"
                                        >
                                            <FaFlask /> Lab Test
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500">
                                    No appointments scheduled.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showEMRModal && selectedAppointment && (
                <AddEMRModal 
                    appointment={selectedAppointment}
                    onClose={() => setShowEMRModal(false)} 
                    onRecordAdded={fetchAppointments} 
                />
            )}

            {showLabModal && selectedAppointment && (
                <AddLabTestModal 
                    appointment={selectedAppointment}
                    onClose={() => setShowLabModal(false)} 
                    onTestRequested={fetchAppointments} 
                />
            )}
        </div>
    );
}

export default DoctorAppointments;