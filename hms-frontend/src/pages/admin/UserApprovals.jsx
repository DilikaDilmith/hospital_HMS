import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserCheck, FaUserTimes, FaEnvelope, FaUserShield } from 'react-icons/fa';

function UserApprovals() {
    const [pendingUsers, setPendingUsers] = useState([]);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Function to fetch pending users from the backend
    const fetchPendingUsers = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/users/pending', config);
            setPendingUsers(response.data);
        } catch (error) {
            console.error("Error fetching pending users:", error);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    // Function to approve a user
    const handleApprove = async (id) => {
        try {
            await axios.put(`http://localhost:8080/api/users/${id}/approve`, {}, config);
            fetchPendingUsers(); // Refresh the list after approval
        } catch (error) {
            console.error("Error approving user:", error);
        }
    };

    // Function to reject a user
    const handleReject = async (id) => {
        try {
            await axios.put(`http://localhost:8080/api/users/${id}/reject`, {}, config);
            fetchPendingUsers(); // Refresh the list after rejection
        } catch (error) {
            console.error("Error rejecting user:", error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaUserShield className="text-purple-600"/> User Login Approvals
                </h2>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Username / Email</th>
                            <th className="p-4 font-semibold text-gray-600">Role Requested</th>
                            <th className="p-4 font-semibold text-gray-600">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingUsers.length > 0 ? (
                            pendingUsers.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-4 text-gray-800 font-medium">{user.fullName}</td>
                                    <td className="p-4 text-gray-600 flex items-center gap-2">
                                        <FaEnvelope className="text-gray-400" /> {user.username}
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <button 
                                            onClick={() => handleApprove(user.id)}
                                            className="bg-green-100 text-green-700 hover:bg-green-600 hover:text-white px-3 py-1 rounded-lg flex items-center gap-1 transition text-sm font-medium"
                                        >
                                            <FaUserCheck /> Approve
                                        </button>
                                        <button 
                                            onClick={() => handleReject(user.id)}
                                            className="bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-3 py-1 rounded-lg flex items-center gap-1 transition text-sm font-medium"
                                        >
                                            <FaUserTimes /> Reject
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="p-10 text-center text-gray-500">
                                    No pending approvals at the moment. All clear! 🎉
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserApprovals;