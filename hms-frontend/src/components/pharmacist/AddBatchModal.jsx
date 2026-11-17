import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaBoxes, FaPills, FaCalendarAlt, FaPlus } from 'react-icons/fa';

function AddBatchModal({ onClose, onBatchAdded, defaultMedicineId = '' }) {
    const [medicines, setMedicines] = useState([]);
    const [formData, setFormData] = useState({
        medicineId: defaultMedicineId,
        batchNumber: `BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        quantity: '100',
        expiryDate: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchMedicines = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/medicines', config);
                setMedicines(Array.isArray(res.data) ? res.data : []);
                setLoading(false);
            } catch (err) {
                console.error("Error loading medicines:", err);
                setError("Failed to load medicine list.");
                setLoading(false);
            }
        };
        fetchMedicines();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.medicineId) {
            setError("Please select a medicine.");
            return;
        }
        if (!formData.expiryDate) {
            setError("Please select the batch expiry date.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const payload = {
                batchNumber: formData.batchNumber.trim(),
                quantity: parseInt(formData.quantity, 10),
                expiryDate: formData.expiryDate
            };

            await axios.post(`http://localhost:8080/api/medicines/${formData.medicineId}/batches`, payload, config);
            if (onBatchAdded) onBatchAdded();
            onClose();
        } catch (err) {
            console.error("Error adding batch:", err);
            setError("Failed to register stock batch. Please verify details.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-teal-200">
                            <FaBoxes size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Register Stock Batch</h3>
                            <p className="text-xs text-teal-100">Add an inventory lot with distinct batch number and expiry date</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-sm">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    {/* Medicine Dropdown */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FaPills className="text-teal-600" /> Target Medicine *
                        </label>
                        <select 
                            value={formData.medicineId} 
                            onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })} 
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs text-gray-800 transition"
                        >
                            <option value="">-- Choose Medicine --</option>
                            {medicines.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} (Current Stock: {m.stockQuantity}) - #{m.id}
                                </option>
                            ))}
                        </select>
                        {loading && <span className="text-[11px] text-gray-400">Loading medicines...</span>}
                    </div>

                    {/* Batch Number */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Batch / Lot Number *
                        </label>
                        <input 
                            type="text"
                            value={formData.batchNumber}
                            onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                            required
                            placeholder="e.g. BATCH-2026-X1"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs text-gray-800 transition"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Quantity */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Batch Quantity *
                            </label>
                            <input 
                                type="number" 
                                min="1"
                                value={formData.quantity} 
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
                                required
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs text-gray-800 transition"
                            />
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                                <FaCalendarAlt className="text-red-500" /> Expiry Date *
                            </label>
                            <input 
                                type="date" 
                                value={formData.expiryDate} 
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} 
                                required
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs text-gray-800 transition"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 mt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
                        >
                            <FaPlus size={11} /> {isSubmitting ? 'Registering...' : 'Add Stock Batch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddBatchModal;

