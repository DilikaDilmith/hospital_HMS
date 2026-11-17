import { useState } from 'react';
import axios from 'axios';
import { FaTimes, FaCheckCircle, FaFileInvoiceDollar, FaBed, FaCalendarAlt, FaUserInjured } from 'react-icons/fa';

function DischargeModal({ admission, onClose, onDischarged }) {
    const [dischargeNotes, setDischargeNotes] = useState('Patient recovered satisfactorily. Prescribed oral maintenance medications and advised 1-week follow-up.');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Calculate stay duration
    const admissionDate = admission.admissionDate ? new Date(admission.admissionDate) : new Date();
    const today = new Date();
    const diffTime = Math.abs(today - admissionDate);
    const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const bedRate = admission.bed?.effectiveDailyRate || admission.bed?.dailyRate || 2500.0;
    const estimatedTotal = calculatedDays * bedRate;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await axios.put(`http://localhost:8080/api/admissions/${admission.id}/discharge`, 
                { dischargeNotes: dischargeNotes.trim() }, 
                config
            );
            alert(`Patient successfully discharged! Bed #${admission.bed?.bedNumber} is now AVAILABLE. Accommodation fee of LKR ${estimatedTotal.toFixed(2)} has been automatically billed to the patient's active Invoice.`);
            if (onDischarged) onDischarged();
            onClose();
        } catch (err) {
            console.error("Error discharging patient:", err);
            const msg = err.response?.data?.message || err.response?.data || "Failed to discharge patient.";
            setError(typeof msg === 'string' ? msg : "Discharge failed");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-emerald-200">
                            <FaCheckCircle size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Process Patient Discharge</h3>
                            <p className="text-xs text-emerald-100">Finalize stay, release bed, and auto-bill ward charges</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-sm">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    {/* Patient & Bed Summary */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Patient:</span>
                            <span className="font-bold text-gray-900 text-sm">
                                {admission.patient ? `${admission.patient.firstName} ${admission.patient.lastName}` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Bed Assigned:</span>
                            <span className="font-semibold text-blue-700">
                                {admission.bed?.bedNumber} ({admission.bed?.ward?.name || 'Ward'})
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Admitted Date:</span>
                            <span className="font-medium text-gray-800">
                                {admission.admissionDate ? new Date(admission.admissionDate).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Stay Calculation Card */}
                    <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center text-xs">
                        <div>
                            <span className="font-semibold text-emerald-950 block">Stay Duration & Rate</span>
                            <span className="text-emerald-700 text-[11px]">
                                {calculatedDays} day(s) × LKR {Number(bedRate).toFixed(2)} / day
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-emerald-800 font-medium block">Total Bed Fee</span>
                            <span className="font-extrabold text-base text-emerald-950">
                                LKR {estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Discharge Notes */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Clinical Discharge Notes & Summary *
                        </label>
                        <textarea 
                            rows={3}
                            placeholder="Enter discharge condition, treatment response, and discharge advice..."
                            value={dischargeNotes}
                            onChange={(e) => setDischargeNotes(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-xs text-gray-800 transition"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
                        >
                            <FaCheckCircle size={12} /> {isSubmitting ? 'Processing...' : 'Discharge & Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DischargeModal;
