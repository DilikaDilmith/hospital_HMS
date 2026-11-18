import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { 
    FaCalendarCheck, 
    FaHospital, 
    FaUserMd, 
    FaClock, 
    FaCalendarAlt, 
    FaMoneyBillWave, 
    FaCheckCircle, 
    FaExclamationCircle, 
    FaExclamationTriangle,
    FaSpinner, 
    FaArrowRight, 
    FaStethoscope,
    FaPhone,
    FaEnvelope,
    FaRedo
} from 'react-icons/fa';

function BookAppointment() {
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState('ALL');
    const [appointmentData, setAppointmentData] = useState({
        doctorId: '',
        appointmentDateTime: '',
        reason: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookedAppointment, setBookedAppointment] = useState(null);
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [scheduleWarning, setScheduleWarning] = useState('');

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Fetch Departments and Doctors
    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            try {
                const [deptRes, docRes] = await Promise.all([
                    axios.get('http://localhost:8080/api/departments', config),
                    axios.get('http://localhost:8080/api/doctors', config)
                ]);
                setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
                setDoctors(Array.isArray(docRes.data) ? docRes.data : []);
            } catch (error) {
                console.error("Error loading appointment booking data:", error);
                setErrorMessage("Failed to load departments and doctors. Please ensure the backend is running.");
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    // Filter doctors based on selected department
    const filteredDoctors = selectedDepartment === 'ALL'
        ? doctors
        : doctors.filter(d => d.department && String(d.department.id) === String(selectedDepartment));

    // Handle department change
    const handleDepartmentChange = (deptId) => {
        setSelectedDepartment(deptId);
        // Reset doctor selection if current doctor is not in the newly selected department
        if (deptId !== 'ALL' && appointmentData.doctorId) {
            const docInDept = doctors.find(d => 
                String(d.id) === String(appointmentData.doctorId) && 
                d.department && 
                String(d.department.id) === String(deptId)
            );
            if (!docInDept) {
                setAppointmentData(prev => ({ ...prev, doctorId: '' }));
                setScheduleWarning('');
            }
        }
        if (errorMessage) setErrorMessage('');
    };

    // Selected doctor object
    const selectedDoctor = doctors.find(d => String(d.id) === String(appointmentData.doctorId));

    // Real-time schedule validation against doctor's working days & hours
    const validateSchedule = (doc, dateTimeStr) => {
        if (!doc || !dateTimeStr) {
            setScheduleWarning('');
            return true;
        }

        const dateObj = new Date(dateTimeStr);
        if (isNaN(dateObj.getTime())) {
            setScheduleWarning('');
            return true;
        }

        // 1. Check if date is in the future
        const now = new Date();
        if (dateObj <= now) {
            setScheduleWarning('Selected appointment date & time must be in the future.');
            return false;
        }

        // 2. Check working day of week
        const daysMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const selectedDayOfWeek = daysMap[dateObj.getDay()];
        const selectedDayLabel = dayNames[dateObj.getDay()];

        if (doc.availableDays) {
            const availableList = doc.availableDays.split(',').map(d => d.trim().toUpperCase());
            const isDayAvailable = availableList.some(d => 
                d === selectedDayOfWeek || d === selectedDayOfWeek.substring(0, 3)
            );

            if (!isDayAvailable) {
                setScheduleWarning(`Dr. ${doc.firstName} ${doc.lastName} is not scheduled to work on ${selectedDayLabel}s. Available days: ${formatDays(doc.availableDays)}.`);
                return false;
            }
        }

        // 3. Check working hours
        const selectedHour = dateObj.getHours();
        const selectedMinute = dateObj.getMinutes();
        const selectedTimeMinutes = selectedHour * 60 + selectedMinute;

        const parseTimeToMinutes = (timeStr, fallbackMinutes) => {
            if (!timeStr) return fallbackMinutes;
            const parts = timeStr.split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
        };

        const startMinutes = parseTimeToMinutes(doc.availableTimeStart, 8 * 60);
        const endMinutes = parseTimeToMinutes(doc.availableTimeEnd, 17 * 60);

        if (selectedTimeMinutes < startMinutes || selectedTimeMinutes > endMinutes) {
            const startLabel = doc.availableTimeStart ? doc.availableTimeStart.substring(0, 5) : '08:00';
            const endLabel = doc.availableTimeEnd ? doc.availableTimeEnd.substring(0, 5) : '17:00';
            setScheduleWarning(`Selected time is outside Dr. ${doc.firstName} ${doc.lastName}'s available working hours (${startLabel} - ${endLabel}).`);
            return false;
        }

        setScheduleWarning('');
        return true;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...appointmentData, [name]: value };
        setAppointmentData(updated);

        if (errorMessage) setErrorMessage('');

        if (name === 'doctorId') {
            const doc = doctors.find(d => String(d.id) === String(value));
            validateSchedule(doc, updated.appointmentDateTime);
        } else if (name === 'appointmentDateTime') {
            validateSchedule(selectedDoctor, value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setMessage('');

        if (!appointmentData.doctorId) {
            setErrorMessage('Please select a doctor for your appointment.');
            return;
        }

        if (!appointmentData.appointmentDateTime) {
            setErrorMessage('Please select an appointment date and time.');
            return;
        }

        if (!appointmentData.reason.trim()) {
            setErrorMessage('Please enter the reason for your visit.');
            return;
        }

        // Validate schedule client-side
        const isValid = validateSchedule(selectedDoctor, appointmentData.appointmentDateTime);
        if (!isValid && scheduleWarning) {
            setErrorMessage(scheduleWarning);
            return;
        }

        setIsSubmitting(true);

        try {
            let formattedTime = appointmentData.appointmentDateTime;
            if (formattedTime && formattedTime.length === 16) {
                formattedTime += ':00';
            }

            const payload = {
                appointmentDateTime: formattedTime,
                reason: appointmentData.reason.trim(),
                doctor: { id: parseInt(appointmentData.doctorId, 10) }
            };

            const response = await axios.post('http://localhost:8080/api/appointments', payload, config);
            setBookedAppointment(response.data);
            setMessage("Your appointment has been successfully scheduled!");
        } catch (error) {
            console.error("Error booking appointment:", error);
            let errMsg = "Failed to book appointment.";
            if (error.response?.status === 409) {
                errMsg = error.response.data || "The selected doctor already has an appointment booked at this time slot or is not available. Please choose another time.";
            } else if (error.response?.data) {
                errMsg = typeof error.response.data === 'string' 
                    ? error.response.data 
                    : error.response.data.message || errMsg;
            }
            setErrorMessage(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setBookedAppointment(null);
        setAppointmentData({
            doctorId: '',
            appointmentDateTime: '',
            reason: ''
        });
        setSelectedDepartment('ALL');
        setMessage('');
        setErrorMessage('');
        setScheduleWarning('');
    };

    const formatDays = (daysStr) => {
        if (!daysStr) return 'Mon - Fri';
        const dayMap = {
            'MONDAY': 'Mon', 'TUESDAY': 'Tue', 'WEDNESDAY': 'Wed', 'THURSDAY': 'Thu',
            'FRIDAY': 'Fri', 'SATURDAY': 'Sat', 'SUNDAY': 'Sun'
        };
        const parts = daysStr.split(',').map(d => d.trim().toUpperCase());
        if (parts.length === 7) return 'All Days (Mon-Sun)';
        if (parts.length === 5 && !parts.includes('SATURDAY') && !parts.includes('SUNDAY')) return 'Mon - Fri';
        return parts.map(p => dayMap[p] || p).join(', ');
    };

    const formatHours = (start, end) => {
        const s = start ? start.substring(0, 5) : '08:00';
        const e = end ? end.substring(0, 5) : '17:00';
        return `${s} - ${e}`;
    };

    // Calculate minimum allowed date-time (current time + 15 mins)
    const getMinDateTime = () => {
        const now = new Date(Date.now() + 15 * 60 * 1000);
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    if (loadingData) {
        return (
            <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
                <FaSpinner className="animate-spin text-cyan-600 mx-auto text-3xl" />
                <p className="text-gray-500 text-sm font-medium">Loading departments and available doctors...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <FaCalendarCheck size={24} className="text-cyan-100" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Book a Medical Appointment</h2>
                        <p className="text-cyan-100 text-xs mt-0.5">
                            Select a department, choose your preferred doctor, and pick an available date & time.
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start justify-between gap-3 text-xs font-semibold animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                        <FaExclamationCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Appointment Notice</p>
                            <p className="text-rose-600 mt-0.5 font-normal">{errorMessage}</p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => setErrorMessage('')} 
                        className="text-rose-400 hover:text-rose-700 font-bold ml-2"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Success Booking Confirmation Card */}
            {bookedAppointment ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-200 text-center space-y-5 animate-fadeIn">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <FaCheckCircle size={36} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Appointment Confirmed!</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Your appointment has been registered with reference ID <span className="font-bold text-cyan-700">#{bookedAppointment.id}</span>.
                        </p>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-left space-y-3 max-w-lg mx-auto text-xs">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Doctor:</span>
                            <span className="font-bold text-gray-800">
                                Dr. {bookedAppointment.doctor?.firstName} {bookedAppointment.doctor?.lastName} ({bookedAppointment.doctor?.specialization})
                            </span>
                        </div>
                        {bookedAppointment.doctor?.department && (
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Department:</span>
                                <span className="font-semibold text-cyan-700">{bookedAppointment.doctor.department.name}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Date & Time:</span>
                            <span className="font-bold text-gray-800">
                                {new Date(bookedAppointment.appointmentDateTime).toLocaleString(undefined, {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Consultation Fee:</span>
                            <span className="font-bold text-emerald-700">
                                LKR {bookedAppointment.doctor?.consultationFee ? bookedAppointment.doctor.consultationFee.toFixed(2) : '1,500.00'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Reason:</span>
                            <span className="font-medium text-gray-700 italic">{bookedAppointment.reason}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                        <button
                            onClick={handleReset}
                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                        >
                            <FaRedo size={12} /> Book Another Appointment
                        </button>
                        <button
                            onClick={() => navigate('/patient/dashboard')}
                            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
                        >
                            View on Dashboard <FaArrowRight size={12} />
                        </button>
                    </div>
                </div>
            ) : (
                /* Main Appointment Booking Form */
                <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Step 1: Select Department */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <FaHospital className="text-cyan-600" /> 1. Select Hospital Department
                                </label>
                                <span className="text-[11px] text-gray-400">
                                    {departments.length} departments available
                                </span>
                            </div>

                            <select
                                value={selectedDepartment}
                                onChange={(e) => handleDepartmentChange(e.target.value)}
                                className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 bg-white font-medium text-gray-800"
                            >
                                <option value="ALL">All Departments (Show All Doctors)</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name} {dept.description ? `— ${dept.description}` : ''}
                                    </option>
                                ))}
                            </select>

                            {/* Quick clickable Department pills */}
                            {departments.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    <button
                                        type="button"
                                        onClick={() => handleDepartmentChange('ALL')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                            selectedDepartment === 'ALL'
                                                ? 'bg-cyan-600 text-white shadow-xs'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        All ({doctors.length})
                                    </button>
                                    {departments.map(dept => {
                                        const count = doctors.filter(d => d.department?.id === dept.id).length;
                                        return (
                                            <button
                                                key={dept.id}
                                                type="button"
                                                onClick={() => handleDepartmentChange(String(dept.id))}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                                    String(selectedDepartment) === String(dept.id)
                                                        ? 'bg-cyan-600 text-white shadow-xs'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {dept.name} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Step 2: Select Doctor */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <FaUserMd className="text-cyan-600" /> 2. Select Doctor *
                                </label>
                                <span className="text-[11px] text-gray-400">
                                    {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} found
                                </span>
                            </div>

                            <select
                                name="doctorId"
                                value={appointmentData.doctorId}
                                onChange={handleChange}
                                required
                                className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 bg-white font-medium text-gray-800"
                            >
                                <option value="">-- Choose a Doctor --</option>
                                {filteredDoctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                        Dr. {doc.firstName} {doc.lastName} — {doc.specialization} ({doc.department?.name || 'General'}) • Fee: LKR {doc.consultationFee ? doc.consultationFee.toFixed(2) : '1,500.00'}
                                    </option>
                                ))}
                            </select>

                            {filteredDoctors.length === 0 && (
                                <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                                    No doctors found in this department. Please choose "All Departments" or select another department.
                                </p>
                            )}

                            {/* Detailed Doctor Availability Profile Card */}
                            {selectedDoctor && (
                                <div className="mt-3.5 p-4 bg-gradient-to-br from-cyan-50/60 to-blue-50/50 border border-cyan-200 rounded-xl space-y-2 text-xs">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                                                <FaStethoscope className="text-cyan-600" />
                                                Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                                            </h4>
                                            <p className="text-gray-500 text-[11px]">
                                                {selectedDoctor.specialization} • {selectedDoctor.department?.name || 'General Medicine'}
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full text-xs">
                                                Fee: LKR {selectedDoctor.consultationFee ? selectedDoctor.consultationFee.toFixed(2) : '1,500.00'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-cyan-100">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <FaCalendarAlt className="text-cyan-600 shrink-0" />
                                            <div>
                                                <span className="text-[11px] text-gray-500 font-medium block">Working Days:</span>
                                                <span className="font-semibold text-gray-800">
                                                    {formatDays(selectedDoctor.availableDays)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <FaClock className="text-cyan-600 shrink-0" />
                                            <div>
                                                <span className="text-[11px] text-gray-500 font-medium block">Available Hours:</span>
                                                <span className="font-semibold text-gray-800">
                                                    {formatHours(selectedDoctor.availableTimeStart, selectedDoctor.availableTimeEnd)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {(selectedDoctor.phoneNumber || selectedDoctor.email) && (
                                        <div className="flex flex-wrap gap-4 pt-1.5 text-[11px] text-gray-500">
                                            {selectedDoctor.phoneNumber && (
                                                <span className="flex items-center gap-1">
                                                    <FaPhone size={10} className="text-gray-400" /> {selectedDoctor.phoneNumber}
                                                </span>
                                            )}
                                            {selectedDoctor.email && (
                                                <span className="flex items-center gap-1">
                                                    <FaEnvelope size={10} className="text-gray-400" /> {selectedDoctor.email}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Step 3: Select Date & Time */}
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                <FaCalendarAlt className="text-cyan-600" /> 3. Select Appointment Date & Time *
                            </label>

                            <input
                                type="datetime-local"
                                name="appointmentDateTime"
                                value={appointmentData.appointmentDateTime}
                                onChange={handleChange}
                                min={getMinDateTime()}
                                required
                                className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 bg-white font-medium text-gray-800"
                            />

                            {/* Real-time schedule warning */}
                            {scheduleWarning && (
                                <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-2">
                                    <FaExclamationTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span>{scheduleWarning}</span>
                                </div>
                            )}

                            {selectedDoctor && !scheduleWarning && appointmentData.appointmentDateTime && (
                                <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1 font-medium">
                                    <FaCheckCircle size={11} /> Selected slot fits Dr. {selectedDoctor.firstName}'s working schedule.
                                </p>
                            )}
                        </div>

                        {/* Step 4: Reason for Visit */}
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                <FaStethoscope className="text-cyan-600" /> 4. Reason for Consultation *
                            </label>
                            <textarea
                                name="reason"
                                value={appointmentData.reason}
                                onChange={handleChange}
                                required
                                rows="3"
                                placeholder="Describe symptoms or purpose (e.g. routine cardiac follow-up, persistent cough, fever)..."
                                className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 bg-white outline-none"
                            ></textarea>
                        </div>

                        {/* Booking Summary Box before submit */}
                        {selectedDoctor && appointmentData.appointmentDateTime && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                <p className="font-bold text-gray-700 uppercase text-[11px] tracking-wide mb-1">
                                    Appointment Summary
                                </p>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Department:</span>
                                    <span className="font-semibold text-gray-800">{selectedDoctor.department?.name || 'General Medicine'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Doctor:</span>
                                    <span className="font-semibold text-gray-800">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date & Time:</span>
                                    <span className="font-semibold text-gray-800">
                                        {new Date(appointmentData.appointmentDateTime).toLocaleString(undefined, {
                                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Consultation Fee:</span>
                                    <span className="font-bold text-emerald-700">
                                        LKR {selectedDoctor.consultationFee ? selectedDoctor.consultationFee.toFixed(2) : '1,500.00'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting || !!scheduleWarning}
                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <FaSpinner className="animate-spin" size={14} /> Scheduling Appointment...
                                    </>
                                ) : (
                                    <>
                                        <FaCalendarCheck size={14} /> Confirm & Book Appointment
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            )}
        </div>
    );
}

export default BookAppointment;
