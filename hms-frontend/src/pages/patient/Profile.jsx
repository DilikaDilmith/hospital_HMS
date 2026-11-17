import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaUser, 
    FaIdCard, 
    FaBirthdayCake, 
    FaPhone, 
    FaMapMarkerAlt,
    FaFolderOpen,
    FaFilePdf,
    FaFileImage,
    FaFileAlt,
    FaEye,
    FaDownload
} from 'react-icons/fa';

function PatientProfile() {
    const [user, setUser] = useState(null);
    const [patient, setPatient] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 1. Get User Data
                const userRes = await axios.get('http://localhost:8080/api/users/profile', config);
                setUser(userRes.data);

                // 2. Get Patient Data directly from linked profile endpoint
                const patRes = await axios.get('http://localhost:8080/api/patients/profile', config);
                if (patRes.data) {
                    setPatient(patRes.data);
                    // Fetch documents for this patient
                    fetchDocuments(patRes.data.id);
                }
            } catch (error) {
                console.error("Error loading profile details:", error);
            }
        };
        fetchProfile();
    }, []);

    const fetchDocuments = async (patientId) => {
        setLoadingDocs(true);
        try {
            const res = await axios.get(`http://localhost:8080/api/patients/${patientId}/documents`, config);
            setDocuments(Array.isArray(res.data) ? res.data : []);
            setLoadingDocs(false);
        } catch (err) {
            console.error("Error loading patient documents:", err);
            setLoadingDocs(false);
        }
    };

    const handleView = async (doc) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/documents/${doc.id}/view`, {
                ...config,
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: doc.fileType || 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } catch (err) {
            alert("Failed to view document.");
        }
    };

    const handleDownload = async (doc) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/documents/${doc.id}/download`, {
                ...config,
                responseType: 'blob'
            });
            const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', doc.originalFileName || `document-${doc.id}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            alert("Failed to download document.");
        }
    };

    const getFileIcon = (fileType, originalName) => {
        const name = (originalName || '').toLowerCase();
        if (fileType?.includes('pdf') || name.endsWith('.pdf')) {
            return <FaFilePdf className="text-red-500" size={16} />;
        }
        if (fileType?.includes('image') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) {
            return <FaFileImage className="text-blue-500" size={16} />;
        }
        return <FaFileAlt className="text-gray-500" size={16} />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    if (!user) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-cyan-600 h-32"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-center md:justify-start -mt-12 mb-4">
                        <div className="bg-white p-2 rounded-full">
                            <FaUser className="text-gray-300" size={80} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{user.fullName}</h3>
                    <p className="text-cyan-600 font-semibold flex items-center gap-2 mt-1">
                        Patient
                    </p>

                    {patient ? (
                        <>
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <FaIdCard className="text-gray-400" />
                                <div><p className="text-xs text-gray-500">NIC</p><p className="text-gray-800 font-medium">{patient.nic}</p></div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <FaBirthdayCake className="text-gray-400" />
                                <div><p className="text-xs text-gray-500">Date of Birth</p><p className="text-gray-800 font-medium">{patient.dateOfBirth}</p></div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <FaPhone className="text-gray-400" />
                                <div><p className="text-xs text-gray-500">Phone</p><p className="text-gray-800 font-medium">{patient.phoneNumber}</p></div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3 md:col-span-2">
                                <FaMapMarkerAlt className="text-gray-400" />
                                <div><p className="text-xs text-gray-500">Address</p><p className="text-gray-800 font-medium">{patient.address}</p></div>
                            </div>
                        </div>

                        {/* My Documents Section */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h4 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <FaFolderOpen className="text-cyan-600" /> My Medical Documents ({documents.length})
                            </h4>

                            {loadingDocs ? (
                                <p className="text-xs text-gray-500">Loading documents...</p>
                            ) : documents.length > 0 ? (
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {getFileIcon(doc.fileType, doc.originalFileName)}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-800 truncate" title={doc.originalFileName}>
                                                        {doc.originalFileName}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {doc.description ? `${doc.description} • ` : ''}
                                                        {formatFileSize(doc.fileSize)} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => handleView(doc)}
                                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium flex items-center gap-1 transition"
                                                    title="View Document"
                                                >
                                                    <FaEye size={12} /> View
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(doc)}
                                                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium flex items-center gap-1 transition"
                                                    title="Download Document"
                                                >
                                                    <FaDownload size={12} /> Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic">
                                    No medical documents uploaded yet. Hospital staff can upload reports and scans to your profile.
                                </p>
                            )}
                        </div>
                        </>
                    ) : (
                        <div className="mt-6 bg-yellow-50 text-yellow-700 p-4 rounded-lg">
                            Your detailed medical profile (NIC, DOB, etc.) has not been created by the reception yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default PatientProfile;
