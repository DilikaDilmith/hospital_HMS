import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Layout Component
import Layout from './components/common/Layout';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Patients from './pages/admin/Patients';
import Doctors from './pages/admin/Doctors';
import Departments from './pages/admin/Departments';
import Appointments from './pages/admin/Appointments';
import Pharmacy from './pages/admin/Pharmacy';
import Billing from './pages/admin/Billing';
import UserApprovals from './pages/admin/UserApprovals';

// Doctor Pages
import DoctorAppointments from './pages/doctor/Appointments';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Routes (No Sidebar, No Navbar) */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* 2. Protected Routes (Wrapped inside Layout with Sidebar & Navbar) */}
        <Route element={<Layout />}>
          
          {/* Common Routes for All Logged-in Users */}
          <Route path="/dashboard" element={<Dashboard />} />
          
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

        </Route>

        {/* 3. Catch-all Route: Redirects unknown URLs to Login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;