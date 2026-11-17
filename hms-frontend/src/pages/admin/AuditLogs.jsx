import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaHistory, 
    FaSearch, 
    FaCheckCircle, 
    FaTimesCircle, 
    FaShieldAlt, 
    FaSyncAlt, 
    FaUser, 
    FaFilter,
    FaFileInvoiceDollar,
    FaUserInjured,
    FaUserTie,
    FaNotesMedical
} from 'react-icons/fa';

function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterResult, setFilterResult] = useState('ALL');
    const [filterCategory, setFilterCategory] = useState('ALL');

    const token = localStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:8080/api/audit-logs', authHeader);
            setLogs(res.data);
        } catch (err) {
            console.error("Error fetching audit logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    // Filter logs
    const filteredLogs = logs.filter(log => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' ||
            (log.username && log.username.toLowerCase().includes(query)) ||
            (log.action && log.action.toLowerCase().includes(query)) ||
            (log.details && log.details.toLowerCase().includes(query));

        const matchesResult = filterResult === 'ALL' || log.result === filterResult;

        let matchesCategory = true;
        if (filterCategory === 'LOGIN') {
            matchesCategory = log.action && log.action.includes('LOGIN');
        } else if (filterCategory === 'PATIENT') {
            matchesCategory = log.action && log.action.includes('PATIENT');
        } else if (filterCategory === 'BILLING') {
            matchesCategory = log.action && log.action.includes('INVOICE');
        } else if (filterCategory === 'STAFF') {
            matchesCategory = log.action && (log.action.includes('STAFF') || log.action.includes('LEAVE'));
        } else if (filterCategory === 'CLINICAL') {
            matchesCategory = log.action && log.action.includes('MEDICAL_RECORD');
        }

        return matchesSearch && matchesResult && matchesCategory;
    });

    const totalSuccess = logs.filter(l => l.result === 'SUCCESS').length;
    const totalFailed = logs.filter(l => l.result === 'FAILED').length;
    const uniqueActors = new Set(logs.map(l => l.username)).size;

    const getActionBadgeColor = (action = '') => {
        if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (action.includes('PATIENT')) return 'bg-cyan-100 text-cyan-800 border-cyan-200';
        if (action.includes('INVOICE')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (action.includes('STAFF') || action.includes('LEAVE')) return 'bg-purple-100 text-purple-800 border-purple-200';
        if (action.includes('MEDICAL')) return 'bg-amber-100 text-amber-800 border-amber-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="pb-12 max-w-7xl mx-auto animate-fade-in">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3">
                        <FaShieldAlt className="text-indigo-400" /> Security & System Audit Trail
                    </h1>
                    <p className="text-indigo-200 text-sm mt-1">
                        Track system activities, user authentication, patient records, billing modifications, and HR actions.
                    </p>
                </div>

                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 text-sm transition"
                >
                    <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh Logs
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Total Audited Events</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{logs.length}</h3>
                        <p className="text-xs text-indigo-600 mt-1 font-medium">Logged system actions</p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                        <FaHistory size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Successful Actions</p>
                        <h3 className="text-2xl font-black text-emerald-600 mt-1">{totalSuccess}</h3>
                        <p className="text-xs text-emerald-700 mt-1 font-medium">Authorized operations</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                        <FaCheckCircle size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Failed / Blocked</p>
                        <h3 className="text-2xl font-black text-rose-600 mt-1">{totalFailed}</h3>
                        <p className="text-xs text-rose-700 mt-1 font-medium">Auth failures or rejections</p>
                    </div>
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-xl">
                        <FaTimesCircle size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Unique Actors</p>
                        <h3 className="text-2xl font-black text-blue-600 mt-1">{uniqueActors}</h3>
                        <p className="text-xs text-blue-700 mt-1 font-medium">Distinct users recorded</p>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                        <FaUser size={24} />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="relative w-full md:w-80">
                        <FaSearch className="absolute left-3.5 top-3 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search by user, action, details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <FaFilter size={11} /> Category:
                            </label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="border rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="ALL">All Categories</option>
                                <option value="LOGIN">User Logins</option>
                                <option value="PATIENT">Patient Records</option>
                                <option value="BILLING">Billing & Invoicing</option>
                                <option value="STAFF">Staff & Leaves</option>
                                <option value="CLINICAL">Clinical Entries</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Result:</label>
                            <select
                                value={filterResult}
                                onChange={(e) => setFilterResult(e.target.value)}
                                className="border rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="ALL">All Results</option>
                                <option value="SUCCESS">SUCCESS</option>
                                <option value="FAILED">FAILED</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="text-center py-12 text-gray-500 font-medium">Loading audit logs...</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <FaShieldAlt className="mx-auto text-4xl mb-3 opacity-40 text-indigo-400" />
                        <p className="text-base font-semibold">No audit logs found</p>
                        <p className="text-sm mt-1">Actions performed in the system will automatically appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 font-semibold border-b">
                                    <th className="py-3 px-4 w-44">Date / Time</th>
                                    <th className="py-3 px-4 w-36">User</th>
                                    <th className="py-3 px-4 w-48">Action</th>
                                    <th className="py-3 px-4 w-28">Result</th>
                                    <th className="py-3 px-4">Event Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-indigo-50/30 transition">
                                        <td className="py-3 px-4 text-gray-600 font-mono text-xs whitespace-nowrap">
                                            {log.timestamp}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-gray-900">
                                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-xs">
                                                <FaUser size={10} className="text-slate-500" />
                                                {log.username}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getActionBadgeColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                log.result === 'SUCCESS'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {log.result === 'SUCCESS' ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                                                {log.result}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-700 text-xs">
                                            {log.details || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Compliance Footer Banner */}
            <div className="mt-6 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-3">
                <FaShieldAlt className="text-indigo-600 mt-0.5 flex-shrink-0" size={16} />
                <div>
                    <span className="font-bold">Security & Compliance Policy:</span> All access attempts, patient profile updates, billing modifications, and employee management events are logged in an immutable audit trail. In accordance with healthcare information privacy standards, passwords, authorization tokens, and confidential patient diagnoses are strictly redacted and never recorded in audit logs.
                </div>
            </div>
        </div>
    );
}

export default AuditLogs;
