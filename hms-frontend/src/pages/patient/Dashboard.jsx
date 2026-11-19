import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaCalendarPlus, 
    FaNotesMedical, 
    FaFlask, 
    FaFolderOpen, 
    FaUserCircle, 
    FaCalendarCheck, 
    FaFilePdf, 
    FaFileImage, 
    FaFileAlt, 
    FaEye, 
    FaDownload, 
    FaPrint, 
    FaUserShield,
    FaClock,
    FaUserMd,
    FaArrowRight
} from 'react-icons/fa';
import RescheduleAppointmentModal from '../../components/common/RescheduleAppointmentModal';
import PrintableLabReportModal from '../../components/common/PrintableLabReportModal';

function PatientDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'records' | 'lab' | 'documents'

    // Data lists
    const [appointments, setAppointments] = useState([]);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [labTests, setLabTests] = useState([]);
    const [documents, setDocuments] = useState([]);

    // Loading states
    const [loadingData, setLoadingData] = useState(true);

    // Messages & Modals
    const [cancelMsg, setCancelMsg] = useState('');
    const [cancelError, setCancelError] = useState('');
    const [selectedApptToReschedule, setSelectedApptToReschedule] = useState(null);
    const [selectedTestToPrint, setSelectedTestToPrint] = useState(null);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchAllPatientData = async () => {
        setLoadingData(true);
        try {
            const [userRes, apptRes, recRes, labRes, docRes] = await Promise.allSettled([
                axios.get('http://localhost:8080/api/users/profile', config),
                axios.get('http://localhost:8080/api/appointments/my', config),
                axios.get('http://localhost:8080/api/medical-records/my', config),
                axios.get('http://localhost:8080/api/lab-tests/my', config),
                axios.get('http://localhost:8080/api/documents/my', config)
            ]);

            if (userRes.status === 'fulfilled') setUser(userRes.value.data);
            if (apptRes.status === 'fulfilled' && Array.isArray(apptRes.value.data)) setAppointments(apptRes.value.data);
            if (recRes.status === 'fulfilled' && Array.isArray(recRes.value.data)) setMedicalRecords(recRes.value.data);
            if (labRes.status === 'fulfilled' && Array.isArray(labRes.value.data)) setLabTests(labRes.value.data);
            if (docRes.status === 'fulfilled' && Array.isArray(docRes.value.data)) setDocuments(docRes.value.data);
        } catch (error) {
            console.error("Error fetching patient dashboard data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchAllPatientData();
    }, []);

    const handleCancelAppointment = async (id) => {
        if (!window.confirm(`Are you sure you want to cancel appointment #${id}?`)) {
            return;
        }
        setCancelMsg('');
        setCancelError('');
        try {
            await axios.put(`http://localhost:8080/api/appointments/${id}/cancel`, {}, config);
            setCancelMsg(`Appointment #${id} has been cancelled successfully. Your time slot has been released.`);
            // Refresh appointments
            const res = await axios.get('http://localhost:8080/api/appointments/my', config);
            setAppointments(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error cancelling appointment:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to cancel appointment.';
            setCancelError(msg);
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
            return <FaFilePdf className="text-red-500 text-xl" />;
        }
        if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || type.includes('image')) {
            return <FaFileImage className="text-blue-500 text-xl" />;
        }
        return <FaFileAlt className="text-gray-500 text-xl" />;
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

    const getStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        if (s === 'SCHEDULED' || s === 'BOOKED') {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Scheduled</span>;
        }
        if (s === 'CONFIRMED') {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Confirmed</span>;
        }
        if (s === 'CHECKED_IN') {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Checked In</span>;
        }
        if (s === 'COMPLETED') {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">Completed</span>;
        }
        if (s === 'CANCELLED') {
            return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">Cancelled</span>;
        }
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    };

    return (
        <div className="pb-12 space-y-8 max-w-7xl mx-auto">
            {/* 1. Profile Banner (Welcome Section) */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <FaUserCircle size={58} className="text-cyan-200" />
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold mb-1 backdrop-blur-sm">
                            <FaUserShield size={11} /> Patient Portal • Strict Data Isolation
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Welcome, {user ? user.fullName : 'Valued Patient'}
                        </h2>
                        <p className="text-cyan-100 text-xs sm:text-sm mt-0.5">
                            Manage consultations, review clinical medical records, view diagnostic lab results, and download medical documents.
                        </p>
                    </div>
                </div>

                <Link
                    to="/profile"
                    className="bg-white text-blue-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-md text-xs sm:text-sm whitespace-nowrap"
                >
                    View & Edit Profile
                </Link>
            </div>

            {/* Notification Messages */}
            {cancelMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex justify-between items-center shadow-sm">
                    <span>{cancelMsg}</span>
                    <button onClick={() => setCancelMsg('')} className="font-bold text-emerald-700 hover:text-emerald-900 text-lg">&times;</button>
                </div>
            )}
            {cancelError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl flex justify-between items-center shadow-sm">
                    <span>{cancelError}</span>
                    <button onClick={() => setCancelError('')} className="font-bold text-rose-700 hover:text-rose-900 text-lg">&times;</button>
                </div>
            )}

            {/* 2. Quick Action Cards (4 Core Features) */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center justify-between">
                    <span>Quick Healthcare Actions</span>
                    <span className="text-xs font-normal text-gray-500">Instant access to your records</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Book Appointment */}
                    <Link 
                        to="/patient/book-appointment" 
                        className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
                                <FaCalendarPlus size={22} />
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm mb-1">Book Appointment</h4>
                            <p className="text-xs text-gray-500">Select department, attending doctor, and date to schedule consultation.</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition">
                            Book Now <FaArrowRight size={10} className="ml-1" />
                        </div>
                    </Link>

                    {/* 2. Medical Records */}
                    <Link 
                        to="/patient/medical-records" 
                        className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow-md transition group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                                <FaNotesMedical size={22} />
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm mb-1">Medical Records</h4>
                            <p className="text-xs text-gray-500">Review clinical diagnoses, treatment summaries, and physician prescriptions.</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition">
                            View Records ({medicalRecords.length}) <FaArrowRight size={10} className="ml-1" />
                        </div>
                    </Link>

                    {/* 3. Lab Results */}
                    <Link 
                        to="/patient/lab-results" 
                        className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-amber-500 hover:shadow-md transition group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition">
                                <FaFlask size={22} />
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm mb-1">Lab Results</h4>
                            <p className="text-xs text-gray-500">Inspect pathology logs, specimen findings, and print diagnostic lab reports.</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-semibold text-amber-600 group-hover:translate-x-1 transition">
                            View Tests ({labTests.length}) <FaArrowRight size={10} className="ml-1" />
                        </div>
                    </Link>

                    {/* 4. Medical Documents (Uploaded by Hospital Staff) */}
                    <Link 
                        to="/patient/documents" 
                        className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-purple-500 hover:shadow-md transition group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition">
                                <FaFolderOpen size={22} />
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm mb-1">Medical Documents</h4>
                            <p className="text-xs text-gray-500">Access scans, discharge forms, and PDFs uploaded by hospital doctors & staff.</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-semibold text-purple-600 group-hover:translate-x-1 transition">
                            View Files ({documents.length}) <FaArrowRight size={10} className="ml-1" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* 3. Unified Healthcare Activity Hub (Tabbed Content for Patient Dashboard) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Navigation Tabs */}
                <div className="border-b border-gray-200 bg-gray-50/70 p-2 sm:p-3 flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                            activeTab === 'appointments'
                                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <FaCalendarCheck className="text-blue-600" />
                        <span>My Consultations</span>
                        <span className="ml-1 px-2 py-0.2 rounded-full text-[11px] bg-blue-100 text-blue-800 font-bold">
                            {appointments.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('records')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                            activeTab === 'records'
                                ? 'bg-white text-emerald-700 shadow-sm border border-gray-200'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <FaNotesMedical className="text-emerald-600" />
                        <span>Medical Records</span>
                        <span className="ml-1 px-2 py-0.2 rounded-full text-[11px] bg-emerald-100 text-emerald-800 font-bold">
                            {medicalRecords.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('lab')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                            activeTab === 'lab'
                                ? 'bg-white text-amber-700 shadow-sm border border-gray-200'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <FaFlask className="text-amber-500" />
                        <span>Lab Results</span>
                        <span className="ml-1 px-2 py-0.2 rounded-full text-[11px] bg-amber-100 text-amber-800 font-bold">
                            {labTests.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                            activeTab === 'documents'
                                ? 'bg-white text-purple-700 shadow-sm border border-gray-200'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <FaFolderOpen className="text-purple-600" />
                        <span>Uploaded Documents</span>
                        <span className="ml-1 px-2 py-0.2 rounded-full text-[11px] bg-purple-100 text-purple-800 font-bold">
                            {documents.length}
                        </span>
                    </button>
                </div>

                {/* Tab 1: Appointments */}
                {activeTab === 'appointments' && (
                    <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                                <FaCalendarCheck className="text-blue-600" /> My Scheduled Appointments
                            </h4>
                            <Link to="/patient/book-appointment" className="text-xs font-semibold text-blue-600 hover:underline">
                                + Book Another
                            </Link>
                        </div>

                        {loadingData ? (
                            <div className="py-10 text-center text-gray-400 text-xs">Loading appointments...</div>
                        ) : appointments.length === 0 ? (
                            <div className="py-10 text-center text-gray-400 text-xs">
                                No consultations found. Use the "Book Appointment" button above to schedule your visit.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase bg-gray-50">
                                            <th className="p-3">ID</th>
                                            <th className="p-3">Doctor</th>
                                            <th className="p-3">Date & Time</th>
                                            <th className="p-3">Reason</th>
                                            <th className="p-3 text-center">Status</th>
                                            <th className="p-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {appointments.map((appt) => {
                                            const canCancel = (appt.status || '').toUpperCase() === 'SCHEDULED' || (appt.status || '').toUpperCase() === 'CONFIRMED';
                                            return (
                                                <tr key={appt.id} className="hover:bg-gray-50/70 transition">
                                                    <td className="p-3 font-semibold text-gray-700">#{appt.id}</td>
                                                    <td className="p-3">
                                                        <div className="font-semibold text-gray-900 text-xs sm:text-sm">
                                                            {appt.doctor ? `Dr. ${appt.doctor.firstName} ${appt.doctor.lastName}` : 'Assigned Doctor'}
                                                        </div>
                                                        <span className="text-[11px] text-gray-500">{appt.doctor?.specialization || 'General Consultation'}</span>
                                                    </td>
                                                    <td className="p-3 text-gray-600 text-xs">
                                                        {new Date(appt.appointmentDateTime).toLocaleString()}
                                                    </td>
                                                    <td className="p-3 text-gray-600 text-xs max-w-xs truncate" title={appt.reason}>
                                                        {appt.reason || 'General Consultation'}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {getStatusBadge(appt.status)}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {canCancel ? (
                                                            <div className="flex items-center justify-center gap-1.5">
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
                                                            <span className="text-xs text-gray-400">—</span>
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

                {/* Tab 2: Medical Records */}
                {activeTab === 'records' && (
                    <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                                <FaNotesMedical className="text-emerald-600" /> Electronic Medical Records (EMR)
                            </h4>
                            <Link to="/patient/medical-records" className="text-xs font-semibold text-emerald-600 hover:underline">
                                View Full Records Page
                            </Link>
                        </div>

                        {loadingData ? (
                            <div className="py-10 text-center text-gray-400 text-xs">Loading medical records...</div>
                        ) : medicalRecords.length === 0 ? (
                            <div className="py-10 text-center text-gray-400 text-xs">
                                No clinical medical records recorded yet. Records entered by your doctors will appear here securely.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {medicalRecords.map((record) => (
                                    <div key={record.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 transition">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h5 className="font-bold text-gray-900 text-sm">Diagnosis: {record.diagnosis}</h5>
                                                <p className="text-xs text-gray-500">
                                                    Attending: Dr. {record.doctor ? `${record.doctor.firstName} ${record.doctor.lastName}` : 'Hospital Physician'}
                                                </p>
                                            </div>
                                            <span className="text-[11px] font-semibold bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                                {record.recordDate ? new Date(record.recordDate).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100 text-xs">
                                            <span className="font-semibold text-emerald-700 block mb-0.5">Prescription / Medication:</span>
                                            <span className="text-gray-600">{record.prescription || 'No medications listed'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Lab Results */}
                {activeTab === 'lab' && (
                    <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                                <FaFlask className="text-amber-500" /> Diagnostic Laboratory Test Results
                            </h4>
                            <Link to="/patient/lab-results" className="text-xs font-semibold text-amber-600 hover:underline">
                                View Full Lab Results Page
                            </Link>
                        </div>

                        {loadingData ? (
                            <div className="py-10 text-center text-gray-400 text-xs">Loading lab tests...</div>
                        ) : labTests.length === 0 ? (
                            <div className="py-10 text-center text-gray-400 text-xs">
                                No lab tests ordered for your profile. Tests requested by doctors will appear here.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase bg-gray-50">
                                            <th className="p-3">Test Name</th>
                                            <th className="p-3">Requested Date</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Result Summary</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {labTests.map((test) => (
                                            <tr key={test.id} className="hover:bg-gray-50/70 transition">
                                                <td className="p-3 font-semibold text-gray-900">{test.testName}</td>
                                                <td className="p-3 text-gray-600 text-xs">
                                                    {test.requestedAt ? new Date(test.requestedAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                                        test.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {test.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-xs">
                                                    {test.result ? (
                                                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                            {test.result}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Processing at laboratory...</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {test.status === 'COMPLETED' ? (
                                                        <button
                                                            onClick={() => setSelectedTestToPrint(test)}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            <FaPrint size={11} /> Print Report
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Pending</span>
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

                {/* Tab 4: Uploaded Medical Documents */}
                {activeTab === 'documents' && (
                    <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                                    <FaFolderOpen className="text-purple-600" /> Medical Documents Uploaded by Hospital Side
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Scans, lab PDFs, discharge summaries, and clinical reports uploaded by doctors, nurses, or admins
                                </p>
                            </div>
                            <Link to="/patient/documents" className="text-xs font-semibold text-purple-600 hover:underline">
                                View Full Documents Hub
                            </Link>
                        </div>

                        {loadingData ? (
                            <div className="py-10 text-center text-gray-400 text-xs">Loading documents...</div>
                        ) : documents.length === 0 ? (
                            <div className="py-12 text-center text-gray-400">
                                <FaFolderOpen className="mx-auto text-4xl text-gray-300 mb-2" />
                                <p className="text-xs font-semibold text-gray-600">No medical documents uploaded yet</p>
                                <p className="text-[11px] text-gray-400 mt-1 max-w-md mx-auto">
                                    When doctors or administrators upload diagnostic scans, clinical reports, or discharge letters to your record, they will appear here instantly.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase bg-gray-50">
                                            <th className="p-3">File Name</th>
                                            <th className="p-3">Description</th>
                                            <th className="p-3">Uploaded By</th>
                                            <th className="p-3">Upload Date</th>
                                            <th className="p-3">File Size</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {documents.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-gray-50/70 transition">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2.5">
                                                        {getFileIcon(doc.originalFileName, doc.fileType)}
                                                        <span className="font-semibold text-gray-900 text-xs">{doc.originalFileName}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-xs text-gray-600 max-w-xs truncate">
                                                    {doc.description || <span className="text-gray-400 italic">No description</span>}
                                                </td>
                                                <td className="p-3 text-xs">
                                                    <span className="inline-flex items-center gap-1 font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                                                        <FaUserMd className="text-blue-500 text-[10px]" />
                                                        {doc.uploadedBy || 'Hospital Staff'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-xs text-gray-600">
                                                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString([], {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    }) : 'N/A'}
                                                </td>
                                                <td className="p-3 text-xs text-gray-500 font-mono">
                                                    {formatFileSize(doc.fileSizeBytes)}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleViewDocument(doc)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition shadow-sm"
                                                            title="Preview document in browser"
                                                        >
                                                            <FaEye size={11} /> View
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadDocument(doc)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 transition shadow-sm"
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
            </div>

            {/* Reschedule Appointment Modal */}
            {selectedApptToReschedule && (
                <RescheduleAppointmentModal
                    appointment={selectedApptToReschedule}
                    onClose={() => setSelectedApptToReschedule(null)}
                    onRescheduled={(updated) => {
                        setCancelMsg(`Appointment #${updated.id} successfully rescheduled to ${new Date(updated.appointmentDateTime).toLocaleString()}!`);
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
        </div>
    );
}

export default PatientDashboard;
