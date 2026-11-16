import { useState, useEffect } from 'react';
import axios from 'axios';

function AddBillModal({ onClose, onBillAdded }) {
    const [patients, setPatients] = useState([]);
    const [billData, setBillData] = useState({
        patientId: '', description: '', totalAmount: '', paymentStatus: 'UNPAID'
    });

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Fetch patients to populate the dropdown
    useEffect(() => {
        const fetchPatients = async () => {
            const currentToken = localStorage.getItem('token');
            const authConfig = { headers: { Authorization: `Bearer ${currentToken}` } };
            try {
                const res = await axios.get('http://localhost:8080/api/patients', authConfig);
                setPatients(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error("Error fetching patients", error);
            }
        };
        fetchPatients();
    }, []);

    const handleChange = (e) => setBillData({ ...billData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentToken = localStorage.getItem('token');
        const authConfig = { headers: { Authorization: `Bearer ${currentToken}` } };
        try {
            const payload = {
                description: billData.description,
                totalAmount: parseFloat(billData.totalAmount),
                paymentStatus: billData.paymentStatus,
                patient: { id: billData.patientId }
            };

            await axios.post('http://localhost:8080/api/bills', payload, authConfig);
            onBillAdded();
            onClose();
        } catch (error) {
            console.error("Error generating bill:", error);
            alert("Failed to generate bill. Please check the details.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Generate New Invoice</h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
                        <select name="patientId" onChange={handleChange} required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                            <option value="">-- Choose Patient --</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (NIC: {p.nic})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Charges)</label>
                        <input type="text" name="description" onChange={handleChange} required placeholder="e.g. Consultation + Blood Test"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (LKR)</label>
                            <input type="number" step="0.01" name="totalAmount" onChange={handleChange} required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                            <select name="paymentStatus" onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                                <option value="UNPAID">UNPAID</option>
                                <option value="PAID">PAID</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Generate Invoice</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddBillModal;