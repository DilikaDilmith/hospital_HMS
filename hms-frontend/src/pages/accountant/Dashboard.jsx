import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaMoneyBillWave, 
    FaFileInvoiceDollar, 
    FaReceipt, 
    FaExclamationCircle, 
    FaCheckCircle, 
    FaHourglassHalf, 
    FaPlus, 
    FaSearch, 
    FaSync, 
    FaPrint, 
    FaEye, 
    FaUserCircle, 
    FaChartPie, 
    FaArrowRight,
    FaStethoscope,
    FaPills,
    FaFlask,
    FaBed,
    FaFilter
} from 'react-icons/fa';
import AddInvoiceModal from '../../components/admin/AddInvoiceModal';
import InvoiceDetailsModal from '../../components/admin/InvoiceDetailsModal';
import PrintableInvoiceModal from '../../components/common/PrintableInvoiceModal';

function AccountantDashboard() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalBilledRevenue: 0,
        totalPatients: 0,
        categoryRevenue: []
    });
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [printModalData, setPrintModalData] = useState(null);
    const [processingPaymentId, setProcessingPaymentId] = useState(null);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchAllData = async () => {
        setLoading(true);
        setError('');
        try {
            const [profileRes, statsRes, invoicesRes] = await Promise.allSettled([
                axios.get('http://localhost:8080/api/users/profile', config),
                axios.get('http://localhost:8080/api/dashboard', config),
                axios.get('http://localhost:8080/api/invoices', config)
            ]);

            if (profileRes.status === 'fulfilled') {
                setUser(profileRes.value.data);
            }
            if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value.data || {});
            }
            if (invoicesRes.status === 'fulfilled') {
                setInvoices(Array.isArray(invoicesRes.value.data) ? invoicesRes.value.data : []);
            }
        } catch (err) {
            console.error("Error loading accountant dashboard data:", err);
            setError("Failed to fetch financial data from server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Payment Processing
    const handlePayInvoice = async (invoiceId, paymentMethod = 'CASH') => {
        if (!window.confirm(`Confirm payment collection of invoice #${invoiceId} via ${paymentMethod}?`)) {
            return;
        }
        setProcessingPaymentId(invoiceId);
        try {
            await axios.put(`http://localhost:8080/api/invoices/${invoiceId}/pay?paymentMethod=${paymentMethod}`, {}, config);
            await fetchAllData();
        } catch (err) {
            console.error("Payment recording failed:", err);
            alert(err.response?.data?.message || err.response?.data || "Failed to record payment.");
        } finally {
            setProcessingPaymentId(null);
        }
    };

    // Financial calculations
    const paidInvoices = invoices.filter(inv => (inv.status || '').toUpperCase() === 'PAID');
    const unpaidInvoices = invoices.filter(inv => (inv.status || '').toUpperCase() === 'UNPAID');

    const totalCollected = stats.totalRevenue || paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalBilled = stats.totalBilledRevenue || invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalUnpaid = Math.max(0, totalBilled - totalCollected);

    // Filter recent invoices
    const filteredInvoices = invoices.filter(inv => {
        const matchesStatus = statusFilter === 'ALL' || (inv.status || '').toUpperCase() === statusFilter;
        if (!matchesStatus) return false;

        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase().trim();
        const pName = inv.patient ? `${inv.patient.firstName || ''} ${inv.patient.lastName || ''}`.toLowerCase() : '';
        const pNic = inv.patient?.nic?.toLowerCase() || '';
        const idStr = String(inv.id);
        return pName.includes(q) || pNic.includes(q) || idStr.includes(q);
    });

    const formatCurrency = (amt) => {
        return (amt || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getCategoryIcon = (category) => {
        switch ((category || '').toUpperCase()) {
            case 'CONSULTATION':
                return <FaStethoscope className="text-blue-500" />;
            case 'PHARMACY':
                return <FaPills className="text-teal-500" />;
            case 'LAB':
                return <FaFlask className="text-amber-500" />;
            case 'WARD':
                return <FaBed className="text-pink-500" />;
            default:
                return <FaReceipt className="text-indigo-500" />;
        }
    };

    return (
        <div className="pb-12 max-w-7xl mx-auto px-2 sm:px-4">
            {/* 1. Header Banner */}
            <div className="mb-8 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                        <FaMoneyBillWave size={36} className="text-emerald-200" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Welcome, {user ? user.fullName : 'Accountant'}
                            </h2>
                            <span className="bg-emerald-500/30 border border-emerald-300/40 text-emerald-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-sm">
                                {user ? user.role : 'ACCOUNTANT'}
                            </span>
                        </div>
                        <p className="text-emerald-100/90 text-sm mt-1">
                            Hospital Financial Accounting & Itemized Revenue Management Portal
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-md flex items-center gap-2 text-sm border border-emerald-300/30"
                    >
                        <FaPlus /> New Invoice
                    </button>
                    <Link 
                        to="/accountant/billing" 
                        className="bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl font-semibold transition border border-white/20 text-sm flex items-center gap-2"
                    >
                        <FaFileInvoiceDollar /> Billing Manager
                    </Link>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm">
                    <FaExclamationCircle className="text-red-500 text-lg flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* 2. Key Financial Metric Cards (4 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                {/* Collected Revenue */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-lg border border-emerald-500/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Collected Revenue</p>
                            <h3 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                                LKR {formatCurrency(totalCollected)}
                            </h3>
                            <p className="text-xs text-emerald-200 mt-2 font-medium flex items-center gap-1.5">
                                <FaCheckCircle size={12} /> {paidInvoices.length} Settled Invoices
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                            <FaMoneyBillWave size={24} className="text-emerald-100" />
                        </div>
                    </div>
                </div>

                {/* Total Gross Billed */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-lg border border-blue-500/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Total Gross Billed</p>
                            <h3 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                                LKR {formatCurrency(totalBilled)}
                            </h3>
                            <p className="text-xs text-blue-200 mt-2 font-medium flex items-center gap-1.5">
                                <FaFileInvoiceDollar size={12} /> {invoices.length} Total Generated
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                            <FaFileInvoiceDollar size={24} className="text-blue-100" />
                        </div>
                    </div>
                </div>

                {/* Outstanding Receivables */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg border border-amber-400/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-100">Outstanding Unpaid</p>
                            <h3 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                                LKR {formatCurrency(totalUnpaid)}
                            </h3>
                            <p className="text-xs text-amber-100 mt-2 font-medium flex items-center gap-1.5">
                                <FaHourglassHalf size={12} /> {unpaidInvoices.length} Invoices Pending Payment
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                            <FaExclamationCircle size={24} className="text-amber-100" />
                        </div>
                    </div>
                </div>

                {/* Total Invoices Count */}
                <div className="bg-gradient-to-br from-purple-600 to-violet-800 text-white rounded-2xl p-6 shadow-lg border border-purple-500/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-purple-100">Billing Registry</p>
                            <h3 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                                {invoices.length} Invoices
                            </h3>
                            <p className="text-xs text-purple-200 mt-2 font-medium">
                                Active Hospital Accounts
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                            <FaReceipt size={24} className="text-purple-100" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Category Revenue Breakdown Cards */}
            {stats.categoryRevenue && stats.categoryRevenue.length > 0 && (
                <div className="mb-10 bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <FaChartPie size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Revenue Stream Breakdown by Service Category</h3>
                            <p className="text-xs text-slate-400">Aggregated itemized charges across all patient accounts</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.categoryRevenue.map((cat, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-lg">
                                        {getCategoryIcon(cat.category)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cat.category}</p>
                                        <h4 className="text-base font-extrabold text-slate-800 mt-0.5">
                                            LKR {formatCurrency(cat.amount)}
                                        </h4>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                                    {cat.count} items
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Recent Invoices Ledger */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-800">
                                Recent Invoices & Billing Ledger
                            </h3>
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full">
                                {invoices.length} Total Invoices
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Real-time patient billing records, payment processing, and official receipt issuing
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={fetchAllData}
                            className="text-slate-600 hover:text-slate-800 p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition"
                            title="Refresh Data"
                        >
                            <FaSync className={loading ? "animate-spin" : ""} />
                        </button>
                        <Link 
                            to="/accountant/billing" 
                            className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-1.5 transition"
                        >
                            View Full Invoicing Manager <FaArrowRight size={12} />
                        </Link>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="relative w-full sm:w-80">
                        <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                        <input 
                            type="text" 
                            placeholder="Search patient, NIC or invoice #..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <FaFilter size={10} /> Status:
                        </span>
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PAID">Paid Only</option>
                            <option value="UNPAID">Unpaid Only</option>
                        </select>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">
                            <FaSync className="mx-auto text-3xl animate-spin text-emerald-500 mb-3" />
                            <p className="text-sm font-semibold">Loading financial records...</p>
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
                                {filteredInvoices.slice(0, 15).map((inv) => {
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
                                                    {/* Details Button */}
                                                    <button 
                                                        onClick={() => setSelectedInvoice(inv)}
                                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="View Itemized Breakdown"
                                                    >
                                                        <FaEye size={14} />
                                                    </button>

                                                    {/* Print Invoice/Receipt */}
                                                    <button 
                                                        onClick={() => setPrintModalData(inv)}
                                                        className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                        title="Print Official Invoice / Receipt"
                                                    >
                                                        <FaPrint size={14} />
                                                    </button>

                                                    {/* Quick Collect Payment if Unpaid */}
                                                    {!isPaid && (
                                                        <button 
                                                            disabled={processingPaymentId === inv.id}
                                                            onClick={() => handlePayInvoice(inv.id, 'CASH')}
                                                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition border border-emerald-200 hover:border-emerald-600 shadow-sm"
                                                            title="Record Payment (Cash)"
                                                        >
                                                            {processingPaymentId === inv.id ? 'Processing...' : 'Collect'}
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
                    onInvoiceCreated={fetchAllData}
                />
            )}

            {selectedInvoice && (
                <InvoiceDetailsModal 
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onUpdated={fetchAllData}
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

export default AccountantDashboard;
