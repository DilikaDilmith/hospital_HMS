import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaFlask, 
    FaPrint, 
    FaArrowLeft, 
    FaUserShield, 
    FaSearch, 
    FaCheckCircle, 
    FaClock,
    FaCalendarAlt
} from 'react-icons/fa';
import PrintableLabReportModal from '../../components/common/PrintableLabReportModal';

function LabResults() {
    const [labTests, setLabTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [printModalTest, setPrintModalTest] = useState(null);

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    useEffect(() => {
        const fetchLabTests = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:8080/api/lab-tests/my', config);
                setLabTests(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Error fetching lab tests:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLabTests();
    }, [config]);

    const filteredLabTests = useMemo(() => {
        return labTests.filter(t => {
            const matchesStatus = statusFilter === 'ALL' || (t.status || '').toUpperCase() === statusFilter;
            if (!matchesStatus) return false;

            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            const name = (t.testName || '').toLowerCase();
            const res = (t.result || '').toLowerCase();
            return name.includes(term) || res.includes(term) || String(t.id).includes(term);
        });
    }, [labTests, statusFilter, searchTerm]);

    return (
        <div className="pb-14 max-w-7xl mx-auto space-y-6 px-3 sm:px-6">
            {/* Top Navigation & Title */}
            <div>
                <Link
                    to="/patient/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition mb-3"
                >
                    <FaArrowLeft size={11} /> Back to Dashboard
                </Link>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                                <FaFlask size={20} />
                            </span>
                            My Diagnostic Lab Results
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Review pathology analysis, specimen findings, and print authorized laboratory reports
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shadow-2xs">
                        <FaUserShield size={12} className="text-amber-600" /> Patient Privacy Isolation Active
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
                        placeholder="Search by test name or result..."
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        {['ALL', 'COMPLETED', 'PENDING'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition capitalize ${
                                    statusFilter === f
                                        ? 'bg-white text-amber-800 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {f.toLowerCase()}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">({filteredLabTests.length})</span>
                </div>
            </div>

            {/* Lab Table View */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200/80">
                {loading ? (
                    <div className="py-16 text-center text-slate-400 text-xs sm:text-sm">Loading lab results...</div>
                ) : filteredLabTests.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <FaFlask className="mx-auto text-5xl text-slate-300 mb-3" />
                        <h3 className="text-base font-bold text-slate-800">No lab results found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                            {searchTerm ? 'No laboratory tests matched your search.' : 'Tests requested by your physician will appear here once registered.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                                    <th className="p-4">Test Name</th>
                                    <th className="p-4">Requested Date</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Result Summary</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLabTests.map((test) => {
                                    const isCompleted = (test.status || '').toUpperCase() === 'COMPLETED';
                                    return (
                                        <tr key={test.id} className="hover:bg-slate-50/70 transition">
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-900">{test.testName}</div>
                                                <span className="text-[11px] text-slate-400">Order #{test.id}</span>
                                            </td>
                                            <td className="p-4 text-slate-600 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <FaCalendarAlt className="text-slate-400" size={11} />
                                                    {test.requestedAt ? new Date(test.requestedAt).toLocaleDateString([], {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    }) : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                    isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {isCompleted ? <FaCheckCircle size={10} /> : <FaClock size={10} />}
                                                    {test.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs">
                                                {test.result ? (
                                                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                                                        {test.result}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">Processing at laboratory...</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {isCompleted ? (
                                                    <button
                                                        onClick={() => setPrintModalTest(test)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-semibold transition shadow-2xs"
                                                        title="Print official diagnostic report"
                                                    >
                                                        <FaPrint size={11} /> Print Report
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Pending Results</span>
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

            {/* Printable Lab Report Modal */}
            {printModalTest && (
                <PrintableLabReportModal
                    test={printModalTest}
                    onClose={() => setPrintModalTest(null)}
                />
            )}
        </div>
    );
}

export default LabResults;
