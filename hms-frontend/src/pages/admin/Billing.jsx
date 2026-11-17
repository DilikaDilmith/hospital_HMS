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
    FaArrowUp,
    FaHourglassHalf,
    FaFilter
} from 'react-icons/fa';
import AddInvoiceModal from '../../components/admin/AddInvoiceModal';
import InvoiceDetailsModal from '../../components/admin/InvoiceDetailsModal';

function Billing() {
    const [invoices, setInvoices] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
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

    // Filter invoices based on search query and status filter
    const filteredInvoices = invoices.filter(inv => {
        const query = searchQuery.toLowerCase().trim();
        const matchesStatus = statusFilter === 'ALL' || (inv.status || '').toUpperCase() === statusFilter;

        if (!matchesStatus) return false;
        if (!query) return true;

        const patientName = inv.patient 
            ? `${inv.patient.firstName || ''} ${inv.patient.lastName || ''}`.toLowerCase() 
            : '';
        const patientNic = inv.patient?.nic?.toLowerCase() || '';
        const invoiceId = String(inv.id || '');
        const amount = String(inv.totalAmount || '');

        return patientName.includes(query) || 
               patientNic.includes(query) || 
               invoiceId.includes(query) || 
               amount.includes(query);
    });

    // Calculate billing summary stats
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const paidInvoices = invoices.filter(inv => (inv.status || '').toUpperCase() === 'PAID');
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const unpaidInvoices = invoices.filter(inv => (inv.status || '').toUpperCase() === 'UNPAID');
    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    // Quick mark as paid action
    const handleQuickPay = async (invoiceId) => {
        if (!window.confirm(`Mark Invoice #${invoiceId} as PAID?`)) return;
        try {
            await axios.put(`http://localhost:8080/api/invoices/${invoiceId}/pay`, {}, config);
            fetchInvoices();
        } catch (err) {
            console.error('Error marking invoice paid:', err);
            alert('Failed to update invoice status.');
        }
    };

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
                        <FaFileInvoiceDollar className="text-blue-600" /> Billing & Invoicing
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Itemized hospital invoices across Consultation, Lab, Pharmacy & Inpatient Ward. Total: <span className="font-semibold text-blue-600">{invoices.length}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={fetchInvoices}
                        title="Refresh Invoices"
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                    >
                        <FaSync size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition"
                    >
                        <FaPlus size={12} /> Generate Invoice
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FaExclamationCircle className="text-red-500" />
                        <span>{error}</span>
                    </div>
                    <button 
                        onClick={fetchInvoices}
                        className="text-xs font-semibold px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg transition"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Invoiced</span>
                        <div className="text-xl font-extrabold text-gray-900 mt-1">
                            LKR {totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">{invoices.length} total bills</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FaFileInvoiceDollar size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Collected / Paid</span>
                        <div className="text-xl font-extrabold text-emerald-600 mt-1">
                            LKR {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-emerald-500 mt-0.5 block">{paidInvoices.length} settled invoices</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <FaArrowUp size={20} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Pending / Unpaid</span>
                        <div className="text-xl font-extrabold text-amber-600 mt-1">
                            LKR {totalUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-amber-500 mt-0.5 block">{unpaidInvoices.length} awaiting payment</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <FaHourglassHalf size={20} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">Active Invoices</span>
                        <div className="text-xl font-extrabold text-purple-700 mt-1">
                            {invoices.length}
                        </div>
                        <span className="text-[11px] text-purple-400 mt-0.5 block">Itemized billing enabled</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <FaMoneyBillWave size={22} />
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="relative w-full sm:w-80">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input 
                        type="text"
                        placeholder="Search patient, NIC, invoice ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-xs text-gray-500 flex items-center gap-1 font-medium pl-1">
                        <FaFilter size={10} /> Status:
                    </span>
                    {['ALL', 'UNPAID', 'PAID'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                statusFilter === status
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 hover:bg-slate-200 text-gray-700'
                            }`}
                        >
                            {status === 'ALL' ? 'All Invoices' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Invoice #</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Date Issued</th>
                                <th className="p-4">Items</th>
                                <th className="p-4">Total Amount (LKR)</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                                        <td className="p-4 font-bold text-blue-700">
                                            #INV-{inv.id}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                    <FaUserInjured size={13} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-sm">
                                                        {inv.patient 
                                                            ? `${inv.patient.firstName || ''} ${inv.patient.lastName || ''}`.trim() 
                                                            : 'Unassigned Patient'}
                                                    </div>
                                                    {inv.patient?.nic && (
                                                        <div className="text-[11px] text-gray-400">
                                                            NIC: {inv.patient.nic}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            <div className="flex items-center gap-1.5">
                                                <FaCalendarAlt className="text-gray-400" size={11} />
                                                <span>{inv.date ? new Date(inv.date).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            <span className="text-[11px] text-gray-400">
                                                {inv.date ? new Date(inv.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                <FaListUl size={10} className="text-slate-500" />
                                                {inv.items?.length || 0} items
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-900 text-sm">
                                            LKR {Number(inv.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                                inv.status === 'PAID'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'
                                                }`} />
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedInvoice(inv)}
                                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold text-xs transition"
                                                >
                                                    View Items
                                                </button>
                                                {inv.status !== 'PAID' && (
                                                    <button
                                                        onClick={() => handleQuickPay(inv.id)}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-sm transition flex items-center gap-1"
                                                    >
                                                        <FaCheckCircle size={10} /> Pay
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <FaFileInvoiceDollar size={42} className="mb-3 text-gray-300" />
                                            <p className="text-sm font-semibold text-gray-700">
                                                {searchQuery || statusFilter !== 'ALL' 
                                                    ? 'No matching invoices found.' 
                                                    : 'No invoices found in the system.'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 max-w-sm">
                                                Click "Generate Invoice" above or complete an appointment to automatically generate an itemized invoice.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generate Invoice Modal */}
            {showAddModal && (
                <AddInvoiceModal
                    onClose={() => setShowAddModal(false)}
                    onInvoiceAdded={fetchInvoices}
                />
            )}

            {/* Invoice Details & Line Items Modal */}
            {selectedInvoice && (
                <InvoiceDetailsModal
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onInvoiceUpdated={() => {
                        fetchInvoices();
                        // Refresh selected invoice data
                        axios.get(`http://localhost:8080/api/invoices/${selectedInvoice.id}`, config)
                            .then(res => setSelectedInvoice(res.data))
                            .catch(err => console.error(err));
                    }}
                />
            )}
        </div>
    );
}

export default Billing;
