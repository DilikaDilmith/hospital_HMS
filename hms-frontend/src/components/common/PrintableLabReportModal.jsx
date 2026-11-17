import React from 'react';
import { FaPrint, FaTimes, FaFlask, FaCheckCircle, FaHospital, FaUserMd } from 'react-icons/fa';

function PrintableLabReportModal({ test, onClose }) {
    if (!test) return null;

    const patient = test.patient || {};
    const doctor = test.doctor || {};

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            {/* Modal Box */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8 flex flex-col">
                
                {/* Non-Printable Top Action Toolbar */}
                <div className="no-print bg-slate-900 text-white px-6 py-3.5 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <FaFlask className="text-cyan-400" size={18} />
                        <span className="font-semibold text-sm">
                            Clinical Laboratory Diagnostic Report Preview
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ml-2 bg-emerald-500/20 text-emerald-300">
                            {test.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                        >
                            <FaPrint size={12} /> Print Lab Report
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-slate-800 transition"
                            title="Close"
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>
                </div>

                {/* Printable Document Sheet */}
                <div id="printable-lab-report-content" className="p-8 sm:p-10 bg-white text-gray-800 text-xs sm:text-sm font-sans flex-grow">
                    
                    {/* Header: Hospital & Laboratory Branding */}
                    <div className="border-b-2 border-gray-900 pb-5 mb-6">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-lg bg-cyan-700 text-white flex items-center justify-center">
                                        <FaHospital size={20} />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                                            CITY GENERAL HOSPITAL
                                        </h1>
                                        <p className="text-[11px] sm:text-xs text-cyan-800 font-bold uppercase tracking-wider">
                                            Department of Clinical Pathology & Diagnostic Laboratories
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 text-[11px] text-gray-500 space-y-0.5">
                                    <p>120 Hospital Boulevard, Colombo 07, Sri Lanka</p>
                                    <p>Laboratory Hotline: (+94) 11 269 2222 | lab@citygeneral.lk</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="inline-block px-3 py-1 rounded text-xs font-black uppercase tracking-wider mb-1.5 bg-cyan-50 text-cyan-900 border border-cyan-300">
                                    LABORATORY DIAGNOSTIC REPORT
                                </span>
                                <div className="text-xs text-gray-700 font-mono font-bold">
                                    LAB-{String(test.id).padStart(5, '0')}
                                </div>
                                <div className="text-[11px] text-gray-500 mt-1">
                                    Status: <span className="font-bold text-emerald-700">{test.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Patient and Doctor Demographics Grid */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
                        {/* Patient Demographics */}
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                PATIENT INFORMATION
                            </div>
                            <div>
                                <span className="text-gray-500">Name: </span>
                                <span className="font-bold text-gray-900 text-sm">
                                    {patient.firstName || ''} {patient.lastName || ''}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">Patient ID: </span>
                                <span className="font-mono font-semibold">#PAT-{patient.id || 'N/A'}</span>
                            </div>
                            {patient.nic && (
                                <div>
                                    <span className="text-gray-500">NIC: </span>
                                    <span className="font-mono">{patient.nic}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-gray-500">DOB / Gender: </span>
                                <span>{patient.dateOfBirth || 'N/A'} ({patient.gender || 'N/A'})</span>
                            </div>
                            {patient.phoneNumber && (
                                <div>
                                    <span className="text-gray-500">Phone: </span>
                                    <span>{patient.phoneNumber}</span>
                                </div>
                            )}
                        </div>

                        {/* Referring Doctor & Investigation Dates */}
                        <div className="space-y-1 text-right">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                CLINICAL INVESTIGATION DETAILS
                            </div>
                            <div>
                                <span className="text-gray-500">Referring Doctor: </span>
                                <span className="font-bold text-gray-900">
                                    {doctor.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Attending Consultant'}
                                </span>
                            </div>
                            {doctor.specialization && (
                                <div className="text-gray-600">
                                    <span>Specialization: </span>
                                    <span>{doctor.specialization}</span>
                                </div>
                            )}
                            <div className="pt-1 text-[11px] text-gray-500 space-y-0.5">
                                <div>
                                    <span>Requested: </span>
                                    <span className="font-mono">
                                        {test.requestedAt ? new Date(test.requestedAt).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                                {test.sampleCollectedAt && (
                                    <div>
                                        <span>Sample Collected: </span>
                                        <span className="font-mono">
                                            {new Date(test.sampleCollectedAt).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <span>Result Finalized: </span>
                                    <span className="font-mono font-semibold text-gray-800">
                                        {test.completedAt ? new Date(test.completedAt).toLocaleString() : (test.requestedAt ? new Date(test.requestedAt).toLocaleString() : 'N/A')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Investigation & Clinical Instructions */}
                    <div className="mb-6 bg-cyan-50/50 p-3.5 rounded-xl border border-cyan-100 text-xs">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider block">
                                    TEST INVESTIGATION
                                </span>
                                <span className="text-base font-extrabold text-cyan-950">
                                    {test.testName}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Billed Charge</span>
                                <span className="text-xs font-mono font-bold text-gray-800">
                                    LKR {Number(test.testFee || 2500).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        {test.clinicalNotes && (
                            <div className="mt-2 pt-2 border-t border-cyan-100 text-cyan-900 text-xs">
                                <span className="font-semibold text-cyan-800">Clinical Indication / Instructions: </span>
                                {test.clinicalNotes}
                            </div>
                        )}
                    </div>

                    {/* Diagnostic Findings & Result Section */}
                    <div className="mb-8">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center justify-between">
                            <span>Diagnostic Findings & Results</span>
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                <FaCheckCircle size={11} /> Verified & Signed
                            </span>
                        </div>
                        <div className="border border-gray-300 rounded-xl p-5 bg-white min-h-[140px]">
                            {test.result ? (
                                <div className="text-xs sm:text-sm text-gray-900 whitespace-pre-wrap font-mono leading-relaxed">
                                    {test.result}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 italic">
                                    Results not finalized yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pathology Sign-off & Disclaimer */}
                    <div className="pt-6 border-t border-gray-300 flex justify-between items-end text-xs text-gray-500">
                        <div className="max-w-xs">
                            <p className="font-semibold text-gray-700">City General Hospital Pathology Services</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Report validated electronically. These results should be correlated with clinical findings.
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                Generated: {new Date().toLocaleString()}
                            </p>
                        </div>
                        <div className="text-center w-52">
                            <div className="border-b border-gray-400 mb-1 h-10"></div>
                            <span className="text-[11px] font-semibold text-gray-700 block">
                                Medical Laboratory Technologist
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                                Certified Clinical Pathology Staff
                            </span>
                        </div>
                    </div>

                </div>

                {/* Print CSS Styles injected dynamically */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }
                        #printable-lab-report-content, #printable-lab-report-content * {
                            visibility: visible !important;
                        }
                        #printable-lab-report-content {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 20mm !important;
                            box-shadow: none !important;
                            border: none !important;
                            background: white !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}} />

            </div>
        </div>
    );
}

export default PrintableLabReportModal;
