import { Link } from 'react-router-dom';
import { FaUserPlus, FaCalendarPlus, FaMoneyBill, FaUserInjured } from 'react-icons/fa';

function ReceptionistDashboard() {
    return (
        <div className="pb-10">
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800">Reception Dashboard</h2>
                <p className="text-gray-500 mt-1">Manage patient registrations, appointments, and billing.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                
                {/* Register Patient Card */}
                <Link to="/receptionist/patients" className="bg-blue-600 text-white rounded-xl p-6 shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all h-40">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold">Register Patient</h3>
                        <FaUserPlus size={30} className="opacity-70" />
                    </div>
                    <p className="text-sm opacity-90 mt-4">Add new patients to the system.</p>
                </Link>

                {/* Book Appointment Card */}
                <Link to="/receptionist/appointments" className="bg-green-600 text-white rounded-xl p-6 shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all h-40">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold">Book Appointment</h3>
                        <FaCalendarPlus size={30} className="opacity-70" />
                    </div>
                    <p className="text-sm opacity-90 mt-4">Schedule a doctor consultation for a patient.</p>
                </Link>

                {/* Generate Bill Card */}
                <Link to="/receptionist/billing" className="bg-red-500 text-white rounded-xl p-6 shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all h-40">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold">Generate Bill</h3>
                        <FaMoneyBill size={30} className="opacity-70" />
                    </div>
                    <p className="text-sm opacity-90 mt-4">Create invoices and record payments.</p>
                </Link>

            </div>
        </div>
    );
}

export default ReceptionistDashboard;