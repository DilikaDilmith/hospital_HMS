import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFlask } from 'react-icons/fa';

function DoctorLabRequests() {
    const [labTests, setLabTests] = useState([]);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchLabTests = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/lab-tests', config);
                setLabTests(response.data);
            } catch (error) {
                console.error("Error fetching lab tests:", error);
            }
        };
        fetchLabTests();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaFlask className="text-orange-500"/> My Lab Requests
                </h2>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Patient</th>
                            <th className="p-4 font-semibold text-gray-600">Test Name</th>
                            <th className="p-4 font-semibold text-gray-600">Requested Date</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {labTests.length > 0 ? (
                            labTests.map((test) => (
                                <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-4 text-gray-800 font-medium">
                                        {test.patient ? `${test.patient.firstName} ${test.patient.lastName}` : 'Unknown'}
                                    </td>
                                    <td className="p-4 text-gray-700">{test.testName}</td>
                                    <td className="p-4 text-gray-600">
                                        {new Date(test.requestedAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${test.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {test.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {test.result ? test.result : <span className="text-gray-400 italic">Pending...</span>}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500">
                                    No lab tests requested yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DoctorLabRequests;