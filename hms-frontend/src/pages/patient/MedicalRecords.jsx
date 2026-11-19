import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaNotesMedical, 
    FaArrowLeft, 
    FaUserShield, 
    FaSearch, 
    FaUserMd, 
    FaStethoscope,
    FaCalendarAlt,
    FaPrescriptionBottleAlt
} from 'react-icons/fa';

function MedicalRecords() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    useEffect(() => {
        const fetchRecords = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:8080/api/medical-records/my', config);
                setRecords(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Error fetching records:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, [config]);

    const filteredRecords = useMemo(() => {
        if (!searchTerm.trim()) return records;
        const term = searchTerm.toLowerCase();
        return records.filter(r => {
            const diag = (r.diagnosis || '').toLowerCase();
            const rx = (r.prescription || '').toLowerCase();
            const doc = `${r.doctor?.firstName || ''} ${r.doctor?.lastName || ''}`.toLowerCase();
            return diag.includes(term) || rx.includes(term) || doc.includes(term);
        });
    }, [records, searchTerm]);

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
                            <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <FaNotesMedical size={20} />
                            </span>
                            My Medical Records
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Secure archive of your clinical diagnoses, physician notes, and prescription regimens
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
                        <FaUserShield size={12} className="text-emerald-600" /> Patient Privacy Isolation Active
                    </div>
                </div>
            </div>

            {/* Search Toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search diagnosis, doctor, or medication..."
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                </div>
                <div className="text-xs font-semibold text-slate-500">
                    Total Records: <strong className="text-slate-800">{filteredRecords.length}</strong>
                </div>
            </div>

            {/* Records Content */}
            {loading ? (
                <div className="py-16 text-center text-slate-400 text-xs sm:text-sm">
                    Loading your medical history...
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
                    <FaNotesMedical className="mx-auto text-5xl text-slate-300 mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No medical records found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {searchTerm ? 'No medical records matched your search query.' : 'Clinical records documented by attending doctors will appear here securely.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredRecords.map((record) => (
                        <div 
                            key={record.id} 
                            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start gap-3 mb-3">
                                    <div>
                                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full mb-1.5">
                                            Clinical Diagnosis
                                        </span>
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                                            {record.diagnosis}
                                        </h3>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-xl flex-shrink-0">
                                        <FaCalendarAlt size={10} className="text-slate-400" />
                                        {record.recordDate ? new Date(record.recordDate).toLocaleDateString([], {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        }) : 'N/A'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-600 mb-4 pb-3 border-b border-slate-100">
                                    <FaUserMd className="text-emerald-600" />
                                    <span>
                                        Attending Physician: <strong className="text-slate-800">Dr. {record.doctor ? `${record.doctor.firstName} ${record.doctor.lastName}` : 'Hospital Staff'}</strong>
                                    </span>
                                </div>

                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs">
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                                        <FaStethoscope className="text-emerald-700" /> Prescribed Medications & Instructions:
                                    </div>
                                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        {record.prescription || 'No medications listed for this consultation.'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                                <span>Record ID: #{record.id}</span>
                                <span className="text-emerald-600 font-medium">Verified by HMS Clinical Staff</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MedicalRecords;
