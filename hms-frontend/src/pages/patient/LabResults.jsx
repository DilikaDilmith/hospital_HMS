import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFlask } from 'react-icons/fa';

function LabResults() {
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
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaFlask className="text-yellow-500"/> My Lab Results
                </h2>
                <p className="text-gray-500">Check the status and results of your laboratory tests.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Test Name</th>
                            <th className="p-4 font-semibold text-gray-600">Date</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {labTests.length > 0 ? (
                            labTests.map((test) => (
                                <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-4 text-gray-800 font-medium">{test.testName}</td>
                                    <td className="p-4 text-gray-600">
                                        {new Date(test.requestedAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${test.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {test.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {test.result ? (
                                            <span className="text-green-700 font-bold bg-green-50 px-3 py-1 rounded border border-green-200">
                                                {test.result}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">Pending...</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-500">
                                    No lab tests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default LabResults;
