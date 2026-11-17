import AdminDashboard from './admin/Dashboard';
import DoctorDashboard from './doctor/Dashboard';
import LabStaffDashboard from './labstaff/Dashboard';
import PharmacistDashboard from './pharmacist/Dashboard';
import ReceptionistDashboard from './receptionist/Dashboard';
import PatientDashboard from './patient/Dashboard';
import NurseDashboard from './nurse/NurseDashboard';

function DashboardRouter() {
    const role = localStorage.getItem('role');

    // Route to the correct dashboard based on the user's role
    if (role === 'ADMIN') return <AdminDashboard />;
    if (role === 'DOCTOR') return <DoctorDashboard />;
    if (role === 'LAB_STAFF') return <LabStaffDashboard />;
    if (role === 'PHARMACIST') return <PharmacistDashboard />;
    if (role === 'RECEPTIONIST') return <ReceptionistDashboard />;
    if (role === 'PATIENT') return <PatientDashboard />;
    if (role === 'NURSE') return <NurseDashboard />;

    
    return <h1 className="text-2xl font-bold p-10">Welcome to HMS</h1>;
}

export default DashboardRouter;