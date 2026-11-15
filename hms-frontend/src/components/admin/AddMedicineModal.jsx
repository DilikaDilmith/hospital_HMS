import { useState } from 'react';
import axios from 'axios';

function AddMedicineModal({ onClose, onMedicineAdded }) {
    const [medicineData, setMedicineData] = useState({
        name: '', description: '', price: '', stockQuantity: '', expiryDate: ''
    });

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const handleChange = (e) => setMedicineData({ ...medicineData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/api/medicines', medicineData, config);
            onMedicineAdded();
            onClose();
        } catch (error) {
            console.error("Error adding medicine:", error);
            alert("Failed to add medicine. Please check the details.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Add New Medicine</h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                        <input type="text" name="name" onChange={handleChange} required placeholder="e.g. Paracetamol 500mg"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input type="text" name="description" onChange={handleChange} placeholder="e.g. For fever and pain"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (LKR)</label>
                            <input type="number" step="0.01" name="price" onChange={handleChange} required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                            <input type="number" name="stockQuantity" onChange={handleChange} required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input type="date" name="expiryDate" onChange={handleChange} required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                    </div>

                    <div className="flex justify-end gap-3 mt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">Save Medicine</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddMedicineModal;