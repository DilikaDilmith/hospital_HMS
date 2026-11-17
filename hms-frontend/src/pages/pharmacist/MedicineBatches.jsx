import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaBoxes, 
    FaPlus, 
    FaSearch, 
    FaSync, 
    FaExclamationTriangle, 
    FaCheckCircle, 
    FaPills, 
    FaCalendarAlt,
    FaHourglassEnd,
    FaArrowLeft
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import AddBatchModal from '../../components/pharmacist/AddBatchModal';

function MedicineBatches() {
    const [batches, setBatches] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchBatches = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('http://localhost:8080/api/medicines/batches', config);
            setBatches(Array.isArray(res.data) ? res.data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error loading batches:", err);
            setError("Failed to fetch medicine batches.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    // Expiry analysis
    const getExpiryInfo = (expiryDateStr) => {
        if (!expiryDateStr) return { text: 'N/A', badge: 'bg-gray-100 text-gray-700' };
        const expiry = new Date(expiryDateStr);
        const today = new Date();
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            return {
                text: 'EXPIRED',
                badge: 'bg-rose-100 text-rose-800 border-rose-200',
                status: 'EXPIRED'
            };
        } else if (diffDays <= 90) {
            return {
                text: `EXPIRING (${diffDays}d)`,
                badge: 'bg-amber-100 text-amber-800 border-amber-200',
                status: 'EXPIRING_SOON'
            };
        } else {
            return {
                text: `VALID (${diffDays}d)`,
                badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                status: 'VALID'
            };
        }
    };

    // Filter batches
    const filteredBatches = batches.filter(b => {
        const query = searchQuery.toLowerCase().trim();
        const expiryInfo = getExpiryInfo(b.expiryDate);

        if (filterStatus !== 'ALL' && expiryInfo.status !== filterStatus) return false;
        if (!query) return true;

        const batchNum = (b.batchNumber || '').toLowerCase();
        const medName = b.medicine?.name ? b.medicine.name.toLowerCase() : '';
        return batchNum.includes(query) || medName.includes(query);
    });

    const expiredCount = batches.filter(b => getExpiryInfo(b.expiryDate).status === 'EXPIRED').length;
    const expiringSoonCount = batches.filter(b => getExpiryInfo(b.expiryDate).status === 'EXPIRING_SOON').length;
    const validCount = batches.filter(b => getExpiryInfo(b.expiryDate).status === 'VALID').length;

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link to="/pharmacist/prescriptions" className="text-xs text-teal-600 hover:underline flex items-center gap-1 font-semibold">
                            <FaArrowLeft size={10} /> Prescriptions
                        </Link>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
                        <FaBoxes className="text-teal-600" /> Medicine Batches & FEFO Inventory
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        First-Expiring First-Out (FEFO) batch tracking for pharmaceutical safety. Total: <span className="font-semibold text-teal-600">{batches.length}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={fetchBatches}
                        title="Refresh Batches"
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                    >
                        <FaSync size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition"
                    >
                        <FaPlus size={12} /> Add Stock Batch
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-semibold">
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Valid Batches</span>
                        <div className="text-2xl font-extrabold text-emerald-600 mt-1">{validCount}</div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">&gt; 90 days to expiration</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <FaCheckCircle size={20} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Expiring Soon</span>
                        <div className="text-2xl font-extrabold text-amber-600 mt-1">{expiringSoonCount}</div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">Priority FEFO dispensing</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <FaHourglassEnd size={20} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-rose-600 uppercase tracking-wider">Expired Batches</span>
                        <div className="text-2xl font-extrabold text-rose-600 mt-1">{expiredCount}</div>
                        <span className="text-[11px] text-rose-400 mt-0.5 block">Excluded from dispensing</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <FaExclamationTriangle size={20} />
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="relative w-full sm:w-80">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input 
                        type="text"
                        placeholder="Search batch number, medicine name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {['ALL', 'VALID', 'EXPIRING_SOON', 'EXPIRED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                filterStatus === status
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'bg-slate-100 hover:bg-slate-200 text-gray-700'
                            }`}
                        >
                            {status === 'ALL' ? 'All Batches' : status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-gray-600 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Batch Number</th>
                                <th className="p-4">Medicine</th>
                                <th className="p-4">Quantity Remaining</th>
                                <th className="p-4">Expiry Date</th>
                                <th className="p-4">FEFO Status</th>
                                <th className="p-4">Date Added</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredBatches.length > 0 ? (
                                filteredBatches.map((b) => {
                                    const expiry = getExpiryInfo(b.expiryDate);
                                    return (
                                        <tr key={b.id} className="hover:bg-slate-50/80 transition">
                                            <td className="p-4 font-bold text-teal-700">
                                                {b.batchNumber}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                                                        <FaPills size={12} />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-900 block">
                                                            {b.medicine?.name || 'Unknown'}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400">
                                                            LKR {Number(b.medicine?.price || 0).toFixed(2)} / unit
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-bold text-sm ${b.quantity < 30 ? 'text-amber-600' : 'text-gray-900'}`}>
                                                    {b.quantity} units
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-700">
                                                <div className="flex items-center gap-1.5">
                                                    <FaCalendarAlt className="text-gray-400" size={11} />
                                                    <span className="font-medium">{b.expiryDate}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${expiry.badge}`}>
                                                    {expiry.text}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500">
                                                {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-gray-400">
                                        No inventory batches found matching the filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Batch Modal */}
            {showModal && (
                <AddBatchModal
                    onClose={() => setShowModal(false)}
                    onBatchAdded={fetchBatches}
                />
            )}
        </div>
    );
}

export default MedicineBatches;

