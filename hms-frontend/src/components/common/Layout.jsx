import {
  FaSignOutAlt,
  FaTachometerAlt,
  FaUserInjured,
  FaUserMd,
  FaCalendarCheck,
  FaFlask,
  FaPills,
  FaMoneyBill,
  FaBuilding,
  FaUserShield,
  FaPrescription,
  FaCalendarPlus,
  FaBoxes,
  FaBed,
  FaHospital,
  FaUserTie,
  FaNotesMedical,
  FaHistory,
  FaFolderOpen,
} from "react-icons/fa";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role"); // Get logged in user role

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `flex items-center gap-3 p-3 rounded-xl transition text-sm font-medium ${
      isActive(path)
        ? "bg-blue-600 text-white shadow-md font-semibold"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    }`;

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-5 border-b border-gray-800 text-center">
          <div className="text-xl font-black tracking-wider text-blue-400">
            HOSPITAL MS
          </div>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
            {role || "USER"}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {/* Common Dashboard */}
          <Link to="/dashboard" className={linkClass("/dashboard")}>
            <FaTachometerAlt className="text-blue-400" /> Dashboard
          </Link>

          {/* ADMIN ONLY ROUTES */}
          {role === "ADMIN" && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Hospital Administration
              </div>
              <Link to="/admin/approvals" className={linkClass("/admin/approvals")}>
                <FaUserShield className="text-yellow-400" /> User Approvals
              </Link>
              <Link to="/admin/audit-logs" className={linkClass("/admin/audit-logs")}>
                <FaHistory className="text-indigo-400" /> Audit Logs
              </Link>
              <Link to="/admin/staff" className={linkClass("/admin/staff")}>
                <FaUserTie className="text-indigo-400" /> Staff & HR
              </Link>
              <Link to="/admin/patients" className={linkClass("/admin/patients")}>
                <FaUserInjured className="text-cyan-400" /> Patients
              </Link>
              <Link to="/admin/doctors" className={linkClass("/admin/doctors")}>
                <FaUserMd className="text-emerald-400" /> Doctors
              </Link>
              <Link to="/admin/departments" className={linkClass("/admin/departments")}>
                <FaBuilding className="text-purple-400" /> Departments
              </Link>
              <Link to="/admin/appointments" className={linkClass("/admin/appointments")}>
                <FaCalendarCheck className="text-orange-400" /> Appointments
              </Link>
              <Link to="/admin/inpatient" className={linkClass("/admin/inpatient")}>
                <FaBed className="text-pink-400" /> Inpatient & Beds
              </Link>
              <Link to="/admin/pharmacy" className={linkClass("/admin/pharmacy")}>
                <FaPills className="text-teal-400" /> Pharmacy
              </Link>
              <Link to="/admin/batches" className={linkClass("/admin/batches")}>
                <FaBoxes className="text-amber-400" /> Medicine Batches
              </Link>
              <Link to="/admin/billing" className={linkClass("/admin/billing")}>
                <FaMoneyBill className="text-emerald-400" /> Itemized Billing
              </Link>
            </>
          )}

          {/* DOCTOR ONLY ROUTES */}
          {role === "DOCTOR" && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Clinical Duties
              </div>
              <Link to="/doctor/appointments" className={linkClass("/doctor/appointments")}>
                <FaCalendarCheck className="text-emerald-400" /> My Appointments
              </Link>
              <Link to="/doctor/lab-requests" className={linkClass("/doctor/lab-requests")}>
                <FaFlask className="text-amber-400" /> Lab Requests
              </Link>
            </>
          )}

          {/* PHARMACIST ONLY ROUTES */}
          {role === "PHARMACIST" && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Dispensary
              </div>
              <Link to="/pharmacist/prescriptions" className={linkClass("/pharmacist/prescriptions")}>
                <FaPrescription className="text-teal-400" /> Prescriptions
              </Link>
              <Link to="/pharmacist/batches" className={linkClass("/pharmacist/batches")}>
                <FaBoxes className="text-amber-400" /> Medicine Batches
              </Link>
              <Link to="/pharmacist/inventory" className={linkClass("/pharmacist/inventory")}>
                <FaPills className="text-emerald-400" /> Medicine Inventory
              </Link>
            </>
          )}

          {/* LAB STAFF ONLY ROUTES */}
          {role === "LAB_STAFF" && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Diagnostics
              </div>
              <Link to="/lab/tests" className={linkClass("/lab/tests")}>
                <FaFlask className="text-purple-400" /> Lab Tests & Results
              </Link>
            </>
          )}

          {/* RECEPTIONIST ROUTES */}
          {role === "RECEPTIONIST" && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Front Desk
              </div>
              <Link to="/receptionist/patients" className={linkClass("/receptionist/patients")}>
                <FaUserInjured className="text-cyan-400" /> Patients
              </Link>
              <Link to="/receptionist/appointments" className={linkClass("/receptionist/appointments")}>
                <FaCalendarCheck className="text-orange-400" /> Appointments
              </Link>
              <Link to="/receptionist/inpatient" className={linkClass("/receptionist/inpatient")}>
                <FaBed className="text-pink-400" /> Inpatient & Beds
              </Link>
              <Link to="/receptionist/billing" className={linkClass("/receptionist/billing")}>
                <FaMoneyBill className="text-emerald-400" /> Itemized Billing
              </Link>
            </>
          )}

          {/* NURSE ONLY ROUTES */}
          {role === "NURSE" && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Nursing Station
              </div>
              <Link to="/nurse/dashboard" className={linkClass("/nurse/dashboard")}>
                <FaBed className="text-blue-400" /> Nurse Station
              </Link>
              <Link to="/nurse/inpatient" className={linkClass("/nurse/inpatient")}>
                <FaHospital className="text-pink-400" /> Inpatient Ward Roster
              </Link>
            </>
          )}

          {/* ACCOUNTANT ONLY ROUTES (SRS Section 2 & 3.8) */}
          {role === "ACCOUNTANT" && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Finance & Accounting
              </div>
              <Link to="/accountant/billing" className={linkClass("/accountant/billing")}>
                <FaMoneyBill className="text-emerald-400" /> Itemized Billing & Invoicing
              </Link>
            </>
          )}

          {/* PATIENT ROUTES */}
          {role === "PATIENT" && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Patient Services
              </div>
              <Link to="/patient/book-appointment" className={linkClass("/patient/book-appointment")}>
                <FaCalendarPlus className="text-cyan-400" /> Book Appointment
              </Link>
              <Link to="/patient/medical-records" className={linkClass("/patient/medical-records")}>
                <FaNotesMedical className="text-emerald-400" /> Medical Records
              </Link>
              <Link to="/patient/lab-results" className={linkClass("/patient/lab-results")}>
                <FaFlask className="text-purple-400" /> Lab Results
              </Link>
              <Link to="/patient/documents" className={linkClass("/patient/documents")}>
                <FaFolderOpen className="text-amber-400" /> Medical Documents
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b px-6 py-3.5 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-extrabold text-gray-800">
              Hospital Management System
            </h2>
            <span className="text-xs font-semibold text-gray-400 hidden sm:inline">
              | Enterprise Healthcare Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white px-3.5 py-1.5 rounded-xl transition text-xs font-bold border border-rose-200 hover:border-transparent"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-slate-50/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
