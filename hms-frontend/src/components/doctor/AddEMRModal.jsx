import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaNotesMedical, 
    FaTimes, 
    FaStethoscope, 
    FaPills, 
    FaClipboardList, 
    FaUserInjured, 
    FaCalendarAlt, 
    FaCheckCircle, 
    FaExclamationCircle, 
    FaSpinner, 
    FaCheck
} from 'react-icons/fa';

function AddEMRModal({ appointment, onClose, onRecordAdded }) {
    const [emrData, setEmrData] = useState({
        diagnosis: '',
        prescription: '',
        treatmentHistory: ''
    });

    const [markAsCompleted, setMarkAsCompleted] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [serverError, setServerError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Close on Escape key and submit on Ctrl+Enter
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleSubmit(e);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [emrData, markAsCompleted]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEmrData(prev => ({ ...prev, [name]: value }));
        
        // Clear field validation error upon typing
        if (formErrors[name]) {
            setFormErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
        if (serverError) setServerError('');
    };

    // Quick preset helpers for prescriptions
    const appendPrescriptionTemplate = (template) => {
        setEmrData(prev => {
            const current = prev.prescription ? prev.prescription.trim() : '';
            const updated = current ? `${current}\n• ${template}` : `• ${template}`;
            return { ...prev, prescription: updated };
        });
        if (formErrors.prescription) {
            setFormErrors(prev => {
                const updated = { ...prev };
                delete updated.prescription;
                return updated;
            });
        }
    };

    // Quick preset helpers for common diagnoses
    const setDiagnosisPreset = (diagnosisName) => {
        setEmrData(prev => ({ ...prev, diagnosis: diagnosisName }));
        if (formErrors.diagnosis) {
            setFormErrors(prev => {
                const updated = { ...prev };
                delete updated.diagnosis;
                return updated;
            });
        }
    };

    // Client-side validation
    const validateForm = () => {
        const errors = {};
        const diag = emrData.diagnosis ? emrData.diagnosis.trim() : '';
        const rx = emrData.prescription ? emrData.prescription.trim() : '';

        if (!diag) {
            errors.diagnosis = 'Clinical diagnosis is required.';
        } else if (diag.length < 3) {
            errors.diagnosis = 'Diagnosis must be at least 3 characters long.';
        }

        if (!rx) {
            errors.prescription = 'Prescription and medication details are required.';
        } else if (rx.length < 5) {
            errors.prescription = 'Prescription details must be at least 5 characters long.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setServerError('');

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Prepare payload for Medical Record (EMR)
            const payload = {
                diagnosis: emrData.diagnosis.trim(),
                prescription: emrData.prescription.trim(),
                treatmentHistory: emrData.treatmentHistory ? emrData.treatmentHistory.trim() : '',
                patient: appointment.patient?.id ? { id: appointment.patient.id } : null,
                doctor: appointment.doctor?.id ? { id: appointment.doctor.id } : null
            };

            await axios.post('http://localhost:8080/api/medical-records', payload, config);

            // 2. Optionally update appointment status to COMPLETED
            if (markAsCompleted && appointment?.id && appointment.status !== 'COMPLETED') {
                try {
                    await axios.put(
                        `http://localhost:8080/api/appointments/${appointment.id}/status`,
                        { status: 'COMPLETED' },
                        config
                    );
                } catch (statusErr) {
                    console.warn("Could not auto-mark appointment as completed:", statusErr);
                }
            }

            if (onRecordAdded) onRecordAdded();
            onClose();
        } catch (error) {
            console.error("Error saving medical record:", error);
            const msg = error.response?.data?.message || 
                (typeof error.response?.data === 'string' ? error.response.data : null) || 
                'Failed to save clinical medical record. Please verify your inputs and try again.';
            setServerError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const patientName = appointment?.patient 
        ? `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim()
        : 'Walk-in / Unregistered Patient';

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col my-6 max-h-[90vh]">
                
                {/* 1. Gradient Modal Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-700 text-white p-5 sm:p-6 flex justify-between items-center flex-shrink-0">
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

                    <div className="relative z-10 flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
                            <FaNotesMedical size={22} className="text-sky-100" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">Add Medical Record (EMR)</h3>
                            <p className="text-xs text-sky-100 mt-0.5">
                                Electronic medical consultation entry & prescription documentation
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="relative z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15"
                        title="Close modal (Esc)"
                    >
                        <FaTimes size={15} />
                    </button>
                </div>

                {/* 2. Scrollable Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                    
                    {/* Patient Context Card */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                <FaUserInjured size={16} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient</span>
                                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                                    {patientName}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                                    {appointment?.patient?.id && (
                                        <span className="font-mono font-semibold text-blue-600">ID: #{appointment.patient.id}</span>
                                    )}
                                    {appointment?.patient?.nic && (
                                        <span>• NIC: {appointment.patient.nic}</span>
                                    )}
                                    {appointment?.patient?.phoneNumber && (
                                        <span>• Tel: {appointment.patient.phoneNumber}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {appointment?.appointmentDateTime && (
                            <div className="text-left sm:text-right bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultation Date</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1 sm:justify-end mt-0.5">
                                    <FaCalendarAlt size={11} className="text-blue-500" />
                                    {new Date(appointment.appointmentDateTime).toLocaleDateString([], {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    })}
                                </span>
                                {appointment.reason && (
                                    <span className="text-[11px] text-slate-500 block mt-0.5 truncate max-w-xs" title={appointment.reason}>
                                        Reason: {appointment.reason}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Server Error Alert */}
                    {serverError && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
                            <FaExclamationCircle className="text-rose-500 text-base flex-shrink-0 mt-0.5" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    {/* Form Controls */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Field 1: Clinical Diagnosis */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <FaStethoscope className="text-blue-600" /> Clinical Diagnosis <span className="text-rose-500">*</span>
                                </label>
                                <span className="text-[11px] text-slate-400">Primary medical finding</span>
                            </div>
                            
                            <div className="relative">
                                <input 
                                    type="text" 
                                    name="diagnosis" 
                                    value={emrData.diagnosis}
                                    onChange={handleChange} 
                                    placeholder="e.g. Viral Upper Respiratory Infection, Essential Hypertension"
                                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition ${
                                        formErrors.diagnosis 
                                            ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' 
                                            : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                                    }`} 
                                    autoFocus
                                />
                            </div>

                            {formErrors.diagnosis && (
                                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                                    <FaExclamationCircle size={10} /> {formErrors.diagnosis}
                                </p>
                            )}

                            {/* Quick Diagnosis Chips */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <span className="text-[11px] font-medium text-slate-400 mr-0.5">Quick presets:</span>
                                {['Viral Fever', 'Hypertension', 'Type 2 Diabetes', 'Acute Gastritis', 'Allergic Rhinitis'].map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDiagnosisPreset(d)}
                                        className="px-2.5 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg text-[11px] font-semibold transition border border-slate-200"
                                    >
                                        + {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Field 2: Prescription & Medication Plan */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <FaPills className="text-emerald-600" /> Prescription & Medication Instructions <span className="text-rose-500">*</span>
                                </label>
                                <span className="text-[11px] text-slate-400">Dosage, frequency, & duration</span>
                            </div>

                            <textarea 
                                name="prescription" 
                                value={emrData.prescription}
                                onChange={handleChange} 
                                rows="3" 
                                placeholder="e.g. Paracetamol 500mg - 1 tablet 3 times daily for 5 days&#10;Amoxicillin 500mg - 1 capsule twice daily after meals for 7 days"
                                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 font-mono leading-relaxed transition ${
                                    formErrors.prescription 
                                        ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' 
                                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                                }`}
                            />

                            {formErrors.prescription && (
                                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                                    <FaExclamationCircle size={10} /> {formErrors.prescription}
                                </p>
                            )}

                            {/* Quick Prescription Chips */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <span className="text-[11px] font-medium text-slate-400 mr-0.5">Quick Rx:</span>
                                {[
                                    'Paracetamol 500mg TDS (3 days)',
                                    'Amoxicillin 500mg BD (5 days)',
                                    'Omeprazole 20mg OD ac (14 days)',
                                    'Cetirizine 10mg Nocte (5 days)',
                                    'Oral Rehydration Salts PRN'
                                ].map(rx => (
                                    <button
                                        key={rx}
                                        type="button"
                                        onClick={() => appendPrescriptionTemplate(rx)}
                                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-semibold transition border border-emerald-200"
                                    >
                                        + {rx.split(' ')[0]} {rx.split(' ')[1]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Field 3: Treatment History & Clinical Notes (Optional) */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <FaClipboardList className="text-purple-600" /> Treatment History & Clinical Notes
                                </label>
                                <span className="text-[11px] text-slate-400">Optional</span>
                            </div>

                            <textarea 
                                name="treatmentHistory" 
                                value={emrData.treatmentHistory}
                                onChange={handleChange} 
                                rows="2" 
                                placeholder="Patient vitals (BP, pulse, temp), known drug allergies, or clinical follow-up advice..."
                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                            />
                        </div>

                        {/* Automation: Mark Appointment as Completed */}
                        <div className="p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-2xl flex items-center justify-between">
                            <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
                                <input 
                                    type="checkbox"
                                    checked={markAsCompleted}
                                    onChange={(e) => setMarkAsCompleted(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 transition cursor-pointer"
                                />
                                <div>
                                    <span className="font-bold text-slate-800 block">Mark consultation as COMPLETED</span>
                                    <span className="text-[11px] text-slate-500">Automatically transitions appointment status from active to completed</span>
                                </div>
                            </label>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                Recommended
                            </span>
                        </div>

                        {/* 3. Action Buttons */}
                        <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition text-xs sm:text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold transition text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <FaSpinner className="animate-spin" /> Saving EMR...
                                    </>
                                ) : (
                                    <>
                                        <FaCheck size={12} /> Save Medical Record
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddEMRModal;
