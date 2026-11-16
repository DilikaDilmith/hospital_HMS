import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Layout
import Layout from './components/common/Layout';

// --- මේක තමයි අපේ මැජික් එක (Role එක බලලා ඩෑෂ්බෝඩ් එක පෙන්නනවා) ---
import DashboardRouter from './pages/DashboardRouter'; 

// Admin Pages
import Patients from './pages/admin/Patients';
import Doctors from './pages/admin/Doctors';
import Departments from './pages/admin/Departments';
import Appointments from './pages/admin/Appointments';
import Pharmacy from './pages/admin/Pharmacy';
import Billing from './pages/admin/Billing';
import UserApprovals from './pages/admin/UserApprovals';

// Doctor Pages
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorLabRequests from './pages/doctor/LabRequests';

// Lab Staff Pages
import LabTests from './pages/labstaff/LabTests';

// Pharmacist Pages
import PharmacistPrescriptions from './pages/pharmacist/Prescriptions';

// Receptionist Pages
import ReceptionistDashboard from './pages/receptionist/Dashboard';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes inside Layout */}
        <Route element={<Layout />}>
          
          <Route path="/dashboard" element={<DashboardRouter />} />
          
          {/* Admin Specific Routes */}
          <Route path="/admin/approvals" element={<UserApprovals />} />
          <Route path="/admin/patients" element={<Patients />} />
          <Route path="/admin/doctors" element={<Doctors />} />
          <Route path="/admin/departments" element={<Departments />} />
          <Route path="/admin/appointments" element={<Appointments />} />
          <Route path="/admin/pharmacy" element={<Pharmacy />} />
          <Route path="/admin/billing" element={<Billing />} />

          {/* Doctor Specific Routes */}
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/lab-requests" element={<DoctorLabRequests />} />

          {/* Lab Staff Specific Routes */}
          <Route path="/lab/tests" element={<LabTests />} />

          {/* Pharmacist Specific Routes */}
          <Route path="/pharmacist/prescriptions" element={<PharmacistPrescriptions />} />

          {/* Receptionist Specific Routes (Reusing existing components for now) */}
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/patients" element={<Patients />} />
          <Route path="/receptionist/appointments" element={<Appointments />} />
          <Route path="/receptionist/billing" element={<Billing />} />

        </Route>

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;