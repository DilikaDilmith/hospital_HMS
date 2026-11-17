import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserMd, FaEnvelope, FaPhone, FaStethoscope, FaBuilding, FaKey, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

function DoctorProfile() {
    const [user, setUser] = useState(null);
    const [doctor, setDoctor] = useState(null);
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
            // 1. Get User Data
            const userRes = await axios.get('http://localhost:8080/api/users/profile', config);
            setUser(userRes.data);

            // 2. Get Doctor Data (Match by email or name)
            const docRes = await axios.get('http://localhost:8080/api/doctors', config);
            const currentDoctor = docRes.data.find(d => 
                d.email === userRes.data.username || 
                `${d.firstName} ${d.lastName}` === userRes.data.fullName
            );
            if (currentDoctor) setDoctor(currentDoctor);
        };
        fetchProfile();
    }, []);

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

    if (!user || !doctor) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-green-600 h-32"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-center md:justify-start -mt-12 mb-4">
                        <div className="bg-white p-2 rounded-full">
                            <FaUserMd className="text-gray-300" size={80} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Dr. {doctor.firstName} {doctor.lastName}</h3>
                    <p className="text-green-600 font-semibold flex items-center gap-2 mt-1">
                        <FaStethoscope /> {doctor.specialization}
                    </p>
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                            <FaEnvelope className="text-gray-400" />
                            <div><p className="text-xs text-gray-500">Email</p><p className="text-gray-800 font-medium">{doctor.email}</p></div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                            <FaPhone className="text-gray-400" />
                            <div><p className="text-xs text-gray-500">Phone</p><p className="text-gray-800 font-medium">{doctor.phoneNumber}</p></div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                            <FaBuilding className="text-gray-400" />
                            <div><p className="text-xs text-gray-500">Department</p><p className="text-gray-800 font-medium">{doctor.department ? doctor.department.name : 'N/A'}</p></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Management Card (SRS 3.1) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h4 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <FaKey className="text-emerald-600" /> Password Management
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
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Confirm new password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={changingPassword}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                    >
                        {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
export default DoctorProfile;