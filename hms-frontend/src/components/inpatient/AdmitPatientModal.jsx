import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaBed, FaUserInjured, FaUserMd, FaNotesMedical, FaPlus } from 'react-icons/fa';

function AdmitPatientModal({ onClose, onPatientAdmitted }) {
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [availableBeds, setAvailableBeds] = useState([]);
    const [formData, setFormData] = useState({
        patientId: '',
        doctorId: '',
        bedId: '',
        admissionReason: ''
    });
    const [loadingData, setLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, dRes, bRes] = await Promise.all([
                    axios.get('http://localhost:8080/api/patients', config),
                    axios.get('http://localhost:8080/api/doctors', config),
                    axios.get('http://localhost:8080/api/wards/beds/available', config)
                ]);
                setPatients(Array.isArray(pRes.data) ? pRes.data : []);
                setDoctors(Array.isArray(dRes.data) ? dRes.data : []);
                setAvailableBeds(Array.isArray(bRes.data) ? bRes.data : []);
                setLoadingData(false);
            } catch (err) {
                console.error("Error loading admission form data:", err);
                const status = err.response?.status;
                const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || err.message;
                if (status === 403) {
                    setError(`Permission Denied (403): Your account does not have permission to load admission data (${msg}). Please restart the backend server or log in with an authorized account.`);
                } else if (status === 401) {
                    setError("Session expired (401). Please log in again.");
                } else {
                    setError(`Failed to load patients, doctors, or available beds: ${msg || "Server unreachable. Please ensure the backend is running."}`);
                }
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId || !formData.doctorId || !formData.bedId) {
            setError("Please select patient, attending doctor, and an available bed.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const payload = {
                patient: { id: parseInt(formData.patientId, 10) },
                doctor: { id: parseInt(formData.doctorId, 10) },
                bed: { id: parseInt(formData.bedId, 10) },
                admissionReason: formData.admissionReason.trim()
            };

            await axios.post('http://localhost:8080/api/admissions', payload, config);
            if (onPatientAdmitted) onPatientAdmitted();
            onClose();
        } catch (err) {
            console.error("Error admitting patient:", err);
            const msg = err.response?.data?.message || err.response?.data || "Failed to admit patient. Please check details.";
            setError(typeof msg === 'string' ? msg : "Admission error");
            setIsSubmitting(false);
            // Re-fetch available beds to update dropdown if bed was claimed concurrently
            try {
                const bRes = await axios.get('http://localhost:8080/api/wards/beds/available', config);
                setAvailableBeds(Array.isArray(bRes.data) ? bRes.data : []);
            } catch (ignore) {}
        }
    };

    const selectedBed = availableBeds.find(b => String(b.id) === String(formData.bedId));

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-cyan-300">
                            <FaBed size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Inpatient Admission</h3>
                            <p className="text-xs text-blue-200">Assign hospital bed and register inpatient care</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-sm">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    {/* Patient Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FaUserInjured className="text-blue-600" /> Patient *
                        </label>
                        <select 
                            value={formData.patientId} 
                            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} 
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs text-gray-800 transition"
                        >
                            <option value="">-- Choose Patient --</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName} {p.nic ? `(NIC: ${p.nic})` : ''} - #{p.id}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Doctor Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FaUserMd className="text-emerald-600" /> Attending Doctor *
                        </label>
                        <select 
                            value={formData.doctorId} 
                            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })} 
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs text-gray-800 transition"
                        >
                            <option value="">-- Choose Attending Doctor --</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>
                                    Dr. {d.firstName} {d.lastName} ({d.specialization})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Bed Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FaBed className="text-purple-600" /> Available Bed Assignment *
                        </label>
                        <select 
                            value={formData.bedId} 
                            onChange={(e) => setFormData({ ...formData, bedId: e.target.value })} 
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs text-gray-800 transition"
                        >
                            <option value="">-- Select Available Bed --</option>
                            {availableBeds.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.bedNumber} ({b.ward ? b.ward.name : 'Ward'} • LKR {b.effectiveDailyRate || b.dailyRate || 2500}/day)
                                </option>
                            ))}
                        </select>
                        {availableBeds.length === 0 && !loadingData && (
                            <span className="text-[11px] text-amber-600 font-semibold block mt-1">
                                No beds currently available. Please check maintenance or discharge patients first.
                            </span>
                        )}
                    </div>

                    {/* Rate preview */}
                    {selectedBed && (
                        <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex justify-between items-center text-xs">
                            <span className="text-blue-900 font-medium">Daily Ward Rate:</span>
                            <span className="font-bold text-blue-950">
                                LKR {Number(selectedBed.effectiveDailyRate || selectedBed.dailyRate || 2500).toFixed(2)} / day
                            </span>
                        </div>
                    )}

                    {/* Admission Reason / Diagnosis */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FaNotesMedical className="text-amber-500" /> Admission Reason / Diagnosis *
                        </label>
                        <textarea 
                            rows={3}
                            placeholder="e.g. Post-operative recovery, severe acute gastroenteritis, pneumonia observation."
                            value={formData.admissionReason} 
                            onChange={(e) => setFormData({ ...formData, admissionReason: e.target.value })} 
                            required
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs text-gray-800 transition"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 mt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || availableBeds.length === 0}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
                        >
                            <FaPlus size={11} /> {isSubmitting ? 'Admitting...' : 'Admit Patient'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdmitPatientModal;
