import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
    FaHospital,
    FaLock,
    FaIdBadge,
    FaUserTag,
    FaEnvelope,
    FaEye,
    FaEyeSlash,
    FaCheckCircle,
    FaExclamationCircle,
    FaHeartbeat,
    FaShieldAlt,
    FaSpinner,
    FaArrowRight,
    FaUserMd,
    FaUserInjured,
    FaUserNurse,
    FaPills,
    FaVials,
    FaFileInvoiceDollar,
    FaUserTie,
    FaCheck,
    FaStethoscope,
    FaChevronDown,
    FaUserShield,
    FaBolt
} from 'react-icons/fa';

// Role metadata with descriptions and approval indicators
const ROLES = [
    {
        id: 'PATIENT',
        label: 'Patient',
        category: 'Patients',
        icon: FaUserInjured,
        autoApproved: true,
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        iconBg: 'bg-emerald-50 text-emerald-600',
        desc: 'Instant access: book doctor appointments, view lab results & prescriptions'
    },
    {
        id: 'DOCTOR',
        label: 'Doctor / Physician',
        category: 'Clinical Staff',
        icon: FaUserMd,
        autoApproved: false,
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        iconBg: 'bg-blue-50 text-blue-600',
        desc: 'Conduct consultations, write prescriptions & review patient EMR'
    },
    {
        id: 'NURSE',
        label: 'Nurse',
        category: 'Clinical Staff',
        icon: FaUserNurse,
        autoApproved: false,
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        iconBg: 'bg-purple-50 text-purple-600',
        desc: 'Inpatient wards, vitals monitoring & clinical care assistance'
    },
    {
        id: 'PHARMACIST',
        label: 'Pharmacist',
        category: 'Hospital Departments',
        icon: FaPills,
        autoApproved: false,
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        iconBg: 'bg-amber-50 text-amber-600',
        desc: 'Dispense prescription medications & manage medicine stock inventory'
    },
    {
        id: 'LAB_STAFF',
        label: 'Lab Technician',
        category: 'Hospital Departments',
        icon: FaVials,
        autoApproved: false,
        badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        iconBg: 'bg-cyan-50 text-cyan-600',
        desc: 'Record diagnostic lab results, specimen reports & pathology logs'
    },
    {
        id: 'RECEPTIONIST',
        label: 'Receptionist',
        category: 'Hospital Departments',
        icon: FaUserTie,
        autoApproved: false,
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        iconBg: 'bg-indigo-50 text-indigo-600',
        desc: 'Patient admissions, counter booking & general hospital inquiries'
    },
    {
        id: 'ACCOUNTANT',
        label: 'Accountant',
        category: 'Hospital Departments',
        icon: FaFileInvoiceDollar,
        autoApproved: false,
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        iconBg: 'bg-rose-50 text-rose-600',
        desc: 'Manage patient billing, invoices, payment receipts & financial auditing'
    }
];

// Categorized roles for structured menu
const CATEGORIES = [
    { name: 'Patients', badge: 'Auto-Approved ⚡', roles: ROLES.filter((r) => r.category === 'Patients') },
    { name: 'Clinical Staff', badge: 'Admin Approval Required 🛡️', roles: ROLES.filter((r) => r.category === 'Clinical Staff') },
    { name: 'Hospital Departments', badge: 'Admin Approval Required 🛡️', roles: ROLES.filter((r) => r.category === 'Hospital Departments') }
];

function Signup() {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'PATIENT',
        agreeTerms: false
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    // Close custom dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Calculate password strength
    const getPasswordStrength = (pass) => {
        if (!pass) return { score: 0, text: '', color: 'bg-gray-200' };
        let score = 0;
        if (pass.length >= 6) score += 1;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
        if (score === 2) return { score: 2, text: 'Fair', color: 'bg-yellow-500', width: 'w-2/4' };
        if (score === 3) return { score: 3, text: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
        return { score: 4, text: 'Strong', color: 'bg-green-500', width: 'w-full' };
    };

    const strength = getPasswordStrength(formData.password);
    const selectedRoleObj = ROLES.find((r) => r.id === formData.role) || ROLES[0];
    const SelectedRoleIcon = selectedRoleObj.icon;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (error) setError('');
    };

    const handleRoleSelect = (roleId) => {
        setFormData((prev) => ({ ...prev, role: roleId }));
        setIsDropdownOpen(false);
        if (error) setError('');
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Client-side validations
        if (!formData.fullName.trim()) {
            setError('Please enter your full name.');
            return;
        }

        if (!formData.username.trim()) {
            setError('Please enter a username or email address.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match. Please verify your password.');
            return;
        }

        if (!formData.agreeTerms) {
            setError('Please agree to the HMS Terms of Service and Privacy Policy to continue.');
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                fullName: formData.fullName.trim(),
                username: formData.username.trim(),
                password: formData.password,
                role: formData.role
            };

            const response = await axios.post('http://localhost:8080/api/auth/signup', payload);

            if (response.data === 'Username already exists!') {
                setError('This username is already taken. Please choose another username or email.');
                setIsLoading(false);
            } else {
                const message =
                    formData.role === 'PATIENT'
                        ? 'Account registered successfully! Redirecting you to login...'
                        : 'Registration submitted successfully! Your account is pending administrator approval. Redirecting to login...';

                setSuccess(message);
                setIsLoading(false);

                setTimeout(() => {
                    navigate('/');
                }, 2500);
            }
        } catch (err) {
            setIsLoading(false);
            if (err.response && err.response.data) {
                if (typeof err.response.data === 'string') {
                    setError(err.response.data);
                } else if (err.response.data.message) {
                    setError(err.response.data.message);
                } else if (err.response.data.error) {
                    setError(err.response.data.error);
                } else {
                    setError('Registration failed. Please check your details and try again.');
                }
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Registration failed. Please verify the backend service is running and try again.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Ambient Lighting Accents */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-100 z-10">
                {/* LEFT HERO / BRANDING PANEL */}
                <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-cyan-300 shadow-inner">
                                <FaHospital size={26} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                    CarePulse <span className="text-cyan-300 font-light text-sm bg-white/10 px-2 py-0.5 rounded-full border border-white/10">HMS</span>
                                </h1>
                                <p className="text-xs text-blue-200">Hospital Management System</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-8">
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                                Smarter Care, <br />
                                Seamless Access.
                            </h2>
                            <p className="text-sm text-blue-100/90 leading-relaxed">
                                Connecting patients, doctors, and hospital departments on a unified digital healthcare platform.
                            </p>
                        </div>

                        {/* Feature Highlights */}
                        <div className="space-y-3.5 mb-8">
                            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                                <div className="mt-0.5 text-cyan-300">
                                    <FaShieldAlt size={16} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-white">Role-Based Security</h4>
                                    <p className="text-xs text-blue-200/80">Strict access control for Patients, Doctors, and Clinical staff.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                                <div className="mt-0.5 text-emerald-300">
                                    <FaHeartbeat size={16} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-white">Instant Patient Onboarding</h4>
                                    <p className="text-xs text-blue-200/80">Patients register and access doctor appointments immediately.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                                <div className="mt-0.5 text-amber-300">
                                    <FaStethoscope size={16} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-white">Verified Clinical Staff</h4>
                                    <p className="text-xs text-blue-200/80">Medical practitioners verified by hospital administrators.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-200">
                        <span className="flex items-center gap-1.5 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            24/7 Clinical System
                        </span>
                        <span className="text-blue-300/80">HIPAA Compliant</span>
                    </div>
                </div>

                {/* RIGHT REGISTRATION FORM PANEL */}
                <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
                    <div className="mb-5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                                Registration Portal
                            </span>
                            <Link
                                to="/"
                                className="text-xs font-medium text-gray-500 hover:text-blue-600 transition flex items-center gap-1"
                            >
                                Back to Login <FaArrowRight size={10} />
                            </Link>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Create an Account</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Choose your role and enter your details to get started.
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5 animate-fadeIn">
                            <FaExclamationCircle className="mt-0.5 flex-shrink-0 text-red-500" size={16} />
                            <div className="flex-1">{error}</div>
                        </div>
                    )}

                    {/* Success Banner */}
                    {success && (
                        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-2.5 animate-fadeIn">
                            <FaCheckCircle className="mt-0.5 flex-shrink-0 text-emerald-500" size={18} />
                            <div>
                                <div className="font-semibold">{success}</div>
                                <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1.5">
                                    <FaSpinner className="animate-spin" size={12} /> Preparing your session...
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* ========================================================= */}
                        {/* UPGRADED & USER-FRIENDLY ACCOUNT TYPE & ROLE SECTION */}
                        {/* ========================================================= */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <FaUserTag className="inline mr-1 text-blue-600" /> Account Type & Role
                                </label>
                                <span className="text-[11px] font-medium text-gray-400">Select one option</span>
                            </div>

                            {/* 1. Quick-Tap Segmented Pills */}
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleRoleSelect('PATIENT')}
                                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition duration-150 ${
                                        formData.role === 'PATIENT'
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-2 ring-emerald-500/20'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    <FaUserInjured className={formData.role === 'PATIENT' ? 'text-emerald-600' : 'text-gray-400'} size={14} />
                                    <span>Patient</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Instant Access" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleRoleSelect('DOCTOR')}
                                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition duration-150 ${
                                        formData.role === 'DOCTOR'
                                            ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm ring-2 ring-blue-500/20'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    <FaUserMd className={formData.role === 'DOCTOR' ? 'text-blue-600' : 'text-gray-400'} size={14} />
                                    <span>Doctor</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleRoleSelect('NURSE')}
                                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition duration-150 ${
                                        formData.role === 'NURSE'
                                            ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-sm ring-2 ring-purple-500/20'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    <FaUserNurse className={formData.role === 'NURSE' ? 'text-purple-600' : 'text-gray-400'} size={14} />
                                    <span>Nurse</span>
                                </button>
                            </div>

                            {/* 2. Custom Interactive Dropdown Component */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition duration-200 bg-white text-left ${
                                        isDropdownOpen
                                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                                            : 'border-gray-300 hover:border-gray-400 shadow-sm'
                                    }`}
                                    aria-haspopup="listbox"
                                    aria-expanded={isDropdownOpen}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedRoleObj.iconBg}`}
                                        >
                                            <SelectedRoleIcon size={18} />
                                        </div>
                                        <div className="truncate">
                                            <div className="text-sm font-bold text-gray-900 truncate">
                                                {selectedRoleObj.label}
                                            </div>
                                            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                                                <span>{selectedRoleObj.category}</span>
                                                <span>•</span>
                                                <span className={selectedRoleObj.autoApproved ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                                                    {selectedRoleObj.autoApproved ? 'Instant Access' : 'Admin Approval'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        <span
                                            className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${selectedRoleObj.badgeColor}`}
                                        >
                                            {selectedRoleObj.autoApproved ? 'Instant' : 'Verification'}
                                        </span>
                                        <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                                isDropdownOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400'
                                            }`}
                                        >
                                            <FaChevronDown
                                                size={12}
                                                className={`transition-transform duration-200 ${
                                                    isDropdownOpen ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </div>
                                    </div>
                                </button>

                                {/* Custom Floating Dropdown Menu (Replaces Clunky Browser Native Select) */}
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn divide-y divide-gray-100 max-h-80 overflow-y-auto">
                                        {CATEGORIES.map((cat) => (
                                            <div key={cat.name} className="p-2">
                                                <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    <span>{cat.name}</span>
                                                    <span className="text-gray-500 font-medium text-[9px]">{cat.badge}</span>
                                                </div>
                                                <div className="space-y-1 mt-1">
                                                    {cat.roles.map((r) => {
                                                        const RoleIcon = r.icon;
                                                        const isSelected = r.id === formData.role;
                                                        return (
                                                            <button
                                                                key={r.id}
                                                                type="button"
                                                                onClick={() => handleRoleSelect(r.id)}
                                                                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-left ${
                                                                    isSelected
                                                                        ? 'bg-blue-50/80 border border-blue-200 text-blue-900'
                                                                        : 'hover:bg-gray-50 text-gray-700'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div
                                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.iconBg}`}
                                                                    >
                                                                        <RoleIcon size={15} />
                                                                    </div>
                                                                    <div className="truncate">
                                                                        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                                                            <span>{r.label}</span>
                                                                            {r.autoApproved && (
                                                                                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                                                                                    Auto
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-[11px] text-gray-500 truncate">
                                                                            {r.desc}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {isSelected && (
                                                                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 ml-2">
                                                                        <FaCheck size={9} />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 3. Dynamic Informational Status Banner */}
                            <div
                                className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs transition duration-200 ${
                                    selectedRoleObj.autoApproved
                                        ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                                        : 'bg-amber-50/90 border-amber-200 text-amber-900'
                                }`}
                            >
                                <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        selectedRoleObj.autoApproved
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}
                                >
                                    {selectedRoleObj.autoApproved ? <FaBolt size={14} /> : <FaUserShield size={14} />}
                                </div>
                                <div className="flex-1">
                                    <span className="font-bold mr-1">
                                        {selectedRoleObj.autoApproved ? 'Instant Access Portal:' : 'Admin Verification:'}
                                    </span>
                                    <span className="opacity-90">
                                        {selectedRoleObj.autoApproved
                                            ? 'Patients can log in immediately after registration to book visits & consult doctors.'
                                            : `As a ${selectedRoleObj.label}, your account will require hospital admin approval before login is enabled.`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FULL NAME & USERNAME (GRID) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    <FaIdBadge className="inline mr-1 text-blue-600" /> Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    placeholder="e.g. Dr. Arthur Conan"
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>

                            {/* Username / Email */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    <FaEnvelope className="inline mr-1 text-blue-600" /> Username / Email
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    placeholder="e.g. arthur@hospital.com"
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* PASSWORDS (GRID) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Password */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    <FaLock className="inline mr-1 text-blue-600" /> Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        placeholder="Min. 6 characters"
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                    </button>
                                </div>

                                {/* Dynamic Password Strength Indicator */}
                                {formData.password && (
                                    <div className="mt-1.5">
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1">
                                            <span>Strength:</span>
                                            <span className="font-semibold text-gray-700">{strength.text}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    <FaLock className="inline mr-1 text-blue-600" /> Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        placeholder="Re-enter your password"
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1"
                                        aria-label="Toggle confirm password visibility"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                    </button>
                                </div>

                                {/* Real-time Match Indicator */}
                                {formData.confirmPassword && (
                                    <div className="mt-1.5 text-[11px]">
                                        {formData.password === formData.confirmPassword ? (
                                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                                                <FaCheck size={10} /> Passwords match
                                            </span>
                                        ) : (
                                            <span className="text-red-500 font-medium">Passwords do not match</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* TERMS CHECKBOX */}
                        <div className="pt-1">
                            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600 select-none">
                                <input
                                    type="checkbox"
                                    name="agreeTerms"
                                    checked={formData.agreeTerms}
                                    onChange={handleChange}
                                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                                <span>
                                    I agree to the{' '}
                                    <span className="text-blue-600 font-semibold hover:underline">Terms of Service</span> and{' '}
                                    <span className="text-blue-600 font-semibold hover:underline">Privacy Policy</span>.
                                </span>
                            </label>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className="animate-spin" size={16} /> Creating Account...
                                </>
                            ) : (
                                <>
                                    Complete Registration <FaArrowRight size={13} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* FOOTER */}
                    <div className="mt-5 text-center text-xs text-gray-500 border-t border-gray-100 pt-4">
                        Already have an active account?{' '}
                        <Link to="/" className="text-blue-600 font-bold hover:text-blue-700 hover:underline">
                            Log In Here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signup;
