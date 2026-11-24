import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaPrescription, 
    FaPills, 
    FaUserCircle, 
    FaBoxes, 
    FaExclamationTriangle, 
    FaCheckCircle, 
    FaClock, 
    FaSyncAlt, 
    FaPlus, 
    FaSearch, 
    FaUserInjured, 
    FaUserMd, 
    FaCalendarAlt, 
    FaMoneyBillWave, 
    FaTimes, 
    FaShieldAlt, 
    FaArrowRight, 
    FaHourglassHalf,
    FaFileInvoiceDollar,
    FaFilter,
    FaTrashAlt
} from 'react-icons/fa';
import AddBatchModal from '../../components/pharmacist/AddBatchModal';
import AddMedicineModal from '../../components/admin/AddMedicineModal';

function PharmacistDashboard() {
    const [user, setUser] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [batches, setBatches] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'dispensed' | 'low_stock' | 'expiring' | 'all'
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [selectedMedForBatch, setSelectedMedForBatch] = useState('');
    const [showMedicineModal, setShowMedicineModal] = useState(false);
    const [activeDispenseRecord, setActiveDispenseRecord] = useState(null);
    const [dispenseItems, setDispenseItems] = useState([
        { medicineId: '', quantity: '10' }
    ]);
    const [isDispensing, setIsDispensing] = useState(false);

    // Toast feedback notification
    const [toast, setToast] = useState({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    // Fetch all live pharmacist data from backend endpoints
    const fetchPharmacyData = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [userRes, recRes, medRes, batchRes, statsRes] = await Promise.allSettled([
                axios.get('http://localhost:8080/api/users/profile', config),
                axios.get('http://localhost:8080/api/medical-records/all-records', config),
                axios.get('http://localhost:8080/api/medicines', config),
                axios.get('http://localhost:8080/api/medicines/batches', config),
                axios.get('http://localhost:8080/api/dashboard/stats', config)
            ]);

            if (userRes.status === 'fulfilled') setUser(userRes.value.data);
            if (recRes.status === 'fulfilled' && Array.isArray(recRes.value.data)) {
                setPrescriptions(recRes.value.data);
            }
            if (medRes.status === 'fulfilled' && Array.isArray(medRes.value.data)) {
                setMedicines(medRes.value.data);
            }
            if (batchRes.status === 'fulfilled' && Array.isArray(batchRes.value.data)) {
                setBatches(batchRes.value.data);
            }
            if (statsRes.status === 'fulfilled') {
                setDashboardStats(statsRes.value.data);
            }
        } catch (err) {
            console.error("Error fetching pharmacy dashboard data:", err);
            setToast({ type: 'error', text: 'Failed to synchronize with backend pharmacy services.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPharmacyData();
    }, []);

    // Greeting helper
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Calculate Expiry Status for Batches (FEFO logic)
    const getBatchExpiryInfo = (expiryDateStr) => {
        if (!expiryDateStr) return { text: 'N/A', status: 'VALID', badge: 'bg-slate-100 text-slate-700' };
        const expiry = new Date(expiryDateStr);
        const today = new Date();
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            return {
                text: 'EXPIRED',
                diffDays,
                status: 'EXPIRED',
                badge: 'bg-rose-100 text-rose-800 border-rose-200'
            };
        } else if (diffDays <= 90) {
            return {
                text: `EXPIRING (${diffDays}d)`,
                diffDays,
                status: 'EXPIRING_SOON',
                badge: 'bg-amber-100 text-amber-800 border-amber-200'
            };
        } else {
            return {
                text: `VALID (${diffDays}d)`,
                diffDays,
                status: 'VALID',
                badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
            };
        }
    };

    // Derived Metrics
    const pendingPrescriptions = useMemo(() => {
        return prescriptions.filter(p => (p.status || '').toUpperCase() !== 'DISPENSED');
    }, [prescriptions]);

    const dispensedPrescriptions = useMemo(() => {
        return prescriptions.filter(p => (p.status || '').toUpperCase() === 'DISPENSED');
    }, [prescriptions]);

    const lowStockMedicines = useMemo(() => {
        return medicines.filter(m => (m.stockQuantity || 0) < 50);
    }, [medicines]);

    const expiringBatches = useMemo(() => {
        return batches
            .map(b => ({ ...b, expiryInfo: getBatchExpiryInfo(b.expiryDate) }))
            .filter(b => b.expiryInfo.status === 'EXPIRED' || b.expiryInfo.status === 'EXPIRING_SOON')
            .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    }, [batches]);

    const totalStockUnits = useMemo(() => {
        return medicines.reduce((sum, m) => sum + (m.stockQuantity || 0), 0);
    }, [medicines]);

    // Pharmacy category revenue from backend dashboard stats
    const pharmacyRevenue = useMemo(() => {
        if (!dashboardStats?.categoryRevenue) return 0;
        const pharm = dashboardStats.categoryRevenue.find(c => c.category === 'PHARMACY');
        return pharm ? pharm.amount : 0;
    }, [dashboardStats]);

    // Quick Dispense Submission (FEFO batch deduction & billing)
    const handleDispenseSubmit = async (e) => {
        e.preventDefault();
        if (!activeDispenseRecord) return;

        if (dispenseItems.length === 0) {
            setToast({ type: 'error', text: 'Please add at least one medication to dispense.' });
            return;
        }

        // Validate each item
        for (let i = 0; i < dispenseItems.length; i++) {
            const item = dispenseItems[i];
            if (!item.medicineId) {
                setToast({ type: 'error', text: `Please select an inventory drug for medication #${i + 1}.` });
                return;
            }
            const qty = parseInt(item.quantity, 10);
            if (isNaN(qty) || qty <= 0) {
                setToast({ type: 'error', text: `Quantity for medication #${i + 1} must be at least 1 unit.` });
                return;
            }
            const med = medicines.find(m => String(m.id) === String(item.medicineId));
            if (med && (med.stockQuantity || 0) < qty) {
                setToast({ 
                    type: 'error', 
                    text: `Insufficient stock for ${med.name}! Available stock: ${med.stockQuantity} units, Requested: ${qty}.` 
                });
                return;
            }
        }

        // Check for duplicates
        const selectedIds = dispenseItems.map(it => it.medicineId);
        if (new Set(selectedIds).size !== selectedIds.length) {
            setToast({ 
                type: 'error', 
                text: 'Duplicate medicines detected in dispense list. Please combine quantities into one row.' 
            });
            return;
        }

        setIsDispensing(true);
        try {
            const payload = {
                items: dispenseItems.map(it => ({
                    medicineId: parseInt(it.medicineId, 10),
                    quantity: parseInt(it.quantity, 10)
                }))
            };

            await axios.put(
                `http://localhost:8080/api/medical-records/${activeDispenseRecord.id}/dispense`,
                payload,
                config
            );

            const totalCharged = calculateDispenseBill();
            setToast({
                type: 'success',
                text: `Prescription #${activeDispenseRecord.id} successfully DISPENSED! ${dispenseItems.length} medication(s) deducted from earliest expiring batches (FEFO) and LKR ${totalCharged.toFixed(2)} auto-billed to patient invoice.`
            });
            setActiveDispenseRecord(null);
            fetchPharmacyData(true);
        } catch (err) {
            console.error("Error dispensing prescription:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to dispense prescription.';
            setToast({ type: 'error', text: msg });
        } finally {
            setIsDispensing(false);
        }
    };

    // Open Dispense Modal with smart multi-drug auto-detection from prescription text
    const handleOpenDispenseModal = (record) => {
        setActiveDispenseRecord(record);
        
        const matched = [];
        if (record.prescription && medicines.length > 0) {
            const lines = record.prescription
                .split(/[\n;•\r]+/)
                .map(s => s.trim().toLowerCase())
                .filter(Boolean);

            medicines.forEach(m => {
                const medNameLower = m.name.toLowerCase();
                const firstWord = medNameLower.split(' ')[0];
                const isMentioned = lines.some(line => 
                    (firstWord.length >= 3 && line.includes(firstWord)) || line.includes(medNameLower)
                );
                if (isMentioned && !matched.some(it => String(it.medicineId) === String(m.id))) {
                    matched.push({
                        medicineId: String(m.id),
                        quantity: '10'
                    });
                }
            });
        }

        if (matched.length === 0) {
            matched.push({
                medicineId: medicines.length > 0 ? String(medicines[0].id) : '',
                quantity: '10'
            });
        }

        setDispenseItems(matched);
    };

    // Multi-drug row management helpers
    const handleAddDispenseItem = () => {
        const usedIds = new Set(dispenseItems.map(it => String(it.medicineId)));
        const available = medicines.find(m => !usedIds.has(String(m.id)));
        setDispenseItems(prev => [
            ...prev,
            {
                medicineId: available ? String(available.id) : (medicines.length > 0 ? String(medicines[0].id) : ''),
                quantity: '10'
            }
        ]);
    };

    const handleRemoveDispenseItem = (index) => {
        if (dispenseItems.length <= 1) return;
        setDispenseItems(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleUpdateDispenseItem = (index, field, value) => {
        setDispenseItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const calculateDispenseBill = () => {
        let total = 0;
        dispenseItems.forEach(item => {
            const med = medicines.find(m => String(m.id) === String(item.medicineId));
            const qty = parseInt(item.quantity || '0', 10);
            if (med && !isNaN(qty) && qty > 0) {
                total += Number(med.price || 0) * qty;
            }
        });
        return total;
    };

    // Filter prescriptions by search & activeTab
    const filteredPrescriptions = useMemo(() => {
        return prescriptions.filter(p => {
            const isDisp = (p.status || '').toUpperCase() === 'DISPENSED';
            if (activeTab === 'pending' && isDisp) return false;
            if (activeTab === 'dispensed' && !isDisp) return false;

            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            const patientName = `${p.patient?.firstName || ''} ${p.patient?.lastName || ''}`.toLowerCase();
            const docName = `${p.doctor?.firstName || ''} ${p.doctor?.lastName || ''}`.toLowerCase();
            const diag = (p.diagnosis || '').toLowerCase();
            const rx = (p.prescription || '').toLowerCase();
            const idMatch = String(p.id).includes(term) || (p.patient?.nic && p.patient.nic.toLowerCase().includes(term));

            return patientName.includes(term) || docName.includes(term) || diag.includes(term) || rx.includes(term) || idMatch;
        });
    }, [prescriptions, activeTab, searchTerm]);

    // Filter medicines for low stock tab
    const filteredLowStock = useMemo(() => {
        if (!searchTerm.trim()) return lowStockMedicines;
        const term = searchTerm.toLowerCase();
        return lowStockMedicines.filter(m => 
            (m.name || '').toLowerCase().includes(term) || (m.description || '').toLowerCase().includes(term)
        );
    }, [lowStockMedicines, searchTerm]);

    // Filter batches for expiring tab
    const filteredExpiringBatches = useMemo(() => {
        if (!searchTerm.trim()) return expiringBatches;
        const term = searchTerm.toLowerCase();
        return expiringBatches.filter(b => 
            (b.batchNumber || '').toLowerCase().includes(term) ||
            (b.medicine?.name || '').toLowerCase().includes(term) ||
            (b.medicineName || '').toLowerCase().includes(term)
        );
    }, [expiringBatches, searchTerm]);


    return (
        <div className="pb-14 max-w-7xl mx-auto space-y-6 px-3 sm:px-6">

            {/* 1. Header & Welcome Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 text-white p-6 sm:p-8 shadow-xl">
                {/* Background ambient lighting */}
                <div className="absolute -right-10 -top-10 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute right-48 -bottom-16 w-52 h-52 rounded-full bg-cyan-400/20 blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
                            <FaPills size={32} className="text-teal-100" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-sm">
                                    <FaShieldAlt size={10} /> Dispensary Operations
                                </span>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-900/60 text-teal-200 border border-teal-500/40">
                                    FEFO Protocol Active
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                {getGreeting()}, {user?.fullName || 'Pharmacist'} 👋
                            </h1>
                            <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-xl">
                                Real-time hospital dispensary workstation: process clinical prescriptions, execute FEFO batch deductions, and monitor pharmaceutical inventory levels.
                            </p>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                        <button
                            onClick={() => fetchPharmacyData(true)}
                            disabled={refreshing}
                            className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition border border-white/20 shadow-sm"
                            title="Refresh Pharmacy Data"
                        >
                            <FaSyncAlt className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => { setSelectedMedForBatch(''); setShowBatchModal(true); }}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold transition border border-white/20 text-xs sm:text-sm whitespace-nowrap"
                        >
                            <FaBoxes size={12} /> Add Batch
                        </button>
                        <button
                            onClick={() => setShowMedicineModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-bold transition shadow-md text-xs sm:text-sm whitespace-nowrap"
                        >
                            <FaPlus size={11} /> New Medicine
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {toast.text && (
                <div className={`p-4 rounded-2xl flex justify-between items-center text-xs sm:text-sm shadow-sm border animate-in fade-in duration-200 ${
                    toast.type === 'error' 
                        ? 'bg-rose-50 text-rose-800 border-rose-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                    <div className="flex items-center gap-2.5">
                        {toast.type === 'error' ? (
                            <FaExclamationTriangle className="text-rose-500 text-base flex-shrink-0" />
                        ) : (
                            <FaCheckCircle className="text-emerald-500 text-base flex-shrink-0" />
                        )}
                        <span className="font-medium">{toast.text}</span>
                    </div>
                    <button 
                        onClick={() => setToast({ type: '', text: '' })} 
                        className="font-bold text-gray-400 hover:text-gray-700 text-base leading-none p-1"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* 2. Key Performance Indicators (5 Clean High-Contrast Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                
                {/* 1. Pending Prescriptions */}
                <button
                    onClick={() => { setActiveTab('pending'); setSearchTerm(''); }}
                    className={`text-left p-4 rounded-2xl transition border flex flex-col justify-between ${
                        activeTab === 'pending'
                            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-amber-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending Rx</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <FaClock size={14} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : pendingPrescriptions.length}
                        </div>
                        <p className="text-[11px] text-amber-700 font-semibold mt-1 truncate">
                            Needs Dispensing
                        </p>
                    </div>
                </button>

                {/* 2. Dispensed Prescriptions */}
                <button
                    onClick={() => { setActiveTab('dispensed'); setSearchTerm(''); }}
                    className={`text-left p-4 rounded-2xl transition border flex flex-col justify-between ${
                        activeTab === 'dispensed'
                            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Dispensed</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <FaCheckCircle size={14} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : dispensedPrescriptions.length}
                        </div>
                        <p className="text-[11px] text-emerald-600 font-medium mt-1 truncate">
                            Deducted & Billed
                        </p>
                    </div>
                </button>

                {/* 3. Low Stock Medicines */}
                <button
                    onClick={() => { setActiveTab('low_stock'); setSearchTerm(''); }}
                    className={`text-left p-4 rounded-2xl transition border flex flex-col justify-between ${
                        activeTab === 'low_stock'
                            ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-rose-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Low Stock</span>
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                            <FaExclamationTriangle size={14} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : lowStockMedicines.length}
                        </div>
                        <p className="text-[11px] text-rose-600 font-medium mt-1 truncate">
                            &lt; 50 units remaining
                        </p>
                    </div>
                </button>

                {/* 4. FEFO Expiring Soon */}
                <button
                    onClick={() => { setActiveTab('expiring'); setSearchTerm(''); }}
                    className={`text-left p-4 rounded-2xl transition border flex flex-col justify-between ${
                        activeTab === 'expiring'
                            ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-orange-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700">FEFO Expiry</span>
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                            <FaHourglassHalf size={14} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : expiringBatches.length}
                        </div>
                        <p className="text-[11px] text-orange-700 font-medium mt-1 truncate">
                            &le; 90 days to expiry
                        </p>
                    </div>
                </button>

                {/* 5. Total Inventory & Revenue */}
                <Link
                    to="/pharmacist/batches"
                    className="text-left p-4 rounded-2xl transition border flex flex-col justify-between col-span-2 sm:col-span-1 bg-white border-slate-200/80 hover:border-teal-300 hover:shadow-sm group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">Inventory Units</span>
                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
                            <FaBoxes size={14} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : totalStockUnits.toLocaleString()}
                        </div>
                        <p className="text-[11px] text-teal-700 font-medium mt-1 truncate flex items-center gap-1">
                            LKR {Number(pharmacyRevenue).toFixed(2)} rev. <FaArrowRight size={9} />
                        </p>
                    </div>
                </Link>

            </div>

            {/* 3. Main Operational Workstation Tabs */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                
                {/* Tab Header & Search Toolbar */}
                <div className="border-b border-slate-200 bg-slate-50/70 p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    
                    {/* Navigation Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        <button
                            onClick={() => { setActiveTab('pending'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === 'pending'
                                    ? 'bg-white text-amber-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaClock className="text-amber-500" />
                            <span>Dispensing Queue</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                                {pendingPrescriptions.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('dispensed'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === 'dispensed'
                                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaCheckCircle className="text-emerald-600" />
                            <span>Dispensed Log</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                                {dispensedPrescriptions.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('low_stock'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === 'low_stock'
                                    ? 'bg-white text-rose-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaExclamationTriangle className="text-rose-500" />
                            <span>Low Stock Watchdog</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                                {lowStockMedicines.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('expiring'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === 'expiring'
                                    ? 'bg-white text-orange-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaHourglassHalf className="text-orange-500" />
                            <span>FEFO Expirations</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-orange-100 text-orange-800 font-bold">
                                {expiringBatches.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('all'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === 'all'
                                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaPrescription className="text-teal-600" />
                            <span>All Records</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 text-teal-800 font-bold">
                                {prescriptions.length}
                            </span>
                        </button>
                    </div>

                    {/* Search Field */}
                    <div className="relative min-w-[240px]">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={
                                activeTab === 'low_stock' ? 'Search low stock medicines...' :
                                activeTab === 'expiring' ? 'Search batch # or drug...' :
                                'Search patient, doctor, medicine, NIC...'
                            }
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                        />
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="p-4 sm:p-6">

                    {/* SECTION A: PRESCRIPTIONS LIST (Pending, Dispensed, or All) */}
                    {(activeTab === 'pending' || activeTab === 'dispensed' || activeTab === 'all') && (
                        <div>
                            {loading ? (
                                <div className="py-14 text-center text-slate-400 text-xs">
                                    <FaSyncAlt className="animate-spin mx-auto text-xl mb-2 text-teal-600" />
                                    Synchronizing prescriptions with hospital clinical records...
                                </div>
                            ) : filteredPrescriptions.length === 0 ? (
                                <div className="py-14 text-center text-slate-400">
                                    <FaPrescription className="mx-auto text-4xl text-slate-300 mb-2" />
                                    <p className="text-sm font-semibold text-slate-700">No prescriptions found</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {searchTerm 
                                            ? 'No prescriptions match your current search query.' 
                                            : activeTab === 'pending' 
                                                ? 'All patient prescriptions have been processed and dispensed!' 
                                                : 'No dispensed prescription history recorded.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50/70">
                                                <th className="p-3.5">Rx ID</th>
                                                <th className="p-3.5">Patient Details</th>
                                                <th className="p-3.5">Attending Doctor</th>
                                                <th className="p-3.5">Prescription & Dosage</th>
                                                <th className="p-3.5">Date</th>
                                                <th className="p-3.5 text-center">Status</th>
                                                <th className="p-3.5 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredPrescriptions.map((record) => {
                                                const isDispensed = (record.status || '').toUpperCase() === 'DISPENSED';
                                                return (
                                                    <tr key={record.id} className="hover:bg-slate-50/70 transition">
                                                        <td className="p-3.5 font-mono text-slate-500 text-xs">
                                                            #{record.id}
                                                        </td>
                                                        <td className="p-3.5">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                                    <FaUserInjured size={13} />
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                                                        {record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : 'Walk-in Patient'}
                                                                    </div>
                                                                    <span className="text-[11px] text-slate-400">
                                                                        {record.patient?.nic ? `NIC: ${record.patient.nic} • ` : ''}ID: #{record.patient?.id || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3.5">
                                                            <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                                                                <FaUserMd className="text-teal-600" />
                                                                <span>Dr. {record.doctor ? `${record.doctor.firstName} ${record.doctor.lastName}` : 'Physician'}</span>
                                                            </div>
                                                            <span className="text-[11px] text-slate-400">
                                                                {record.diagnosis || 'General Consultation'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3.5 max-w-xs">
                                                            <div className="bg-teal-50/70 text-teal-950 p-2.5 rounded-xl border border-teal-100 text-xs font-medium whitespace-pre-wrap">
                                                                {record.prescription || 'No specific medication instructions entered'}
                                                            </div>
                                                        </td>
                                                        <td className="p-3.5 text-slate-600 text-xs">
                                                            <div className="flex items-center gap-1 text-slate-500">
                                                                <FaCalendarAlt size={11} className="text-slate-400" />
                                                                <span>{record.recordDate ? new Date(record.recordDate).toLocaleDateString() : 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3.5 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                                                isDispensed
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                                            }`}>
                                                                {isDispensed ? 'DISPENSED' : 'PENDING'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3.5 text-right">
                                                            {!isDispensed ? (
                                                                <button
                                                                    onClick={() => handleOpenDispenseModal(record)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition whitespace-nowrap"
                                                                >
                                                                    <FaCheckCircle size={11} /> Dispense & Bill
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 inline-flex items-center gap-1">
                                                                    <FaCheckCircle size={10} /> Invoiced
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION B: LOW STOCK WATCHDOG */}
                    {activeTab === 'low_stock' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                                        <FaExclamationTriangle className="text-rose-500" /> Medicines Running Low On Stock (&lt; 50 units)
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Critical stock warnings requiring batch replenishment</p>
                                </div>
                                <button
                                    onClick={() => setShowMedicineModal(true)}
                                    className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                                >
                                    + Add New Medicine Form
                                </button>
                            </div>

                            {filteredLowStock.length === 0 ? (
                                <div className="py-14 text-center text-slate-400">
                                    <FaCheckCircle className="mx-auto text-4xl text-emerald-400 mb-2" />
                                    <p className="text-sm font-semibold text-slate-700">Formulary stock is healthy</p>
                                    <p className="text-xs text-slate-400 mt-1">No medicines currently below the 50-unit threshold.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50/70">
                                                <th className="p-3.5">Medicine Name</th>
                                                <th className="p-3.5">Therapeutic Class</th>
                                                <th className="p-3.5">Unit Price</th>
                                                <th className="p-3.5">Stock Level</th>
                                                <th className="p-3.5">Stock Depletion Bar</th>
                                                <th className="p-3.5 text-right">Replenish</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredLowStock.map((med) => {
                                                const pct = Math.min(100, Math.round(((med.stockQuantity || 0) / 50) * 100));
                                                return (
                                                    <tr key={med.id} className="hover:bg-slate-50/70 transition">
                                                        <td className="p-3.5 font-bold text-slate-900">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                                                                    <FaPills size={12} />
                                                                </div>
                                                                <span>{med.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3.5 text-xs text-slate-500">
                                                            {med.description || 'General Pharmaceutical'}
                                                        </td>
                                                        <td className="p-3.5 font-semibold text-slate-700 text-xs">
                                                            LKR {Number(med.price || 0).toFixed(2)}
                                                        </td>
                                                        <td className="p-3.5">
                                                            <span className="font-extrabold text-rose-600 text-sm">
                                                                {med.stockQuantity || 0} units
                                                            </span>
                                                        </td>
                                                        <td className="p-3.5 w-44">
                                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                <div 
                                                                    className="bg-rose-500 h-2 rounded-full transition-all" 
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 mt-0.5 block">{pct}% of safe threshold (50)</span>
                                                        </td>
                                                        <td className="p-3.5 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedMedForBatch(String(med.id));
                                                                    setShowBatchModal(true);
                                                                }}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 border border-teal-200 rounded-xl text-xs font-semibold transition"
                                                            >
                                                                <FaBoxes size={11} /> Add Stock Batch
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION C: FEFO EXPIRING BATCHES */}
                    {activeTab === 'expiring' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                                        <FaHourglassHalf className="text-orange-500" /> First-Expiring First-Out (FEFO) Batches Watchdog
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Batches nearing expiry date or expired; automatically prioritized during doctor dispensing</p>
                                </div>
                                <Link to="/pharmacist/batches" className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                                    Full Batches Directory <FaArrowRight size={9} />
                                </Link>
                            </div>

                            {filteredExpiringBatches.length === 0 ? (
                                <div className="py-14 text-center text-slate-400">
                                    <FaCheckCircle className="mx-auto text-4xl text-emerald-400 mb-2" />
                                    <p className="text-sm font-semibold text-slate-700">No urgent batch expirations</p>
                                    <p className="text-xs text-slate-400 mt-1">All batches in inventory have valid expiry dates beyond 90 days.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50/70">
                                                <th className="p-3.5">Batch #</th>
                                                <th className="p-3.5">Target Medicine</th>
                                                <th className="p-3.5">Remaining Stock</th>
                                                <th className="p-3.5">Expiry Date</th>
                                                <th className="p-3.5">FEFO Status</th>
                                                <th className="p-3.5 text-right">Added Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredExpiringBatches.map((b) => {
                                                const isExp = b.expiryInfo.status === 'EXPIRED';
                                                return (
                                                    <tr key={b.id} className={`transition ${isExp ? 'bg-rose-50/70' : 'hover:bg-slate-50/70'}`}>
                                                        <td className="p-3.5 font-bold font-mono text-teal-700">
                                                            {b.batchNumber}
                                                        </td>
                                                        <td className="p-3.5">
                                                            <span className="font-semibold text-slate-900 block">
                                                                {b.medicine?.name || b.medicineName || 'Medicine Item'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3.5">
                                                            <span className="font-bold text-slate-800">
                                                                {b.quantity} units
                                                            </span>
                                                        </td>
                                                        <td className="p-3.5 text-slate-700 text-xs">
                                                            <div className="flex items-center gap-1.5">
                                                                <FaCalendarAlt className="text-slate-400" size={11} />
                                                                <span className="font-medium">{b.expiryDate}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3.5">
                                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${b.expiryInfo.badge}`}>
                                                                {b.expiryInfo.text}
                                                            </span>
                                                        </td>
                                                        <td className="p-3.5 text-slate-400 text-xs text-right">
                                                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* 4. Multi-Drug Dispense Modal */}
            {activeDispenseRecord && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col my-6 max-h-[92vh]">
                        
                        {/* Header */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 text-white p-5 sm:p-6 flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-teal-100">
                                    <FaPrescription size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Dispense Prescription</h3>
                                    <p className="text-xs text-teal-100">Multi-drug FEFO batch deduction & patient invoice auto-billing</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveDispenseRecord(null)}
                                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15"
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleDispenseSubmit} className="p-5 sm:p-6 flex flex-col gap-4 text-xs sm:text-sm overflow-y-auto">
                            
                            {/* Patient & Prescription Info Box */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient</span>
                                    <span className="text-xs font-mono font-semibold text-slate-500">Rx #{activeDispenseRecord.id}</span>
                                </div>
                                <span className="font-extrabold text-slate-900 text-sm block">
                                    {activeDispenseRecord.patient ? `${activeDispenseRecord.patient.firstName} ${activeDispenseRecord.patient.lastName}` : 'Walk-in Patient'}
                                </span>
                                <div className="mt-2 p-3 bg-teal-50/80 rounded-xl border border-teal-100 text-teal-900">
                                    <span className="font-bold text-[11px] text-teal-700 block mb-0.5">Doctor's Prescribed Medications:</span>
                                    <p className="font-medium text-xs whitespace-pre-wrap leading-relaxed">
                                        {activeDispenseRecord.prescription || 'No specific medication instructions entered.'}
                                    </p>
                                </div>
                            </div>

                            {/* Section: Multi-Drug Dispensing List */}
                            <div>
                                <div className="flex justify-between items-center mb-2.5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <FaPills className="text-teal-600" /> Dispensed Medications ({dispenseItems.length}) *
                                        </label>
                                        <span className="text-[11px] text-slate-400">Match one or more drugs from hospital inventory</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddDispenseItem}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold transition shadow-2xs"
                                    >
                                        <FaPlus size={10} /> Add Another Drug
                                    </button>
                                </div>

                                {/* List of items */}
                                <div className="space-y-3">
                                    {dispenseItems.map((item, idx) => {
                                        const currentMed = medicines.find(m => String(m.id) === String(item.medicineId));
                                        const qtyNum = parseInt(item.quantity || '0', 10);
                                        const validQty = (!isNaN(qtyNum) && qtyNum > 0) ? qtyNum : 0;
                                        const lineSubtotal = currentMed ? (Number(currentMed.price || 0) * validQty) : 0;
                                        const isOutOfStock = currentMed && (currentMed.stockQuantity || 0) < validQty;

                                        return (
                                            <div 
                                                key={idx} 
                                                className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col gap-3 transition hover:border-teal-200"
                                            >
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                                                        Drug #{idx + 1}
                                                    </span>
                                                    {dispenseItems.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveDispenseItem(idx)}
                                                            className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition flex items-center gap-1 text-[11px] font-semibold"
                                                            title="Remove drug"
                                                        >
                                                            <FaTrashAlt size={11} /> Remove
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                                                    {/* Drug Dropdown */}
                                                    <div className="sm:col-span-8">
                                                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                            Select Inventory Drug *
                                                        </label>
                                                        <select
                                                            value={item.medicineId}
                                                            onChange={(e) => handleUpdateDispenseItem(idx, 'medicineId', e.target.value)}
                                                            required
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs text-slate-800 transition"
                                                        >
                                                            <option value="">-- Choose Formulary Item --</option>
                                                            {medicines.map(m => (
                                                                <option key={m.id} value={m.id}>
                                                                    {m.name} (Stock: {m.stockQuantity} • LKR {Number(m.price || 0).toFixed(2)}/unit)
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {currentMed && (
                                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                                <span className={currentMed.stockQuantity < 30 ? 'text-amber-600 font-semibold' : ''}>
                                                                    Available: {currentMed.stockQuantity} units
                                                                </span>
                                                                <span>•</span>
                                                                <span>Unit Price: LKR {Number(currentMed.price || 0).toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Quantity */}
                                                    <div className="sm:col-span-4">
                                                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                            Quantity (Units) *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => handleUpdateDispenseItem(idx, 'quantity', e.target.value)}
                                                            required
                                                            placeholder="e.g. 10"
                                                            className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 transition text-xs text-slate-800 ${
                                                                isOutOfStock 
                                                                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500' 
                                                                    : 'border-slate-300 focus:ring-teal-500/20 focus:border-teal-500'
                                                            }`}
                                                        />
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-[11px] font-bold text-teal-700">
                                                                = LKR {lineSubtotal.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isOutOfStock && (
                                                    <div className="text-[11px] text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                                                        <FaExclamationTriangle size={11} />
                                                        <span>Quantity exceeds available stock ({currentMed.stockQuantity} units).</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Itemized Total Medical Bill Preview */}
                            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200/70 text-xs space-y-2">
                                <div className="flex justify-between items-center border-b border-emerald-200/60 pb-2">
                                    <div>
                                        <span className="font-bold text-emerald-950 text-sm block">Total Medical Bill</span>
                                        <span className="text-emerald-700 text-[11px]">
                                            Itemized across {dispenseItems.length} medication(s)
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-emerald-700 uppercase font-bold block">Charge to Patient Invoice</span>
                                        <span className="font-extrabold text-lg text-emerald-950">
                                            LKR {calculateDispenseBill().toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-[11px] text-emerald-800 flex items-start gap-1.5 pt-0.5">
                                    <FaCheckCircle className="text-emerald-600 text-xs flex-shrink-0 mt-0.5" />
                                    <span>
                                        Each drug is automatically deducted from its earliest expiring non-expired batch (FEFO) and billed atomically onto the patient's active hospital invoice.
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setActiveDispenseRecord(null)}
                                    disabled={isDispensing}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDispensing}
                                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isDispensing ? (
                                        <>
                                            <FaSyncAlt className="animate-spin" /> Dispensing & Auto-Billing...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle size={12} /> Confirm Dispense & Bill (LKR {calculateDispenseBill().toFixed(2)})
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* Modal 1: Add Stock Batch Modal */}
            {showBatchModal && (
                <AddBatchModal
                    defaultMedicineId={selectedMedForBatch}
                    onClose={() => { setShowBatchModal(false); setSelectedMedForBatch(''); }}
                    onBatchAdded={() => {
                        setToast({ type: 'success', text: 'Stock batch added successfully! FEFO inventory updated.' });
                        fetchPharmacyData(true);
                    }}
                />
            )}

            {/* Modal 2: Add Medicine Modal */}
            {showMedicineModal && (
                <AddMedicineModal
                    onClose={() => setShowMedicineModal(false)}
                    onMedicineAdded={() => {
                        setToast({ type: 'success', text: 'New medicine registered into hospital inventory!' });
                        fetchPharmacyData(true);
                    }}
                />
            )}

        </div>
    );
}

export default PharmacistDashboard;
