import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaCalendarPlus, 
    FaCalendarCheck, 
    FaNotesMedical, 
    FaFlask, 
    FaFolderOpen, 
    FaUserCircle, 
    FaFilePdf, 
    FaFileImage, 
    FaFileAlt, 
    FaEye, 
    FaDownload, 
    FaPrint, 
    FaUserShield,
    FaClock,
    FaUserMd,
    FaArrowRight,
    FaSearch,
    FaCheckCircle,
    FaTimesCircle,
    FaSyncAlt,
    FaFileInvoiceDollar,
    FaReceipt,
    FaStethoscope,
    FaIdCard,
    FaPhone,
    FaVenusMars,
    FaBirthdayCake,
    FaChevronRight,
    FaCalendarAlt
} from 'react-icons/fa';
import RescheduleAppointmentModal from '../../components/common/RescheduleAppointmentModal';
import PrintableLabReportModal from '../../components/common/PrintableLabReportModal';
import PrintableInvoiceModal from '../../components/common/PrintableInvoiceModal';

function PatientDashboard() {
    const [user, setUser] = useState(null);
    const [patient, setPatient] = useState(null);
    const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'records' | 'lab' | 'documents' | 'invoices'

    // Data lists
    const [appointments, setAppointments] = useState([]);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [labTests, setLabTests] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [invoices, setInvoices] = useState([]);

    // Search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [appointmentFilter, setAppointmentFilter] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'

    // Loading states
    const [loadingData, setLoadingData] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Feedback Messages & Modals
    const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });
    const [selectedApptToReschedule, setSelectedApptToReschedule] = useState(null);
    const [selectedTestToPrint, setSelectedTestToPrint] = useState(null);
    const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState(null);

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    const fetchAllPatientData = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoadingData(true);

        try {
            const [userRes, patientRes, apptRes, recRes, labRes, docRes, invRes] = await Promise.allSettled([
                axios.get('http://localhost:8080/api/users/profile', config),
                axios.get('http://localhost:8080/api/patients/profile', config),
                axios.get('http://localhost:8080/api/appointments/my', config),
                axios.get('http://localhost:8080/api/medical-records/my', config),
                axios.get('http://localhost:8080/api/lab-tests/my', config),
                axios.get('http://localhost:8080/api/documents/my', config),
                axios.get('http://localhost:8080/api/invoices/my', config)
            ]);

            if (userRes.status === 'fulfilled') setUser(userRes.value.data);
            if (patientRes.status === 'fulfilled') setPatient(patientRes.value.data);
            if (apptRes.status === 'fulfilled' && Array.isArray(apptRes.value.data)) setAppointments(apptRes.value.data);
            if (recRes.status === 'fulfilled' && Array.isArray(recRes.value.data)) setMedicalRecords(recRes.value.data);
            if (labRes.status === 'fulfilled' && Array.isArray(labRes.value.data)) setLabTests(labRes.value.data);
            if (invRes.status === 'fulfilled' && Array.isArray(invRes.value.data)) setInvoices(invRes.value.data);

            if (docRes.status === 'fulfilled' && Array.isArray(docRes.value.data)) {
                setDocuments(docRes.value.data);
            } else if (docRes.status === 'rejected' && (docRes.reason?.response?.status === 405 || docRes.reason?.response?.status === 404)) {
                // Fallback: fetch documents using the patient profile ID
                try {
                    const patientId = patientRes.status === 'fulfilled' ? patientRes.value?.data?.id : null;
                    if (patientId) {
                        const fallbackDocs = await axios.get(`http://localhost:8080/api/patients/${patientId}/documents`, config);
                        if (Array.isArray(fallbackDocs.data)) {
                            setDocuments(fallbackDocs.data);
                        }
                    }
                } catch (fallbackErr) {
                    console.warn("Patient dashboard fallback documents fetch error:", fallbackErr);
                }
            }
        } catch (error) {
            console.error("Error fetching patient dashboard data:", error);
        } finally {
            setLoadingData(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllPatientData();
    }, []);

    const handleCancelAppointment = async (id) => {
        if (!window.confirm(`Are you sure you want to cancel appointment #${id}?`)) {
            return;
        }
        setFeedbackMsg({ type: '', text: '' });
        try {
            await axios.put(`http://localhost:8080/api/appointments/${id}/cancel`, {}, config);
            setFeedbackMsg({ 
                type: 'success', 
                text: `Appointment #${id} has been cancelled successfully. Your consultation slot was released.` 
            });
            // Refresh appointments
            const res = await axios.get('http://localhost:8080/api/appointments/my', config);
            setAppointments(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error cancelling appointment:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to cancel appointment.';
            setFeedbackMsg({ type: 'error', text: msg });
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getFileIcon = (fileName, fileType) => {
        const name = (fileName || '').toLowerCase();
        const type = (fileType || '').toLowerCase();
        if (name.endsWith('.pdf') || type.includes('pdf')) {
            return <FaFilePdf className="text-red-500 text-lg flex-shrink-0" />;
        }
        if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || type.includes('image')) {
            return <FaFileImage className="text-blue-500 text-lg flex-shrink-0" />;
        }
        return <FaFileAlt className="text-gray-400 text-lg flex-shrink-0" />;
    };

    const handleViewDocument = async (doc) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/documents/${doc.id}/view`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: doc.fileType || 'application/octet-stream' });
            const fileUrl = window.URL.createObjectURL(blob);
            window.open(fileUrl, '_blank');
        } catch (err) {
            console.error("Error opening document:", err);
            alert("Could not open preview. You may download it directly.");
        }
    };

    const handleDownloadDocument = async (doc) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/documents/${doc.id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: doc.fileType || 'application/octet-stream' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', doc.originalFileName || `document-${doc.id}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error("Error downloading document:", err);
            alert("Failed to download document.");
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Calculate upcoming appointments
    const now = new Date();
    const upcomingAppointments = useMemo(() => {
        return appointments
            .filter(a => {
                const s = (a.status || '').toUpperCase();
                if (s === 'CANCELLED' || s === 'COMPLETED') return false;
                if (!a.appointmentDateTime) return false;
                return new Date(a.appointmentDateTime) >= new Date(now.getTime() - 2 * 60 * 60 * 1000);
            })
            .sort((a, b) => new Date(a.appointmentDateTime) - new Date(b.appointmentDateTime));
    }, [appointments]);

    const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

    // Derived counts
    const completedLabCount = useMemo(() => {
        return labTests.filter(t => (t.status || '').toUpperCase() === 'COMPLETED').length;
    }, [labTests]);

    const pendingLabCount = useMemo(() => {
        return labTests.filter(t => (t.status || '').toUpperCase() !== 'COMPLETED').length;
    }, [labTests]);

    const unpaidInvoicesCount = useMemo(() => {
        return invoices.filter(i => (i.status || '').toUpperCase() !== 'PAID').length;
    }, [invoices]);

    // Status pill badge helper
    const getStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'SCHEDULED':
            case 'BOOKED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Scheduled</span>;
            case 'CONFIRMED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Confirmed</span>;
            case 'CHECKED_IN':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Checked In</span>;
            case 'COMPLETED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Completed</span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">Cancelled</span>;
            case 'PAID':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Paid</span>;
            case 'UNPAID':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">Unpaid</span>;
            case 'PARTIALLY_PAID':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Partially Paid</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    // Filtered lists based on search
    const filteredAppointments = useMemo(() => {
        return appointments.filter(a => {
            const s = (a.status || '').toUpperCase();
            if (appointmentFilter === 'UPCOMING') {
                if (s === 'CANCELLED' || s === 'COMPLETED') return false;
            } else if (appointmentFilter === 'COMPLETED') {
                if (s !== 'COMPLETED') return false;
            } else if (appointmentFilter === 'CANCELLED') {
                if (s !== 'CANCELLED') return false;
            }

            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            const docName = `${a.doctor?.firstName || ''} ${a.doctor?.lastName || ''}`.toLowerCase();
            const spec = (a.doctor?.specialization || '').toLowerCase();
            const reason = (a.reason || '').toLowerCase();
            return docName.includes(term) || spec.includes(term) || reason.includes(term) || String(a.id).includes(term);
        });
    }, [appointments, appointmentFilter, searchTerm]);

    const filteredRecords = useMemo(() => {
        if (!searchTerm.trim()) return medicalRecords;
        const term = searchTerm.toLowerCase();
        return medicalRecords.filter(r => {
            const diag = (r.diagnosis || '').toLowerCase();
            const rx = (r.prescription || '').toLowerCase();
            const docName = `${r.doctor?.firstName || ''} ${r.doctor?.lastName || ''}`.toLowerCase();
            return diag.includes(term) || rx.includes(term) || docName.includes(term);
        });
    }, [medicalRecords, searchTerm]);

    const filteredLabTests = useMemo(() => {
        if (!searchTerm.trim()) return labTests;
        const term = searchTerm.toLowerCase();
        return labTests.filter(t => {
            const name = (t.testName || '').toLowerCase();
            const res = (t.result || '').toLowerCase();
            const status = (t.status || '').toLowerCase();
            return name.includes(term) || res.includes(term) || status.includes(term);
        });
    }, [labTests, searchTerm]);

    const filteredDocuments = useMemo(() => {
        if (!searchTerm.trim()) return documents;
        const term = searchTerm.toLowerCase();
        return documents.filter(d => {
            const name = (d.originalFileName || '').toLowerCase();
            const desc = (d.description || '').toLowerCase();
            const uploader = (d.uploadedBy || '').toLowerCase();
            return name.includes(term) || desc.includes(term) || uploader.includes(term);
        });
    }, [documents, searchTerm]);

    const filteredInvoices = useMemo(() => {
        if (!searchTerm.trim()) return invoices;
        const term = searchTerm.toLowerCase();
        return invoices.filter(inv => {
            const num = (inv.invoiceNumber || '').toLowerCase();
            const status = (inv.status || '').toLowerCase();
            return num.includes(term) || status.includes(term) || String(inv.id).includes(term);
        });
    }, [invoices, searchTerm]);

    const displayName = patient?.firstName 
        ? `${patient.firstName} ${patient.lastName || ''}`.trim()
        : (user?.fullName || 'Valued Patient');

    return (
        <div className="pb-14 max-w-7xl mx-auto space-y-6 px-3 sm:px-6">
            
            {/* 1. Header & Welcome Card (Simple, Modern, Clean) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-700 text-white p-6 sm:p-8 shadow-lg">
                {/* Subtle background glow effect */}
                <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute right-40 -bottom-16 w-48 h-48 rounded-full bg-sky-400/20 blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
                            <FaUserCircle size={40} className="text-sky-200" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-sm">
                                    <FaUserShield size={10} /> Patient Portal
                                </span>
                                {patient?.id && (
                                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/15 text-sky-100">
                                        ID: #P-{patient.id}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                {getGreeting()}, {displayName} 👋
                            </h1>

                            <div className="flex items-center gap-4 text-xs text-sky-100 mt-1.5 flex-wrap">
                                {patient?.gender && (
                                    <span className="flex items-center gap-1">
                                        <FaVenusMars size={11} className="text-sky-300" /> {patient.gender}
                                    </span>
                                )}
                                {patient?.age && (
                                    <span className="flex items-center gap-1">
                                        <FaBirthdayCake size={11} className="text-sky-300" /> {patient.age} Yrs
                                    </span>
                                )}
                                {patient?.phoneNumber && (
                                    <span className="flex items-center gap-1">
                                        <FaPhone size={10} className="text-sky-300" /> {patient.phoneNumber}
                                    </span>
                                )}
                                {patient?.nic && (
                                    <span className="flex items-center gap-1">
                                        <FaIdCard size={11} className="text-sky-300" /> NIC: {patient.nic}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                        <button
                            onClick={() => fetchAllPatientData(true)}
                            disabled={refreshing}
                            className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition border border-white/20 shadow-sm"
                            title="Refresh Dashboard Data"
                        >
                            <FaSyncAlt className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <Link
                            to="/profile"
                            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold transition border border-white/20 text-xs sm:text-sm whitespace-nowrap"
                        >
                            My Profile
                        </Link>
                        <Link
                            to="/patient/book-appointment"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-sky-50 font-bold transition shadow-md text-xs sm:text-sm whitespace-nowrap"
                        >
                            <FaCalendarPlus /> Book Appointment
                        </Link>
                    </div>
                </div>
            </div>

            {/* Notification Messages */}
            {feedbackMsg.text && (
                <div className={`p-4 rounded-2xl flex justify-between items-center text-xs sm:text-sm shadow-sm border ${
                    feedbackMsg.type === 'error' 
                        ? 'bg-rose-50 text-rose-800 border-rose-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                    <div className="flex items-center gap-2">
                        {feedbackMsg.type === 'error' ? <FaTimesCircle className="text-rose-500" /> : <FaCheckCircle className="text-emerald-500" />}
                        <span>{feedbackMsg.text}</span>
                    </div>
                    <button 
                        onClick={() => setFeedbackMsg({ type: '', text: '' })} 
                        className="font-bold text-gray-500 hover:text-gray-800 text-lg leading-none"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* 2. Key Metrics Cards (Simple, High-Contrast 5 Columns) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                
                {/* 1. Appointments */}
                <button
                    onClick={() => setActiveTab('appointments')}
                    className={`text-left p-4 rounded-2xl transition border flex flex-col justify-between ${
                        activeTab === 'appointments'
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Consultations</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <FaCalendarCheck size={14} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loadingData ? '...' : appointments.length}
                        </div>
                        <p className="text-[11px] text-blue-600 font-medium mt-1 truncate">
                            {upcomingAppointments.length} Upcoming
                        </p>
                    </div>
                </button>

                {/* 2. Medical Records */}
                <button
                    onClick={() => setActiveTab('records')}
                    className={`text-left p-4 rounded-2xl transition border flex flex-col justify-between ${
                        activeTab === 'records'
                            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">EMR Records</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <FaNotesMedical size={14} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loadingData ? '...' : medicalRecords.length}
                        </div>
                        <p className="text-[11px] text-emerald-600 font-medium mt-1 truncate">
                            Prescriptions & Notes
                        </p>
                    </div>
                </button>

                {/* 3. Lab Results */}
                <button
                    onClick={() => setActiveTab('lab')}
                    className={`text-left p-4 rounded-2xl transition border flex flex-col justify-between ${
                        activeTab === 'lab'
                            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-amber-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Lab Results</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <FaFlask size={14} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loadingData ? '...' : labTests.length}
                        </div>
                        <p className="text-[11px] text-amber-700 font-medium mt-1 truncate">
                            {completedLabCount} Ready • {pendingLabCount} Pending
                        </p>
                    </div>
                </button>

                {/* 4. Medical Documents */}
                <button
                    onClick={() => setActiveTab('documents')}
                    className={`text-left p-4 rounded-2xl transition border flex flex-col justify-between ${
                        activeTab === 'documents'
                            ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-purple-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Documents</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                            <FaFolderOpen size={14} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loadingData ? '...' : documents.length}
                        </div>
                        <p className="text-[11px] text-purple-600 font-medium mt-1 truncate">
                            Scans & PDF Reports
                        </p>
                    </div>
                </button>

                {/* 5. Invoices & Billing */}
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`text-left p-4 rounded-2xl transition border flex flex-col justify-between col-span-2 sm:col-span-1 ${
                        activeTab === 'invoices'
                            ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-500/20 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-teal-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">Invoices</span>
                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                            <FaFileInvoiceDollar size={14} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            {loadingData ? '...' : invoices.length}
                        </div>
                        <p className="text-[11px] text-teal-700 font-medium mt-1 truncate">
                            {unpaidInvoicesCount > 0 ? `${unpaidInvoicesCount} Pending Payment` : 'All Settled'}
                        </p>
                    </div>
                </button>

            </div>

            {/* 3. Upcoming Appointment Spotlight (Top Priority UX) */}
            {nextAppointment ? (
                <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white rounded-3xl p-5 sm:p-6 border border-blue-200/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md">
                            <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                                {new Date(nextAppointment.appointmentDateTime).toLocaleDateString([], { month: 'short' })}
                            </span>
                            <span className="text-base font-extrabold leading-none mt-0.5">
                                {new Date(nextAppointment.appointmentDateTime).getDate()}
                            </span>
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold mb-1">
                                <FaClock size={10} /> Next Scheduled Consultation
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                {nextAppointment.doctor ? `Dr. ${nextAppointment.doctor.firstName} ${nextAppointment.doctor.lastName}` : 'Assigned Doctor'}
                                {nextAppointment.doctor?.specialization && (
                                    <span className="text-xs font-normal text-slate-500 ml-2">
                                        ({nextAppointment.doctor.specialization})
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center gap-4 text-xs text-slate-600 mt-1 flex-wrap">
                                <span className="flex items-center gap-1 font-medium text-blue-700">
                                    <FaCalendarAlt size={11} /> {new Date(nextAppointment.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {nextAppointment.reason && (
                                    <span className="text-slate-500">
                                        Reason: <strong className="text-slate-700">{nextAppointment.reason}</strong>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                            onClick={() => setSelectedApptToReschedule(nextAppointment)}
                            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 font-semibold text-xs border border-indigo-200 transition shadow-sm"
                        >
                            Reschedule
                        </button>
                        <button
                            onClick={() => handleCancelAppointment(nextAppointment.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-200 transition shadow-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                            <FaCalendarCheck size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">No upcoming consultations</p>
                            <p className="text-xs text-slate-500">Need medical care or a routine health checkup? Book an appointment today.</p>
                        </div>
                    </div>
                    <Link
                        to="/patient/book-appointment"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition whitespace-nowrap shadow-sm"
                    >
                        Schedule a Visit
                    </Link>
                </div>
            )}

            {/* 4. Unified Healthcare Activity Tabs (Simple & Organized) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                
                {/* Tab Navigation Header with Integrated Search */}
                <div className="border-b border-slate-200 bg-slate-50/70 p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    
                    {/* Tab Navigation Buttons */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        <button
                            onClick={() => { setActiveTab('appointments'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === 'appointments'
                                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaCalendarCheck className="text-blue-600" />
                            <span>Appointments</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                                {appointments.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('records'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === 'records'
                                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaNotesMedical className="text-emerald-600" />
                            <span>Medical Records</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                                {medicalRecords.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('lab'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === 'lab'
                                    ? 'bg-white text-amber-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaFlask className="text-amber-500" />
                            <span>Lab Results</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                                {labTests.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('documents'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === 'documents'
                                    ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaFolderOpen className="text-purple-600" />
                            <span>Documents</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
                                {documents.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('invoices'); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === 'invoices'
                                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <FaFileInvoiceDollar className="text-teal-600" />
                            <span>Invoices</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 text-teal-800 font-bold">
                                {invoices.length}
                            </span>
                        </button>
                    </div>

                    {/* Quick Search Within Active Tab */}
                    <div className="relative min-w-[220px]">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={
                                activeTab === 'appointments' ? 'Search doctor or reason...' :
                                activeTab === 'records' ? 'Search diagnosis or medicine...' :
                                activeTab === 'lab' ? 'Search test name...' :
                                activeTab === 'documents' ? 'Search document name...' : 'Search invoice #...'
                            }
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                {/* TAB 1: APPOINTMENTS */}
                {activeTab === 'appointments' && (
                    <div className="p-4 sm:p-6">
                        {/* Sub-filter Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                                {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setAppointmentFilter(f)}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition capitalize ${
                                            appointmentFilter === f
                                                ? 'bg-white text-blue-700 shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {f.toLowerCase()}
                                    </button>
                                ))}
                            </div>

                            <Link 
                                to="/patient/book-appointment" 
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                + Book New Consultation <FaChevronRight size={9} />
                            </Link>
                        </div>

                        {loadingData ? (
                            <div className="py-12 text-center text-slate-400 text-xs">Loading appointments...</div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <FaCalendarCheck className="mx-auto text-4xl text-slate-300 mb-2" />
                                <p className="text-xs font-semibold text-slate-600">No appointments found</p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    {searchTerm ? 'No appointments match your search criteria.' : 'You have not booked any appointments in this view.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                                            <th className="p-3.5">ID</th>
                                            <th className="p-3.5">Doctor</th>
                                            <th className="p-3.5">Date & Time</th>
                                            <th className="p-3.5">Reason</th>
                                            <th className="p-3.5 text-center">Status</th>
                                            <th className="p-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredAppointments.map((appt) => {
                                            const canModify = (appt.status || '').toUpperCase() === 'SCHEDULED' || (appt.status || '').toUpperCase() === 'CONFIRMED';
                                            return (
                                                <tr key={appt.id} className="hover:bg-slate-50/70 transition">
                                                    <td className="p-3.5 font-mono text-slate-500 text-xs">#{appt.id}</td>
                                                    <td className="p-3.5">
                                                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                                                            {appt.doctor ? `Dr. ${appt.doctor.firstName} ${appt.doctor.lastName}` : 'Assigned Doctor'}
                                                        </div>
                                                        <span className="text-[11px] text-slate-500">{appt.doctor?.specialization || 'General Practitioner'}</span>
                                                    </td>
                                                    <td className="p-3.5 text-slate-600 text-xs">
                                                        {new Date(appt.appointmentDateTime).toLocaleString([], {
                                                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="p-3.5 text-slate-600 text-xs max-w-xs truncate" title={appt.reason}>
                                                        {appt.reason || 'General Consultation'}
                                                    </td>
                                                    <td className="p-3.5 text-center">
                                                        {getStatusBadge(appt.status)}
                                                    </td>
                                                    <td className="p-3.5 text-right">
                                                        {canModify ? (
                                                            <div className="inline-flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => setSelectedApptToReschedule(appt)}
                                                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition"
                                                                >
                                                                    Reschedule
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCancelAppointment(appt.id)}
                                                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: MEDICAL RECORDS */}
                {activeTab === 'records' && (
                    <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                                    <FaNotesMedical className="text-emerald-600" /> Electronic Medical Records
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">Clinical consultation summaries, doctor diagnoses, and active prescriptions</p>
                            </div>
                            <Link to="/patient/medical-records" className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                                Full Records Page <FaChevronRight size={9} />
                            </Link>
                        </div>

                        {loadingData ? (
                            <div className="py-12 text-center text-slate-400 text-xs">Loading medical records...</div>
                        ) : filteredRecords.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <FaNotesMedical className="mx-auto text-4xl text-slate-300 mb-2" />
                                <p className="text-xs font-semibold text-slate-600">No medical records found</p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Records created by your attending physicians during consultations will be safely stored here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredRecords.map((record) => (
                                    <div key={record.id} className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 hover:border-emerald-300 transition">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                    Diagnosis
                                                </span>
                                                <h5 className="font-bold text-slate-900 text-sm mt-1.5">{record.diagnosis}</h5>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Attending: Dr. {record.doctor ? `${record.doctor.firstName} ${record.doctor.lastName}` : 'Hospital Physician'}
                                                </p>
                                            </div>
                                            <span className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg shadow-2xs">
                                                {record.recordDate ? new Date(record.recordDate).toLocaleDateString([], {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                }) : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="mt-3.5 p-3.5 bg-white rounded-xl border border-slate-100 text-xs">
                                            <div className="flex items-center gap-1.5 font-semibold text-emerald-800 mb-1">
                                                <FaStethoscope className="text-emerald-600" /> Prescribed Medications / Plan:
                                            </div>
                                            <p className="text-slate-700 whitespace-pre-wrap">{record.prescription || 'No medications listed.'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: LAB RESULTS */}
                {activeTab === 'lab' && (
                    <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                                    <FaFlask className="text-amber-500" /> Diagnostic Laboratory Test Results
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">Pathology tests, clinical specimen findings, and printable lab reports</p>
                            </div>
                            <Link to="/patient/lab-results" className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1">
                                Full Lab Page <FaChevronRight size={9} />
                            </Link>
                        </div>

                        {loadingData ? (
                            <div className="py-12 text-center text-slate-400 text-xs">Loading lab tests...</div>
                        ) : filteredLabTests.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <FaFlask className="mx-auto text-4xl text-slate-300 mb-2" />
                                <p className="text-xs font-semibold text-slate-600">No laboratory test orders found</p>
                                <p className="text-[11px] text-slate-400 mt-1">Diagnostic tests requested by your doctors will appear here automatically.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                                            <th className="p-3.5">Test Name</th>
                                            <th className="p-3.5">Requested Date</th>
                                            <th className="p-3.5">Status</th>
                                            <th className="p-3.5">Result Summary</th>
                                            <th className="p-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredLabTests.map((test) => (
                                            <tr key={test.id} className="hover:bg-slate-50/70 transition">
                                                <td className="p-3.5 font-semibold text-slate-900">{test.testName}</td>
                                                <td className="p-3.5 text-slate-600 text-xs">
                                                    {test.requestedAt ? new Date(test.requestedAt).toLocaleDateString([], {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    }) : 'N/A'}
                                                </td>
                                                <td className="p-3.5">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                        test.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {test.status}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-xs">
                                                    {test.result ? (
                                                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                                                            {test.result}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Processing at laboratory...</span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    {test.status === 'COMPLETED' ? (
                                                        <button
                                                            onClick={() => setSelectedTestToPrint(test)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            <FaPrint size={11} /> Print Report
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">In progress</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: MEDICAL DOCUMENTS */}
                {activeTab === 'documents' && (
                    <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                                    <FaFolderOpen className="text-purple-600" /> Medical Documents Uploaded by Hospital Side
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Diagnostic scans, lab PDFs, referral notes, and discharge letters uploaded by hospital staff
                                </p>
                            </div>
                            <Link to="/patient/documents" className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1">
                                Full Documents Hub <FaChevronRight size={9} />
                            </Link>
                        </div>

                        {loadingData ? (
                            <div className="py-12 text-center text-slate-400 text-xs">Loading documents...</div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <FaFolderOpen className="mx-auto text-4xl text-slate-300 mb-2" />
                                <p className="text-xs font-semibold text-slate-600">No medical documents uploaded yet</p>
                                <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                                    When doctors or hospital administrators upload clinical files, scans, or discharge summaries, they will appear here securely.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                                            <th className="p-3.5">File Name</th>
                                            <th className="p-3.5">Description</th>
                                            <th className="p-3.5">Uploaded By</th>
                                            <th className="p-3.5">Upload Date</th>
                                            <th className="p-3.5">File Size</th>
                                            <th className="p-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredDocuments.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                                                <td className="p-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        {getFileIcon(doc.originalFileName, doc.fileType)}
                                                        <span className="font-semibold text-slate-900 text-xs">{doc.originalFileName}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3.5 text-xs text-slate-600 max-w-xs truncate">
                                                    {doc.description || <span className="text-slate-400 italic">No description</span>}
                                                </td>
                                                <td className="p-3.5 text-xs">
                                                    <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                                        <FaUserMd className="text-blue-500 text-[10px]" />
                                                        {doc.uploadedBy || 'Hospital Staff'}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-xs text-slate-600">
                                                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString([], {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    }) : 'N/A'}
                                                </td>
                                                <td className="p-3.5 text-xs text-slate-500 font-mono">
                                                    {formatFileSize(doc.fileSizeBytes)}
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleViewDocument(doc)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition shadow-2xs"
                                                            title="Preview document in browser"
                                                        >
                                                            <FaEye size={11} /> View
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadDocument(doc)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 transition shadow-2xs"
                                                            title="Download file"
                                                        >
                                                            <FaDownload size={10} /> Download
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 5: INVOICES & BILLING */}
                {activeTab === 'invoices' && (
                    <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                                    <FaFileInvoiceDollar className="text-teal-600" /> Patient Invoices & Receipts
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">Itemized hospital charges, consultation fees, and official payment receipts</p>
                            </div>
                        </div>

                        {loadingData ? (
                            <div className="py-12 text-center text-slate-400 text-xs">Loading billing invoices...</div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <FaFileInvoiceDollar className="mx-auto text-4xl text-slate-300 mb-2" />
                                <p className="text-xs font-semibold text-slate-600">No invoices generated yet</p>
                                <p className="text-[11px] text-slate-400 mt-1">Invoices created for consultations or inpatient services will be listed here.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                                            <th className="p-3.5">Invoice #</th>
                                            <th className="p-3.5">Issue Date</th>
                                            <th className="p-3.5">Items Summary</th>
                                            <th className="p-3.5">Total Amount</th>
                                            <th className="p-3.5 text-center">Status</th>
                                            <th className="p-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredInvoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                                                <td className="p-3.5 font-mono font-bold text-slate-800 text-xs">
                                                    {inv.invoiceNumber || `#INV-${inv.id}`}
                                                </td>
                                                <td className="p-3.5 text-slate-600 text-xs">
                                                    {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString([], {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    }) : 'N/A'}
                                                </td>
                                                <td className="p-3.5 text-xs text-slate-600 max-w-xs truncate">
                                                    {inv.items && inv.items.length > 0 ? (
                                                        inv.items.map(it => it.description || it.category).join(', ')
                                                    ) : (
                                                        'General Medical Services'
                                                    )}
                                                </td>
                                                <td className="p-3.5 font-semibold text-slate-900 text-xs">
                                                    LKR {Number(inv.totalAmount || 0).toFixed(2)}
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    {getStatusBadge(inv.status)}
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    <button
                                                        onClick={() => setSelectedInvoiceToPrint(inv)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold transition"
                                                    >
                                                        <FaPrint size={11} /> {inv.status === 'PAID' ? 'View Receipt' : 'View Invoice'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Reschedule Appointment Modal */}
            {selectedApptToReschedule && (
                <RescheduleAppointmentModal
                    appointment={selectedApptToReschedule}
                    onClose={() => setSelectedApptToReschedule(null)}
                    onRescheduled={(updated) => {
                        setFeedbackMsg({
                            type: 'success',
                            text: `Appointment #${updated.id} successfully rescheduled to ${new Date(updated.appointmentDateTime).toLocaleString()}!`
                        });
                        fetchAllPatientData();
                    }}
                />
            )}

            {/* Printable Lab Report Modal */}
            {selectedTestToPrint && (
                <PrintableLabReportModal
                    test={selectedTestToPrint}
                    onClose={() => setSelectedTestToPrint(null)}
                />
            )}

            {/* Printable Invoice Modal */}
            {selectedInvoiceToPrint && (
                <PrintableInvoiceModal
                    invoice={selectedInvoiceToPrint}
                    mode={selectedInvoiceToPrint.status === 'PAID' ? 'RECEIPT' : 'INVOICE'}
                    onClose={() => setSelectedInvoiceToPrint(null)}
                />
            )}

        </div>
    );
}

export default PatientDashboard;
