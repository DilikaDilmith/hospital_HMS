import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaBed, 
    FaPlus, 
    FaSearch, 
    FaSync, 
    FaUserInjured, 
    FaUserMd, 
    FaCalendarAlt, 
    FaCheckCircle, 
    FaExclamationTriangle, 
    FaTools, 
    FaSignOutAlt, 
    FaClock,
    FaHospital
} from 'react-icons/fa';
import AdmitPatientModal from '../../components/inpatient/AdmitPatientModal';
import DischargeModal from '../../components/inpatient/DischargeModal';

function InpatientManagement() {
    const [wards, setWards] = useState([]);
    const [beds, setBeds] = useState([]);
    const [admissions, setAdmissions] = useState([]);
    const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE', 'BED_MAP', 'HISTORY'
    const [showAdmitModal, setShowAdmitModal] = useState(false);
    const [selectedAdmissionToDischarge, setSelectedAdmissionToDischarge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchAllData = async () => {
        setLoading(true);
        setError('');
        try {
            const [wRes, bRes, aRes] = await Promise.all([
                axios.get('http://localhost:8080/api/wards', config),
                axios.get('http://localhost:8080/api/wards/beds', config),
                axios.get('http://localhost:8080/api/admissions', config)
            ]);
            setWards(Array.isArray(wRes.data) ? wRes.data : []);
            setBeds(Array.isArray(bRes.data) ? bRes.data : []);
            setAdmissions(Array.isArray(aRes.data) ? aRes.data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error loading inpatient data:", err);
            setError("Failed to fetch inpatient and bed roster details.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Bed status toggle (e.g. MAINTENANCE / AVAILABLE)
    const handleToggleMaintenance = async (bed) => {
        const nextStatus = bed.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
        if (bed.status === 'OCCUPIED') {
            alert("Cannot place an occupied bed into maintenance. Discharge the patient first.");
            return;
        }
        try {
            await axios.put(`http://localhost:8080/api/wards/beds/${bed.id}/status`, 
                { status: nextStatus }, 
                config
            );
            fetchAllData();
        } catch (err) {
            console.error("Error toggling bed status:", err);
            alert("Failed to update bed status.");
        }
    };

    // Metrics
    const totalBeds = beds.length;
    const availableBeds = beds.filter(b => b.status === 'AVAILABLE').length;
    const occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length;
    const maintenanceBeds = beds.filter(b => b.status === 'MAINTENANCE').length;

    const activeAdmissions = admissions.filter(a => a.status === 'ADMITTED');
    const pastAdmissions = admissions.filter(a => a.status === 'DISCHARGED');

    // Filter active admissions
    const filteredActive = activeAdmissions.filter(a => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const pName = a.patient ? `${a.patient.firstName || ''} ${a.patient.lastName || ''}`.toLowerCase() : '';
        const pNic = a.patient?.nic?.toLowerCase() || '';
        const bedNum = a.bed?.bedNumber?.toLowerCase() || '';
        const dName = a.doctor ? `${a.doctor.firstName || ''} ${a.doctor.lastName || ''}`.toLowerCase() : '';
        return pName.includes(q) || pNic.includes(q) || bedNum.includes(q) || dName.includes(q);
    });

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
                        <FaBed className="text-blue-600" /> Inpatient (IPD) & Ward Management
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Track hospital wards, manage bed allocations, admit patients, and automate stay billing.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={fetchAllData}
                        title="Refresh Data"
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                    >
                        <FaSync size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowAdmitModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition"
                    >
                        <FaPlus size={12} /> Admit Patient
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-semibold">
                    {error}
                </div>
            )}

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Beds</span>
                        <div className="text-2xl font-extrabold text-gray-900 mt-1">{totalBeds}</div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">{wards.length} hospital wards</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FaHospital size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Available Beds</span>
                        <div className="text-2xl font-extrabold text-emerald-600 mt-1">{availableBeds}</div>
                        <span className="text-[11px] text-emerald-500 mt-0.5 block">Ready for admission</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <FaCheckCircle size={20} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Occupied Beds</span>
                        <div className="text-2xl font-extrabold text-blue-700 mt-1">{occupiedBeds}</div>
                        <span className="text-[11px] text-blue-500 mt-0.5 block">Admitted inpatients</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FaBed size={20} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">In Maintenance</span>
                        <div className="text-2xl font-extrabold text-amber-600 mt-1">{maintenanceBeds}</div>
                        <span className="text-[11px] text-amber-500 mt-0.5 block">Cleaning / Sanitizing</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <FaTools size={18} />
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
                <button
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeTab === 'ACTIVE'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-gray-700'
                    }`}
                >
                    <FaUserInjured size={12} /> Active Inpatients ({activeAdmissions.length})
                </button>
                <button
                    onClick={() => setActiveTab('BED_MAP')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeTab === 'BED_MAP'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-gray-700'
                    }`}
                >
                    <FaBed size={12} /> Ward & Bed Roster Map
                </button>
                <button
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeTab === 'HISTORY'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-gray-700'
                    }`}
                >
                    <FaClock size={12} /> Discharge History ({pastAdmissions.length})
                </button>
            </div>

            {/* TAB 1: ACTIVE INPATIENTS */}
            {activeTab === 'ACTIVE' && (
                <div>
                    {/* Search Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex justify-between items-center">
                        <div className="relative w-full sm:w-80">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                            <input 
                                type="text"
                                placeholder="Search admitted patient, bed, doctor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-gray-600 font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Admission #</th>
                                        <th className="p-4">Patient</th>
                                        <th className="p-4">Bed & Ward</th>
                                        <th className="p-4">Attending Doctor</th>
                                        <th className="p-4">Admission Date</th>
                                        <th className="p-4">Stay Reason</th>
                                        <th className="p-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredActive.length > 0 ? (
                                        filteredActive.map((adm) => {
                                            const admDate = adm.admissionDate ? new Date(adm.admissionDate) : new Date();
                                            const daysSoFar = Math.max(1, Math.ceil(Math.abs(new Date() - admDate) / (1000 * 60 * 60 * 24)));
                                            return (
                                                <tr key={adm.id} className="hover:bg-slate-50/80 transition">
                                                    <td className="p-4 font-bold text-blue-700">
                                                        #ADM-{adm.id}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                                <FaUserInjured size={13} />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 text-sm">
                                                                    {adm.patient ? `${adm.patient.firstName || ''} ${adm.patient.lastName || ''}`.trim() : 'Patient'}
                                                                </div>
                                                                {adm.patient?.nic && (
                                                                    <div className="text-[11px] text-gray-400">
                                                                        NIC: {adm.patient.nic}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-bold text-gray-800 block text-xs">
                                                            {adm.bed?.bedNumber || 'Bed'}
                                                        </span>
                                                        <span className="text-[11px] text-blue-600 font-medium">
                                                            {adm.bed?.ward?.name || 'General Ward'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-medium text-gray-800 block">
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
                                                        <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
                                                            Day {daysSoFar} of stay
                                                        </span>
                                                    </td>
                                                    <td className="p-4 max-w-xs text-gray-700">
                                                        <span className="line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                                            {adm.admissionReason || 'Clinical observation'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => setSelectedAdmissionToDischarge(adm)}
                                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition flex items-center gap-1.5 mx-auto shadow-sm"
                                                        >
                                                            <FaSignOutAlt size={11} /> Discharge & Bill
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="p-12 text-center text-gray-400">
                                                No patients currently admitted in the inpatient wards.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: WARD & BED ROSTER MAP */}
            {activeTab === 'BED_MAP' && (
                <div className="space-y-6">
                    {wards.map((ward) => (
                        <div key={ward.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <FaHospital className="text-blue-600" /> {ward.name}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Classification: <span className="font-semibold text-blue-700">{ward.type}</span> • Daily Rate: <span className="font-bold text-gray-800">LKR {Number(ward.dailyRate || 2500).toFixed(2)}/day</span>
                                    </p>
                                </div>
                                <span className="text-xs bg-slate-100 text-gray-700 px-3 py-1 rounded-full font-semibold">
                                    {beds.filter(b => b.ward?.id === ward.id).length} Beds Total
                                </span>
                            </div>

                            {/* Beds Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {beds.filter(b => b.ward?.id === ward.id).map((bed) => {
                                    const isAvail = bed.status === 'AVAILABLE';
                                    const isOcc = bed.status === 'OCCUPIED';
                                    const isMaint = bed.status === 'MAINTENANCE';

                                    return (
                                        <div 
                                            key={bed.id}
                                            className={`p-3.5 rounded-2xl border flex flex-col justify-between transition ${
                                                isAvail ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' :
                                                isOcc ? 'bg-blue-50/70 border-blue-200 text-blue-950' :
                                                'bg-slate-100 border-slate-300 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-extrabold text-sm">{bed.bedNumber}</span>
                                                <span className={`w-2 h-2 rounded-full ${
                                                    isAvail ? 'bg-emerald-500 animate-pulse' :
                                                    isOcc ? 'bg-blue-600' : 'bg-slate-400'
                                                }`} />
                                            </div>

                                            <div className="text-[11px] font-bold mb-2">
                                                <span className={`px-2 py-0.5 rounded-md ${
                                                    isAvail ? 'bg-emerald-200/60 text-emerald-800' :
                                                    isOcc ? 'bg-blue-200/60 text-blue-800' :
                                                    'bg-slate-200 text-slate-800'
                                                }`}>
                                                    {bed.status}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleToggleMaintenance(bed)}
                                                disabled={isOcc}
                                                className={`text-[10px] font-semibold py-1 px-2 rounded-lg transition ${
                                                    isOcc ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-500' :
                                                    isMaint ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                                                    'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                                }`}
                                            >
                                                {isMaint ? 'Mark Available' : 'Set Maintenance'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 3: DISCHARGE HISTORY */}
            {activeTab === 'HISTORY' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-gray-600 font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Admission #</th>
                                    <th className="p-4">Patient</th>
                                    <th className="p-4">Bed & Ward</th>
                                    <th className="p-4">Admitted</th>
                                    <th className="p-4">Discharged</th>
                                    <th className="p-4">Duration</th>
                                    <th className="p-4">Bed Charge (LKR)</th>
                                    <th className="p-4">Discharge Summary</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pastAdmissions.length > 0 ? (
                                    pastAdmissions.map((adm) => (
                                        <tr key={adm.id} className="hover:bg-slate-50/80 transition">
                                            <td className="p-4 font-bold text-gray-700">
                                                #ADM-{adm.id}
                                            </td>
                                            <td className="p-4 font-semibold text-gray-900">
                                                {adm.patient ? `${adm.patient.firstName} ${adm.patient.lastName}` : 'Patient'}
                                            </td>
                                            <td className="p-4 text-gray-700">
                                                {adm.bed?.bedNumber} ({adm.bed?.ward?.name})
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {adm.admissionDate ? new Date(adm.admissionDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {adm.dischargeDate ? new Date(adm.dischargeDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="p-4 font-bold text-blue-700">
                                                {adm.totalDays || 1} day(s)
                                            </td>
                                            <td className="p-4 font-bold text-emerald-600">
                                                LKR {Number(adm.totalBedCharge || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4 max-w-xs text-gray-600">
                                                <span className="line-clamp-2">{adm.dischargeNotes || 'Satisfactory discharge'}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="p-12 text-center text-gray-400">
                                            No discharge history records logged yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Admit Modal */}
            {showAdmitModal && (
                <AdmitPatientModal
                    onClose={() => setShowAdmitModal(false)}
                    onPatientAdmitted={fetchAllData}
                />
            )}

            {/* Discharge Modal */}
            {selectedAdmissionToDischarge && (
                <DischargeModal
                    admission={selectedAdmissionToDischarge}
                    onClose={() => setSelectedAdmissionToDischarge(null)}
                    onDischarged={fetchAllData}
                />
            )}
        </div>
    );
}

export default InpatientManagement;
