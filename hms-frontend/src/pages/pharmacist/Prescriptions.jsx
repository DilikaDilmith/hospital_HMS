import { useState, useEffect } from "react";
import axios from "axios";
import { 
    FaPrescription, 
    FaCheckCircle, 
    FaBoxes, 
    FaSync, 
    FaUserInjured, 
    FaUserMd, 
    FaCalendarAlt, 
    FaPills, 
    FaExclamationCircle,
    FaTimes,
    FaArrowRight
} from "react-icons/fa";
import { Link } from "react-router-dom";

function PharmacistPrescriptions() {
    const [records, setRecords] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeRecord, setActiveRecord] = useState(null);
    const [dispenseForm, setDispenseForm] = useState({
        medicineId: '',
        quantity: '10'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchRecords = async () => {
        setLoading(true);
        setError('');
        try {
            const [recRes, medRes] = await Promise.all([
                axios.get("http://localhost:8080/api/medical-records/all-records", config),
                axios.get("http://localhost:8080/api/medicines", config)
            ]);
            setRecords(Array.isArray(recRes.data) ? recRes.data : []);
            setMedicines(Array.isArray(medRes.data) ? medRes.data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching prescriptions:", err);
            setError("Failed to load patient prescriptions.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    // Handle dispensing with FEFO batch deduction and auto-billing
    const handleDispenseSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                medicineId: dispenseForm.medicineId ? parseInt(dispenseForm.medicineId, 10) : null,
                quantity: dispenseForm.quantity ? parseInt(dispenseForm.quantity, 10) : null
            };

            await axios.put(
                `http://localhost:8080/api/medical-records/${activeRecord.id}/dispense`,
                payload,
                config
            );

            alert("Prescription marked as DISPENSED! Deducted from earliest expiring batch (FEFO) and auto-billed to patient's active Invoice.");
            setActiveRecord(null);
            setIsSubmitting(false);
            fetchRecords();
        } catch (err) {
            console.error("Error dispensing record:", err);
            const msg = err.response?.data?.message || err.response?.data || "Failed to dispense prescription.";
            alert("Dispense Error: " + msg);
            setIsSubmitting(false);
        }
    };

    const selectedMed = medicines.find(m => String(m.id) === String(dispenseForm.medicineId));

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
                        <FaPrescription className="text-teal-600" /> Pharmacy Dispensing & Prescriptions
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Review doctor prescriptions, execute FEFO batch deductions, and bill dispensed medicines. Total: <span className="font-semibold text-teal-600">{records.length}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        to="/pharmacist/batches"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition"
                    >
                        <FaBoxes className="text-teal-600" size={13} /> View Batches (FEFO)
                    </Link>
                    <button 
                        onClick={fetchRecords}
                        title="Refresh Prescriptions"
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                    >
                        <FaSync size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-semibold">
                    {error}
                </div>
            )}

            {/* Prescriptions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {records.length > 0 ? (
                    records.map((record) => {
                        const isDispensed = (record.status || '').toUpperCase() === 'DISPENSED';
                        return (
                            <div
                                key={record.id}
                                className={`bg-white rounded-2xl p-6 shadow-sm border transition flex flex-col justify-between ${
                                    isDispensed ? 'border-slate-200 bg-slate-50/50' : 'border-teal-300 ring-1 ring-teal-100'
                                }`}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                                isDispensed ? 'bg-slate-200 text-slate-600' : 'bg-teal-100 text-teal-700'
                                            }`}>
                                                <FaUserInjured size={14} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900">
                                                    {record.patient
                                                        ? `${record.patient.firstName} ${record.patient.lastName}`
                                                        : "Unknown Patient"}
                                                </h3>
                                                <p className="text-[11px] text-gray-400">
                                                    {record.patient?.nic ? `NIC: ${record.patient.nic} • ` : ''}ID: #{record.patient?.id}
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                            isDispensed
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {isDispensed ? 'DISPENSED' : 'PENDING'}
                                        </span>
                                    </div>

                                    {/* Doctor & Date */}
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <span className="flex items-center gap-1.5 font-medium text-gray-700">
                                            <FaUserMd className="text-teal-600" />
                                            Dr. {record.doctor ? `${record.doctor.firstName} ${record.doctor.lastName}` : "Attending Doctor"}
                                        </span>
                                        <span className="flex items-center gap-1 text-gray-400">
                                            <FaCalendarAlt size={10} />
                                            {record.recordDate ? new Date(record.recordDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>

                                    {/* Clinical Details */}
                                    <div className="space-y-2 mb-4 text-xs">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <span className="font-semibold text-gray-500 block mb-0.5">Diagnosis</span>
                                            <span className="font-medium text-gray-900">{record.diagnosis || "General Consultation"}</span>
                                        </div>

                                        <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-100 text-teal-950">
                                            <span className="font-semibold text-teal-700 block mb-0.5 flex items-center gap-1">
                                                <FaPills size={11} /> Prescribed Medicines:
                                            </span>
                                            <p className="font-medium text-teal-900 whitespace-pre-wrap">{record.prescription || "No medicine instructions"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="pt-3 border-t border-slate-100">
                                    {!isDispensed ? (
                                        <button
                                            onClick={() => {
                                                setActiveRecord(record);
                                                // Try finding matching medicine in inventory
                                                const match = medicines.find(m => 
                                                    record.prescription && record.prescription.toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
                                                );
                                                setDispenseForm({
                                                    medicineId: match ? String(match.id) : (medicines.length > 0 ? String(medicines[0].id) : ''),
                                                    quantity: '10'
                                                });
                                            }}
                                            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl font-semibold text-xs transition flex justify-center items-center gap-2 shadow-sm"
                                        >
                                            <FaCheckCircle size={12} /> Dispense & Auto-Bill
                                        </button>
                                    ) : (
                                        <div className="text-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-100 flex items-center justify-center gap-1.5">
                                            <FaCheckCircle size={11} /> Dispensed & Added to Invoice
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-2 text-center text-gray-400 py-16 bg-white rounded-2xl border border-slate-200">
                        <FaPrescription size={40} className="mx-auto mb-2 text-gray-300" />
                        <p className="font-semibold text-gray-700 text-sm">No prescriptions found</p>
                        <p className="text-xs text-gray-400 mt-0.5">When doctors enter prescriptions, they will appear here for batch dispensing.</p>
                    </div>
                )}
            </div>

            {/* Dispense Modal with FEFO deduction */}
            {activeRecord && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-teal-200">
                                    <FaPrescription size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Dispense Prescription</h3>
                                    <p className="text-xs text-teal-100">FEFO batch deduction & billing</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveRecord(null)}
                                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleDispenseSubmit} className="p-6 flex flex-col gap-4 text-sm">
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <span className="text-xs text-gray-400 font-medium block">Patient</span>
                                <span className="font-bold text-gray-900 block">
                                    {activeRecord.patient ? `${activeRecord.patient.firstName} ${activeRecord.patient.lastName}` : 'N/A'}
                                </span>
                                <span className="text-xs text-teal-800 font-medium mt-1 block">
                                    Rx: {activeRecord.prescription}
                                </span>
                            </div>

                            {/* Select Medicine from inventory */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <FaPills className="text-teal-600" /> Match Inventory Drug *
                                </label>
                                <select 
                                    value={dispenseForm.medicineId} 
                                    onChange={(e) => setDispenseForm({ ...dispenseForm, medicineId: e.target.value })} 
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs text-gray-800 transition"
                                >
                                    <option value="">-- Generic Prescription (No batch deduction) --</option>
                                    {medicines.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} (Stock: {m.stockQuantity} • LKR {m.price}/unit)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Dispense Quantity (Units) *
                                </label>
                                <input 
                                    type="number"
                                    min="1"
                                    value={dispenseForm.quantity}
                                    onChange={(e) => setDispenseForm({ ...dispenseForm, quantity: e.target.value })}
                                    required
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-xs text-gray-800 transition"
                                />
                            </div>

                            {/* Price preview */}
                            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 flex justify-between items-center text-xs">
                                <div>
                                    <span className="font-semibold text-emerald-900 block">FEFO Deduction & Auto-Billing</span>
                                    <span className="text-emerald-700 text-[11px]">Deducts automatically from earliest expiring batch</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-sm text-emerald-950">
                                        LKR {selectedMed 
                                            ? (selectedMed.price * parseInt(dispenseForm.quantity || '0', 10)).toFixed(2) 
                                            : '1,200.00'}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setActiveRecord(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
                                >
                                    <FaCheckCircle size={12} /> {isSubmitting ? 'Dispensing...' : 'Confirm & Bill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PharmacistPrescriptions;
