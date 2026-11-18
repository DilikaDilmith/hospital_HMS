import { useState } from 'react';
import axios from 'axios';
import { FaUserPlus, FaTimes, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

function AddPatientModal({ onClose, onPatientAdded }) {
    const [newPatient, setNewPatient] = useState({
        firstName: '',
        lastName: '',
        nic: '',
        dateOfBirth: '',
        age: '',
        gender: 'Male',
        phoneNumber: '',
        address: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setNewPatient({ ...newPatient, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    // Calculate age automatically when DOB changes
    const handleDobChange = (e) => {
        const dobVal = e.target.value;
        let calculatedAge = newPatient.age;
        if (dobVal) {
            const birthDate = new Date(dobVal);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            calculatedAge = age >= 0 ? age : 0;
        }
        setNewPatient(prev => ({
            ...prev,
            dateOfBirth: dobVal,
            age: calculatedAge !== '' ? String(calculatedAge) : ''
        }));
        if (error) setError('');
    };

    // Auto-suggest DOB when Age is entered directly
    const handleAgeChange = (e) => {
        const ageVal = e.target.value;
        let suggestedDob = newPatient.dateOfBirth;
        if (ageVal !== '' && !isNaN(ageVal)) {
            const num = parseInt(ageVal, 10);
            if (num >= 0 && num <= 130) {
                const year = new Date().getFullYear() - num;
                suggestedDob = `${year}-01-01`;
            }
        }
        setNewPatient(prev => ({
            ...prev,
            age: ageVal,
            dateOfBirth: suggestedDob
        }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Proper Client-side validation
        if (!newPatient.firstName.trim()) {
            setError('First name is required.');
            return;
        }
        if (newPatient.firstName.trim().length < 2) {
            setError('First name must be at least 2 characters.');
            return;
        }
        if (!newPatient.lastName.trim()) {
            setError('Last name is required.');
            return;
        }
        if (!newPatient.phoneNumber.trim()) {
            setError('Phone number is required.');
            return;
        }
        const phoneRegex = /^[0-9+\-\s()]{9,15}$/;
        if (!phoneRegex.test(newPatient.phoneNumber.trim())) {
            setError('Please enter a valid phone number (e.g. 0771234567 or +94771234567).');
            return;
        }
        if (newPatient.dateOfBirth) {
            const todayStr = new Date().toISOString().split('T')[0];
            if (newPatient.dateOfBirth > todayStr) {
                setError('Date of birth cannot be in the future.');
                return;
            }
        }
        if (newPatient.age !== '' && (parseInt(newPatient.age, 10) < 0 || parseInt(newPatient.age, 10) > 130)) {
            setError('Please enter a valid patient age between 0 and 130 years.');
            return;
        }
        if (!newPatient.dateOfBirth && newPatient.age === '') {
            setError('Please provide either Date of Birth or Patient Age.');
            return;
        }

        setIsSubmitting(true);

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication session not found. Please log in again.');
            setIsSubmitting(false);
            return;
        }

        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const payload = {
            firstName: newPatient.firstName.trim(),
            lastName: newPatient.lastName.trim(),
            // Safe null normalization: patients without NIC have null (not empty string)
            nic: newPatient.nic && newPatient.nic.trim() !== '' ? newPatient.nic.trim() : null,
            dateOfBirth: newPatient.dateOfBirth || null,
            age: newPatient.age !== '' ? parseInt(newPatient.age, 10) : null,
            gender: newPatient.gender,
            phoneNumber: newPatient.phoneNumber.trim(),
            address: newPatient.address ? newPatient.address.trim() : ''
        };

        try {
            await axios.post('http://localhost:8080/api/patients', payload, config);
            setIsSubmitting(false);
            onPatientAdded();
            onClose();
        } catch (err) {
            setIsSubmitting(false);
            console.error("Error adding patient:", err);
            let errMsg = 'Failed to add patient. Please check the details and try again.';
            if (!err.response) {
                errMsg = 'Backend server is unreachable at http://localhost:8080. Please ensure the Spring Boot backend is running.';
            } else if (err.response.status === 403) {
                errMsg = 'Access Forbidden (403): You are not authorized to register patients.';
            } else if (typeof err.response.data === 'string') {
                errMsg = err.response.data;
            } else if (err.response.data?.message) {
                errMsg = err.response.data.message;
            }
            
            if (errMsg.includes('Duplicate entry') || errMsg.includes('constraint') || errMsg.includes('already registered')) {
                errMsg = 'A patient with this National Identity Card (NIC) is already registered in the system. Please verify the NIC or leave it blank if unavailable.';
            }
            setError(errMsg);
        }
    };

    const maxDate = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FaUserPlus className="text-blue-600" /> Register New Patient
                    </h3>
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>
                
                {/* Error Banner */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                        <FaExclamationCircle className="mt-0.5 flex-shrink-0 text-red-500" />
                        <div>{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">First Name *</label>
                            <input 
                                type="text" 
                                name="firstName" 
                                value={newPatient.firstName} 
                                onChange={handleChange} 
                                placeholder="e.g. Kasun"
                                required
                                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Last Name *</label>
                            <input 
                                type="text" 
                                name="lastName" 
                                value={newPatient.lastName} 
                                onChange={handleChange} 
                                placeholder="e.g. Silva"
                                required
                                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">NIC (Optional)</label>
                            <input 
                                type="text" 
                                name="nic" 
                                value={newPatient.nic} 
                                onChange={handleChange} 
                                placeholder="e.g. 199512345678 or 951234567V"
                                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Leave blank for children, infants, or patients without an NIC.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Gender *</label>
                            <select 
                                name="gender" 
                                value={newPatient.gender} 
                                onChange={handleChange}
                                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Date of Birth</label>
                            <input 
                                type="date" 
                                name="dateOfBirth" 
                                max={maxDate}
                                value={newPatient.dateOfBirth} 
                                onChange={handleDobChange} 
                                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Auto-calculates patient age.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Patient Age (Years)</label>
                            <input 
                                type="number" 
                                name="age" 
                                min="0" 
                                max="130"
                                value={newPatient.age} 
                                onChange={handleAgeChange} 
                                placeholder="e.g. 28"
                                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Enter age directly if DOB is unavailable.</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number *</label>
                            <input 
                                type="text" 
                                name="phoneNumber" 
                                value={newPatient.phoneNumber} 
                                onChange={handleChange} 
                                placeholder="e.g. 0771234567"
                                required
                                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Residential Address</label>
                            <input 
                                type="text" 
                                name="address" 
                                value={newPatient.address} 
                                onChange={handleChange} 
                                placeholder="e.g. No. 12, Main Street, Colombo"
                                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <FaSpinner className="animate-spin" size={14} /> Saving...
                                </>
                            ) : (
                                'Save Patient'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddPatientModal;
