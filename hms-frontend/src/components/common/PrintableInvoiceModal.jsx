import React from 'react';
import { FaPrint, FaTimes, FaHospital, FaCheckCircle, FaFileInvoiceDollar, FaReceipt } from 'react-icons/fa';

function PrintableInvoiceModal({ invoice, mode = 'INVOICE', onClose }) {
    if (!invoice) return null;

    const isReceipt = mode === 'RECEIPT' || invoice.status === 'PAID' && mode !== 'INVOICE';
    const patient = invoice.patient || {};
    const items = invoice.items || [];
    const totalAmount = Number(invoice.totalAmount || 0);

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
                        {isReceipt ? (
                            <FaReceipt className="text-emerald-400" size={18} />
                        ) : (
                            <FaFileInvoiceDollar className="text-cyan-400" size={18} />
                        )}
                        <span className="font-semibold text-sm">
                            {isReceipt ? 'Payment Receipt Preview' : 'Invoice Preview'}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ml-2 ${
                            invoice.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                            {invoice.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                        >
                            <FaPrint size={12} /> Print {isReceipt ? 'Receipt' : 'Invoice'}
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
                <div id="printable-invoice-content" className="p-8 sm:p-10 bg-white text-gray-800 text-xs sm:text-sm font-sans flex-grow">
                    
                    {/* Header: Hospital Branding */}
                    <div className="border-b-2 border-gray-900 pb-5 mb-6">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center">
                                        <FaHospital size={20} />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                                            CITY GENERAL HOSPITAL
                                        </h1>
                                        <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                                            Tertiary Healthcare & Clinical Care Services
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 text-[11px] text-gray-500 space-y-0.5">
                                    <p>120 Hospital Boulevard, Colombo 07, Sri Lanka</p>
                                    <p>Telephone: (+94) 11 269 1111 | Email: billing@citygeneral.lk</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className={`inline-block px-3 py-1 rounded text-xs font-black uppercase tracking-wider mb-1.5 border ${
                                    isReceipt
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-blue-50 text-blue-800 border-blue-300'
                                }`}>
                                    {isReceipt ? 'OFFICIAL PAYMENT RECEIPT' : 'BILLING INVOICE'}
                                </span>
                                <div className="text-xs text-gray-700 font-mono font-bold">
                                    {isReceipt ? `REC-${String(invoice.id).padStart(5, '0')}` : `INV-${String(invoice.id).padStart(5, '0')}`}
                                </div>
                                <div className="text-[11px] text-gray-500 mt-1">
                                    Date: {invoice.date ? new Date(invoice.date).toLocaleDateString() : new Date().toLocaleDateString()}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                    Time: {invoice.date ? new Date(invoice.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Patient & Billing Details Grid */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                BILLED TO PATIENT
                            </div>
                            <div className="font-bold text-gray-900 text-sm">
                                {patient.firstName || ''} {patient.lastName || ''}
                            </div>
                            <div className="text-gray-600 mt-0.5">
                                Patient ID: <span className="font-mono font-semibold">#PAT-{patient.id || 'N/A'}</span>
                            </div>
                            {patient.nic && (
                                <div className="text-gray-600">
                                    NIC: <span className="font-mono">{patient.nic}</span>
                                </div>
                            )}
                            {patient.phoneNumber && (
                                <div className="text-gray-600">
                                    Phone: {patient.phoneNumber}
                                </div>
                            )}
                            {patient.address && (
                                <div className="text-gray-500 truncate">
                                    Address: {patient.address}
                                </div>
                            )}
                        </div>

                        <div className="text-right flex flex-col justify-between">
                            <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    PAYMENT STATUS
                                </div>
                                <div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-black text-xs ${
                                        invoice.status === 'PAID'
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}>
                                        {invoice.status === 'PAID' && <FaCheckCircle size={10} />}
                                        {invoice.status || 'UNPAID'}
                                    </span>
                                </div>
                            </div>

                            {/* Payment details already recorded */}
                            {invoice.status === 'PAID' && (
                                <div className="mt-2 text-[11px] text-gray-600 space-y-0.5">
                                    <div>
                                        <span className="text-gray-500">Payment Date: </span>
                                        <span className="font-medium">
                                            {invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : (invoice.date ? new Date(invoice.date).toLocaleString() : 'Recorded')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Method: </span>
                                        <span className="font-medium">{invoice.paymentMethod || 'CASH / COUNTER'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Itemized Charges Table */}
                    <div className="mb-6">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                            Itemized Charges & Services
                        </div>
                        <table className="w-full text-left border-collapse border border-gray-300 text-xs">
                            <thead className="bg-gray-100 border-b border-gray-300 text-gray-700">
                                <tr>
                                    <th className="p-2.5 border-r border-gray-300 w-12 text-center">#</th>
                                    <th className="p-2.5 border-r border-gray-300 w-28">Category</th>
                                    <th className="p-2.5 border-r border-gray-300">Description of Service / Medication</th>
                                    <th className="p-2.5 text-right w-32">Amount (LKR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {items.length > 0 ? (
                                    items.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-gray-50">
                                            <td className="p-2.5 border-r border-gray-300 text-center text-gray-500 font-mono">
                                                {idx + 1}
                                            </td>
                                            <td className="p-2.5 border-r border-gray-300 font-semibold text-gray-700">
                                                {item.category || 'MISC'}
                                            </td>
                                            <td className="p-2.5 border-r border-gray-300 text-gray-800">
                                                {item.description || 'Medical service charge'}
                                            </td>
                                            <td className="p-2.5 text-right font-mono font-medium text-gray-900">
                                                {Number(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center text-gray-400 italic">
                                            No itemized charges attached to this invoice.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Summary Calculation */}
                    <div className="flex justify-end mb-8">
                        <div className="w-72 bg-slate-50 border border-slate-300 rounded-xl p-3.5 space-y-1.5 text-xs">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal Charges:</span>
                                <span className="font-mono">
                                    LKR {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Hospital Service Tax:</span>
                                <span className="font-mono">LKR 0.00</span>
                            </div>
                            <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-gray-900 text-sm">
                                <span>Total Amount:</span>
                                <span className="font-mono text-blue-700">
                                    LKR {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            {invoice.status === 'PAID' ? (
                                <>
                                    <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-dashed border-slate-200">
                                        <span>Amount Paid:</span>
                                        <span className="font-mono">
                                            LKR {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 font-semibold">
                                        <span>Balance Due:</span>
                                        <span className="font-mono text-emerald-700">LKR 0.00</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between text-amber-700 font-semibold pt-1 border-t border-dashed border-slate-200">
                                    <span>Balance Due:</span>
                                    <span className="font-mono">
                                        LKR {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Signature & Disclaimer Block */}
                    <div className="pt-6 border-t border-gray-300 flex justify-between items-end text-xs text-gray-500">
                        <div>
                            <p className="font-semibold text-gray-700">City General Hospital Accounts Department</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                This is a computer-generated document. Valid without stamp when verified.
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                Issued: {new Date().toLocaleString()}
                            </p>
                        </div>
                        <div className="text-center w-48">
                            <div className="border-b border-gray-400 mb-1 h-10"></div>
                            <span className="text-[11px] font-medium text-gray-600 block">
                                Authorized Signature / Cashier
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
                        #printable-invoice-content, #printable-invoice-content * {
                            visibility: visible !important;
                        }
                        #printable-invoice-content {
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

export default PrintableInvoiceModal;
