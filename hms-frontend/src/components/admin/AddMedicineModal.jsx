import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaPills, 
    FaTimes, 
    FaSpinner, 
    FaExclamationCircle, 
    FaCalendarAlt, 
    FaBoxes, 
    FaNotesMedical,
    FaInfoCircle,
    FaCheck
} from 'react-icons/fa';

function AddMedicineModal({ onClose, onMedicineAdded }) {
    const todayStr = new Date().toISOString().split('T')[0];

    const [medicineData, setMedicineData] = useState({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        expiryDate: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleChange = (e) => {
        setMedicineData({ ...medicineData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    // Quick presets for Expiry Date
    const setExpiryPreset = (monthsToAdd) => {
        const d = new Date();
        d.setMonth(d.getMonth() + monthsToAdd);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setMedicineData(prev => ({ ...prev, expiryDate: `${yyyy}-${mm}-${dd}` }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        const trimmedName = medicineData.name.trim();
        if (!trimmedName) {
            setError('Please provide a valid medicine name.');
            return;
        }

        const parsedPrice = parseFloat(medicineData.price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            setError('Please enter a valid price greater than zero (LKR).');
            return;
        }

        const parsedStock = parseInt(medicineData.stockQuantity, 10);
        if (isNaN(parsedStock) || parsedStock < 0) {
            setError('Stock quantity cannot be negative.');
            return;
        }

        if (!medicineData.expiryDate) {
            setError('Please select an expiry date for this medicine.');
            return;
        }

        if (medicineData.expiryDate < todayStr) {
            setError('Expiry date cannot be in the past for new inventory stock.');
            return;
        }

        const payload = {
            name: trimmedName,
            description: medicineData.description.trim(),
            price: parsedPrice,
            stockQuantity: parsedStock,
            expiryDate: medicineData.expiryDate
        };

        setIsSubmitting(true);
        try {
            const res = await axios.post('http://localhost:8080/api/medicines', payload, config);
            if (onMedicineAdded) {
                onMedicineAdded(res.data);
            }
            onClose();
        } catch (err) {
            console.error("Error adding medicine:", err);
            const msg = err.response?.data?.message || 
                (typeof err.response?.data === 'string' ? err.response.data : null) || 
                'Failed to add medicine to inventory. Please check inputs.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col my-6">
                
                {/* 1. Header with Gradient Accent */}
                <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 text-white p-5 sm:p-6 flex justify-between items-center flex-shrink-0">
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

                    <div className="relative z-10 flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
                            <FaPills size={22} className="text-teal-100" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">Add New Medicine</h3>
                            <p className="text-xs text-teal-100 mt-0.5">
                                Register pharmaceutical item into hospital inventory
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="relative z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15"
                        title="Close modal"
                    >
                        <FaTimes size={15} />
                    </button>
                </div>

                {/* 2. Form Body */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-7 flex flex-col gap-4 text-xs sm:text-sm overflow-y-auto">
                    
                    {/* Error Banner */}
                    {error && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2.5 shadow-2xs">
                            <FaExclamationCircle className="text-rose-500 text-base flex-shrink-0 mt-0.5" />
                            <span className="text-xs font-semibold leading-relaxed">{error}</span>
                        </div>
                    )}

                    {/* Field 1: Medicine Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Medicine Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <FaPills size={14} />
                            </div>
                            <input 
                                type="text" 
                                name="name" 
                                value={medicineData.name}
                                onChange={handleChange} 
                                required 
                                autoFocus
                                placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg"
                                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition" 
                            />
                        </div>
                    </div>

                    {/* Field 2: Description / Therapeutic Category */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Description / Therapeutic Category
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <FaNotesMedical size={13} />
                            </div>
                            <input 
                                type="text" 
                                name="description" 
                                value={medicineData.description}
                                onChange={handleChange} 
                                placeholder="e.g. Analgesic & Antipyretic, Antibiotic Capsule"
                                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition" 
                            />
                        </div>
                    </div>

                    {/* Field 3 & 4: Price and Stock Quantity (2-Column Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Price */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Unit Price (LKR) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                                    Rs.
                                </div>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    min="0.01"
                                    name="price" 
                                    value={medicineData.price}
                                    onChange={handleChange} 
                                    required
                                    placeholder="0.00"
                                    className="w-full pl-11 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition" 
                                />
                            </div>
                        </div>

                        {/* Stock Quantity */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Initial Stock <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <FaBoxes size={13} />
                                </div>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="1"
                                    name="stockQuantity" 
                                    value={medicineData.stockQuantity}
                                    onChange={handleChange} 
                                    required
                                    placeholder="e.g. 100"
                                    className="w-full pl-10 pr-14 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition" 
                                />
                                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                                    Units
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Field 5: Expiry Date */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Batch Expiry Date <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[11px] text-slate-400">FEFO Expiry Tracking</span>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <FaCalendarAlt size={13} />
                            </div>
                            <input 
                                type="date" 
                                name="expiryDate" 
                                min={todayStr}
                                value={medicineData.expiryDate}
                                onChange={handleChange} 
                                required
                                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition" 
                            />
                        </div>

                        {/* Quick Expiry Date Presets */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[11px] font-medium text-slate-400 mr-1">Quick Select:</span>
                            <button
                                type="button"
                                onClick={() => setExpiryPreset(6)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-[11px] font-semibold transition border border-slate-200"
                            >
                                +6 Mos
                            </button>
                            <button
                                type="button"
                                onClick={() => setExpiryPreset(12)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-[11px] font-semibold transition border border-slate-200"
                            >
                                +1 Year
                            </button>
                            <button
                                type="button"
                                onClick={() => setExpiryPreset(24)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-[11px] font-semibold transition border border-slate-200"
                            >
                                +2 Years
                            </button>
                            <button
                                type="button"
                                onClick={() => setExpiryPreset(36)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-[11px] font-semibold transition border border-slate-200"
                            >
                                +3 Years
                            </button>
                        </div>
                    </div>

                    {/* Informative Note */}
                    <div className="p-3.5 bg-teal-50/80 border border-teal-200/70 rounded-2xl flex items-start gap-2.5 text-teal-800 text-[11px] leading-relaxed">
                        <FaInfoCircle className="text-teal-600 text-sm flex-shrink-0 mt-0.5" />
                        <div>
                            Initial stock units will automatically be registered as <strong>Batch #1</strong> in hospital inventory for First-Expired, First-Out (FEFO) automated deduction during doctor dispensing.
                        </div>
                    </div>

                    {/* 3. Action Buttons */}
                    <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100 mt-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isSubmitting}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition text-xs sm:text-sm disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-bold transition text-xs sm:text-sm shadow-md shadow-teal-600/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <FaSpinner className="animate-spin" /> Saving Medicine...
                                </>
                            ) : (
                                <>
                                    <FaCheck size={12} /> Save Medicine
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default AddMedicineModal;
