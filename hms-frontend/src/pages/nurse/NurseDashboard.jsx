import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaBed, 
    FaUserNurse, 
    FaUserInjured, 
    FaSync, 
    FaCalendarAlt, 
    FaHeartbeat, 
    FaCheckCircle, 
    FaHospital,
    FaSignOutAlt,
    FaSearch
} from 'react-icons/fa';
import DischargeModal from '../../components/inpatient/DischargeModal';

function NurseDashboard() {
    const [admissions, setAdmissions] = useState([]);
    const [beds, setBeds] = useState([]);
    const [selectedAdmissionToDischarge, setSelectedAdmissionToDischarge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [aRes, bRes] = await Promise.all([
                axios.get('http://localhost:8080/api/admissions/active', config),
                axios.get('http://localhost:8080/api/wards/beds', config)
            ]);
            setAdmissions(Array.isArray(aRes.data) ? aRes.data : []);
            setBeds(Array.isArray(bRes.data) ? bRes.data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error loading nurse dashboard data:", err);
            setError("Failed to load active inpatients.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter active patients
    const filteredAdmissions = admissions.filter(a => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const pName = a.patient ? `${a.patient.firstName || ''} ${a.patient.lastName || ''}`.toLowerCase() : '';
        const pNic = a.patient?.nic?.toLowerCase() || '';
        const bedNum = a.bed?.bedNumber?.toLowerCase() || '';
        const wardName = a.bed?.ward?.name?.toLowerCase() || '';
        return pName.includes(q) || pNic.includes(q) || bedNum.includes(q) || wardName.includes(q);
    });

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length;
    const availableBeds = beds.filter(b => b.status === 'AVAILABLE').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return (
        <div className="pb-10">
            {/* Header Banner */}
            <div className="mb-8 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-purple-200 shadow-inner">
                        <FaUserNurse size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold tracking-tight">
                            Nurse Station & Inpatient Ward
                        </h2>
                        <p className="text-xs text-purple-200 mt-1">
                            Monitor patient vitals, manage bed occupancy, and coordinate physician discharge orders.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={fetchData}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border border-white/20 transition backdrop-blur-md"
                >
                    <FaSync size={12} className={loading ? 'animate-spin' : ''} /> Refresh Station
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-semibold">
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-purple-700 uppercase tracking-wider">Admitted Inpatients</span>
                        <div className="text-2xl font-extrabold text-purple-800 mt-1">{admissions.length}</div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">Under continuous nursing care</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <FaUserInjured size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Ward Occupancy Rate</span>
                        <div className="text-2xl font-extrabold text-blue-700 mt-1">{occupancyRate}%</div>
                        <span className="text-[11px] text-blue-500 mt-0.5 block">{occupiedBeds} of {totalBeds} total beds filled</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FaBed size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Available Beds</span>
                        <div className="text-2xl font-extrabold text-emerald-600 mt-1">{availableBeds}</div>
                        <span className="text-[11px] text-emerald-500 mt-0.5 block">Sanitized & ready for intake</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <FaCheckCircle size={22} />
                    </div>
                </div>
            </div>

            {/* Inpatient Roster Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <FaHeartbeat className="text-rose-500" /> Active Inpatients Under Ward Care
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Real-time roster of admitted patients across all wards.
                        </p>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        <input 
                            type="text"
                            placeholder="Filter patients, beds, wards..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-gray-600 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Bed & Location</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Admission Reason</th>
                                <th className="p-4">Attending Physician</th>
                                <th className="p-4">Admitted Since</th>
                                <th className="p-4 text-center">Nursing Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAdmissions.length > 0 ? (
                                filteredAdmissions.map((adm) => {
                                    const admDate = adm.admissionDate ? new Date(adm.admissionDate) : new Date();
                                    const daysSoFar = Math.max(1, Math.ceil(Math.abs(new Date() - admDate) / (1000 * 60 * 60 * 24)));
                                    return (
                                        <tr key={adm.id} className="hover:bg-slate-50/80 transition">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                        <FaBed size={13} />
                                                    </div>
                                                    <div>
                                                        <span className="font-extrabold text-sm text-purple-900 block">
                                                            {adm.bed?.bedNumber || 'Bed'}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500">
                                                            {adm.bed?.ward?.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900 text-sm">
                                                    {adm.patient ? `${adm.patient.firstName} ${adm.patient.lastName}` : 'N/A'}
                                                </div>
                                                <span className="text-[11px] text-gray-400">
                                                    NIC: {adm.patient?.nic || 'N/A'} • Phone: {adm.patient?.phoneNumber || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-4 max-w-xs">
                                                <span className="line-clamp-2 text-gray-800 font-medium bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                                    {adm.admissionReason || 'Clinical observation'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-semibold text-gray-800 block">
                                                    Dr. {adm.doctor ? `${adm.doctor.firstName} ${adm.doctor.lastName}` : 'Physician'}
                                                </span>
                                                <span className="text-[11px] text-gray-400">
                                                    {adm.doctor?.specialization}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <FaCalendarAlt className="text-gray-400" size={11} />
                                                    <span>{adm.admissionDate ? new Date(adm.admissionDate).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                                <span className="text-[11px] text-purple-700 font-semibold block mt-0.5">
                                                    Day {daysSoFar} of stay
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => setSelectedAdmissionToDischarge(adm)}
                                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 mx-auto shadow-sm"
                                                >
                                                    <FaSignOutAlt size={11} /> Discharge Patient
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-gray-400">
                                        No active inpatients in the ward currently.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Discharge Modal */}
            {selectedAdmissionToDischarge && (
                <DischargeModal
                    admission={selectedAdmissionToDischarge}
                    onClose={() => setSelectedAdmissionToDischarge(null)}
                    onDischarged={fetchData}
                />
            )}
        </div>
    );
}

export default NurseDashboard;
