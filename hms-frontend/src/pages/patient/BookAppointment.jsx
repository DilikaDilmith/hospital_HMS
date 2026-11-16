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

    const handleChange = (e) => setAppointmentData({ ...appointmentData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Note: For a real app, we need the Patient ID linked to this User.
            // For now, let's just create an appointment with the selected doctor.
            // (We will link the patient ID properly later).
            
            // Since this is a demo, we are fetching the patient list and using the first one, 
            // or you can modify this to match the logged-in user's name.
            const patientRes = await axios.get('http://localhost:8080/api/patients', config);
            const patientId = patientRes.data.length > 0 ? patientRes.data[0].id : null; // Dummy link for now

            if (!patientId) {
                alert("No patient record found. Please contact reception.");
                return;
            }

            const payload = {
                appointmentDateTime: appointmentData.appointmentDateTime,
                status: 'BOOKED',
                reason: appointmentData.reason,
                patient: { id: patientId }, 
                doctor: { id: appointmentData.doctorId }
            };

            await axios.post('http://localhost:8080/api/appointments', payload, config);
            setMessage("Appointment booked successfully!");
            setTimeout(() => navigate('/patient/dashboard'), 2000);
        } catch (error) {
            console.error("Error booking appointment:", error);
            alert("Failed to book appointment.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaCalendarCheck className="text-blue-600"/> Book an Appointment
                </h2>
                <p className="text-gray-500">Select a doctor and a suitable time for your visit.</p>
            </div>

            {message && (
                <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
                    {message}
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
