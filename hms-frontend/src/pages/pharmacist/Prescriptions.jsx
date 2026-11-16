import { useState, useEffect } from "react";
import axios from "axios";
import { FaPrescription, FaCheckCircle } from "react-icons/fa";

function PharmacistPrescriptions() {
  const [records, setRecords] = useState([]);

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchRecords = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/medical-records/all-records",
        config,
      );
      setRecords(response.data);
    } catch (error) {
      console.error("Error fetching records:", error);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Function to handle the "Mark as Dispensed" button click
  const handleDispense = async (id) => {
    try {
      await axios.put(
        `http://localhost:8080/api/medical-records/${id}/dispense`,
        {},
        config,
      );
      alert("Prescription marked as dispensed!");
      fetchRecords(); // Refresh the list
    } catch (error) {
      console.error("Error dispensing record:", error);
      alert("Failed to update status.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaPrescription className="text-teal-600" /> Patient Prescriptions
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {records.length > 0 ? (
          records.map((record) => (
            <div
              key={record.id}
              className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-teal-500"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {record.patient
                      ? `${record.patient.firstName} ${record.patient.lastName}`
                      : "Unknown Patient"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Prescribed by: Dr.{" "}
                    {record.doctor
                      ? `${record.doctor.firstName} ${record.doctor.lastName}`
                      : "Unknown"}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {new Date(record.recordDate).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Diagnosis:
                </p>
                <p className="text-sm text-gray-600 mb-3">{record.diagnosis}</p>

                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Medication:
                </p>
                <p className="text-sm text-gray-600">{record.prescription}</p>
              </div>

              <button
                onClick={() => handleDispense(record.id)}
                className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition flex justify-center items-center gap-2"
              >
                <FaCheckCircle /> Mark as Dispensed
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center text-gray-500 py-10 bg-white rounded-xl">
            No prescriptions available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}

export default PharmacistPrescriptions;
