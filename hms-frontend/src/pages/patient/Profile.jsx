import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaUser, 
    FaIdCard, 
    FaBirthdayCake, 
    FaPhone, 
    FaMapMarkerAlt,
    FaFolderOpen,
    FaFilePdf,
    FaFileImage,
    FaFileAlt,
    FaEye,
    FaDownload,
    FaKey,
    FaCheckCircle,
    FaExclamationCircle,
    FaEdit,
    FaSave,
    FaTimes,
    FaSpinner,
    FaVenusMars,
    FaHourglassHalf
} from 'react-icons/fa';

function PatientProfile() {
    const [user, setUser] = useState(null);
    const [patient, setPatient] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        nic: '',
        dateOfBirth: '',
        age: '',
        gender: 'Male',
        phoneNumber: '',
        address: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
    const [changingPassword, setChangingPassword] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 1. Get User Data
                const userRes = await axios.get('http://localhost:8080/api/users/profile', config);
                setUser(userRes.data);

                // 2. Get Patient Data directly from linked profile endpoint
                const patRes = await axios.get('http://localhost:8080/api/patients/profile', config);
                if (patRes.data) {
                    setPatient(patRes.data);
                    setEditForm({
                        firstName: patRes.data.firstName || '',
                        lastName: patRes.data.lastName || '',
                        nic: patRes.data.nic || '',
                        dateOfBirth: patRes.data.dateOfBirth || '',
                        age: patRes.data.age !== null && patRes.data.age !== undefined ? String(patRes.data.age) : '',
                        gender: patRes.data.gender || 'Male',
                        phoneNumber: patRes.data.phoneNumber || '',
                        address: patRes.data.address || ''
                    });
                    // Fetch documents for this patient
                    fetchDocuments(patRes.data.id);
                }
            } catch (error) {
                console.error("Error loading profile details:", error);
            }
        };
        fetchProfile();
    }, []);

    const fetchDocuments = async (patientId) => {
        setLoadingDocs(true);
        try {
            const res = await axios.get(`http://localhost:8080/api/patients/${patientId}/documents`, config);
            setDocuments(Array.isArray(res.data) ? res.data : []);
            setLoadingDocs(false);
        } catch (err) {
            console.error("Error loading patient documents:", err);
            setLoadingDocs(false);
        }
    };

    const handleEditFormChange = (e) => {
        setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (profileMsg.text) setProfileMsg({ type: '', text: '' });
    };

    const handleDobChange = (e) => {
        const dobVal = e.target.value;
        let calculatedAge = editForm.age;
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
        setEditForm(prev => ({
            ...prev,
            dateOfBirth: dobVal,
            age: calculatedAge !== '' ? String(calculatedAge) : ''
        }));
        if (profileMsg.text) setProfileMsg({ type: '', text: '' });
    };

    const handleAgeChange = (e) => {
        const ageVal = e.target.value;
        let suggestedDob = editForm.dateOfBirth;
        if (ageVal !== '' && !isNaN(ageVal)) {
            const num = parseInt(ageVal, 10);
            if (num >= 0 && num <= 130) {
                const year = new Date().getFullYear() - num;
                suggestedDob = `${year}-01-01`;
            }
        }
        setEditForm(prev => ({
            ...prev,
            age: ageVal,
            dateOfBirth: suggestedDob
        }));
        if (profileMsg.text) setProfileMsg({ type: '', text: '' });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setProfileMsg({ type: '', text: '' });

        if (!editForm.firstName.trim()) {
            setProfileMsg({ type: 'error', text: 'First name is required.' });
            return;
        }
        if (editForm.firstName.trim().length < 2) {
            setProfileMsg({ type: 'error', text: 'First name must be at least 2 characters.' });
            return;
        }
        if (!editForm.lastName.trim()) {
            setProfileMsg({ type: 'error', text: 'Last name is required.' });
            return;
        }
        if (!editForm.phoneNumber.trim()) {
            setProfileMsg({ type: 'error', text: 'Phone number is required.' });
            return;
        }
        const phoneRegex = /^[0-9+\-\s()]{9,15}$/;
        if (!phoneRegex.test(editForm.phoneNumber.trim())) {
            setProfileMsg({ type: 'error', text: 'Please enter a valid phone number (e.g. 0771234567 or +94771234567).' });
            return;
        }
        if (editForm.dateOfBirth) {
            const todayStr = new Date().toISOString().split('T')[0];
            if (editForm.dateOfBirth > todayStr) {
                setProfileMsg({ type: 'error', text: 'Date of birth cannot be in the future.' });
                return;
            }
        }
        if (editForm.age !== '' && (parseInt(editForm.age, 10) < 0 || parseInt(editForm.age, 10) > 130)) {
            setProfileMsg({ type: 'error', text: 'Patient age must be between 0 and 130 years.' });
            return;
        }

        setSavingProfile(true);

        const payload = {
            firstName: editForm.firstName.trim(),
            lastName: editForm.lastName.trim(),
            nic: editForm.nic && editForm.nic.trim() !== '' ? editForm.nic.trim() : null,
            dateOfBirth: editForm.dateOfBirth || null,
            age: editForm.age !== '' ? parseInt(editForm.age, 10) : null,
            gender: editForm.gender,
            phoneNumber: editForm.phoneNumber.trim(),
            address: editForm.address ? editForm.address.trim() : ''
        };

        try {
            const res = await axios.put('http://localhost:8080/api/patients/profile', payload, config);
            setPatient(res.data);
            setUser(prev => ({ ...prev, fullName: `${res.data.firstName} ${res.data.lastName}` }));
            setProfileMsg({ type: 'success', text: 'Your profile details were updated successfully!' });
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            const errMsg =
                (typeof err.response?.data === 'string' ? err.response.data : null) ||
                err.response?.data?.message ||
                "Failed to update profile. Please try again.";
            setProfileMsg({ type: 'error', text: errMsg });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordMsg({ type: '', text: '' });

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
            return;
        }

        setChangingPassword(true);
        try {
            const res = await axios.put('http://localhost:8080/api/users/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            }, config);
            setPasswordMsg({ type: 'success', text: res.data || 'Password updated successfully!' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            const errText = err.response?.data || 'Failed to change password. Please check your current password.';
            setPasswordMsg({ type: 'error', text: typeof errText === 'string' ? errText : 'Error updating password.' });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleView = async (doc) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/documents/${doc.id}/view`, {
                ...config,
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: doc.fileType || 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } catch (err) {
            alert("Failed to view document.");
        }
    };

    const handleDownload = async (doc) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/documents/${doc.id}/download`, {
                ...config,
                responseType: 'blob'
            });
            const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', doc.originalFileName || `document-${doc.id}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            alert("Failed to download document.");
        }
    };

    const getFileIcon = (fileType, originalName) => {
        const name = (originalName || '').toLowerCase();
        if (fileType?.includes('pdf') || name.endsWith('.pdf')) {
            return <FaFilePdf className="text-red-500" size={16} />;
        }
        if (fileType?.includes('image') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) {
            return <FaFileImage className="text-blue-500" size={16} />;
        }
        return <FaFileAlt className="text-gray-500" size={16} />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    if (!user) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-cyan-600 h-32"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-4">
                        <div className="bg-white p-2 rounded-full shadow-sm">
                            <FaUser className="text-gray-300" size={80} />
                        </div>
                        {patient && !isEditing && (
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setProfileMsg({ type: '', text: '' });
                                    setEditForm({
                                        firstName: patient.firstName || '',
                                        lastName: patient.lastName || '',
                                        nic: patient.nic || '',
                                        dateOfBirth: patient.dateOfBirth || '',
                                        age: patient.age !== null && patient.age !== undefined ? String(patient.age) : '',
                                        gender: patient.gender || 'Male',
                                        phoneNumber: patient.phoneNumber || '',
                                        address: patient.address || ''
                                    });
                                }}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
                            >
                                <FaEdit size={13} /> Edit Profile
                            </button>
                        )}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-800">{user.fullName}</h3>
                    <p className="text-cyan-600 font-semibold flex items-center gap-2 mt-1">
                        Patient Portal Profile
                    </p>

                    {profileMsg.text && (
                        <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${profileMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                            {profileMsg.type === 'error' ? <FaExclamationCircle size={14} /> : <FaCheckCircle size={14} />}
                            <span>{profileMsg.text}</span>
                        </div>
                    )}

                    {isEditing ? (
                        <form onSubmit={handleSaveProfile} className="mt-6 space-y-4 bg-gray-50/70 p-5 rounded-2xl border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                                <FaEdit className="text-cyan-600" /> Edit Personal Information
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={editForm.firstName}
                                        onChange={handleEditFormChange}
                                        required
                                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={editForm.lastName}
                                        onChange={handleEditFormChange}
                                        required
                                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">NIC (Optional)</label>
                                    <input
                                        type="text"
                                        name="nic"
                                        value={editForm.nic}
                                        onChange={handleEditFormChange}
                                        placeholder="e.g. 200012345678 or leave empty"
                                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Gender *</label>
                                    <select
                                        name="gender"
                                        value={editForm.gender}
                                        onChange={handleEditFormChange}
                                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={editForm.dateOfBirth}
                                        onChange={handleDobChange}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Patient Age (Years)</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={editForm.age}
                                        onChange={handleAgeChange}
                                        min="0"
                                        max="130"
                                        placeholder="Auto-calculated from DOB or enter directly"
                                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phone Number *</label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={editForm.phoneNumber}
                                        onChange={handleEditFormChange}
                                        required
                                        placeholder="0771234567"
                                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Residential Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={editForm.address}
                                        onChange={handleEditFormChange}
                                        placeholder="No 12, Main Street, Colombo"
                                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setProfileMsg({ type: '', text: '' });
                                    }}
                                    disabled={savingProfile}
                                    className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                                >
                                    <FaTimes size={12} /> Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
                                >
                                    {savingProfile ? <FaSpinner className="animate-spin" size={13} /> : <FaSave size={13} />}
                                    {savingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : patient ? (
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <FaIdCard className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">NIC</p>
                                    <p className="text-gray-800 font-medium">
                                        {patient.nic ? patient.nic : <span className="text-gray-400 text-xs italic">No NIC on file</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <FaBirthdayCake className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Date of Birth & Age</p>
                                    <p className="text-gray-800 font-medium">
                                        {patient.dateOfBirth ? patient.dateOfBirth : 'N/A'}
                                        {patient.age !== null && patient.age !== undefined && (
                                            <span className="ml-1.5 text-xs text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full font-semibold">
                                                {patient.age} yrs
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <FaVenusMars className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Gender</p>
                                    <p className="text-gray-800 font-medium">{patient.gender || 'Not specified'}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <FaPhone className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-gray-800 font-medium">{patient.phoneNumber || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3 md:col-span-2">
                                <FaMapMarkerAlt className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Residential Address</p>
                                    <p className="text-gray-800 font-medium">{patient.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                            No patient medical profile linked yet.
                        </div>
                    )}

                        {/* My Documents Section */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h4 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <FaFolderOpen className="text-cyan-600" /> My Medical Documents ({documents.length})
                            </h4>

                            {loadingDocs ? (
                                <p className="text-xs text-gray-500">Loading documents...</p>
                            ) : documents.length > 0 ? (
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {getFileIcon(doc.fileType, doc.originalFileName)}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-800 truncate" title={doc.originalFileName}>
                                                        {doc.originalFileName}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {doc.description ? `${doc.description} • ` : ''}
                                                        {formatFileSize(doc.fileSize)} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => handleView(doc)}
                                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium flex items-center gap-1 transition"
                                                    title="View Document"
                                                >
                                                    <FaEye size={12} /> View
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(doc)}
                                                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium flex items-center gap-1 transition"
                                                    title="Download Document"
                                                >
                                                    <FaDownload size={12} /> Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic">
                                    No medical documents uploaded yet. Hospital staff can upload reports and scans to your profile.
                                </p>
                            )}
                        </div>
                </div>
            </div>

            {/* Password Management Card (SRS 3.1) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h4 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <FaKey className="text-cyan-600" /> Password Management
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                    Update your account login password. Must be at least 6 characters long.
                </p>

                {passwordMsg.text && (
                    <div className={`mb-5 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                        passwordMsg.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                        {passwordMsg.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {passwordMsg.text}
                    </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Current Password</label>
                        <input
                            type="password"
                            required
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="Enter current password"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="Enter new password (min. 6 characters)"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="Confirm new password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={changingPassword}
                        className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                    >
                        {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
export default PatientProfile;
