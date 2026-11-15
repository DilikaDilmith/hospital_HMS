import { useState, useEffect } from 'react';
import axios from 'axios';

function AddAppointmentModal({ onClose, onAppointmentAdded }) {
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [appointmentData, setAppointmentData] = useState({
        patientId: '', doctorId: '', appointmentDateTime: '', reason: ''
    });

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const pRes = await axios.get('http://localhost:8080/api/patients', config);
                const dRes = await axios.get('http://localhost:8080/api/doctors', config);
                setPatients(pRes.data);
                setDoctors(dRes.data);
            } catch (error) {
                console.error("Error fetching data for modal", error);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => setAppointmentData({ ...appointmentData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                appointmentDateTime: appointmentData.appointmentDateTime,
                status: 'BOOKED',
                reason: appointmentData.reason,
                patient: { id: appointmentData.patientId },
                doctor: { id: appointmentData.doctorId }
            };
            await axios.post('http://localhost:8080/api/appointments', payload, config);
            onAppointmentAdded();
            onClose();
        } catch (error) {
            console.error("Error adding appointment:", error);
            alert("Failed to book appointment. Please check the details.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Book New Appointment</h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
                        <select name="patientId" onChange={handleChange} required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">-- Choose Patient --</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (NIC: {p.nic})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
                        <select name="doctorId" onChange={handleChange} required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">-- Choose Doctor --</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} ({d.specialization})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                        <input type="datetime-local" name="appointmentDateTime" onChange={handleChange} required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                        <input type="text" name="reason" onChange={handleChange} required placeholder="e.g. Fever, Checkup"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div className="flex justify-end gap-3 mt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Book</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddAppointmentModal;