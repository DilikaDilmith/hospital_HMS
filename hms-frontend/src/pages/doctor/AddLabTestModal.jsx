import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaFlask, 
    FaTimes, 
    FaUserInjured, 
    FaCalendarAlt, 
    FaMoneyBillWave, 
    FaClipboardList, 
    FaExclamationCircle, 
    FaSpinner, 
    FaCheck, 
    FaVial,
    FaInfoCircle
} from 'react-icons/fa';

function AddLabTestModal({ appointment, onClose, onTestRequested }) {
    const commonTests = [
        { name: 'Full Blood Count (FBC)', fee: 2500.0, category: 'Hematology' },
        { name: 'Lipid Profile (Cholesterol & Triglycerides)', fee: 3500.0, category: 'Biochemistry' },
        { name: 'Fasting Blood Glucose (FBS)', fee: 1500.0, category: 'Endocrinology' },
        { name: 'HbA1c (Glycated Hemoglobin)', fee: 2800.0, category: 'Diabetes Care' },
        { name: 'Liver Function Test (LFT)', fee: 4000.0, category: 'Hepatology' },
        { name: 'Renal Function Test (Creatinine & Urea)', fee: 3000.0, category: 'Nephrology' },
        { name: 'Serum Electrolytes (Na+, K+, Cl-)', fee: 3200.0, category: 'Critical Care' },
        { name: 'Urine Full Report (UFR)', fee: 1800.0, category: 'Urinalysis' },
        { name: 'Thyroid Stimulating Hormone (TSH)', fee: 3800.0, category: 'Endocrinology' },
        { name: 'Dengue NS1 Antigen & IgM/IgG', fee: 3200.0, category: 'Virology' },
        { name: 'Chest X-Ray (PA View)', fee: 3500.0, category: 'Radiology' },
        { name: 'Electrocardiogram (ECG)', fee: 2000.0, category: 'Cardiology' }
    ];

    const [selectedPreset, setSelectedPreset] = useState(commonTests[0].name);
    const [customTestName, setCustomTestName] = useState('');
    const [testFee, setTestFee] = useState(commonTests[0].fee.toFixed(2));
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [isCustom, setIsCustom] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [serverError, setServerError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Close on Escape, submit on Ctrl+Enter
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
    }, [selectedPreset, isCustom, customTestName, testFee, clinicalNotes]);

    const handlePresetChange = (e) => {
        const val = e.target.value;
        if (val === 'CUSTOM') {
            setIsCustom(true);
            setTestFee('2500.00');
        } else {
            setIsCustom(false);
            setSelectedPreset(val);
            const matched = commonTests.find(t => t.name === val);
            if (matched) {
                setTestFee(matched.fee.toFixed(2));
            }
        }
        if (formErrors.testName) {
            setFormErrors(prev => {
                const u = { ...prev };
                delete u.testName;
                return u;
            });
        }
        if (serverError) setServerError('');
    };

    const handleQuickPresetClick = (testObj) => {
        setIsCustom(false);
        setSelectedPreset(testObj.name);
        setTestFee(testObj.fee.toFixed(2));
        if (formErrors.testName) {
            setFormErrors(prev => {
                const u = { ...prev };
                delete u.testName;
                return u;
            });
        }
    };

    const appendNoteTemplate = (template) => {
        setClinicalNotes(prev => {
            const current = prev ? prev.trim() : '';
            return current ? `${current}\n• ${template}` : `• ${template}`;
        });
    };

    const validateForm = () => {
        const errors = {};
        const effectiveName = isCustom ? customTestName.trim() : selectedPreset.trim();

        if (!effectiveName) {
            errors.testName = 'Please select or enter a valid diagnostic test name.';
        } else if (effectiveName.length < 3) {
            errors.testName = 'Test name must be at least 3 characters long.';
        }

        const feeNum = parseFloat(testFee);
        if (isNaN(feeNum) || feeNum < 0) {
            errors.testFee = 'Please enter a valid laboratory test fee (cannot be negative).';
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
            const effectiveName = isCustom ? customTestName.trim() : selectedPreset.trim();

            const payload = {
                testName: effectiveName,
                testFee: parseFloat(testFee),
                clinicalNotes: clinicalNotes ? clinicalNotes.trim() : '',
                status: 'REQUESTED',
                patient: appointment.patient?.id ? { id: appointment.patient.id } : null,
                doctor: appointment.doctor?.id ? { id: appointment.doctor.id } : null
            };

            await axios.post('http://localhost:8080/api/lab-tests', payload, config);

            if (onTestRequested) onTestRequested();
            onClose();
        } catch (error) {
            console.error("Error requesting lab test:", error);
            const msg = error.response?.data?.message || 
                (typeof error.response?.data === 'string' ? error.response.data : null) || 
                'Failed to request laboratory test. Please verify appointment details and try again.';
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col my-6 max-h-[90vh]">
                
                {/* 1. Gradient Modal Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-5 sm:p-6 flex justify-between items-center flex-shrink-0">
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

                    <div className="relative z-10 flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
                            <FaFlask size={22} className="text-amber-100" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">Request Laboratory Test</h3>
                            <p className="text-xs text-amber-100 mt-0.5">
                                Order diagnostic investigation for hospital pathology processing
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

                {/* 2. Scrollable Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                    
                    {/* Patient Context Card */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                <FaUserInjured size={16} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient</span>
                                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                                    {patientName}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                                    {appointment?.patient?.id && (
                                        <span className="font-mono font-semibold text-amber-600">ID: #{appointment.patient.id}</span>
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
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Appointment Slot</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1 sm:justify-end mt-0.5">
                                    <FaCalendarAlt size={11} className="text-amber-500" />
                                    {new Date(appointment.appointmentDateTime).toLocaleDateString([], {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    })}
                                </span>
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
                        
                        {/* Field 1: Diagnostic Test Selection */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <FaVial className="text-amber-600" /> Diagnostic Test Profile <span className="text-rose-500">*</span>
                                </label>
                                <span className="text-[11px] text-slate-400">Pathology Formulary</span>
                            </div>

                            <select
                                value={isCustom ? 'CUSTOM' : selectedPreset}
                                onChange={handlePresetChange}
                                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition text-slate-800 ${
                                    formErrors.testName 
                                        ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' 
                                        : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'
                                }`}
                            >
                                <optgroup label="Standard Hospital Diagnostic Tests">
                                    {commonTests.map((t, idx) => (
                                        <option key={idx} value={t.name}>
                                            {t.name} — LKR {t.fee.toFixed(2)} ({t.category})
                                        </option>
                                    ))}
                                </optgroup>
                                <option value="CUSTOM">+ Specify Other / Custom Test Name...</option>
                            </select>

                            {/* Custom test input if chosen */}
                            {isCustom && (
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        value={customTestName}
                                        onChange={(e) => setCustomTestName(e.target.value)}
                                        placeholder="Enter specific laboratory test name..."
                                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                                        autoFocus
                                    />
                                </div>
                            )}

                            {formErrors.testName && (
                                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                                    <FaExclamationCircle size={10} /> {formErrors.testName}
                                </p>
                            )}

                            {/* Quick Select Test Chips */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <span className="text-[11px] font-medium text-slate-400 mr-0.5">Quick select:</span>
                                {commonTests.slice(0, 6).map((t, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleQuickPresetClick(t)}
                                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition border ${
                                            !isCustom && selectedPreset === t.name
                                                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                                                : 'bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        + {t.name.split(' (')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Field 2: Laboratory Test Fee */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <FaMoneyBillWave className="text-emerald-600" /> Standard Test Fee (LKR) <span className="text-rose-500">*</span>
                                </label>
                                <span className="text-[11px] text-slate-400">Auto-billed on result completion</span>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                                    Rs.
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={testFee}
                                    onChange={(e) => setTestFee(e.target.value)}
                                    className={`w-full pl-11 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition text-slate-800 ${
                                        formErrors.testFee 
                                            ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' 
                                            : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                                    }`}
                                />
                            </div>

                            {formErrors.testFee && (
                                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                                    <FaExclamationCircle size={10} /> {formErrors.testFee}
                                </p>
                            )}
                        </div>

                        {/* Field 3: Clinical Indications & Special Instructions (Optional) */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <FaClipboardList className="text-blue-600" /> Clinical Indications & Lab Instructions
                                </label>
                                <span className="text-[11px] text-slate-400">Optional</span>
                            </div>

                            <textarea
                                rows="3"
                                value={clinicalNotes}
                                onChange={(e) => setClinicalNotes(e.target.value)}
                                placeholder="e.g. Fasting 10-12 hours prior to draw, suspected Dengue fever, STAT analysis required..."
                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                            />

                            {/* Quick Instructions Chips */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <span className="text-[11px] font-medium text-slate-400 mr-0.5">Quick instructions:</span>
                                {[
                                    '10-12 hrs Fasting Required',
                                    'STAT / Urgent Processing',
                                    'Suspected Dengue Infection',
                                    'Post-Prandial (2 hrs post-meal)',
                                    'Routine Health Screening'
                                ].map(note => (
                                    <button
                                        key={note}
                                        type="button"
                                        onClick={() => appendNoteTemplate(note)}
                                        className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-[11px] font-semibold transition border border-blue-200"
                                    >
                                        + {note}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Informative Note */}
                        <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-2xl flex items-start gap-2.5 text-amber-800 text-[11px] leading-relaxed">
                            <FaInfoCircle className="text-amber-600 text-sm flex-shrink-0 mt-0.5" />
                            <div>
                                This diagnostic order will be queued immediately in the laboratory workstation with status <strong>REQUESTED</strong>. Laboratory staff can collect specimens, perform diagnostics, and record findings.
                            </div>
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
                                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold transition text-xs sm:text-sm shadow-md shadow-orange-600/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <FaSpinner className="animate-spin" /> Submitting Order...
                                    </>
                                ) : (
                                    <>
                                        <FaCheck size={12} /> Request Lab Test
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

export default AddLabTestModal;
