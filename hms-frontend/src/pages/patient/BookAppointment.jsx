import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaCalendarCheck } from 'react-icons/fa';

function BookAppointment() {
    const [doctors, setDoctors] = useState([]);
    const [appointmentData, setAppointmentData] = useState({
        doctorId: '', appointmentDateTime: '', reason: ''
    });
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Fetch doctors so the patient can choose one
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/doctors', config);
                setDoctors(res.data);
            } catch (error) {
                console.error("Error fetching doctors", error);
            }
        };
        fetchDoctors();
    }, []);

    const handleChange = (e) => {
        setAppointmentData({ ...appointmentData, [e.target.name]: e.target.value });
        if (errorMessage) setErrorMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        try {
            let formattedTime = appointmentData.appointmentDateTime;
            if (formattedTime && formattedTime.length === 16) {
                formattedTime += ':00';
            }

            const payload = {
                appointmentDateTime: formattedTime,
                reason: appointmentData.reason,
                doctor: { id: parseInt(appointmentData.doctorId, 10) }
            };

            await axios.post('http://localhost:8080/api/appointments', payload, config);
            setMessage("Appointment booked successfully!");
            setTimeout(() => navigate('/patient/dashboard'), 2000);
        } catch (error) {
            console.error("Error booking appointment:", error);
            const errMsg = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : null) || "Failed to book appointment.";
            setErrorMessage(errMsg);
        }
    };

    const selectedDoctor = doctors.find(d => d.id === parseInt(appointmentData.doctorId, 10));

    const formatDays = (daysStr) => {
        if (!daysStr) return 'Mon-Fri';
        const dayMap = {
            'MONDAY': 'Mon', 'TUESDAY': 'Tue', 'WEDNESDAY': 'Wed', 'THURSDAY': 'Thu',
            'FRIDAY': 'Fri', 'SATURDAY': 'Sat', 'SUNDAY': 'Sun'
        };
        const parts = daysStr.split(',').map(d => d.trim().toUpperCase());
        if (parts.length === 7) return 'All Days (Mon-Sun)';
        if (parts.length === 5 && !parts.includes('SATURDAY') && !parts.includes('SUNDAY')) return 'Mon - Fri';
        return parts.map(p => dayMap[p] || p).join(', ');
    };

    const formatHours = (start, end) => {
        const s = start ? start.substring(0, 5) : '08:00';
        const e = end ? end.substring(0, 5) : '17:00';
        return `${s} - ${e}`;
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaCalendarCheck className="text-blue-600" /> Book an Appointment
                </h2>
                <p className="text-gray-500">Select a doctor and a suitable time for your visit.</p>
            </div>

            {message && (
                <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
                    {message}
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center justify-between">
                    <span>{errorMessage}</span>
                    <button type="button" onClick={() => setErrorMessage('')} className="font-bold text-red-700 hover:text-red-900 ml-2">&times;</button>
                </div>
            )}

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
                        <select name="doctorId" onChange={handleChange} required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">-- Choose a Doctor --</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>
                                    Dr. {d.firstName} {d.lastName} ({d.specialization})
                                </option>
                            ))}
                        </select>
                        {selectedDoctor && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                                <div className="font-semibold flex justify-between">
                                    <span>Dr. {selectedDoctor.firstName} {selectedDoctor.lastName} ({selectedDoctor.specialization})</span>
                                    <span className="text-emerald-700 font-bold">Fee: LKR {selectedDoctor.consultationFee ? selectedDoctor.consultationFee.toFixed(2) : '1,500.00'}</span>
                                </div>
                                <div className="text-gray-600">
                                    <span className="font-medium text-gray-700">Available Days: </span>
                                    {formatDays(selectedDoctor.availableDays)}
                                </div>
                                <div className="text-gray-600">
                                    <span className="font-medium text-gray-700">Working Hours: </span>
                                    {formatHours(selectedDoctor.availableTimeStart, selectedDoctor.availableTimeEnd)}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                        <input type="datetime-local" name="appointmentDateTime" onChange={handleChange} required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                        <textarea name="reason" onChange={handleChange} required rows="3" placeholder="e.g. Fever, regular checkup, chest pain..."
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                    </div>

                    <button type="submit" className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
                        Confirm Appointment
                    </button>
                </form>
            </div>
        </div>
    );
}

export default BookAppointment;
