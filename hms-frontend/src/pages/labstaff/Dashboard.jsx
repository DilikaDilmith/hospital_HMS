import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaFlask, 
    FaVial, 
    FaUserCircle, 
    FaSearch, 
    FaSyncAlt, 
    FaCheckCircle, 
    FaTimesCircle, 
    FaExclamationCircle, 
    FaClock, 
    FaPrint, 
    FaEdit, 
    FaMicroscope, 
    FaCalendarAlt, 
    FaTimes, 
    FaSpinner, 
    FaFileMedical, 
    FaArrowRight, 
    FaIdCard, 
    FaUserInjured,
    FaCheck,
    FaVials
} from 'react-icons/fa';
import PrintableLabReportModal from '../../components/common/PrintableLabReportModal';

function LabStaffDashboard() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [labTests, setLabTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filter & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'REQUESTED' | 'SAMPLE_COLLECTED' | 'COMPLETED'

    // Result entry modal
    const [activeModalTest, setActiveModalTest] = useState(null);
    const [resultInput, setResultInput] = useState('');
    const [isSubmittingResult, setIsSubmittingResult] = useState(false);
    const [modalError, setModalError] = useState('');

    // Print report modal
    const [selectedTestToPrint, setSelectedTestToPrint] = useState(null);

    // Toast feedback
    const [toast, setToast] = useState({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    const fetchAllLabData = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else setLoading(true);

        try {
            const [userRes, statsRes, testsRes] = await Promise.allSettled([
                axios.get('http://localhost:8080/api/users/profile', config),
                axios.get('http://localhost:8080/api/dashboard/stats', config),
                axios.get('http://localhost:8080/api/lab-tests', config)
            ]);

            if (userRes.status === 'fulfilled') setUser(userRes.value.data);
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            if (testsRes.status === 'fulfilled' && Array.isArray(testsRes.value.data)) {
                setLabTests(testsRes.value.data);
            }
        } catch (error) {
            console.error("Error fetching lab dashboard data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllLabData();
    }, []);

    // 1-Click Action: Collect Specimen (REQUESTED -> SAMPLE_COLLECTED)
    const handleCollectSample = async (testId) => {
        try {
            await axios.put(`http://localhost:8080/api/lab-tests/${testId}/collect-sample`, {}, config);
            setToast({
                type: 'success',
                text: `Specimen collected successfully for Test #${testId}. Moved to analysis queue.`
            });
            fetchAllLabData(true);
        } catch (err) {
            console.error("Error collecting sample:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to update sample status.';
            setToast({ type: 'error', text: msg });
        }
    };

    // Open Result Entry Modal
    const handleOpenResultModal = (test) => {
        setActiveModalTest(test);
        setResultInput(test.result || '');
        setModalError('');
    };

    // Submit Findings: SAMPLE_COLLECTED -> COMPLETED (Auto-bills test charge)
    const handleCompleteTest = async (e) => {
        e.preventDefault();
        if (!resultInput.trim()) {
            setModalError('Please enter diagnostic findings or test values before completing.');
            return;
        }

        setIsSubmittingResult(true);
        setModalError('');

        try {
            await axios.put(`http://localhost:8080/api/lab-tests/${activeModalTest.id}/complete`, {
                result: resultInput.trim()
            }, config);

            setToast({
                type: 'success',
                text: `Test #${activeModalTest.id} (${activeModalTest.testName}) finalized! Diagnostic fee auto-billed to patient ledger.`
            });
            setActiveModalTest(null);
            setResultInput('');
            fetchAllLabData(true);
        } catch (err) {
            console.error("Error completing test:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to complete test.';
            setModalError(msg);
        } finally {
            setIsSubmittingResult(false);
        }
    };

    // Quick result template presets
    const applyResultTemplate = (text) => {
        setResultInput(text);
        setModalError('');
    };

    // Derived counts
    const pendingSpecimenCount = useMemo(() => {
        return labTests.filter(t => (t.status || '').toUpperCase() === 'REQUESTED').length;
    }, [labTests]);

    const inAnalysisCount = useMemo(() => {
        return labTests.filter(t => (t.status || '').toUpperCase() === 'SAMPLE_COLLECTED').length;
    }, [labTests]);

    const completedCount = useMemo(() => {
        return labTests.filter(t => (t.status || '').toUpperCase() === 'COMPLETED').length;
    }, [labTests]);

    const uniquePatientsCount = useMemo(() => {
        const set = new Set(labTests.map(t => t.patient?.id).filter(Boolean));
        return set.size;
    }, [labTests]);

    // Status Badge helper
    const getStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'REQUESTED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <FaClock size={9} /> Awaiting Specimen
                    </span>
                );
            case 'SAMPLE_COLLECTED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        <FaVials size={9} /> In Analysis
                    </span>
                );
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <FaCheck size={9} /> Completed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {status}
                    </span>
                );
        }
    };

    // Filtered list
    const filteredTests = useMemo(() => {
        return labTests.filter(t => {
            const matchesStatus = statusFilter === 'ALL' || (t.status || '').toUpperCase() === statusFilter;
            if (!matchesStatus) return false;

            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            const pName = `${t.patient?.firstName || ''} ${t.patient?.lastName || ''}`.toLowerCase();
            const pNic = (t.patient?.nic || '').toLowerCase();
            const testName = (t.testName || '').toLowerCase();
            const res = (t.result || '').toLowerCase();
            return pName.includes(term) || pNic.includes(term) || testName.includes(term) || res.includes(term) || String(t.id).includes(term);
        });
    }, [labTests, statusFilter, searchTerm]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const formattedToday = new Date().toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div className="pb-14 max-w-7xl mx-auto space-y-6 px-3 sm:px-6">
            
            {/* 1. Header Welcome Banner (Clean, Modern, Diagnostic Hub) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-700 text-white p-6 sm:p-8 shadow-lg">
                {/* Decorative background glow */}
                <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute right-40 -bottom-16 w-48 h-48 rounded-full bg-purple-400/20 blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
                            <FaMicroscope size={34} className="text-purple-200" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-sm">
                                    <FaFlask size={10} /> Diagnostic Pathology & Laboratory Services
                                </span>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/15 text-purple-100">
                                    📅 {formattedToday}
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                {getGreeting()}, {user ? user.fullName : 'Lab Specialist'} 👋
                            </h1>
                            <p className="text-purple-100 text-xs sm:text-sm mt-1">
                                Process clinical test orders, collect specimens, enter pathology findings, and issue official diagnostic reports.
                            </p>
                        </div>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                        <button
                            onClick={() => fetchAllLabData(true)}
                            disabled={refreshing}
                            className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition border border-white/20 shadow-sm"
                            title="Refresh Laboratory Queue"
                        >
                            <FaSyncAlt className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <Link
                            to="/profile"
                            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold transition border border-white/20 text-xs sm:text-sm whitespace-nowrap"
                        >
                            My Profile
                        </Link>
                        <Link
                            to="/lab/tests"
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-purple-700 hover:bg-purple-50 font-bold transition shadow-md text-xs sm:text-sm whitespace-nowrap"
                        >
                            <FaVial /> Full Worklist
                        </Link>
                    </div>
                </div>
            </div>

            {/* Notification Feedback Toast */}
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

            {/* 2. Key Operational Diagnostic Metrics (4 Columns) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Awaiting Specimen (REQUESTED) */}
                <button
                    onClick={() => { setStatusFilter('REQUESTED'); setSearchTerm(''); }}
                    className={`text-left p-5 rounded-2xl transition border flex flex-col justify-between ${
                        statusFilter === 'REQUESTED'
                            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-amber-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Awaiting Specimen</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <FaClock size={15} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : pendingSpecimenCount}
                        </div>
                        <p className="text-[11px] text-amber-700 font-medium mt-1 truncate">
                            Pending Sample Collection
                        </p>
                    </div>
                </button>

                {/* 2. In Analysis (SAMPLE_COLLECTED) */}
                <button
                    onClick={() => { setStatusFilter('SAMPLE_COLLECTED'); setSearchTerm(''); }}
                    className={`text-left p-5 rounded-2xl transition border flex flex-col justify-between ${
                        statusFilter === 'SAMPLE_COLLECTED'
                            ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">In Testing</span>
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <FaVials size={15} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : inAnalysisCount}
                        </div>
                        <p className="text-[11px] text-indigo-700 font-medium mt-1 truncate">
                            Ready for Result Entry
                        </p>
                    </div>
                </button>

                {/* 3. Completed Reports (COMPLETED) */}
                <button
                    onClick={() => { setStatusFilter('COMPLETED'); setSearchTerm(''); }}
                    className={`text-left p-5 rounded-2xl transition border flex flex-col justify-between ${
                        statusFilter === 'COMPLETED'
                            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Completed Reports</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <FaCheckCircle size={15} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : completedCount}
                        </div>
                        <p className="text-[11px] text-emerald-700 font-medium mt-1 truncate">
                            Verified & Auto-Billed
                        </p>
                    </div>
                </button>

                {/* 4. Patients Tested */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Patients Tested</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <FaUserInjured size={15} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : (stats?.totalPatients ?? uniquePatientsCount)}
                        </div>
                        <p className="text-[11px] text-purple-600 font-medium mt-1 truncate">
                            Under Diagnostic Care
                        </p>
                    </div>
                </div>

            </div>

            {/* 3. Live Laboratory Worklist Queue (Operational Heart of Lab Tech) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                
                {/* Queue Toolbar: Filter Pills & Search */}
                <div className="border-b border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        {[
                            { key: 'ALL', label: 'All Orders', count: labTests.length },
                            { key: 'REQUESTED', label: 'Awaiting Specimen', count: pendingSpecimenCount },
                            { key: 'SAMPLE_COLLECTED', label: 'In Testing', count: inAnalysisCount },
                            { key: 'COMPLETED', label: 'Completed', count: completedCount }
                        ].map((f) => (
                            <button
                                key={f.key}
                                onClick={() => { setStatusFilter(f.key); setSearchTerm(''); }}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                    statusFilter === f.key
                                        ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span>{f.label}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    statusFilter === f.key ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {f.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Fast Search Input */}
                    <div className="relative min-w-[240px]">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search patient, NIC, or test name..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                        />
                    </div>
                </div>

                {/* Queue Table */}
                <div className="p-4 sm:p-6">
                    {loading ? (
                        <div className="py-16 text-center text-slate-400 text-xs sm:text-sm">
                            Loading laboratory test queue...
                        </div>
                    ) : filteredTests.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">
                            <FaFlask className="mx-auto text-4xl text-slate-300 mb-2" />
                            <h4 className="text-sm font-bold text-slate-700">No laboratory test orders found</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                {searchTerm ? 'No diagnostic orders matched your search query.' : 'There are no active orders matching this filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                                        <th className="p-3.5">Order ID</th>
                                        <th className="p-3.5">Patient Details</th>
                                        <th className="p-3.5">Test Ordered</th>
                                        <th className="p-3.5">Requested Date</th>
                                        <th className="p-3.5 text-center">Status</th>
                                        <th className="p-3.5">Diagnostic Findings</th>
                                        <th className="p-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTests.map((test) => {
                                        const s = (test.status || '').toUpperCase();
                                        const isRequested = s === 'REQUESTED';
                                        const isCollected = s === 'SAMPLE_COLLECTED';
                                        const isCompleted = s === 'COMPLETED';

                                        return (
                                            <tr key={test.id} className="hover:bg-slate-50/70 transition">
                                                <td className="p-3.5 font-mono text-slate-500 text-xs">
                                                    #{test.id}
                                                </td>
                                                <td className="p-3.5">
                                                    <div className="font-semibold text-slate-900">
                                                        {test.patient ? `${test.patient.firstName} ${test.patient.lastName}` : 'Walk-in Patient'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                        {test.patient?.nic && (
                                                            <span className="flex items-center gap-1">
                                                                <FaIdCard size={9} className="text-slate-400" /> {test.patient.nic}
                                                            </span>
                                                        )}
                                                        {test.patient?.gender && (
                                                            <span>• {test.patient.gender}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3.5">
                                                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                                        <FaFlask className="text-purple-600 flex-shrink-0" size={12} />
                                                        {test.testName}
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                        Fee: Rs. {Number(test.testFee || 2500).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-slate-600 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <FaCalendarAlt size={10} className="text-slate-400" />
                                                        {test.requestedAt ? new Date(test.requestedAt).toLocaleDateString([], {
                                                            month: 'short', day: 'numeric', year: 'numeric'
                                                        }) : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    {getStatusBadge(test.status)}
                                                </td>
                                                <td className="p-3.5 text-xs max-w-xs truncate">
                                                    {test.result ? (
                                                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block truncate max-w-xs" title={test.result}>
                                                            {test.result}
                                                        </span>
                                                    ) : isCollected ? (
                                                        <span className="text-indigo-600 italic font-medium">Specimen collected. Enter findings below.</span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Awaiting specimen collection</span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                                        {isRequested && (
                                                            <button
                                                                onClick={() => handleCollectSample(test.id)}
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-2xs whitespace-nowrap"
                                                                title="Collect patient sample"
                                                            >
                                                                <FaVial size={10} /> Collect Sample
                                                            </button>
                                                        )}

                                                        {isCollected && (
                                                            <button
                                                                onClick={() => handleOpenResultModal(test)}
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-2xs whitespace-nowrap"
                                                                title="Enter lab findings and finalize"
                                                            >
                                                                <FaEdit size={11} /> Enter Results
                                                            </button>
                                                        )}

                                                        {isCompleted && (
                                                            <button
                                                                onClick={() => setSelectedTestToPrint(test)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-semibold transition shadow-2xs whitespace-nowrap"
                                                                title="Print authorized pathology report"
                                                            >
                                                                <FaPrint size={11} /> Print Report
                                                            </button>
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
            </div>

            {/* 4. Enter Results Modal */}
            {activeModalTest && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
                    onClick={(e) => { if (e.target === e.currentTarget && !isSubmittingResult) setActiveModalTest(null); }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col my-6">
                        
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 text-white p-5 sm:p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                    <FaMicroscope size={20} className="text-purple-200" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Record Diagnostic Findings</h3>
                                    <p className="text-xs text-purple-100">
                                        Test #{activeModalTest.id} • {activeModalTest.testName}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveModalTest(null)}
                                disabled={isSubmittingResult}
                                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15"
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleCompleteTest} className="p-6 flex flex-col gap-4 text-xs sm:text-sm">
                            
                            {modalError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
                                    <FaExclamationCircle className="text-rose-500" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            {/* Patient Info Banner */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient</span>
                                    <span className="font-bold text-slate-800 text-sm">
                                        {activeModalTest.patient ? `${activeModalTest.patient.firstName} ${activeModalTest.patient.lastName}` : 'Walk-in'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Diagnostic Fee</span>
                                    <span className="font-bold text-emerald-600">
                                        Rs. {Number(activeModalTest.testFee || 2500).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Quick Clinical Presets
                                </label>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => applyResultTemplate("Normal Range: Hemoglobin: 13.8 g/dL, WBC: 7,200 /mcL, Platelets: 240,000 /mcL. All counts within normal parameters.")}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-lg text-[11px] font-semibold transition border border-slate-200"
                                    >
                                        Normal CBC
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyResultTemplate("Fasting Blood Sugar (FBS): 92 mg/dL. Reference Range: 70 - 100 mg/dL (Normal).")}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-lg text-[11px] font-semibold transition border border-slate-200"
                                    >
                                        Normal FBS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyResultTemplate("Lipid Profile: Total Cholesterol: 180 mg/dL, HDL: 48 mg/dL, LDL: 110 mg/dL, Triglycerides: 130 mg/dL.")}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-lg text-[11px] font-semibold transition border border-slate-200"
                                    >
                                        Lipid Profile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyResultTemplate("Urine Analysis: Albumin: Nil, Sugar: Nil, Pus cells: 1-2 /HPF, Red cells: Nil.")}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-lg text-[11px] font-semibold transition border border-slate-200"
                                    >
                                        Urine Full Report
                                    </button>
                                </div>
                            </div>

                            {/* Result Textarea */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Diagnostic Findings & Laboratory Observations <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={resultInput}
                                    onChange={(e) => setResultInput(e.target.value)}
                                    placeholder="Enter detailed laboratory observations, test values, and clinical reference ranges..."
                                    required
                                    className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition leading-relaxed"
                                />
                            </div>

                            {/* Informative Note */}
                            <div className="p-3 bg-purple-50/70 border border-purple-200/70 rounded-xl text-purple-900 text-[11px] leading-relaxed">
                                Submitting will mark this order as <strong>COMPLETED</strong>, unlock printable pathology reports, and automatically add the <strong>Rs. {Number(activeModalTest.testFee || 2500).toFixed(2)}</strong> fee to the patient's active hospital invoice.
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveModalTest(null)}
                                    disabled={isSubmittingResult}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingResult}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmittingResult ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Finalizing...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheck size={11} /> Finalize & Auto-Bill
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 5. Printable Lab Report Modal */}
            {selectedTestToPrint && (
                <PrintableLabReportModal
                    test={selectedTestToPrint}
                    onClose={() => setSelectedTestToPrint(null)}
                />
            )}

        </div>
    );
}

export default LabStaffDashboard;
