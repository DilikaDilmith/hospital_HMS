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
    FaArrowRight,
    FaPlus,
    FaTrashAlt,
    FaExclamationTriangle
} from "react-icons/fa";
import { Link } from "react-router-dom";

function PharmacistPrescriptions() {
    const [records, setRecords] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeRecord, setActiveRecord] = useState(null);
    const [dispenseItems, setDispenseItems] = useState([
        { medicineId: '', quantity: '10' }
    ]);
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

    // Open Dispense Modal with multi-drug matching
    const handleOpenDispenseModal = (record) => {
        setActiveRecord(record);
        const matched = [];
        if (record.prescription && medicines.length > 0) {
            const lines = record.prescription
                .split(/[\n;•\r]+/)
                .map(s => s.trim().toLowerCase())
                .filter(Boolean);

            medicines.forEach(m => {
                const medNameLower = m.name.toLowerCase();
                const firstWord = medNameLower.split(' ')[0];
                const isMentioned = lines.some(line => 
                    (firstWord.length >= 3 && line.includes(firstWord)) || line.includes(medNameLower)
                );
                if (isMentioned && !matched.some(it => String(it.medicineId) === String(m.id))) {
                    matched.push({
                        medicineId: String(m.id),
                        quantity: '10'
                    });
                }
            });
        }

        if (matched.length === 0) {
            matched.push({
                medicineId: medicines.length > 0 ? String(medicines[0].id) : '',
                quantity: '10'
            });
        }

        setDispenseItems(matched);
    };

    const handleAddDispenseItem = () => {
        const usedIds = new Set(dispenseItems.map(it => String(it.medicineId)));
        const available = medicines.find(m => !usedIds.has(String(m.id)));
        setDispenseItems(prev => [
            ...prev,
            {
                medicineId: available ? String(available.id) : (medicines.length > 0 ? String(medicines[0].id) : ''),
                quantity: '10'
            }
        ]);
    };

    const handleRemoveDispenseItem = (index) => {
        if (dispenseItems.length <= 1) return;
        setDispenseItems(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleUpdateDispenseItem = (index, field, value) => {
        setDispenseItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const calculateDispenseBill = () => {
        let total = 0;
        dispenseItems.forEach(item => {
            const med = medicines.find(m => String(m.id) === String(item.medicineId));
            const qty = parseInt(item.quantity || '0', 10);
            if (med && !isNaN(qty) && qty > 0) {
                total += Number(med.price || 0) * qty;
            }
        });
        return total;
    };

    // Handle dispensing with FEFO batch deduction and auto-billing for multiple drugs
    const handleDispenseSubmit = async (e) => {
        e.preventDefault();

        if (dispenseItems.length === 0) {
            alert("Please add at least one medication to dispense.");
            return;
        }

        for (let i = 0; i < dispenseItems.length; i++) {
            const item = dispenseItems[i];
            if (!item.medicineId) {
                alert(`Please select an inventory drug for medication #${i + 1}.`);
                return;
            }
            const qty = parseInt(item.quantity, 10);
            if (isNaN(qty) || qty <= 0) {
                alert(`Quantity for medication #${i + 1} must be at least 1 unit.`);
                return;
            }
            const med = medicines.find(m => String(m.id) === String(item.medicineId));
            if (med && (med.stockQuantity || 0) < qty) {
                alert(`Insufficient stock for ${med.name}! Available: ${med.stockQuantity} units, Requested: ${qty}.`);
                return;
            }
        }

        const selectedIds = dispenseItems.map(it => it.medicineId);
        if (new Set(selectedIds).size !== selectedIds.length) {
            alert("Duplicate medicines detected in dispense list. Please adjust quantities into a single item.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                items: dispenseItems.map(it => ({
                    medicineId: parseInt(it.medicineId, 10),
                    quantity: parseInt(it.quantity, 10)
                }))
            };

            await axios.put(
                `http://localhost:8080/api/medical-records/${activeRecord.id}/dispense`,
                payload,
                config
            );

            const totalCharged = calculateDispenseBill();
            alert(`Prescription #${activeRecord.id} marked as DISPENSED! ${dispenseItems.length} medication(s) deducted from earliest expiring batches (FEFO) and LKR ${totalCharged.toFixed(2)} auto-billed to patient's active Invoice.`);
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
                                            onClick={() => handleOpenDispenseModal(record)}
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

            {/* Multi-Drug Dispense Modal with FEFO deduction */}
            {activeRecord && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col my-6 max-h-[92vh]">
                        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white p-5 sm:p-6 flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-teal-200">
                                    <FaPrescription size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Dispense Prescription</h3>
                                    <p className="text-xs text-teal-100">Multi-drug FEFO batch deduction & billing</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveRecord(null)}
                                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleDispenseSubmit} className="p-5 sm:p-6 flex flex-col gap-4 text-xs sm:text-sm overflow-y-auto">
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Patient</span>
                                <span className="font-extrabold text-slate-900 text-sm block">
                                    {activeRecord.patient ? `${activeRecord.patient.firstName} ${activeRecord.patient.lastName}` : 'Walk-in Patient'}
                                </span>
                                <div className="mt-2 p-2.5 bg-teal-50 rounded-xl border border-teal-100 text-teal-900">
                                    <span className="font-bold text-[11px] text-teal-700 block mb-0.5">Doctor's Prescribed Medications:</span>
                                    <p className="font-medium text-xs whitespace-pre-wrap">{activeRecord.prescription || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Section: Multi-Drug Dispensing List */}
                            <div>
                                <div className="flex justify-between items-center mb-2.5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <FaPills className="text-teal-600" /> Dispensed Medications ({dispenseItems.length}) *
                                        </label>
                                        <span className="text-[11px] text-slate-400">Match one or more drugs from hospital inventory</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddDispenseItem}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold transition shadow-2xs"
                                    >
                                        <FaPlus size={10} /> Add Another Drug
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {dispenseItems.map((item, idx) => {
                                        const currentMed = medicines.find(m => String(m.id) === String(item.medicineId));
                                        const qtyNum = parseInt(item.quantity || '0', 10);
                                        const validQty = (!isNaN(qtyNum) && qtyNum > 0) ? qtyNum : 0;
                                        const lineSubtotal = currentMed ? (Number(currentMed.price || 0) * validQty) : 0;
                                        const isOutOfStock = currentMed && (currentMed.stockQuantity || 0) < validQty;

                                        return (
                                            <div 
                                                key={idx} 
                                                className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col gap-3 transition hover:border-teal-200"
                                            >
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                                                        Drug #{idx + 1}
                                                    </span>
                                                    {dispenseItems.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveDispenseItem(idx)}
                                                            className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition flex items-center gap-1 text-[11px] font-semibold"
                                                            title="Remove drug"
                                                        >
                                                            <FaTrashAlt size={11} /> Remove
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                                                    <div className="sm:col-span-8">
                                                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                            Select Inventory Drug *
                                                        </label>
                                                        <select
                                                            value={item.medicineId}
                                                            onChange={(e) => handleUpdateDispenseItem(idx, 'medicineId', e.target.value)}
                                                            required
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs text-slate-800 transition"
                                                        >
                                                            <option value="">-- Choose Formulary Item --</option>
                                                            {medicines.map(m => (
                                                                <option key={m.id} value={m.id}>
                                                                    {m.name} (Stock: {m.stockQuantity} • LKR {Number(m.price || 0).toFixed(2)}/unit)
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {currentMed && (
                                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                                <span className={currentMed.stockQuantity < 30 ? 'text-amber-600 font-semibold' : ''}>
                                                                    Available: {currentMed.stockQuantity} units
                                                                </span>
                                                                <span>•</span>
                                                                <span>Unit Price: LKR {Number(currentMed.price || 0).toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="sm:col-span-4">
                                                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                                            Quantity (Units) *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => handleUpdateDispenseItem(idx, 'quantity', e.target.value)}
                                                            required
                                                            placeholder="e.g. 10"
                                                            className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 transition text-xs text-slate-800 ${
                                                                isOutOfStock 
                                                                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500' 
                                                                    : 'border-slate-300 focus:ring-teal-500/20 focus:border-teal-500'
                                                            }`}
                                                        />
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-[11px] font-bold text-teal-700">
                                                                = LKR {lineSubtotal.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isOutOfStock && (
                                                    <div className="text-[11px] text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                                                        <FaExclamationTriangle size={11} />
                                                        <span>Quantity exceeds available stock ({currentMed.stockQuantity} units).</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Price preview */}
                            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200/70 text-xs space-y-2">
                                <div className="flex justify-between items-center border-b border-emerald-200/60 pb-2">
                                    <div>
                                        <span className="font-bold text-emerald-950 text-sm block">Total Medical Bill</span>
                                        <span className="text-emerald-700 text-[11px]">
                                            Itemized across {dispenseItems.length} medication(s)
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-emerald-700 uppercase font-bold block">Charge to Patient Invoice</span>
                                        <span className="font-extrabold text-lg text-emerald-950">
                                            LKR {calculateDispenseBill().toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-[11px] text-emerald-800 flex items-start gap-1.5 pt-0.5">
                                    <FaCheckCircle className="text-emerald-600 text-xs flex-shrink-0 mt-0.5" />
                                    <span>
                                        Each drug is automatically deducted from its earliest expiring non-expired batch (FEFO) and billed atomically onto the patient's active hospital invoice.
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
                                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    <FaCheckCircle size={12} /> {isSubmitting ? 'Dispensing...' : `Confirm & Bill (LKR ${calculateDispenseBill().toFixed(2)})`}
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
