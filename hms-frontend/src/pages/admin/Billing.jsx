import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMoneyBill, FaPlus } from 'react-icons/fa';
import AddBillModal from '../../components/admin/AddBillModal';

function Billing() {
    const [bills, setBills] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchBills = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/bills', config);
            setBills(response.data);
        } catch (error) {
            console.error("Error fetching bills:", error);
        }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    // Function to determine status badge color
    const getStatusBadge = (status) => {
        if (status === 'PAID') return 'bg-green-100 text-green-700';
        if (status === 'UNPAID') return 'bg-red-100 text-red-700';
        return 'bg-yellow-100 text-yellow-700';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaMoneyBill className="text-red-600"/> Billing & Payments
                </h2>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <FaPlus /> Generate Bill
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Invoice ID</th>
                            <th className="p-4 font-semibold text-gray-600">Patient Name</th>
                            <th className="p-4 font-semibold text-gray-600">Description</th>
                            <th className="p-4 font-semibold text-gray-600">Amount (LKR)</th>
                            <th className="p-4 font-semibold text-gray-600">Date</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.length > 0 ? (
                            bills.map((bill) => (
                                <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-4 text-gray-700 font-medium">INV-{bill.id}</td>
                                    <td className="p-4 text-gray-800">
                                        {bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}` : 'Unknown'}
                                    </td>
                                    <td className="p-4 text-gray-600">{bill.description}</td>
                                    <td className="p-4 text-gray-800 font-bold">{bill.totalAmount.toFixed(2)}</td>
                                    <td className="p-4 text-gray-600">
                                        {new Date(bill.billDate).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(bill.paymentStatus)}`}>
                                            {bill.paymentStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    No bills found. Click "Generate Bill" to create an invoice.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <AddBillModal 
                    onClose={() => setShowModal(false)} 
                    onBillAdded={fetchBills} 
                />
            )}
        </div>
    );
}

export default Billing;