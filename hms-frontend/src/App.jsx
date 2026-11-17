import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Layout
import Layout from './components/common/Layout';

import DashboardRouter from './pages/DashboardRouter'; 

import ProfileRouter from './pages/ProfileRouter';

// Admin Pages
import Patients from './pages/admin/Patients';
import Doctors from './pages/admin/Doctors';
import Departments from './pages/admin/Departments';
import Appointments from './pages/admin/Appointments';
import Pharmacy from './pages/admin/Pharmacy';
import Billing from './pages/admin/Billing';
import UserApprovals from './pages/admin/UserApprovals';
import InpatientManagement from './pages/admin/InpatientManagement';
import StaffManagement from './pages/admin/StaffManagement';
import AuditLogs from './pages/admin/AuditLogs';
import InactivityTimer from './components/common/InactivityTimer';

// Nurse Pages
import NurseDashboard from './pages/nurse/NurseDashboard';

// Doctor Pages
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorLabRequests from './pages/doctor/LabRequests';

// Lab Staff Pages
import LabTests from './pages/labstaff/LabTests';

// Pharmacist Pages
import PharmacistPrescriptions from './pages/pharmacist/Prescriptions';
import MedicineBatches from './pages/pharmacist/MedicineBatches';

// Receptionist Pages
import ReceptionistDashboard from './pages/receptionist/Dashboard';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';   
import BookAppointment from './pages/patient/BookAppointment';
import MedicalRecords from './pages/patient/MedicalRecords';
import LabResults from './pages/patient/LabResults';

function App() {
  return (
    <BrowserRouter>
      {/* Automatic session inactivity timeout watcher */}
      <InactivityTimer />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes inside Layout */}
        <Route element={<Layout />}>
          
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/profile" element={<ProfileRouter />} />
          
          {/* Admin Specific Routes */}
          <Route path="/admin/approvals" element={<UserApprovals />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
          <Route path="/admin/staff" element={<StaffManagement />} />
          <Route path="/admin/patients" element={<Patients />} />
          <Route path="/admin/doctors" element={<Doctors />} />
          <Route path="/admin/departments" element={<Departments />} />
          <Route path="/admin/appointments" element={<Appointments />} />
          <Route path="/admin/pharmacy" element={<Pharmacy />} />
          <Route path="/admin/billing" element={<Billing />} />
          <Route path="/admin/inpatient" element={<InpatientManagement />} />

          {/* Nurse Specific Routes */}
          <Route path="/nurse/dashboard" element={<NurseDashboard />} />
          <Route path="/nurse/inpatient" element={<InpatientManagement />} />

          {/* Doctor Specific Routes */}
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/lab-requests" element={<DoctorLabRequests />} />

          {/* Lab Staff Specific Routes */}
          <Route path="/lab/tests" element={<LabTests />} />

          {/* Pharmacist Specific Routes */}
          <Route path="/pharmacist/prescriptions" element={<PharmacistPrescriptions />} />
          <Route path="/pharmacist/batches" element={<MedicineBatches />} />
          <Route path="/admin/batches" element={<MedicineBatches />} />

          {/* Receptionist Specific Routes (Reusing existing components for now) */}
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/patients" element={<Patients />} />
          <Route path="/receptionist/appointments" element={<Appointments />} />
          <Route path="/receptionist/billing" element={<Billing />} />
          <Route path="/receptionist/inpatient" element={<InpatientManagement />} />

          {/* Accountant Specific Routes */}
          <Route path="/accountant/billing" element={<Billing />} />
 
          {/* Patient Specific Routes */}
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/book-appointment" element={<BookAppointment />} />
          <Route path="/patient/medical-records" element={<MedicalRecords />} /> 
          <Route path="/patient/lab-results" element={<LabResults />} /> 
        </Route>

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;