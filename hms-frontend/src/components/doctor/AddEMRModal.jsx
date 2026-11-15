import { useState } from 'react';
import axios from 'axios';

function AddEMRModal({ appointment, onClose, onRecordAdded }) {
    const [emrData, setEmrData] = useState({
        diagnosis: '',
        prescription: '',
        treatmentHistory: ''
    });

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const handleChange = (e) => setEmrData({ ...emrData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Prepare payload for EMR (Medical Record)
            const payload = {
                diagnosis: emrData.diagnosis,
                prescription: emrData.prescription,
                treatmentHistory: emrData.treatmentHistory,
                patient: { id: appointment.patient.id }, // Get ID from the selected appointment
                doctor: { id: appointment.doctor.id }    // Get ID from the selected appointment
            };

            await axios.post('http://localhost:8080/api/medical-records', payload, config);
            
            // Optionally update appointment status to COMPLETED here (we can do this in backend later)
            
            onRecordAdded();
            onClose();
            alert("Medical record saved successfully!");
        } catch (error) {
            console.error("Error saving medical record:", error);
            alert("Failed to save medical record. Please check the details.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl">
                <div className="mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold text-gray-800">Add Medical Record (EMR)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Patient: <span className="font-semibold text-blue-600">{appointment.patient.firstName} {appointment.patient.lastName}</span>
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis (රෝග විනිශ්චය)</label>
                        <input type="text" name="diagnosis" onChange={handleChange} required placeholder="e.g. Viral Fever, Hypertension"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prescription (බෙහෙත්)</label>
                        <textarea name="prescription" onChange={handleChange} rows="3" required placeholder="e.g. Paracetamol 500mg - 3 times a day for 5 days"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Treatment History / Notes</label>
                        <textarea name="treatmentHistory" onChange={handleChange} rows="3" placeholder="Any past complications or notes..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Save Record</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddEMRModal;