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
} from "react-icons/fa";
import { useNavigate, Outlet, Link } from "react-router-dom";

function Layout() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); // Get logged in user role

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-5 text-2xl font-bold text-center border-b border-gray-700 text-blue-400">
          HMS - {role}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Common Routes for All (This links to the DashboardRouter) */}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
          >
            <FaTachometerAlt /> Dashboard
          </Link>

          {/* ADMIN ONLY ROUTES */}
          {role === "ADMIN" && (
            <>
              <Link
                to="/admin/approvals"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition text-yellow-400"
              >
                <FaUserShield /> Approvals
              </Link>
              <Link
                to="/admin/patients"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaUserInjured /> Patients
              </Link>
              <Link
                to="/admin/doctors"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaUserMd /> Doctors
              </Link>
              <Link
                to="/admin/departments"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaBuilding /> Departments
              </Link>
              <Link
                to="/admin/appointments"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaCalendarCheck /> Appointments
              </Link>
              <Link
                to="/admin/pharmacy"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaPills /> Pharmacy
              </Link>
              <Link
                to="/admin/billing"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaMoneyBill /> Billing
              </Link>
            </>
          )}

          {/* DOCTOR ONLY ROUTES */}
          {role === "DOCTOR" && (
            <>
              <Link
                to="/doctor/appointments"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaCalendarCheck /> My Appointments
              </Link>
              <Link
                to="/doctor/lab-requests"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaFlask /> Lab Requests
              </Link>
            </>
          )}

          {/* PHARMACIST ONLY ROUTES */}
          {role === "PHARMACIST" && (
            <>
              <Link
                to="/pharmacist/prescriptions"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaPrescription /> Prescriptions
              </Link>
            </>
          )}

          {/* LAB STAFF ONLY ROUTES */}
          {role === "LAB_STAFF" && (
            <>
              <Link
                to="/lab/tests"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaFlask /> Lab Tests
              </Link>
            </>
          )}

          {/* RECEPTIONIST ROUTES */}
          {role === "RECEPTIONIST" && (
            <>
              <Link
                to="/receptionist/patients"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaUserInjured /> Patients
              </Link>
              <Link
                to="/receptionist/appointments"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaCalendarCheck /> Appointments
              </Link>
              <Link
                to="/receptionist/billing"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaMoneyBill /> Billing
              </Link>
            </>
          )}

          {/* PATIENT ROUTES */}
          {role === "PATIENT" && (
            <>
              <Link
                to="/patient/book-appointment"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
              >
                <FaCalendarPlus /> Book Appointment
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Hospital Management System
          </h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
          >
            <FaSignOutAlt /> Logout
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
