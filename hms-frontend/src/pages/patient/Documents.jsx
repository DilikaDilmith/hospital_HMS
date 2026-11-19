import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaFolderOpen, 
    FaFilePdf, 
    FaFileImage, 
    FaFileAlt, 
    FaEye, 
    FaDownload, 
    FaSearch, 
    FaFilter, 
    FaUserShield, 
    FaClock, 
    FaUserMd,
    FaArrowLeft
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

function PatientDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchDocuments = async () => {
        setLoading(true);
        setError('');
        try {
            // Priority endpoint: /api/documents/my (strictly returns only caller's documents)
            const response = await axios.get('http://localhost:8080/api/documents/my', config);
            setDocuments(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Error fetching patient documents:", err);
            setError("Failed to load medical documents. Please ensure the backend is running.");
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getFileIcon = (fileName, fileType) => {
        const name = (fileName || '').toLowerCase();
        const type = (fileType || '').toLowerCase();
        if (name.endsWith('.pdf') || type.includes('pdf')) {
            return <FaFilePdf className="text-red-500 text-2xl" />;
        }
        if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || type.includes('image')) {
            return <FaFileImage className="text-blue-500 text-2xl" />;
        }
        return <FaFileAlt className="text-gray-500 text-2xl" />;
    };

    const handleViewDocument = async (doc) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/documents/${doc.id}/view`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: doc.fileType || 'application/octet-stream' });
            const fileUrl = window.URL.createObjectURL(blob);
            window.open(fileUrl, '_blank');
        } catch (err) {
            console.error("Error opening document:", err);
            alert("Could not open document preview. You may download it directly.");
        }
    };

    const handleDownloadDocument = async (doc) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/documents/${doc.id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: doc.fileType || 'application/octet-stream' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', doc.originalFileName || `document-${doc.id}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error("Error downloading document:", err);
            alert("Failed to download document.");
        }
    };

    const filteredDocs = documents.filter((doc) => {
        const name = (doc.originalFileName || '').toLowerCase();
        const desc = (doc.description || '').toLowerCase();
        const uploader = (doc.uploadedBy || '').toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                              desc.includes(searchTerm.toLowerCase()) || 
                              uploader.includes(searchTerm.toLowerCase());
        
        if (typeFilter === 'PDF') {
            return matchesSearch && (name.endsWith('.pdf') || (doc.fileType || '').includes('pdf'));
        }
        if (typeFilter === 'IMAGE') {
            return matchesSearch && (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || (doc.fileType || '').includes('image'));
        }
        return matchesSearch;
    });

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Top Navigation & Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link to="/patient/dashboard" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <FaArrowLeft size={10} /> Back to Dashboard
                        </Link>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaFolderOpen className="text-yellow-500" /> My Medical Documents
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Clinical scans, doctor referral notes, discharge summaries, and medical reports uploaded by hospital staff
                    </p>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold shadow-sm">
                    <FaUserShield className="text-emerald-600" />
                    <span>Patient Privacy Isolation: Restricted to Your Profile Only</span>
                </div>
            </div>

            {/* Search and Filter Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="relative w-full sm:w-80">
                    <FaSearch className="absolute left-3.5 top-3 text-gray-400 text-xs" />
                    <input
                        type="text"
                        placeholder="Search by file name, description, or uploader..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <FaFilter className="text-gray-400 text-xs" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
                    >
                        <option value="ALL">All File Formats</option>
                        <option value="PDF">PDF Documents only</option>
                        <option value="IMAGE">Scans & Images only</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                    {error}
                </div>
            )}

            {/* Document List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Document Name</th>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Description</th>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Uploaded By</th>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Uploaded Date</th>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">File Size</th>
                                <th className="p-4 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                                            <FaClock className="animate-spin text-blue-600" /> Loading your medical documents...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredDocs.length > 0 ? (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/80 transition">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {getFileIcon(doc.originalFileName, doc.fileType)}
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-xs">
                                                        {doc.originalFileName}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                                                        {doc.fileType || 'Document'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs text-gray-600 max-w-xs">
                                            {doc.description || <span className="text-gray-400 italic">No notes provided</span>}
                                        </td>
                                        <td className="p-4 text-xs">
                                            <span className="inline-flex items-center gap-1 font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                                <FaUserMd className="text-blue-500 text-[10px]" />
                                                {doc.uploadedBy || 'Hospital Staff'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-gray-600">
                                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString([], {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            }) : 'N/A'}
                                            <div className="text-[11px] text-gray-400">
                                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs text-gray-500 font-mono">
                                            {formatFileSize(doc.fileSizeBytes)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDocument(doc)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 hover:border-blue-600 transition shadow-sm"
                                                    title="Preview document in browser"
                                                >
                                                    <FaEye size={12} /> View
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadDocument(doc)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 hover:border-emerald-600 transition shadow-sm"
                                                    title="Download document to computer"
                                                >
                                                    <FaDownload size={11} /> Download
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-gray-500">
                                        <FaFolderOpen className="mx-auto text-4xl text-gray-300 mb-2" />
                                        <p className="font-semibold text-gray-700 text-sm">No medical documents found</p>
                                        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                                            {searchTerm || typeFilter !== 'ALL'
                                                ? 'No documents matched your search criteria. Try clearing the filter.'
                                                : 'No medical documents have been uploaded to your profile yet. Whenever doctors or hospital staff upload medical scans, referral letters, or reports, they will be securely visible here.'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default PatientDocuments;
