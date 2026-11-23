import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    FaPills, 
    FaPlus, 
    FaExclamationTriangle, 
    FaBoxes, 
    FaSearch, 
    FaCalendarAlt, 
    FaSyncAlt, 
    FaCheckCircle, 
    FaTimesCircle,
    FaArrowRight
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import AddMedicineModal from '../../components/admin/AddMedicineModal';

function Pharmacy() {
    const [medicines, setMedicines] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'EXPIRED'
    const [toast, setToast] = useState({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8080/api/medicines', config);
            setMedicines(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching medicines:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
    }, []);

    const isLowStock = (quantity) => quantity < 50;
    const isExpired = (dateString) => dateString && new Date(dateString) <= new Date();

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Summary stats
    const totalUnitsInStock = useMemo(() => {
        return medicines.reduce((sum, m) => sum + (m.stockQuantity || 0), 0);
    }, [medicines]);

    const lowStockCount = useMemo(() => {
        return medicines.filter(m => isLowStock(m.stockQuantity)).length;
    }, [medicines]);

    const expiredCount = useMemo(() => {
        return medicines.filter(m => isExpired(m.expiryDate)).length;
    }, [medicines]);

    // Filtered list
    const filteredMedicines = useMemo(() => {
        return medicines.filter(med => {
            const matchesFilter = 
                filterStatus === 'ALL' ? true :
                filterStatus === 'IN_STOCK' ? med.stockQuantity > 0 :
                filterStatus === 'LOW_STOCK' ? isLowStock(med.stockQuantity) :
                filterStatus === 'EXPIRED' ? isExpired(med.expiryDate) : true;

            if (!matchesFilter) return false;

            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            const name = (med.name || '').toLowerCase();
            const desc = (med.description || '').toLowerCase();
            return name.includes(term) || desc.includes(term) || String(med.id).includes(term);
        });
    }, [medicines, filterStatus, searchTerm]);

    return (
        <div className="pb-14 max-w-7xl mx-auto space-y-6 px-2 sm:px-4">
            
            {/* Header & Page Action Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                            <FaPills size={20} />
                        </span>
                        Pharmacy Inventory
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Manage pharmaceutical stock, low-stock alerts, and FEFO batch expirations
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Link
                        to="/pharmacist/batches"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-semibold transition border border-slate-200"
                    >
                        <FaBoxes className="text-teal-600" /> Manage Batches (FEFO)
                    </Link>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold transition shadow-md shadow-teal-600/20"
                    >
                        <FaPlus /> Add Medicine
                    </button>
                </div>
            </div>

            {/* Notification Toast */}
            {toast.text && (
                <div className={`p-4 rounded-2xl flex justify-between items-center text-xs sm:text-sm shadow-sm border ${
                    toast.type === 'error' 
                        ? 'bg-rose-50 text-rose-800 border-rose-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'error' ? <FaTimesCircle className="text-rose-500" /> : <FaCheckCircle className="text-emerald-500" />}
                        <span>{toast.text}</span>
                    </div>
                    <button 
                        onClick={() => setToast({ type: '', text: '' })} 
                        className="font-bold text-gray-500 hover:text-gray-800 text-lg leading-none"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Metric Summary Cards (4 Columns) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Total Medicines */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">Total Medicines</span>
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                            <FaPills size={15} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : medicines.length}
                        </div>
                        <p className="text-[11px] text-teal-600 font-medium mt-1 truncate">
                            Active Catalog Items
                        </p>
                    </div>
                </div>

                {/* 2. Total Stock Units */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Total Units</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FaBoxes size={15} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : totalUnitsInStock.toLocaleString()}
                        </div>
                        <p className="text-[11px] text-blue-600 font-medium mt-1 truncate">
                            Total Inventory On Hand
                        </p>
                    </div>
                </div>

                {/* 3. Low Stock Alert */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Low Stock</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FaExclamationTriangle size={15} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : lowStockCount}
                        </div>
                        <p className="text-[11px] text-amber-700 font-medium mt-1 truncate">
                            Less than 50 units remaining
                        </p>
                    </div>
                </div>

                {/* 4. Expired Items */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Expired Items</span>
                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <FaCalendarAlt size={15} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : expiredCount}
                        </div>
                        <p className="text-[11px] text-rose-600 font-medium mt-1 truncate">
                            {expiredCount > 0 ? 'Requires disposal' : 'No expired stock'}
                        </p>
                    </div>
                </div>

            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by medicine name or description..."
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                    />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none">
                    {[
                        { key: 'ALL', label: 'All Items' },
                        { key: 'IN_STOCK', label: 'In Stock' },
                        { key: 'LOW_STOCK', label: 'Low Stock' },
                        { key: 'EXPIRED', label: 'Expired' }
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilterStatus(f.key)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                                filterStatus === f.key
                                    ? 'bg-white text-teal-800 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Medicines Table */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200/80">
                {loading ? (
                    <div className="py-16 text-center text-slate-400 text-xs sm:text-sm">
                        Loading pharmacy inventory...
                    </div>
                ) : filteredMedicines.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <FaPills className="mx-auto text-4xl text-slate-300 mb-2" />
                        <h4 className="text-sm font-bold text-slate-700">No medicines found</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                            {searchTerm ? 'No items match your search.' : 'Your pharmacy catalog is currently empty. Click "Add Medicine" to register new stock.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Medicine Details</th>
                                    <th className="p-4">Category / Description</th>
                                    <th className="p-4">Unit Price</th>
                                    <th className="p-4">Available Stock</th>
                                    <th className="p-4 text-right">Earliest Expiry</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredMedicines.map((med) => {
                                    const low = isLowStock(med.stockQuantity);
                                    const exp = isExpired(med.expiryDate);

                                    return (
                                        <tr key={med.id} className="hover:bg-slate-50/70 transition">
                                            <td className="p-4 font-mono text-slate-500 text-xs">#{med.id}</td>
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                                                    {med.name}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600 text-xs max-w-xs truncate">
                                                {med.description || <span className="text-slate-400 italic">No description</span>}
                                            </td>
                                            <td className="p-4 font-semibold text-slate-900 font-mono text-xs">
                                                Rs. {Number(med.price || 0).toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        low ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        {med.stockQuantity} Units
                                                    </span>
                                                    {low && (
                                                        <FaExclamationTriangle className="text-amber-500" title="Low stock warning!" size={12} />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="inline-flex items-center gap-1.5 justify-end">
                                                    <span className="text-slate-600 text-xs">{formatDate(med.expiryDate)}</span>
                                                    {exp && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                                            Expired
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Medicine Modal */}
            {showModal && (
                <AddMedicineModal 
                    onClose={() => setShowModal(false)} 
                    onMedicineAdded={(newMed) => {
                        setShowModal(false);
                        setToast({
                            type: 'success',
                            text: `Medicine "${newMed?.name || 'Item'}" added to inventory successfully!`
                        });
                        fetchMedicines();
                    }} 
                />
            )}
        </div>
    );
}

export default Pharmacy;
