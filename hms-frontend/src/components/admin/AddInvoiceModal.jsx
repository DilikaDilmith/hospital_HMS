import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaFileInvoiceDollar, FaPlus, FaUserInjured, FaTag, FaMoneyBillWave } from 'react-icons/fa';

function AddInvoiceModal({ onClose, onInvoiceAdded }) {
    const [patients, setPatients] = useState([]);
    const [formData, setFormData] = useState({
        patientId: '',
        category: 'CONSULTATION',
        description: 'Doctor Consultation & Outpatient Registration',
        amount: '1500.00',
        status: 'UNPAID'
    });
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Fetch registered patients for the dropdown
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/patients', config);
                setPatients(Array.isArray(res.data) ? res.data : []);
                setLoadingPatients(false);
            } catch (err) {
                console.error("Error fetching patients for invoice:", err);
                setError("Failed to load patients list.");
                setLoadingPatients(false);
            }
        };
        fetchPatients();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId) {
            setError("Please select a patient.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // 1. Create Invoice
            const invoicePayload = {
                patient: { id: parseInt(formData.patientId) },
                status: formData.status
            };

            const invoiceRes = await axios.post('http://localhost:8080/api/invoices', invoicePayload, config);
            const createdInvoice = invoiceRes.data;

            // 2. Attach initial line item if description and amount are provided
            if (formData.description && parseFloat(formData.amount) > 0) {
                const itemPayload = {
                    category: formData.category,
                    description: formData.description.trim(),
                    amount: parseFloat(formData.amount)
                };
                await axios.post(`http://localhost:8080/api/invoices/${createdInvoice.id}/items`, itemPayload, config);
            }

            if (onInvoiceAdded) onInvoiceAdded();
            onClose();
        } catch (err) {
            console.error("Error creating invoice:", err);
            setError("Failed to create invoice. Please check the details.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-cyan-300">
                            <FaFileInvoiceDollar size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Generate New Invoice</h3>
                            <p className="text-xs text-blue-200">Create itemized invoice for outpatient or inpatient</p>
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

                    {/* Patient Dropdown */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FaUserInjured className="text-blue-500" /> Select Patient *
                        </label>
                        <select 
                            name="patientId" 
                            value={formData.patientId} 
                            onChange={handleChange} 
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs text-gray-800 transition"
                        >
                            <option value="">-- Choose Patient --</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName} {p.nic ? `(NIC: ${p.nic})` : ''} - #{p.id}
                                </option>
                            ))}
                        </select>
                        {loadingPatients && <span className="text-[11px] text-gray-400">Loading registered patients...</span>}
                    </div>

                    {/* Item Category */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <FaTag className="text-purple-500" /> Charge Category
                            </label>
                            <select 
                                name="category" 
                                value={formData.category} 
                                onChange={handleChange}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs text-gray-800 transition"
                            >
                                <option value="CONSULTATION">CONSULTATION</option>
                                <option value="LAB">LAB</option>
                                <option value="PHARMACY">PHARMACY</option>
                                <option value="WARD">WARD</option>
                                <option value="MISC">MISC / SERVICE</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Initial Status
                            </label>
                            <select 
                                name="status" 
                                value={formData.status} 
                                onChange={handleChange}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs text-gray-800 transition"
                            >
                                <option value="UNPAID">UNPAID (Pending)</option>
                                <option value="PAID">PAID (Settled)</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Charge Description *
                        </label>
                        <input 
                            type="text" 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            required
                            placeholder="e.g. Doctor Consultation Fee, Blood Count Lab Test"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs text-gray-800 transition"
                        />
                    </div>

                    {/* Initial Amount */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FaMoneyBillWave className="text-emerald-500" /> Item Amount (LKR) *
                        </label>
                        <input 
                            type="number" 
                            step="0.01" 
                            name="amount" 
                            value={formData.amount} 
                            onChange={handleChange} 
                            required
                            placeholder="0.00"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs text-gray-800 transition"
                        />
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
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
                        >
                            <FaPlus size={11} /> {isSubmitting ? 'Generating...' : 'Create Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddInvoiceModal;
