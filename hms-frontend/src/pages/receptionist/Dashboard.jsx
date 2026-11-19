import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaUserPlus, 
    FaCalendarPlus, 
    FaCalendarCheck, 
    FaBed, 
    FaMoneyBillWave, 
    FaUserCircle, 
    FaSearch, 
    FaClock, 
    FaUserMd, 
    FaUserInjured, 
    FaCheckCircle, 
    FaTimesCircle, 
    FaSyncAlt, 
    FaArrowRight, 
    FaPhone, 
    FaIdCard, 
    FaHospital,
    FaCalendarDay,
    FaCheck,
    FaFileInvoiceDollar,
    FaChevronRight,
    FaDoorOpen
} from 'react-icons/fa';

import AddPatientModal from '../../components/admin/AddPatientModal';
import AddAppointmentModal from '../../components/admin/AddAppointmentModal';
import AdmitPatientModal from '../../components/inpatient/AdmitPatientModal';
import RescheduleAppointmentModal from '../../components/common/RescheduleAppointmentModal';

function ReceptionistDashboard() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Front Desk Queue Search & Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [queueFilter, setQueueFilter] = useState('TODAY'); // 'TODAY' | 'SCHEDULED' | 'CHECKED_IN' | 'ALL'

    // Modals
    const [showAddPatientModal, setShowAddPatientModal] = useState(false);
    const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
    const [showAdmitModal, setShowAdmitModal] = useState(false);
    const [selectedApptToReschedule, setSelectedApptToReschedule] = useState(null);

    // Toast feedback
    const [toast, setToast] = useState({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    const getLocalDateString = (d = new Date()) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchReceptionistData = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else setLoading(true);

        try {
            const [userRes, statsRes, apptRes] = await Promise.allSettled([
                axios.get('http://localhost:8080/api/users/profile', config),
                axios.get('http://localhost:8080/api/dashboard/stats', config),
                axios.get('http://localhost:8080/api/appointments', config)
            ]);

            if (userRes.status === 'fulfilled') setUser(userRes.value.data);
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            if (apptRes.status === 'fulfilled' && Array.isArray(apptRes.value.data)) {
                setAppointments(apptRes.value.data);
            }
        } catch (error) {
            console.error("Error loading receptionist dashboard:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReceptionistData();
    }, []);

    // 1-Click Fast Check-In for arriving patients
    const handleCheckIn = async (appointmentId) => {
        try {
            await axios.put(`http://localhost:8080/api/appointments/${appointmentId}/check-in`, {}, config);
            setToast({
                type: 'success',
                text: `Patient checked in successfully for appointment #${appointmentId}!`
            });
            fetchReceptionistData(true);
        } catch (err) {
            console.error("Error checking in patient:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to check in patient.';
            setToast({ type: 'error', text: msg });
        }
    };

    // Cancel appointment helper
    const handleCancelAppointment = async (id) => {
        if (!window.confirm(`Are you sure you want to cancel appointment #${id}?`)) return;
        try {
            await axios.put(`http://localhost:8080/api/appointments/${id}/cancel`, {}, config);
            setToast({ type: 'success', text: `Appointment #${id} has been cancelled.` });
            fetchReceptionistData(true);
        } catch (err) {
            console.error("Error cancelling appointment:", err);
            setToast({ type: 'error', text: 'Failed to cancel appointment.' });
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Derived today's metrics
    const todayStr = getLocalDateString();
    const todaysAppointmentsList = useMemo(() => {
        return appointments.filter(a => a.appointmentDateTime && a.appointmentDateTime.startsWith(todayStr));
    }, [appointments, todayStr]);

    const checkedInTodayCount = useMemo(() => {
        return todaysAppointmentsList.filter(a => (a.status || '').toUpperCase() === 'CHECKED_IN').length;
    }, [todaysAppointmentsList]);

    const pendingCheckInTodayCount = useMemo(() => {
        return todaysAppointmentsList.filter(a => {
            const s = (a.status || '').toUpperCase();
            return s === 'SCHEDULED' || s === 'CONFIRMED' || s === 'BOOKED';
        }).length;
    }, [todaysAppointmentsList]);

    // Status Badge helper
    const getStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'CHECKED_IN':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><FaClock size={9} /> Checked In</span>;
            case 'SCHEDULED':
            case 'BOOKED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Scheduled</span>;
            case 'CONFIRMED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Confirmed</span>;
            case 'COMPLETED':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><FaCheck size={9} /> Completed</span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">Cancelled</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    // Filter queue based on tab and search term
    const filteredQueue = useMemo(() => {
        let list = appointments;

        if (queueFilter === 'TODAY') {
            list = todaysAppointmentsList;
        } else if (queueFilter === 'SCHEDULED') {
            list = appointments.filter(a => {
                const s = (a.status || '').toUpperCase();
                return s === 'SCHEDULED' || s === 'CONFIRMED' || s === 'BOOKED';
            });
        } else if (queueFilter === 'CHECKED_IN') {
            list = appointments.filter(a => (a.status || '').toUpperCase() === 'CHECKED_IN');
        }

        if (!searchTerm.trim()) return list;
        const term = searchTerm.toLowerCase();

        return list.filter(a => {
            const pName = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.toLowerCase();
            const pPhone = (a.patient?.phoneNumber || '').toLowerCase();
            const pNic = (a.patient?.nic || '').toLowerCase();
            const doc = `${a.doctor?.firstName || ''} ${a.doctor?.lastName || ''}`.toLowerCase();
            const reason = (a.reason || '').toLowerCase();
            return pName.includes(term) || pPhone.includes(term) || pNic.includes(term) || doc.includes(term) || reason.includes(term) || String(a.id).includes(term);
        });
    }, [appointments, todaysAppointmentsList, queueFilter, searchTerm]);

    const formattedToday = new Date().toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div className="pb-14 max-w-7xl mx-auto space-y-6 px-3 sm:px-6">
            
            {/* 1. Receptionist Front Desk Header (Clean, Welcoming, Action-Oriented) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 text-white p-6 sm:p-8 shadow-lg">
                {/* Decorative background glow */}
                <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute right-44 -bottom-16 w-48 h-48 rounded-full bg-pink-400/20 blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
                            <FaHospital size={36} className="text-pink-100" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-sm">
                                    <FaDoorOpen size={10} /> Front Desk Station • Patient Intake
                                </span>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/15 text-pink-100">
                                    📅 {formattedToday}
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                {getGreeting()}, {user ? user.fullName : 'Front Desk Officer'} 👋
                            </h1>
                            <p className="text-pink-100 text-xs sm:text-sm mt-1">
                                Manage patient admissions, schedule consultations, perform arrivals check-in, and review bed occupancy.
                            </p>
                        </div>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                        <button
                            onClick={() => fetchReceptionistData(true)}
                            disabled={refreshing}
                            className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition border border-white/20 shadow-sm"
                            title="Refresh Data"
                        >
                            <FaSyncAlt className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowAddPatientModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-bold transition shadow-md text-xs sm:text-sm whitespace-nowrap"
                        >
                            <FaUserPlus /> New Patient
                        </button>
                        <button
                            onClick={() => setShowAddAppointmentModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700/80 hover:bg-rose-700 text-white font-semibold transition border border-white/20 text-xs sm:text-sm whitespace-nowrap shadow-sm"
                        >
                            <FaCalendarPlus /> Book Appt
                        </button>
                        <button
                            onClick={() => setShowAdmitModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold transition border border-white/20 text-xs sm:text-sm whitespace-nowrap"
                        >
                            <FaBed /> Inpatient
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Feedback Toast */}
            {toast.text && (
                <div className={`p-4 rounded-2xl flex justify-between items-center text-xs sm:text-sm shadow-sm border ${
                    toast.type === 'error' 
                        ? 'bg-rose-50 text-rose-800 border-rose-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'error' ? <FaTimesCircle className="text-rose-500" /> : <FaCheckCircle className="text-emerald-500" />}
                        <span>{toast.text}</span>
                    </div>
                    <button 
                        onClick={() => setToast({ type: '', text: '' })} 
                        className="font-bold text-gray-500 hover:text-gray-800 text-lg leading-none"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* 2. Key Operational Metrics Strip (4 Clean High-Impact Columns) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Today's Consultations */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Today's Schedule</span>
                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <FaCalendarDay size={16} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : todaysAppointmentsList.length}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                            <span className="text-amber-600 font-bold">{pendingCheckInTodayCount} Pending</span> • <span className="text-emerald-600 font-bold">{checkedInTodayCount} Checked In</span>
                        </p>
                    </div>
                </div>

                {/* 2. Bed Occupancy & Availability */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Bed Availability</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <FaBed size={16} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : (stats?.availableBeds ?? '—')}
                            <span className="text-xs font-normal text-slate-400 ml-1">/ {stats?.totalBeds ?? '—'} Total</span>
                        </div>
                        <p className="text-[11px] text-purple-600 font-medium mt-1 truncate">
                            {stats ? `${stats.occupiedBeds} Inpatients Currently Admitted` : 'Active Ward Roster'}
                        </p>
                    </div>
                </div>

                {/* 3. Total Patients Registered */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Total Patients</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FaUserInjured size={16} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : (stats?.totalPatients ?? '—')}
                        </div>
                        <p className="text-[11px] text-blue-600 font-medium mt-1 truncate">
                            Active Hospital Medical Records
                        </p>
                    </div>
                </div>

                {/* 4. Doctors on Duty */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Active Doctors</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FaUserMd size={16} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loading ? '...' : (stats?.totalDoctors ?? '—')}
                        </div>
                        <p className="text-[11px] text-emerald-600 font-medium mt-1 truncate">
                            Physicians & Clinical Specialists
                        </p>
                    </div>
                </div>

            </div>

            {/* 3. Front Desk Queue & Arrival Check-In Hub (Heart of Receptionist Duties) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                
                {/* Queue Toolbar: Filters & Fast Search */}
                <div className="border-b border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    
                    {/* Queue Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        <button
                            onClick={() => { setQueueFilter('TODAY'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                queueFilter === 'TODAY'
                                    ? 'bg-white text-rose-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaCalendarDay className="text-rose-600" />
                            <span>Today's Queue</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                                {todaysAppointmentsList.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setQueueFilter('SCHEDULED'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                queueFilter === 'SCHEDULED'
                                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaClock className="text-blue-600" />
                            <span>Awaiting Check-in</span>
                        </button>

                        <button
                            onClick={() => { setQueueFilter('CHECKED_IN'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                queueFilter === 'CHECKED_IN'
                                    ? 'bg-white text-amber-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaCheckCircle className="text-amber-500" />
                            <span>Checked In</span>
                        </button>

                        <button
                            onClick={() => { setQueueFilter('ALL'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                queueFilter === 'ALL'
                                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaCalendarCheck className="text-slate-600" />
                            <span>All Bookings ({appointments.length})</span>
                        </button>
                    </div>

                    {/* Fast Search Input */}
                    <div className="relative min-w-[240px]">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search patient, phone, or doctor..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                        />
                    </div>
                </div>

                {/* Queue Table */}
                <div className="p-4 sm:p-6">
                    {loading ? (
                        <div className="py-14 text-center text-slate-400 text-xs sm:text-sm">
                            Loading front desk queue...
                        </div>
                    ) : filteredQueue.length === 0 ? (
                        <div className="py-14 text-center text-slate-400">
                            <FaCalendarDay className="mx-auto text-4xl text-slate-300 mb-2" />
                            <h4 className="text-sm font-bold text-slate-700">No appointments in this queue</h4>
                            <p className="text-xs text-slate-400 mt-1">
                                {searchTerm ? 'No results matched your search query.' : 'There are no consultations scheduled under this filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                                        <th className="p-3.5">ID</th>
                                        <th className="p-3.5">Patient Details</th>
                                        <th className="p-3.5">Attending Doctor</th>
                                        <th className="p-3.5">Appointment Time</th>
                                        <th className="p-3.5">Reason / Notes</th>
                                        <th className="p-3.5 text-center">Status</th>
                                        <th className="p-3.5 text-right">Front Desk Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredQueue.map((appt) => {
                                        const statusUpper = (appt.status || '').toUpperCase();
                                        const isAwaitingCheckIn = statusUpper === 'SCHEDULED' || statusUpper === 'CONFIRMED' || statusUpper === 'BOOKED';
                                        const isCheckedIn = statusUpper === 'CHECKED_IN';

                                        return (
                                            <tr key={appt.id} className="hover:bg-slate-50/70 transition">
                                                <td className="p-3.5 font-mono text-slate-500 text-xs">#{appt.id}</td>
                                                <td className="p-3.5">
                                                    <div className="font-semibold text-slate-900">
                                                        {appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : 'Walk-in Patient'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                        {appt.patient?.phoneNumber && (
                                                            <span className="flex items-center gap-1">
                                                                <FaPhone size={9} className="text-slate-400" /> {appt.patient.phoneNumber}
                                                            </span>
                                                        )}
                                                        {appt.patient?.nic && (
                                                            <span className="flex items-center gap-1">
                                                                <FaIdCard size={9} className="text-slate-400" /> {appt.patient.nic}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3.5">
                                                    <div className="font-semibold text-slate-900">
                                                        {appt.doctor ? `Dr. ${appt.doctor.firstName} ${appt.doctor.lastName}` : 'General Clinic'}
                                                    </div>
                                                    <span className="text-[11px] text-slate-500">{appt.doctor?.specialization || 'Consultant'}</span>
                                                </td>
                                                <td className="p-3.5 text-slate-600 text-xs">
                                                    <div className="font-medium text-slate-800">
                                                        {new Date(appt.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <span className="text-[11px] text-slate-400">
                                                        {new Date(appt.appointmentDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-slate-600 text-xs max-w-xs truncate" title={appt.reason}>
                                                    {appt.reason || 'General Consultation'}
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    {getStatusBadge(appt.status)}
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        {isAwaitingCheckIn && (
                                                            <button
                                                                onClick={() => handleCheckIn(appt.id)}
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-xs"
                                                                title="Mark patient as arrived at front desk"
                                                            >
                                                                <FaCheck size={10} /> Check In
                                                            </button>
                                                        )}
                                                        {isCheckedIn && (
                                                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                                In Waiting Room
                                                            </span>
                                                        )}
                                                        {(isAwaitingCheckIn || isCheckedIn) && (
                                                            <>
                                                                <button
                                                                    onClick={() => setSelectedApptToReschedule(appt)}
                                                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                                                                    title="Reschedule"
                                                                >
                                                                    Reschedule
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCancelAppointment(appt.id)}
                                                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium transition"
                                                                    title="Cancel Appointment"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        )}
                                                        {!isAwaitingCheckIn && !isCheckedIn && (
                                                            <span className="text-xs text-slate-400">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Quick Action Operational Cards (Clean & Connected Navigation) */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Front Desk Operational Workspaces
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Workspace 1: Patients Directory */}
                    <Link
                        to="/receptionist/patients"
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
                                <FaUserInjured size={18} />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">Patients Directory</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Search patient registry, edit demographic info, and register new walk-in arrivals.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                            <span>Open Patients</span>
                            <FaArrowRight size={10} className="group-hover:translate-x-1 transition" />
                        </div>
                    </Link>

                    {/* Workspace 2: Appointments Schedule */}
                    <Link
                        to="/receptionist/appointments"
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-rose-400 hover:shadow-md transition group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition">
                                <FaCalendarCheck size={18} />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">Appointment Schedule</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Master consultation calendar, schedule outpatient visits, and manage doctor time slots.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600">
                            <span>Open Appointments</span>
                            <FaArrowRight size={10} className="group-hover:translate-x-1 transition" />
                        </div>
                    </Link>

                    {/* Workspace 3: Inpatient & Bed Admissions */}
                    <Link
                        to="/receptionist/inpatient"
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-purple-400 hover:shadow-md transition group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition">
                                <FaBed size={18} />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">Inpatient & Bed Wards</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Review live ward occupancy, admit patients to available beds, and coordinate transfers.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
                            <span>Open Inpatient</span>
                            <FaArrowRight size={10} className="group-hover:translate-x-1 transition" />
                        </div>
                    </Link>

                    {/* Workspace 4: Front Desk Billing */}
                    <Link
                        to="/receptionist/billing"
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                                <FaFileInvoiceDollar size={18} />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">Billing & Invoices</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Generate itemized invoices, record cash/card payments, and issue official receipts.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                            <span>Open Billing</span>
                            <FaArrowRight size={10} className="group-hover:translate-x-1 transition" />
                        </div>
                    </Link>

                </div>
            </div>

            {/* Modal: Add Patient */}
            {showAddPatientModal && (
                <AddPatientModal
                    onClose={() => setShowAddPatientModal(false)}
                    onPatientAdded={(newPat) => {
                        setShowAddPatientModal(false);
                        setToast({
                            type: 'success',
                            text: `New patient ${newPat.firstName} ${newPat.lastName} registered successfully!`
                        });
                        fetchReceptionistData(true);
                    }}
                />
            )}

            {/* Modal: Add Appointment */}
            {showAddAppointmentModal && (
                <AddAppointmentModal
                    onClose={() => setShowAddAppointmentModal(false)}
                    onAppointmentAdded={() => {
                        setShowAddAppointmentModal(false);
                        setToast({
                            type: 'success',
                            text: 'New appointment booked successfully!'
                        });
                        fetchReceptionistData(true);
                    }}
                />
            )}

            {/* Modal: Inpatient Admission */}
            {showAdmitModal && (
                <AdmitPatientModal
                    onClose={() => setShowAdmitModal(false)}
                    onPatientAdmitted={() => {
                        setShowAdmitModal(false);
                        setToast({
                            type: 'success',
                            text: 'Patient admitted to inpatient bed successfully!'
                        });
                        fetchReceptionistData(true);
                    }}
                />
            )}

            {/* Modal: Reschedule Appointment */}
            {selectedApptToReschedule && (
                <RescheduleAppointmentModal
                    appointment={selectedApptToReschedule}
                    onClose={() => setSelectedApptToReschedule(null)}
                    onRescheduled={(updated) => {
                        setSelectedApptToReschedule(null);
                        setToast({
                            type: 'success',
                            text: `Appointment #${updated.id} successfully rescheduled to ${new Date(updated.appointmentDateTime).toLocaleString()}!`
                        });
                        fetchReceptionistData(true);
                    }}
                />
            )}

        </div>
    );
}

export default ReceptionistDashboard;
