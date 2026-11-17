import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPills, FaPlus, FaExclamationTriangle, FaBoxes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import AddMedicineModal from '../../components/admin/AddMedicineModal';

function Pharmacy() {
    const [medicines, setMedicines] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchMedicines = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/medicines', config);
            setMedicines(response.data);
        } catch (error) {
            console.error("Error fetching medicines:", error);
        }
    };

    useEffect(() => {
        fetchMedicines();
    }, []);

    const isLowStock = (quantity) => quantity < 50;
    const isExpired = (dateString) => dateString && new Date(dateString) <= new Date();
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaPills className="text-teal-600"/> Pharmacy Inventory
                </h2>
                <div className="flex items-center gap-2.5">
                    <Link
                        to="/pharmacist/batches"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition"
                    >
                        <FaBoxes className="text-teal-600" /> Manage Batches (FEFO)
                    </Link>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition"
                    >
                        <FaPlus /> Add Medicine
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">ID</th>
                            <th className="p-4 font-semibold text-gray-600">Medicine Name</th>
                            <th className="p-4 font-semibold text-gray-600">Description</th>
                            <th className="p-4 font-semibold text-gray-600">Price (LKR)</th>
                            <th className="p-4 font-semibold text-gray-600">Stock</th>
                            <th className="p-4 font-semibold text-gray-600">Expiry Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {medicines.length > 0 ? (
                            medicines.map((med) => (
                                <tr key={med.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-4 text-gray-700">#{med.id}</td>
                                    <td className="p-4 text-gray-800 font-medium">{med.name}</td>
                                    <td className="p-4 text-gray-600">{med.description}</td>
                                    <td className="p-4 text-gray-600">{med.price.toFixed(2)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${isLowStock(med.stockQuantity) ? 'text-red-600' : 'text-green-600'}`}>
                                                {med.stockQuantity}
                                            </span>
                                            {isLowStock(med.stockQuantity) && (
                                                <FaExclamationTriangle className="text-red-500" title="Low Stock!" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <span>{formatDate(med.expiryDate)}</span>
                                            {isExpired(med.expiryDate) && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                                    Expired
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    No medicines found in inventory. Click "Add Medicine".
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <AddMedicineModal 
                    onClose={() => setShowModal(false)} 
                    onMedicineAdded={fetchMedicines} 
                />
            )}
        </div>
    );
}

export default Pharmacy;