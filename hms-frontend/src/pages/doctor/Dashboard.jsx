import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaCalendarCheck, 
    FaClock, 
    FaFlask, 
    FaUserInjured, 
    FaUserCircle, 
    FaNotesMedical, 
    FaSearch, 
    FaArrowRight, 
    FaCalendarDay,
    FaCheckCircle,
    FaHourglassHalf,
    FaCalendarTimes,
    FaFilter
} from 'react-icons/fa';

function DoctorDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [pendingLabCount, setPendingLabCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Fetch User Profile
                try {
                    const resUser = await axios.get('http://localhost:8080/api/users/profile', config);
                    setUser(resUser.data);
                } catch (err) {
                    console.error("Error fetching doctor profile:", err);
                }

                // 2. Fetch Strictly Doctor's Own Booked Appointments
                let doctorAppts = [];
                try {
                    const resAppt = await axios.get('http://localhost:8080/api/appointments/doctor/my', config);
                    doctorAppts = Array.isArray(resAppt.data) ? resAppt.data : [];
                } catch (err) {
                    // Fallback to /api/appointments (backend automatically scopes to caller doctor)
                    try {
                        const resApptFallback = await axios.get('http://localhost:8080/api/appointments', config);
                        doctorAppts = Array.isArray(resApptFallback.data) ? resApptFallback.data : [];
                    } catch (e) {
                        console.error("Error loading doctor appointments:", e);
                    }
                }
                setAppointments(doctorAppts);

                // 3. Fetch Lab Requests for this Doctor's patients
                try {
                    const labRes = await axios.get('http://localhost:8080/api/lab-tests', config);
                    const allLabs = Array.isArray(labRes.data) ? labRes.data : [];
                    const myPatientIds = new Set(doctorAppts.map(a => a.patient?.id).filter(Boolean));
                    
                    // Count pending tests for this doctor's patients
                    const pendingLabs = allLabs.filter(t => 
                        (myPatientIds.size === 0 || myPatientIds.has(t.patient?.id)) &&
                        (t.status === 'REQUESTED' || t.status === 'PENDING')
                    );
                    setPendingLabCount(pendingLabs.length);
                } catch (err) {
                    console.warn("Could not load lab requests:", err);
                }

            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Derived Doctor Metrics (Scoped STRICTLY to this unique doctor)
    const totalMyAppointments = appointments.length;

    const todayDateStr = new Date().toISOString().split('T')[0];
    const todaysAppointments = appointments.filter(a => {
        if (!a.appointmentDateTime) return false;
        return a.appointmentDateTime.startsWith(todayDateStr);
    });

    const uniquePatientsCount = new Set(
        appointments.map(a => a.patient?.id).filter(Boolean)
    ).size;

    // Filter appointments for the schedule preview
    const filteredAppointments = appointments.filter(a => {
        const matchesStatus = filterStatus === 'ALL' || (a.status || '').toUpperCase() === filterStatus;
        if (!matchesStatus) return false;

        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        const pName = a.patient ? `${a.patient.firstName || ''} ${a.patient.lastName || ''}`.toLowerCase() : '';
        const pNic = a.patient?.nic?.toLowerCase() || '';
        const reason = (a.reasonForVisit || a.reason || '').toLowerCase();
        return pName.includes(q) || pNic.includes(q) || reason.includes(q);
    });

    const getStatusBadge = (status) => {
        const s = (status || 'SCHEDULED').toUpperCase();
        switch (s) {
            case 'CONFIRMED':
                return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-max"><FaCheckCircle size={10} /> Confirmed</span>;
            case 'COMPLETED':
                return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-max"><FaCheckCircle size={10} /> Completed</span>;
            case 'IN_PROGRESS':
                return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-max"><FaClock size={10} /> In Progress</span>;
            case 'CANCELLED':
                return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-max"><FaCalendarTimes size={10} /> Cancelled</span>;
            default:
                return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-max"><FaHourglassHalf size={10} /> Scheduled</span>;
        }
    };

    return (
        <div className="pb-12 max-w-7xl mx-auto px-2 sm:px-4">
            {/* 1. Profile Banner (Welcome Section) */}
            <div className="mb-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                        <FaUserCircle size={44} className="text-emerald-100" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Welcome back, {user ? user.fullName : 'Doctor'}
                            </h2>
                            <span className="bg-emerald-500/30 border border-emerald-300/40 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-sm">
                                {user ? user.role : 'DOCTOR'}
                            </span>
                        </div>
                        <p className="text-emerald-100 text-sm mt-1">
                            Your Clinical Practice Dashboard • Scoped strictly to your assigned patients and consultation bookings
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link 
                        to="/doctor/appointments" 
                        className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-md flex items-center gap-2 text-sm border border-emerald-300/30"
                    >
                        <FaCalendarCheck /> Manage Schedule
                    </Link>
                    <Link 
                        to="/profile" 
                        className="bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl font-semibold transition border border-white/20 text-sm"
                    >
                        View Profile
                    </Link>
                </div>
            </div>

            {/* 2. Isolated Statistics Summary Cards (4 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                
                {/* Card 1: My Total Appointments */}
                <Link 
                    to="/doctor/appointments" 
                    className="group bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border border-emerald-500/20"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">My Appointments</p>
                            <h3 className="text-4xl font-extrabold mt-2 tracking-tight">
                                {loading ? '...' : totalMyAppointments}
                            </h3>
                            <p className="text-xs text-emerald-200 mt-2 font-medium">
                                Booked specifically under your care
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition">
                            <FaCalendarCheck size={24} className="text-emerald-100" />
                        </div>
                    </div>
                </Link>

                {/* Card 2: Today's Consultations */}
                <Link 
                    to="/doctor/appointments" 
                    className="group bg-gradient-to-br from-teal-600 to-cyan-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border border-teal-500/20"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-teal-100">Today's Schedule</p>
                            <h3 className="text-4xl font-extrabold mt-2 tracking-tight">
                                {loading ? '...' : todaysAppointments.length}
                            </h3>
                            <p className="text-xs text-teal-200 mt-2 font-medium">
                                Consultations slated for today
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition">
                            <FaClock size={24} className="text-teal-100" />
                        </div>
                    </div>
                </Link>

                {/* Card 3: My Lab Requests */}
                <Link 
                    to="/doctor/lab-requests" 
                    className="group bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border border-amber-400/20"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-100">Pending Lab Tests</p>
                            <h3 className="text-4xl font-extrabold mt-2 tracking-tight">
                                {loading ? '...' : pendingLabCount}
                            </h3>
                            <p className="text-xs text-amber-100 mt-2 font-medium">
                                Diagnostic orders awaiting results
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition">
                            <FaFlask size={24} className="text-amber-100" />
                        </div>
                    </div>
                </Link>

                {/* Card 4: My Unique Patients */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-lg border border-blue-500/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-100">My Patients</p>
                            <h3 className="text-4xl font-extrabold mt-2 tracking-tight">
                                {loading ? '...' : uniquePatientsCount}
                            </h3>
                            <p className="text-xs text-blue-200 mt-2 font-medium">
                                Unique patients under your consultations
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                            <FaUserInjured size={24} className="text-blue-100" />
                        </div>
                    </div>
                </div>

            </div>

            {/* 3. My Upcoming Appointments & Patient Roster */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-800">
                                My Booked Appointments & Schedule
                            </h3>
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full">
                                {appointments.length} Total Booked
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Real-time bookings where patients selected your profile as attending doctor
                        </p>
                    </div>

                    <Link 
                        to="/doctor/appointments" 
                        className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-1.5 transition"
                    >
                        View All in Appointments Manager <FaArrowRight size={12} />
                    </Link>
                </div>

                {/* Search & Filter Controls */}
                <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="relative w-full sm:w-80">
                        <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                        <input 
                            type="text" 
                            placeholder="Search patient, NIC or reason..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <FaFilter size={10} /> Status:
                        </span>
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Appointments Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">
                            <FaClock className="mx-auto text-3xl animate-spin text-emerald-500 mb-3" />
                            <p className="text-sm font-semibold">Loading your appointment schedule...</p>
                        </div>
                    ) : filteredAppointments.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                    <th className="p-4 pl-6">Patient</th>
                                    <th className="p-4">Date & Time</th>
                                    <th className="p-4">Reason / Symptoms</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right pr-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredAppointments.map((appt) => {
                                    const apptDate = appt.appointmentDateTime ? new Date(appt.appointmentDateTime) : null;
                                    const isToday = apptDate && apptDate.toISOString().split('T')[0] === todayDateStr;

                                    return (
                                        <tr key={appt.id} className="hover:bg-slate-50/80 transition">
                                            {/* Patient info */}
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                                        {appt.patient?.firstName ? appt.patient.firstName[0].toUpperCase() : 'P'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800">
                                                            {appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : 'Walk-in Patient'}
                                                        </div>
                                                        <div className="text-xs text-slate-400 font-mono">
                                                            {appt.patient?.nic ? `NIC: ${appt.patient.nic}` : (appt.patient?.phone || 'No contact')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Date and time */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-slate-700">
                                                        {apptDate ? apptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                    </div>
                                                    {isToday && (
                                                        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                            Today
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <FaClock size={11} className="text-emerald-500" />
                                                    {apptDate ? apptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </div>
                                            </td>

                                            {/* Reason */}
                                            <td className="p-4">
                                                <p className="text-slate-600 line-clamp-1 max-w-xs text-xs font-medium">
                                                    {appt.reasonForVisit || appt.reason || 'General Medical Consultation'}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="p-4">
                                                {getStatusBadge(appt.status)}
                                            </td>

                                            {/* Action Button */}
                                            <td className="p-4 text-right pr-6">
                                                <Link 
                                                    to="/doctor/appointments" 
                                                    className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition border border-emerald-200 hover:border-emerald-600 shadow-sm"
                                                >
                                                    <FaNotesMedical size={11} /> Consult
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-16 text-center text-slate-400">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                <FaCalendarCheck size={28} />
                            </div>
                            <h4 className="text-base font-bold text-slate-700">
                                {searchTerm || filterStatus !== 'ALL'
                                    ? 'No matching appointments found'
                                    : 'No appointments currently booked for you'}
                            </h4>
                            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                                {searchTerm || filterStatus !== 'ALL'
                                    ? 'Try adjusting your search criteria or resetting the status filter.'
                                    : `Whenever a patient books an appointment selecting ${user ? user.fullName : 'your profile'}, it will automatically appear here with full clinical details.`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DoctorDashboard;
