import { useState } from 'react';
import axios from 'axios';
import { 
    FaTimes, 
    FaFileInvoiceDollar, 
    FaUserInjured, 
    FaCalendarAlt, 
    FaCheckCircle, 
    FaPlus, 
    FaPrint, 
    FaStethoscope, 
    FaFlask, 
    FaPills, 
    FaBed, 
    FaTag 
} from 'react-icons/fa';

function InvoiceDetailsModal({ invoice, onClose, onInvoiceUpdated }) {
    const [newItem, setNewItem] = useState({
        description: '',
        category: 'CONSULTATION',
        amount: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Category badge helpers
    const getCategoryBadge = (category) => {
        const cat = (category || 'MISC').toUpperCase();
        switch (cat) {
            case 'CONSULTATION':
                return {
                    bg: 'bg-blue-50 text-blue-700 border-blue-200',
                    icon: <FaStethoscope className="text-blue-500" size={11} />
                };
            case 'LAB':
                return {
                    bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                    icon: <FaFlask className="text-cyan-500" size={11} />
                };
            case 'PHARMACY':
                return {
                    bg: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: <FaPills className="text-amber-500" size={11} />
                };
            case 'WARD':
                return {
                    bg: 'bg-purple-50 text-purple-700 border-purple-200',
                    icon: <FaBed className="text-purple-500" size={11} />
                };
            default:
                return {
                    bg: 'bg-gray-100 text-gray-700 border-gray-200',
                    icon: <FaTag className="text-gray-400" size={11} />
                };
        }
    };

    // Handle adding an itemized charge to this invoice
    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.description || !newItem.amount) {
            setError('Please provide a description and valid amount.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const payload = {
                description: newItem.description.trim(),
                category: newItem.category,
                amount: parseFloat(newItem.amount)
            };

            await axios.post(`http://localhost:8080/api/invoices/${invoice.id}/items`, payload, config);
            setNewItem({ description: '', category: 'CONSULTATION', amount: '' });
            setShowAddItem(false);
            setIsSubmitting(false);
            if (onInvoiceUpdated) onInvoiceUpdated();
        } catch (err) {
            console.error('Error adding invoice item:', err);
            setError('Failed to add item to invoice. Please try again.');
            setIsSubmitting(false);
        }
    };

    // Handle marking the invoice as PAID
    const handleMarkAsPaid = async () => {
        if (!window.confirm('Are you sure you want to mark this invoice as PAID?')) return;
        try {
            await axios.put(`http://localhost:8080/api/invoices/${invoice.id}/pay`, {}, config);
            if (onInvoiceUpdated) onInvoiceUpdated();
            onClose();
        } catch (err) {
            console.error('Error marking invoice as paid:', err);
            alert('Failed to mark invoice as paid.');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 my-8">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-cyan-300">
                            <FaFileInvoiceDollar size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold tracking-tight">Invoice #{invoice.id}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                    invoice.status === 'PAID'
                                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                                        : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                                }`}>
                                    {invoice.status}
                                </span>
                            </div>
                            <p className="text-xs text-blue-200 mt-0.5 flex items-center gap-2">
                                <FaCalendarAlt size={11} /> 
                                Issued: {invoice.date ? new Date(invoice.date).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Patient Information Banner */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            <FaUserInjured size={13} />
                        </div>
                        <div>
                            <span className="font-semibold text-gray-900">
                                {invoice.patient ? `${invoice.patient.firstName || ''} ${invoice.patient.lastName || ''}`.trim() : 'Patient'}
                            </span>
                            {invoice.patient?.nic && (
                                <span className="text-xs text-gray-500 block">NIC: {invoice.patient.nic}</span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-gray-500 block">Contact Phone:</span>
                        <span className="font-medium text-gray-800">{invoice.patient?.phoneNumber || 'N/A'}</span>
                    </div>
                </div>

                {/* Line Items Section */}
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-800 text-base">
                            Itemized Charges ({invoice.items?.length || 0})
                        </h4>
                        {invoice.status !== 'PAID' && (
                            <button
                                onClick={() => setShowAddItem(!showAddItem)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                            >
                                <FaPlus size={10} /> {showAddItem ? 'Cancel Add' : 'Add Item'}
                            </button>
                        )}
                    </div>

                    {/* Add Item Form (Expandable) */}
                    {showAddItem && (
                        <form onSubmit={handleAddItem} className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 mb-5 text-sm">
                            <div className="font-semibold text-blue-900 mb-3 text-xs uppercase tracking-wider">
                                Add Line Item (Consultation, Lab, Pharmacy, Ward)
                            </div>
                            {error && <p className="text-red-600 text-xs mb-2 font-medium">{error}</p>}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                                <div className="sm:col-span-4">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="CONSULTATION">CONSULTATION</option>
                                        <option value="LAB">LAB</option>
                                        <option value="PHARMACY">PHARMACY</option>
                                        <option value="WARD">WARD</option>
                                        <option value="MISC">MISC / SERVICE</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-5">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Paracetamol 500mg, Urine Routine"
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Amount (LKR)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={newItem.amount}
                                        onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                                >
                                    {isSubmitting ? 'Adding...' : 'Attach Charge'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Items Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-100 text-gray-600 uppercase font-semibold text-[11px] sticky top-0">
                                <tr>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Description</th>
                                    <th className="p-3 text-right">Amount (LKR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoice.items && invoice.items.length > 0 ? (
                                    invoice.items.map((item, idx) => {
                                        const badge = getCategoryBadge(item.category);
                                        return (
                                            <tr key={item.id || idx} className="hover:bg-slate-50 transition">
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] border ${badge.bg}`}>
                                                        {badge.icon}
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-800 font-medium">
                                                    {item.description}
                                                </td>
                                                <td className="p-3 text-right font-bold text-gray-900">
                                                    {Number(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="p-6 text-center text-gray-400">
                                            No itemized charges attached to this invoice yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Total Summary */}
                    <div className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                        <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider block">Total Amount Due</span>
                            <span className="text-xs text-gray-400">Includes all Doctor, Lab, Pharmacy & Ward items</span>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-extrabold text-blue-700">
                                LKR {Number(invoice.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-gray-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                    >
                        <FaPrint size={13} /> Print Invoice
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {invoice.status !== 'PAID' && (
                            <button
                                type="button"
                                onClick={handleMarkAsPaid}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
                            >
                                <FaCheckCircle size={13} /> Mark as PAID
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-gray-700 rounded-xl text-xs font-semibold transition"
                        >
                            Close
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default InvoiceDetailsModal;
