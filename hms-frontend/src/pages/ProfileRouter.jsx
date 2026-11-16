import AdminProfile from './admin/Profile';
import DoctorProfile from './doctor/Profile';
import PatientProfile from './patient/Profile';

function ProfileRouter() {
    const role = localStorage.getItem('role');

    if (role === 'ADMIN') return <AdminProfile />;
    if (role === 'DOCTOR') return <DoctorProfile />;
    if (role === 'PATIENT') return <PatientProfile />;
    
    
    return <AdminProfile />;
}

export default ProfileRouter;