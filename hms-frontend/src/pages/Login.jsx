import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
    FaHospital,
    FaUser,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaExclamationCircle,
    FaSpinner,
    FaArrowRight,
    FaShieldAlt,
    FaHeartbeat,
    FaStethoscope
} from 'react-icons/fa';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:8080/api/auth/login', {
                username,
                password
            });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('userName', username);
            setIsLoading(false);
            navigate('/dashboard');
        } catch (err) {
            setIsLoading(false);
            if (err.response && err.response.data && typeof err.response.data === 'string') {
                setError(err.response.data);
            } else if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.response && err.response.status === 403) {
                setError('Access Forbidden (403): Your account may be pending Admin approval, or invalid credentials.');
            } else {
                setError('Invalid username or password! Please check your credentials.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Ambient Lighting Accents */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-100 z-10">
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
                                Welcome Back to <br />
                                Clinical Care.
                            </h2>
                            <p className="text-sm text-blue-100/90 leading-relaxed">
                                Access appointments, patients, electronic medical records, pharmacy, and billing.
                            </p>
                        </div>

                        {/* Quick Highlights */}
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm text-xs">
                                <FaShieldAlt className="text-cyan-300" size={16} />
                                <span className="text-blue-100">Secure Role-Based Portal Access</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm text-xs">
                                <FaHeartbeat className="text-emerald-300" size={16} />
                                <span className="text-blue-100">Live Health & Clinical Analytics</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm text-xs">
                                <FaStethoscope className="text-amber-300" size={16} />
                                <span className="text-blue-100">Doctor & Medical Staff Network</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-200">
                        <span className="flex items-center gap-1.5 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            System Active
                        </span>
                        <span className="text-blue-300/80">v2.0 Healthcare</span>
                    </div>
                </div>

                {/* RIGHT LOGIN FORM PANEL */}
                <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
                    <div className="mb-6">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                            Authentication
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Sign In</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Enter your credentials to access your hospital account.
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
                            <FaExclamationCircle className="mt-0.5 flex-shrink-0 text-red-500" size={16} />
                            <div className="flex-1">{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                <FaUser className="inline mr-1 text-blue-600" /> Username / Email
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your username or email"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (error) setError('');
                                }}
                                required
                                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                <FaLock className="inline mr-1 text-blue-600" /> Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError('');
                                    }}
                                    required
                                    className="w-full pl-4 pr-11 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-3"
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className="animate-spin" size={16} /> Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In to Portal <FaArrowRight size={13} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-100 pt-5">
                        Don't have an account yet?{' '}
                        <Link to="/signup" className="text-blue-600 font-bold hover:text-blue-700 hover:underline">
                            Create an Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
