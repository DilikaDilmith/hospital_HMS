import { useState } from 'react';
import axios from 'axios';

function AddLabTestModal({ appointment, onClose, onTestRequested }) {
    const [testName, setTestName] = useState('');
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                testName: testName,
                status: 'REQUESTED', // Default status
                patient: { id: appointment.patient.id },
                doctor: { id: appointment.doctor.id }
            };

            await axios.post('http://localhost:8080/api/lab-tests', payload, config);
            alert("Lab test requested successfully!");
            onTestRequested();
            onClose();
        } catch (error) {
            console.error("Error requesting lab test:", error);
            alert("Failed to request lab test.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Request Lab Test</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Patient: <span className="font-semibold text-blue-600">{appointment.patient.firstName} {appointment.patient.lastName}</span>
                </p>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Test Type</label>
                        <select 
                            onChange={(e) => setTestName(e.target.value)} required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Choose Test --</option>
                            <option value="Full Blood Count (FBC)">Full Blood Count (FBC)</option>
                            <option value="Lipid Profile">Lipid Profile</option>
                            <option value="Blood Sugar (Fasting)">Blood Sugar (Fasting)</option>
                            <option value="Urine Full Report">Urine Full Report</option>
                            <option value="X-Ray">X-Ray</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Request Test</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddLabTestModal;