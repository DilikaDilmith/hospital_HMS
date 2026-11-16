import { Link } from 'react-router-dom';
import { FaPrescription, FaPills } from 'react-icons/fa';

function PharmacistDashboard() {
    return (
        <div className="pb-10">
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800">Pharmacy Dashboard</h2>
                <p className="text-gray-500 mt-1">Manage your prescriptions and stock here.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <Link to="/pharmacist/prescriptions" className="bg-teal-600 text-white rounded-xl p-6 shadow-lg flex justify-between items-center hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-sm opacity-80 uppercase">Process Prescriptions</p>
                        <h3 className="text-2xl font-bold mt-2">Dispense Medicines</h3>
                    </div>
                    <FaPrescription size={50} className="opacity-50" />
                </Link>
                <div className="bg-blue-600 text-white rounded-xl p-6 shadow-lg flex justify-between items-center">
                    <div>
                        <p className="text-sm opacity-80 uppercase">Inventory Status</p>
                        <h3 className="text-2xl font-bold mt-2">Check Stock</h3>
                    </div>
                    <FaPills size={50} className="opacity-50" />
                </div>
            </div>
        </div>
    );
}
export default PharmacistDashboard;