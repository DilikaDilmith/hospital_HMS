import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaFlask, FaUserInjured, FaDollarSign, FaNotesMedical, FaPlus } from 'react-icons/fa';

function OrderLabTestModal({ onClose, onTestOrdered }) {
    const [patients, setPatients] = useState([]);
    const [formData, setFormData] = useState({
        patientId: '',
        testName: 'Full Blood Count (FBC)',
        testFee: '2500.00',
        clinicalNotes: ''
    });
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const commonTests = [
        { name: 'Full Blood Count (FBC)', fee: 2500.0 },
        { name: 'Lipid Profile (Cholesterol & Triglycerides)', fee: 3500.0 },
        { name: 'Liver Function Test (LFT)', fee: 4000.0 },
        { name: 'Renal Function Test (Serum Creatinine & Urea)', fee: 3000.0 },
        { name: 'Fasting Blood Glucose (FBS)', fee: 1500.0 },
        { name: 'Urine Full Report (UFR)', fee: 1800.0 },
        { name: 'Serum Electrolytes (Na/K/Cl)', fee: 3200.0 },
        { name: 'Thyroid Stimulating Hormone (TSH)', fee: 3800.0 }
    ];

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/patients', config);
                setPatients(Array.isArray(res.data) ? res.data : []);
                setLoadingPatients(false);
            } catch (err) {
                console.error("Error fetching patients for lab test:", err);
                setError("Failed to load patient records.");
                setLoadingPatients(false);
            }
        };
        fetchPatients();
    }, []);

    const handleTestChange = (e) => {
        const selected = e.target.value;
        const matched = commonTests.find(t => t.name === selected);
        setFormData({
            ...formData,
            testName: selected,
            testFee: matched ? matched.fee.toFixed(2) : formData.testFee
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId) {
            setError("Please select a patient.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const payload = {
                testName: formData.testName.trim(),
                testFee: parseFloat(formData.testFee),
                clinicalNotes: formData.clinicalNotes.trim(),
                patient: { id: parseInt(formData.patientId, 10) }
            };

            await axios.post('http://localhost:8080/api/lab-tests', payload, config);
            if (onTestOrdered) onTestOrdered();
            onClose();
        } catch (err) {
            console.error("Error ordering lab test:", err);
            setError("Failed to submit lab test order. Please verify details.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-amber-200">
                            <FaFlask size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Order Laboratory Test</h3>
                            <p className="text-xs text-amber-100">Initiate diagnostic request for laboratory processing</p>
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
                            <FaUserInjured className="text-orange-500" /> Select Patient *
                        </label>
                        <select 
                            value={formData.patientId} 
                            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} 
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none text-xs text-gray-800 transition"
                        >
                            <option value="">-- Choose Patient --</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName} {p.nic ? `(NIC: ${p.nic})` : ''} - #{p.id}
                                </option>
                            ))}
                        </select>
                        {loadingPatients && <span className="text-[11px] text-gray-400">Loading patients list...</span>}
                    </div>

                    {/* Test Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Diagnostic Test *
                        </label>
                        <select 
                            value={formData.testName} 
                            onChange={handleTestChange}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none text-xs text-gray-800 transition mb-2"
                        >
                            {commonTests.map((t, idx) => (
                                <option key={idx} value={t.name}>
                                    {t.name} (LKR {t.fee.toFixed(2)})
                                </option>
                            ))}
                            <option value="Custom Test">-- Other / Custom Test Name --</option>
                        </select>
                        {formData.testName === 'Custom Test' && (
                            <input 
                                type="text"
                                placeholder="Enter specific diagnostic test name..."
                                onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                                required
                                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none mt-1"
                            />
                        )}
                    </div>

                    {/* Test Fee */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FaDollarSign className="text-emerald-500" /> Laboratory Fee (LKR) *
                        </label>
                        <input 
                            type="number" 
                            step="0.01" 
                            value={formData.testFee} 
                            onChange={(e) => setFormData({ ...formData, testFee: e.target.value })} 
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none text-xs text-gray-800 transition"
                        />
                        <span className="text-[11px] text-gray-400">This fee will be automatically billed to the patient upon completion.</span>
                    </div>

                    {/* Clinical Instructions */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FaNotesMedical className="text-blue-500" /> Clinical Indications / Notes (Optional)
                        </label>
                        <textarea 
                            rows={3}
                            placeholder="e.g. Suspected dengue fever, fasting required 10-12 hours prior to draw."
                            value={formData.clinicalNotes} 
                            onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none text-xs text-gray-800 transition"
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
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
                        >
                            <FaPlus size={11} /> {isSubmitting ? 'Submitting...' : 'Order Test'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default OrderLabTestModal;

