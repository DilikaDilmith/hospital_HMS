import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaFileInvoiceDollar, 
    FaPlus, 
    FaSearch, 
    FaSync, 
    FaCheckCircle, 
    FaExclamationCircle, 
    FaUserInjured, 
    FaCalendarAlt, 
    FaMoneyBillWave, 
    FaListUl,
    FaHourglassHalf,
    FaFilter,
    FaPrint,
    FaReceipt
} from 'react-icons/fa';
import AddInvoiceModal from '../../components/admin/AddInvoiceModal';
import InvoiceDetailsModal from '../../components/admin/InvoiceDetailsModal';
import PrintableInvoiceModal from '../../components/common/PrintableInvoiceModal';

function AccountantBilling() {
    const [invoices, setInvoices] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [printModalData, setPrintModalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchInvoices = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://localhost:8080/api/invoices', config);
            setInvoices(Array.isArray(response.data) ? response.data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching invoices:", err);
            let msg = 'Failed to load invoices from the server.';
            if (!err.response) {
                msg = 'Backend server is unreachable. Please ensure Spring Boot is running on port 8080.';
            } else if (err.response.status === 403) {
                msg = 'Access Forbidden (403): You do not have permission to view billing invoices.';
            }
            setError(msg);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handlePay = async (invoiceId, paymentMethod = 'CASH') => {
        if (!window.confirm(`Mark invoice #${invoiceId} as PAID via ${paymentMethod}?`)) {
            return;
        }
        try {
            await axios.put(`http://localhost:8080/api/invoices/${invoiceId}/pay?paymentMethod=${paymentMethod}`, {}, config);
            fetchInvoices();
        } catch (err) {
            console.error("Error updating payment:", err);
            alert(err.response?.data?.message || err.response?.data || "Failed to process payment.");
        }
    };

    // Filter invoices based on search and status
    const filteredInvoices = invoices.filter(inv => {
        const matchesStatus = statusFilter === 'ALL' || (inv.status || '').toUpperCase() === statusFilter;
        if (!matchesStatus) return false;

        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const patientName = inv.patient ? `${inv.patient.firstName || ''} ${inv.patient.lastName || ''}`.toLowerCase() : '';
        const patientNic = inv.patient?.nic?.toLowerCase() || '';
        const invoiceIdStr = String(inv.id);
        const paymentMethod = (inv.paymentMethod || '').toLowerCase();

        return patientName.includes(query) || 
               patientNic.includes(query) || 
               invoiceIdStr.includes(query) || 
               paymentMethod.includes(query);
    });

    const formatCurrency = (amount) => {
        return (amount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Aggregate totals
    const totalCollected = invoices
        .filter(inv => (inv.status || '').toUpperCase() === 'PAID')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    const totalUnpaid = invoices
        .filter(inv => (inv.status || '').toUpperCase() === 'UNPAID')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    return (
        <div className="pb-12 max-w-7xl mx-auto px-2 sm:px-4">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <FaMoneyBillWave className="text-emerald-600" /> Itemized Billing & Invoicing
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Finance & Accounting Division • Generate itemized patient invoices, collect payments, and print receipts
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-2xl shadow-lg transition flex items-center gap-2 text-sm"
                >
                    <FaPlus /> Create New Invoice
                </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Collected (Paid)</p>
                        <h3 className="text-xl font-black text-emerald-600 mt-1">LKR {formatCurrency(totalCollected)}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <FaCheckCircle size={18} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Receivables (Unpaid)</p>
                        <h3 className="text-xl font-black text-amber-600 mt-1">LKR {formatCurrency(totalUnpaid)}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <FaHourglassHalf size={18} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Generated Invoices</p>
                        <h3 className="text-xl font-black text-blue-600 mt-1">{invoices.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <FaReceipt size={18} />
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm">
                    <FaExclamationCircle className="text-red-500 text-lg flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    <div className="relative w-full sm:w-80">
                        <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search patient, NIC or invoice #..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                <FaFilter size={10} /> Status:
                            </span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="ALL">All Invoices</option>
                                <option value="PAID">Paid Only</option>
                                <option value="UNPAID">Unpaid Only</option>
                            </select>
                        </div>

                        <button
                            onClick={fetchInvoices}
                            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition border border-slate-200 bg-white"
                            title="Refresh List"
                        >
                            <FaSync className={loading ? "animate-spin" : ""} size={13} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-16 text-center text-slate-400">
                            <FaSync className="mx-auto text-3xl animate-spin text-emerald-500 mb-3" />
                            <p className="text-sm font-semibold">Loading patient invoices...</p>
                        </div>
                    ) : filteredInvoices.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                    <th className="p-4 pl-6">Invoice #</th>
                                    <th className="p-4">Patient</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Total Amount</th>
                                    <th className="p-4">Payment Method</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredInvoices.map((inv) => {
                                    const isPaid = (inv.status || '').toUpperCase() === 'PAID';
                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                                            <td className="p-4 pl-6 font-mono font-bold text-slate-800">
                                                #{inv.id}
                                            </td>

                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">
                                                    {inv.patient ? `${inv.patient.firstName || ''} ${inv.patient.lastName || ''}` : 'Walk-in Patient'}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono">
                                                    {inv.patient?.nic ? `NIC: ${inv.patient.nic}` : (inv.patient?.phone || 'ID: #' + inv.patient?.id)}
                                                </div>
                                            </td>

                                            <td className="p-4 text-xs text-slate-600 font-medium">
                                                {inv.date ? new Date(inv.date).toLocaleDateString() : 'N/A'}
                                            </td>

                                            <td className="p-4 font-bold text-slate-900">
                                                LKR {formatCurrency(inv.totalAmount)}
                                            </td>

                                            <td className="p-4 text-xs font-semibold text-slate-500">
                                                {inv.paymentMethod || '—'}
                                            </td>

                                            <td className="p-4">
                                                {isPaid ? (
                                                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                                                        <FaCheckCircle size={10} /> Paid
                                                    </span>
                                                ) : (
                                                    <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                                                        <FaHourglassHalf size={10} /> Unpaid
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-4 text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* View Itemized Details */}
                                                    <button
                                                        onClick={() => setSelectedInvoice(inv)}
                                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="View Itemized Breakdown"
                                                    >
                                                        <FaListUl size={14} />
                                                    </button>

                                                    {/* Print Invoice/Receipt */}
                                                    <button
                                                        onClick={() => setPrintModalData(inv)}
                                                        className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                        title="Print Official Invoice / Receipt"
                                                    >
                                                        <FaPrint size={14} />
                                                    </button>

                                                    {/* Mark as Paid Action */}
                                                    {!isPaid && (
                                                        <button
                                                            onClick={() => handlePay(inv.id, 'CASH')}
                                                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition border border-emerald-200 hover:border-emerald-600 shadow-sm"
                                                            title="Mark as Paid (Cash)"
                                                        >
                                                            Collect
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-16 text-center text-slate-400">
                            <FaFileInvoiceDollar size={32} className="mx-auto mb-3 text-slate-300" />
                            <p className="font-bold text-slate-700">No invoices found matching criteria</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddInvoiceModal
                    onClose={() => setShowAddModal(false)}
                    onInvoiceCreated={fetchInvoices}
                />
            )}

            {selectedInvoice && (
                <InvoiceDetailsModal
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onUpdated={fetchInvoices}
                />
            )}

            {printModalData && (
                <PrintableInvoiceModal
                    invoice={printModalData}
                    onClose={() => setPrintModalData(null)}
                />
            )}
        </div>
    );
}

export default AccountantBilling;
