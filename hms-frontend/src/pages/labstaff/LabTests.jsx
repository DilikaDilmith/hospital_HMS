import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFlask, FaCheckCircle } from 'react-icons/fa';

function LabTests() {
    const [labTests, setLabTests] = useState([]);
    // Use an object to store results separately for each test ID
    const [resultInputs, setResultInputs] = useState({}); 

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchLabTests = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/lab-tests', config);
            setLabTests(response.data);
        } catch (error) {
            console.error("Error fetching lab tests:", error);
        }
    };

    useEffect(() => {
        fetchLabTests();
    }, []);

    // Handle input change for a specific test ID
    const handleInputChange = (id, value) => {
        setResultInputs({ ...resultInputs, [id]: value });
    };

    // Submit result to backend
    const handleUpdateResult = async (id) => {
        const result = resultInputs[id];
        if (!result || result.trim() === "") {
            alert("Please enter a result before saving.");
            return;
        }

        try {
            await axios.put(`http://localhost:8080/api/lab-tests/${id}/complete`, 
                { result: result }, 
                config
            );
            alert("Result updated successfully!");
            fetchLabTests(); // Refresh list
            // Clear the input for this specific test
            setResultInputs({ ...resultInputs, [id]: "" });
        } catch (error) {
            console.error("Error updating result:", error.response); 
            // Show the exact error message from Spring Boot
            const errorMsg = error.response?.data?.message || error.response?.data || "Failed to update result.";
            alert("Error: " + errorMsg);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaFlask className="text-blue-600"/> Laboratory Requests
                </h2>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Patient</th>
                            <th className="p-4 font-semibold text-gray-600">Test Name</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600">Action / Result</th>
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
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${test.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {test.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {test.status !== 'COMPLETED' ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Enter Result..." 
                                                    className="border p-2 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={resultInputs[test.id] || ""}
                                                    onChange={(e) => handleInputChange(test.id, e.target.value)}
                                                />
                                                <button 
                                                    onClick={() => handleUpdateResult(test.id)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700 transition"
                                                >
                                                    <FaCheckCircle /> Save
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                                                {test.result}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-500">
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

export default LabTests;