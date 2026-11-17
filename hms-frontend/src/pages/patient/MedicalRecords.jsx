import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaNotesMedical } from 'react-icons/fa';

function MedicalRecords() {
    const [records, setRecords] = useState([]);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                // Fetch authenticated patient's medical records
                const response = await axios.get('http://localhost:8080/api/medical-records/my', config);
                setRecords(response.data);
            } catch (error) {
                console.error("Error fetching records:", error);
            }
        };
        fetchRecords();
    }, []);

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaNotesMedical className="text-green-600" /> My Medical Records
                </h2>
                <p className="text-gray-500">View your past diagnoses and prescribed medications.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {records.length > 0 ? (
                    records.map((record) => (
                        <div key={record.id} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Diagnosis: {record.diagnosis}</h3>
                                    <p className="text-sm text-gray-500">
                                        Doctor: Dr. {record.doctor ? `${record.doctor.firstName} ${record.doctor.lastName}` : 'Unknown'}
                                    </p>
                                </div>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {new Date(record.recordDate).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm font-semibold text-gray-700 mb-1">Prescription:</p>
                                <p className="text-sm text-gray-600">{record.prescription}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center text-gray-500 py-10 bg-white rounded-xl">
                        No medical records found.
                    </div>
                )}
            </div>
        </div>
    );
}

export default MedicalRecords;
