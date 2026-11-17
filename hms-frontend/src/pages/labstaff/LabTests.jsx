import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaFlask, 
    FaCheckCircle, 
    FaVial, 
    FaSearch, 
    FaSync, 
    FaUserInjured, 
    FaCalendarAlt, 
    FaFileInvoiceDollar, 
    FaHourglassHalf, 
    FaEdit,
    FaTimes
} from 'react-icons/fa';

function LabTests() {
    const [labTests, setLabTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [activeModalTest, setActiveModalTest] = useState(null);
    const [resultInput, setResultInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchLabTests = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://localhost:8080/api/lab-tests', config);
            setLabTests(Array.isArray(response.data) ? response.data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching lab tests:", err);
            setError("Failed to load laboratory tests.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabTests();
    }, []);

    // Filter tests
    const filteredTests = labTests.filter(test => {
        const query = searchQuery.toLowerCase().trim();
        const matchesStatus = statusFilter === 'ALL' || (test.status || '').toUpperCase() === statusFilter;
        if (!matchesStatus) return false;
        if (!query) return true;

        const patientName = test.patient ? `${test.patient.firstName || ''} ${test.patient.lastName || ''}`.toLowerCase() : '';
        const patientNic = test.patient?.nic?.toLowerCase() || '';
        const testName = (test.testName || '').toLowerCase();

        return patientName.includes(query) || patientNic.includes(query) || testName.includes(query);
    });

    // 1. Collect Sample Action: REQUESTED -> SAMPLE_COLLECTED
    const handleCollectSample = async (id) => {
        if (!window.confirm("Confirm specimen/sample collection for Test #" + id + "?")) return;
        try {
            await axios.put(`http://localhost:8080/api/lab-tests/${id}/collect-sample`, {}, config);
            fetchLabTests();
        } catch (err) {
            console.error("Error collecting sample:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || "Failed to update sample collection status.";
            alert(msg);
        }
    };

    // 2. Submit Final Result & Complete: SAMPLE_COLLECTED -> COMPLETED (Auto-Bills to Patient)
    const handleCompleteTest = async (e) => {
        e.preventDefault();
        if (!resultInput.trim()) {
            alert("Please enter diagnostic test findings before submitting.");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.put(`http://localhost:8080/api/lab-tests/${activeModalTest.id}/complete`, 
                { result: resultInput.trim() }, 
                config
            );
            alert("Test finalized! Test charge has been automatically added to the patient's active Invoice.");
            setActiveModalTest(null);
            setResultInput('');
            setIsSubmitting(false);
            fetchLabTests();
        } catch (err) {
            console.error("Error finalizing test:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || "Failed to submit results. Please verify connection.";
            alert(msg);
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        if (s === 'REQUESTED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    SAMPLE PENDING
                </span>
            );
        } else if (s === 'SAMPLE_COLLECTED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    SAMPLE COLLECTED
                </span>
            );
        } else if (s === 'COMPLETED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    COMPLETED & BILLED
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    {status}
                </span>
            );
        }
    };

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
                        <FaFlask className="text-cyan-600" /> Laboratory Processing
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Manage specimen collections, enter analyzer results, and auto-bill completed tests.
                    </p>
                </div>

                <button 
                    onClick={fetchLabTests}
                    title="Refresh Tests"
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                >
                    <FaSync size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-semibold">
                    {error}
                </div>
            )}

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="relative w-full sm:w-80">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input 
                        type="text"
                        placeholder="Search patient, NIC, test name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {['ALL', 'REQUESTED', 'SAMPLE_COLLECTED', 'COMPLETED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                statusFilter === status
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'bg-slate-100 hover:bg-slate-200 text-gray-700'
                            }`}
                        >
                            {status === 'ALL' ? 'All Requests' : status.replace('_', ' ')}
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
                                <th className="p-4">Test #</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Test Name</th>
                                <th className="p-4">Fee (LKR)</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Result Findings</th>
                                <th className="p-4 text-center">Workflow Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTests.length > 0 ? (
                                filteredTests.map((test) => (
                                    <tr key={test.id} className="hover:bg-slate-50/80 transition">
                                        <td className="p-4 font-bold text-cyan-700">
                                            #LAB-{test.id}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                    <FaUserInjured size={13} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-sm">
                                                        {test.patient ? `${test.patient.firstName || ''} ${test.patient.lastName || ''}`.trim() : 'Patient'}
                                                    </div>
                                                    {test.patient?.nic && (
                                                        <div className="text-[11px] text-gray-400">
                                                            NIC: {test.patient.nic}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-gray-800">
                                            {test.testName}
                                        </td>
                                        <td className="p-4 font-bold text-gray-900">
                                            LKR {Number(test.testFee || 2500).toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(test.status)}
                                        </td>
                                        <td className="p-4 max-w-xs">
                                            {test.result ? (
                                                <span className="line-clamp-2 text-gray-800 font-medium bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                                                    {test.result}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">Pending analysis...</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {test.status === 'REQUESTED' && (
                                                    <button
                                                        onClick={() => handleCollectSample(test.id)}
                                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
                                                    >
                                                        <FaVial size={11} /> Collect Sample
                                                    </button>
                                                )}

                                                {test.status === 'SAMPLE_COLLECTED' && (
                                                    <button
                                                        onClick={() => {
                                                            setActiveModalTest(test);
                                                            setResultInput(test.result || '');
                                                        }}
                                                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
                                                    >
                                                        <FaEdit size={11} /> Enter Results & Bill
                                                    </button>
                                                )}

                                                {test.status === 'COMPLETED' && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                        <FaFileInvoiceDollar size={11} /> Billed to Invoice
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-gray-400">
                                        No laboratory requests currently found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Result Entry Modal */}
            {activeModalTest && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                        <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-cyan-200">
                                    <FaFlask size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Submit Diagnostic Results</h3>
                                    <p className="text-xs text-cyan-100">{activeModalTest.testName} - #{activeModalTest.id}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveModalTest(null)}
                                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCompleteTest} className="p-6 flex flex-col gap-4 text-sm">
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <span className="text-xs text-gray-500 font-medium block">Patient Name</span>
                                <span className="font-bold text-gray-800 text-sm">
                                    {activeModalTest.patient ? `${activeModalTest.patient.firstName} ${activeModalTest.patient.lastName}` : 'N/A'}
                                </span>
                                <span className="text-xs text-cyan-700 block mt-1 font-semibold">
                                    Billed Amount: LKR {Number(activeModalTest.testFee || 2500).toFixed(2)}
                                </span>
                            </div>

                            {activeModalTest.clinicalNotes && (
                                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-xs text-blue-900">
                                    <span className="font-semibold block text-blue-800 mb-0.5">Doctor Instructions:</span>
                                    {activeModalTest.clinicalNotes}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Diagnostic Findings / Values *
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Enter complete numerical values, reference ranges, and technician remarks (e.g., Hemoglobin: 14.2 g/dL, WBC: 7,500 /uL, Platelets: 250,000 /uL - Normal limits)."
                                    value={resultInput}
                                    onChange={(e) => setResultInput(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none text-xs text-gray-800 transition"
                                />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setActiveModalTest(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
                                >
                                    <FaCheckCircle size={12} /> {isSubmitting ? 'Finalizing...' : 'Finalize & Auto-Bill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LabTests;