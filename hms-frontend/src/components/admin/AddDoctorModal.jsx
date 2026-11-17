import { useState, useEffect } from "react";
import axios from "axios";
import { FaUserMd, FaTimes, FaCalendarAlt, FaClock, FaMoneyBillWave } from "react-icons/fa";

const ALL_DAYS = [
  { key: "MONDAY", label: "Mon" },
  { key: "TUESDAY", label: "Tue" },
  { key: "WEDNESDAY", label: "Wed" },
  { key: "THURSDAY", label: "Thu" },
  { key: "FRIDAY", label: "Fri" },
  { key: "SATURDAY", label: "Sat" },
  { key: "SUNDAY", label: "Sun" },
];

function AddDoctorModal({ onClose, onDoctorAdded }) {
  const [departments, setDepartments] = useState([]);
  const [doctorData, setDoctorData] = useState({
    firstName: "",
    lastName: "",
    specialization: "",
    phoneNumber: "",
    email: "",
    departmentId: "",
    consultationFee: 1500,
    availableTimeStart: "08:00",
    availableTimeEnd: "17:00",
  });
  const [selectedDays, setSelectedDays] = useState([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8080/api/departments",
          config,
        );
        setDepartments(res.data);
      } catch (err) {
        console.error("Error fetching departments", err);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setDoctorData({ ...doctorData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleDayToggle = (dayKey) => {
    let updated;
    if (selectedDays.includes(dayKey)) {
      updated = selectedDays.filter((d) => d !== dayKey);
    } else {
      updated = [...selectedDays, dayKey];
    }
    setSelectedDays(updated);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!doctorData.departmentId) {
      setError("Please select a department.");
      return;
    }
    if (selectedDays.length === 0) {
      setError("Please select at least one working day.");
      return;
    }
    if (doctorData.availableTimeStart >= doctorData.availableTimeEnd) {
      setError("Working hours start time must be before end time.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        firstName: doctorData.firstName.trim(),
        lastName: doctorData.lastName.trim(),
        specialization: doctorData.specialization.trim(),
        phoneNumber: doctorData.phoneNumber.trim(),
        email: doctorData.email.trim(),
        consultationFee: parseFloat(doctorData.consultationFee) || 1500.0,
        department: { id: parseInt(doctorData.departmentId, 10) },
        availableDays: selectedDays.join(","),
        availableTimeStart:
          doctorData.availableTimeStart.length === 5
            ? `${doctorData.availableTimeStart}:00`
            : doctorData.availableTimeStart,
        availableTimeEnd:
          doctorData.availableTimeEnd.length === 5
            ? `${doctorData.availableTimeEnd}:00`
            : doctorData.availableTimeEnd,
      };

      await axios.post("http://localhost:8080/api/doctors", payload, config);
      setIsSubmitting(false);
      onDoctorAdded();
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      console.error("Error adding doctor:", err);
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        "Failed to add doctor. Please check details.";
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FaUserMd size={20} className="text-blue-100" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Register New Doctor</h3>
              <p className="text-xs text-blue-100">
                Create doctor profile with login credentials and working hours
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={doctorData.firstName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={doctorData.lastName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Specialization *
              </label>
              <input
                type="text"
                name="specialization"
                value={doctorData.specialization}
                onChange={handleChange}
                placeholder="e.g. Cardiologist"
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Department *
              </label>
              <select
                name="departmentId"
                value={doctorData.departmentId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={doctorData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={doctorData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <FaMoneyBillWave className="text-emerald-600" /> Consultation Fee (LKR) *
              </label>
              <input
                type="number"
                step="50"
                min="100"
                name="consultationFee"
                value={doctorData.consultationFee}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>
          </div>

          {/* Working Days */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <FaCalendarAlt className="text-indigo-600" /> Working Days *
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => handleDayToggle(day.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Working Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <FaClock className="text-indigo-600" /> Start Time *
              </label>
              <input
                type="time"
                name="availableTimeStart"
                value={doctorData.availableTimeStart}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <FaClock className="text-indigo-600" /> End Time *
              </label>
              <input
                type="time"
                name="availableTimeEnd"
                value={doctorData.availableTimeEnd}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              {isSubmitting ? "Saving..." : "Save Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddDoctorModal;
