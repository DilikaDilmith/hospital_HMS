import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaUserTie, 
    FaCalendarCheck, 
    FaPlus, 
    FaSearch, 
    FaClock, 
    FaCheckCircle, 
    FaTimesCircle, 
    FaSignInAlt, 
    FaSignOutAlt,
    FaEdit,
    FaTrash,
    FaMoneyBillWave,
    FaBuilding
} from 'react-icons/fa';

function StaffManagement() {
    const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'attendance'
    const [employees, setEmployees] = useState([]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [unassignedUsers, setUnassignedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Form States
    const [employeeForm, setEmployeeForm] = useState({
        userId: '',
        designation: '',
        department: 'Cardiology',
        contactNumber: '',
        salary: 60000,
        status: 'ACTIVE'
    });

    const [attendanceForm, setAttendanceForm] = useState({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        checkInTime: '08:30',
        checkOutTime: '17:00',
        status: 'PRESENT',
        notes: ''
    });

    const token = localStorage.getItem('token');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // Fetch Employees
    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:8080/api/staff/employees', authHeader);
            setEmployees(res.data);
        } catch (err) {
            console.error("Error fetching employees", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Attendance by Date
    const fetchAttendance = async (date) => {
        try {
            const queryDate = date || selectedDate;
            const res = await axios.get(`http://localhost:8080/api/staff/attendance?date=${queryDate}`, authHeader);
            setAttendanceList(res.data);
        } catch (err) {
            console.error("Error fetching attendance", err);
        }
    };

    // Fetch Unassigned Users for "Add Staff"
    const fetchUnassignedUsers = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/staff/unassigned-users', authHeader);
            setUnassignedUsers(res.data);
        } catch (err) {
            console.error("Error fetching unassigned users", err);
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchAttendance(selectedDate);
    }, []);

    const handleOpenAddModal = () => {
        fetchUnassignedUsers();
        setEmployeeForm({
            userId: '',
            designation: '',
            department: 'Cardiology',
            contactNumber: '',
            salary: 60000,
            status: 'ACTIVE'
        });
        setShowAddModal(true);
    };

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/api/staff/employees', employeeForm, authHeader);
            alert("✅ Employee record created successfully!");
            setShowAddModal(false);
            fetchEmployees();
        } catch (err) {
            alert("Error creating employee: " + (err.response?.data || err.message));
        }
    };

    const handleOpenEditModal = (emp) => {
        setSelectedEmployee(emp);
        setEmployeeForm({
            userId: emp.user?.id,
            designation: emp.designation,
            department: emp.department,
            contactNumber: emp.contactNumber,
            salary: emp.salary,
            status: emp.status
        });
        setShowEditModal(true);
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:8080/api/staff/employees/${selectedEmployee.id}`, employeeForm, authHeader);
            alert("✅ Employee record updated successfully!");
            setShowEditModal(false);
            fetchEmployees();
        } catch (err) {
            alert("Error updating employee: " + (err.response?.data || err.message));
        }
    };

    const handleDeleteEmployee = async (id) => {
        if (!window.confirm("Are you sure you want to delete this staff record?")) return;
        try {
            await axios.delete(`http://localhost:8080/api/staff/employees/${id}`, authHeader);
            alert("Staff record deleted.");
            fetchEmployees();
        } catch (err) {
            alert("Error deleting: " + (err.response?.data || err.message));
        }
    };

    // Quick Check-In for today
    const handleQuickCheckIn = async (employeeId) => {
        try {
            await axios.post('http://localhost:8080/api/staff/attendance/check-in', {
                employeeId,
                time: new Date().toTimeString().split(' ')[0],
                notes: 'Quick check-in'
            }, authHeader);
            alert("✅ Check-in recorded!");
            fetchAttendance(selectedDate);
        } catch (err) {
            alert("Check-in error: " + (err.response?.data || err.message));
        }
    };

    // Quick Check-Out for today
    const handleQuickCheckOut = async (employeeId) => {
        try {
            await axios.post('http://localhost:8080/api/staff/attendance/check-out', {
                employeeId,
                time: new Date().toTimeString().split(' ')[0]
            }, authHeader);
            alert("✅ Check-out recorded!");
            fetchAttendance(selectedDate);
        } catch (err) {
            alert("Check-out error: " + (err.response?.data || err.message));
        }
    };

    // Manual Attendance Submission
    const handleSaveAttendance = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/api/staff/attendance', attendanceForm, authHeader);
            alert("✅ Attendance logged successfully!");
            setShowAttendanceModal(false);
            fetchAttendance(selectedDate);
        } catch (err) {
            alert("Error recording attendance: " + (err.response?.data || err.message));
        }
    };

    // Filter employees by search
    const filteredEmployees = employees.filter(e => {
        const query = searchTerm.toLowerCase();
        return (
            (e.user?.fullName && e.user.fullName.toLowerCase().includes(query)) ||
            (e.user?.username && e.user.username.toLowerCase().includes(query)) ||
            (e.designation && e.designation.toLowerCase().includes(query)) ||
            (e.department && e.department.toLowerCase().includes(query)) ||
            (e.user?.role && e.user.role.toLowerCase().includes(query))
        );
    });

    const totalPayroll = employees.reduce((acc, curr) => acc + (curr.salary || 0), 0);
    const presentTodayCount = attendanceList.filter(a => a.status !== 'ABSENT').length;

    return (
        <div className="pb-12 max-w-7xl mx-auto">
            {/* 1. Header & Stats Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 rounded-2xl shadow-xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3">
                        <FaUserTie className="text-indigo-400" /> Staff HR & Attendance Management
                    </h1>
                    <p className="text-indigo-200 text-sm mt-1">
                        Manage hospital personnel roster, designations, monthly compensation, and daily attendance logs.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleOpenAddModal}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 text-sm transition"
                    >
                        <FaPlus /> Add Staff Member
                    </button>
                    <button
                        onClick={() => {
                            setAttendanceForm({
                                employeeId: employees[0]?.id || '',
                                date: selectedDate,
                                checkInTime: '08:30',
                                checkOutTime: '17:00',
                                status: 'PRESENT',
                                notes: ''
                            });
                            setShowAttendanceModal(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 text-sm transition"
                    >
                        <FaCalendarCheck /> Log Attendance
                    </button>
                </div>
            </div>

            {/* 2. Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Total Staff</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{employees.length}</h3>
                        <p className="text-xs text-indigo-600 mt-1 font-medium">Registered personnel</p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                        <FaUserTie size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Present Today</p>
                        <h3 className="text-2xl font-black text-emerald-600 mt-1">{presentTodayCount}</h3>
                        <p className="text-xs text-emerald-700 mt-1 font-medium">Checked in on {selectedDate}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                        <FaCheckCircle size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Monthly Payroll</p>
                        <h3 className="text-2xl font-black text-blue-600 mt-1">LKR {totalPayroll.toLocaleString()}</h3>
                        <p className="text-xs text-blue-700 mt-1 font-medium">Total base salaries</p>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                        <FaMoneyBillWave size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Departments</p>
                        <h3 className="text-2xl font-black text-purple-600 mt-1">
                            {new Set(employees.map(e => e.department)).size}
                        </h3>
                        <p className="text-xs text-purple-700 mt-1 font-medium">Operational units</p>
                    </div>
                    <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
                        <FaBuilding size={24} />
                    </div>
                </div>
            </div>

            {/* 3. Navigation Tabs */}
            <div className="flex border-b border-gray-200 mb-6 gap-2">
                <button
                    onClick={() => setActiveTab('roster')}
                    className={`py-3 px-6 font-bold text-sm rounded-t-lg transition flex items-center gap-2 ${
                        activeTab === 'roster'
                            ? 'bg-white border-t-2 border-indigo-600 text-indigo-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <FaUserTie /> Staff Roster ({employees.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('attendance');
                        fetchAttendance(selectedDate);
                    }}
                    className={`py-3 px-6 font-bold text-sm rounded-t-lg transition flex items-center gap-2 ${
                        activeTab === 'attendance'
                            ? 'bg-white border-t-2 border-indigo-600 text-indigo-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <FaCalendarCheck /> Daily Attendance ({attendanceList.length})
                </button>
            </div>

            {/* 4. Tab 1: Staff Roster */}
            {activeTab === 'roster' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                        <div className="relative w-full sm:w-80">
                            <FaSearch className="absolute left-3 top-3.5 text-gray-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Search by name, role, dept..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <span className="text-xs text-gray-500 font-medium">
                            Showing {filteredEmployees.length} of {employees.length} staff members
                        </span>
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-gray-500 font-medium">Loading staff roster...</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FaUserTie className="mx-auto text-4xl mb-3 opacity-40" />
                            <p className="text-base font-semibold">No staff profiles found</p>
                            <p className="text-sm mt-1">Click "Add Staff Member" above to create an employee record.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 font-semibold border-b">
                                        <th className="py-3 px-4">Employee</th>
                                        <th className="py-3 px-4">Designation</th>
                                        <th className="py-3 px-4">Department</th>
                                        <th className="py-3 px-4">Role</th>
                                        <th className="py-3 px-4">Contact</th>
                                        <th className="py-3 px-4">Salary (LKR)</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredEmployees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-indigo-50/40 transition">
                                            <td className="py-3.5 px-4 font-bold text-gray-900">
                                                <div>{emp.user?.fullName || emp.user?.username}</div>
                                                <div className="text-xs font-normal text-gray-400">@{emp.user?.username}</div>
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-gray-800">{emp.designation}</td>
                                            <td className="py-3.5 px-4">
                                                <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                                                    {emp.department}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold">
                                                    {emp.user?.role}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600">{emp.contactNumber || '—'}</td>
                                            <td className="py-3.5 px-4 font-semibold text-gray-900">
                                                LKR {(emp.salary || 0).toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    emp.status === 'ACTIVE' 
                                                        ? 'bg-emerald-100 text-emerald-700' 
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {emp.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleQuickCheckIn(emp.id)}
                                                        title="Mark Check-In for Today"
                                                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                                                    >
                                                        <FaSignInAlt size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleQuickCheckOut(emp.id)}
                                                        title="Mark Check-Out for Today"
                                                        className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition"
                                                    >
                                                        <FaSignOutAlt size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditModal(emp)}
                                                        title="Edit Profile"
                                                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEmployee(emp.id)}
                                                        title="Remove Staff"
                                                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition"
                                                    >
                                                        <FaTrash size={14} />
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

            {/* 5. Tab 2: Attendance Log */}
            {activeTab === 'attendance' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-bold text-gray-700">Filter Date:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    fetchAttendance(e.target.value);
                                }}
                                className="border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <button
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    setSelectedDate(today);
                                    fetchAttendance(today);
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition"
                            >
                                Today
                            </button>
                        </div>

                        <span className="text-xs text-gray-500 font-medium">
                            {attendanceList.length} logs recorded for {selectedDate}
                        </span>
                    </div>

                    {attendanceList.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FaCalendarCheck className="mx-auto text-4xl mb-3 opacity-40" />
                            <p className="text-base font-semibold">No attendance recorded for {selectedDate}</p>
                            <p className="text-sm mt-1">Use the "Log Attendance" button or quick actions in the roster.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 font-semibold border-b">
                                        <th className="py-3 px-4">Staff Member</th>
                                        <th className="py-3 px-4">Department & Role</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Check-In</th>
                                        <th className="py-3 px-4">Check-Out</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Notes</th>
                                        <th className="py-3 px-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {attendanceList.map((att) => (
                                        <tr key={att.id} className="hover:bg-indigo-50/40 transition">
                                            <td className="py-3.5 px-4 font-bold text-gray-900">
                                                {att.employee?.user?.fullName || att.employee?.user?.username}
                                                <div className="text-xs font-normal text-gray-400">{att.employee?.designation}</div>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                                                    {att.employee?.department}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-700">{att.date}</td>
                                            <td className="py-3.5 px-4 font-semibold text-emerald-600">
                                                {att.checkInTime || '—'}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-amber-600">
                                                {att.checkOutTime || '—'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    att.status === 'PRESENT'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : att.status === 'LATE'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : att.status === 'HALF_DAY'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {att.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-500 text-xs">
                                                {att.notes || '—'}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {!att.checkOutTime && (
                                                    <button
                                                        onClick={() => handleQuickCheckOut(att.employee?.id)}
                                                        className="bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-600 text-xs font-bold px-2.5 py-1 rounded-lg transition"
                                                    >
                                                        Check Out
                                                    </button>
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

            {/* 6. Modal: Add Employee */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaUserTie className="text-indigo-600" /> Add Staff Employee Profile
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                        </div>

                        <form onSubmit={handleCreateEmployee} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Select System User *</label>
                                {unassignedUsers.length === 0 ? (
                                    <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs">
                                        No unassigned approved users found. All active staff already have employee profiles, or new users need Admin approval first.
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={employeeForm.userId}
                                        onChange={(e) => {
                                            const uid = e.target.value;
                                            const u = unassignedUsers.find(x => x.id === parseInt(uid));
                                            setEmployeeForm({
                                                ...employeeForm,
                                                userId: uid,
                                                designation: u ? `${u.role} Officer` : ''
                                            });
                                        }}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">-- Choose User --</option>
                                        {unassignedUsers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.fullName} (@{u.username}) — [{u.role}]
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Designation *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Senior Medical Officer"
                                        value={employeeForm.designation}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Department *</label>
                                    <select
                                        value={employeeForm.department}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Neurology">Neurology</option>
                                        <option value="Emergency">Emergency</option>
                                        <option value="Inpatient & ICU">Inpatient & ICU</option>
                                        <option value="Laboratory">Laboratory</option>
                                        <option value="Pharmacy">Pharmacy</option>
                                        <option value="Administration">Administration</option>
                                        <option value="General Outpatient">General Outpatient</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="07X-XXXXXXX"
                                        value={employeeForm.contactNumber}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, contactNumber: e.target.value })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Monthly Salary (LKR)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={employeeForm.salary}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, salary: parseFloat(e.target.value) || 0 })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
                                <select
                                    value={employeeForm.status}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value })}
                                    className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="ON_LEAVE">ON_LEAVE</option>
                                    <option value="RESIGNED">RESIGNED</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!employeeForm.userId}
                                    className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition"
                                >
                                    Save Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 7. Modal: Edit Employee */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaEdit className="text-indigo-600" /> Edit Employee: {selectedEmployee?.user?.fullName}
                            </h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                        </div>

                        <form onSubmit={handleUpdateEmployee} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Designation *</label>
                                    <input
                                        type="text"
                                        required
                                        value={employeeForm.designation}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Department *</label>
                                    <select
                                        value={employeeForm.department}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Neurology">Neurology</option>
                                        <option value="Emergency">Emergency</option>
                                        <option value="Inpatient & ICU">Inpatient & ICU</option>
                                        <option value="Laboratory">Laboratory</option>
                                        <option value="Pharmacy">Pharmacy</option>
                                        <option value="Administration">Administration</option>
                                        <option value="General Outpatient">General Outpatient</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={employeeForm.contactNumber}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, contactNumber: e.target.value })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Monthly Salary (LKR)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={employeeForm.salary}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, salary: parseFloat(e.target.value) || 0 })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
                                <select
                                    value={employeeForm.status}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value })}
                                    className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="ON_LEAVE">ON_LEAVE</option>
                                    <option value="RESIGNED">RESIGNED</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 8. Modal: Log Attendance */}
            {showAttendanceModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaCalendarCheck className="text-emerald-600" /> Record Attendance Entry
                            </h3>
                            <button onClick={() => setShowAttendanceModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                        </div>

                        <form onSubmit={handleSaveAttendance} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Employee *</label>
                                <select
                                    required
                                    value={attendanceForm.employeeId}
                                    onChange={(e) => setAttendanceForm({ ...attendanceForm, employeeId: e.target.value })}
                                    className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- Select Staff Member --</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.user?.fullName || emp.user?.username} ({emp.designation})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={attendanceForm.date}
                                        onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Status *</label>
                                    <select
                                        value={attendanceForm.status}
                                        onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="PRESENT">PRESENT</option>
                                        <option value="LATE">LATE</option>
                                        <option value="HALF_DAY">HALF_DAY</option>
                                        <option value="ABSENT">ABSENT</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Check-In Time</label>
                                    <input
                                        type="time"
                                        step="1"
                                        value={attendanceForm.checkInTime}
                                        onChange={(e) => setAttendanceForm({ ...attendanceForm, checkInTime: e.target.value })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Check-Out Time</label>
                                    <input
                                        type="time"
                                        step="1"
                                        value={attendanceForm.checkOutTime}
                                        onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOutTime: e.target.value })}
                                        className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Notes / Remarks</label>
                                <input
                                    type="text"
                                    placeholder="e.g. On-time, Emergency surgery overtime..."
                                    value={attendanceForm.notes}
                                    onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                                    className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowAttendanceModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                                >
                                    Save Attendance Log
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffManagement;
