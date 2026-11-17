import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaFlask, 
    FaPlus, 
    FaSearch, 
    FaSync, 
    FaCheckCircle, 
    FaExclamationCircle, 
    FaUserInjured, 
    FaCalendarAlt, 
    FaFileAlt,
    FaHourglassHalf,
    FaVial
} from 'react-icons/fa';
import OrderLabTestModal from '../../components/doctor/OrderLabTestModal';

function DoctorLabRequests() {
    const [labTests, setLabTests] = useState([]);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

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
            setError("Failed to load laboratory requests.");
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
        const result = (test.result || '').toLowerCase();

        return patientName.includes(query) || patientNic.includes(query) || testName.includes(query) || result.includes(query);
    });

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
                    PROCESSING IN LAB
                </span>
            );
        } else if (s === 'COMPLETED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    RESULT READY
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

    // Calculate metrics
    const requestedCount = labTests.filter(t => (t.status || '').toUpperCase() === 'REQUESTED').length;
    const processingCount = labTests.filter(t => (t.status || '').toUpperCase() === 'SAMPLE_COLLECTED').length;
    const completedCount = labTests.filter(t => (t.status || '').toUpperCase() === 'COMPLETED').length;

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
                        <FaFlask className="text-orange-500" /> Diagnostic Lab Requests
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Order pathology tests and review clinical findings in real time. Total: <span className="font-semibold text-orange-600">{labTests.length}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={fetchLabTests}
                        title="Refresh Tests"
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                    >
                        <FaSync size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowOrderModal(true)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition"
                    >
                        <FaPlus size={12} /> Order Lab Test
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2">
                    <FaExclamationCircle className="text-red-500" />
                    <span>{error}</span>
                </div>
            )}

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Sample Pending</span>
                        <div className="text-2xl font-extrabold text-amber-600 mt-1">{requestedCount}</div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">Awaiting specimen collection</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <FaHourglassHalf size={20} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">In Processing</span>
                        <div className="text-2xl font-extrabold text-blue-600 mt-1">{processingCount}</div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">Under analyzer inspection</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FaVial size={20} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Results Ready</span>
                        <div className="text-2xl font-extrabold text-emerald-600 mt-1">{completedCount}</div>
                        <span className="text-[11px] text-emerald-500 mt-0.5 block">Auto-billed & finalized</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <FaCheckCircle size={20} />
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="relative w-full sm:w-80">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input 
                        type="text"
                        placeholder="Search patient, NIC, test name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {['ALL', 'REQUESTED', 'SAMPLE_COLLECTED', 'COMPLETED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                statusFilter === status
                                    ? 'bg-orange-600 text-white shadow-sm'
                                    : 'bg-slate-100 hover:bg-slate-200 text-gray-700'
                            }`}
                        >
                            {status === 'ALL' ? 'All Tests' : status.replace('_', ' ')}
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
                                <th className="p-4">Test ID</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Test Name</th>
                                <th className="p-4">Ordered Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Result Findings</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTests.length > 0 ? (
                                filteredTests.map((test) => (
                                    <tr key={test.id} className="hover:bg-slate-50/80 transition">
                                        <td className="p-4 font-bold text-orange-600">
                                            #LAB-{test.id}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
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
                                            <span className="block text-[11px] text-gray-400 font-normal">
                                                Fee: LKR {Number(test.testFee || 2500).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            <div className="flex items-center gap-1.5">
                                                <FaCalendarAlt className="text-gray-400" size={11} />
                                                <span>{test.requestedAt ? new Date(test.requestedAt).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(test.status)}
                                        </td>
                                        <td className="p-4">
                                            {test.result ? (
                                                <span className="line-clamp-2 text-gray-800 font-medium bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-100">
                                                    {test.result}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">
                                                    {test.status === 'SAMPLE_COLLECTED' ? 'Analyzing sample...' : 'Awaiting collection...'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => setSelectedTest(test)}
                                                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 mx-auto"
                                            >
                                                <FaFileAlt size={11} /> Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-gray-400">
                                        No laboratory requests found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Modal */}
            {showOrderModal && (
                <OrderLabTestModal
                    onClose={() => setShowOrderModal(false)}
                    onTestOrdered={fetchLabTests}
                />
            )}

            {/* Test Details Modal */}
            {selectedTest && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 p-6 text-sm">
                        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Lab Test #{selectedTest.id}</h3>
                                <p className="text-xs text-orange-600 font-semibold">{selectedTest.testName}</p>
                            </div>
                            {getStatusBadge(selectedTest.status)}
                        </div>

                        <div className="space-y-3 mb-5">
                            <div className="bg-slate-50 p-3 rounded-xl">
                                <span className="text-xs text-gray-400 block font-medium">Patient</span>
                                <span className="font-semibold text-gray-800">
                                    {selectedTest.patient ? `${selectedTest.patient.firstName} ${selectedTest.patient.lastName}` : 'N/A'}
                                </span>
                            </div>

                            {selectedTest.clinicalNotes && (
                                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                                    <span className="text-xs text-blue-700 block font-medium">Doctor's Clinical Notes</span>
                                    <p className="text-xs text-blue-900 mt-1">{selectedTest.clinicalNotes}</p>
                                </div>
                            )}

                            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                                <span className="text-xs text-emerald-700 block font-medium">Final Diagnostic Findings</span>
                                <p className="text-sm font-bold text-emerald-950 mt-1">
                                    {selectedTest.result || 'Results have not been uploaded by lab staff yet.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setSelectedTest(null)}
                                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DoctorLabRequests;