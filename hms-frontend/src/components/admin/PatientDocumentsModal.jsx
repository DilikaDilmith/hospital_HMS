import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaTimes, 
    FaFileUpload, 
    FaFilePdf, 
    FaFileImage, 
    FaFileAlt, 
    FaDownload, 
    FaEye, 
    FaTrash, 
    FaSpinner, 
    FaFolderOpen,
    FaCheckCircle,
    FaExclamationCircle
} from 'react-icons/fa';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

function PatientDocumentsModal({ patient, onClose }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [selectedFile, setSelectedFile] = useState(null);
    const [description, setDescription] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8080/api/patients/${patient.id}/documents`, config);
            setDocuments(Array.isArray(response.data) ? response.data : []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching documents:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to load patient documents.';
            setError(msg);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patient?.id) {
            fetchDocuments();
        }
    }, [patient?.id]);

    const handleFileChange = (e) => {
        setError('');
        setSuccessMsg('');
        const file = e.target.files[0];
        if (!file) {
            setSelectedFile(null);
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            setError(`Selected file (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds the maximum limit of 5 MB.`);
            e.target.value = '';
            setSelectedFile(null);
            return;
        }

        // Validate file extension
        const ext = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            setError(`Invalid file type .${ext}. Only PDF, JPG, and PNG documents are allowed.`);
            e.target.value = '';
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!selectedFile) {
            setError('Please choose a valid PDF, JPG, or PNG document.');
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);
        if (description.trim()) {
            formData.append('description', description.trim());
        }

        try {
            await axios.post(
                `http://localhost:8080/api/patients/${patient.id}/documents`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setSuccessMsg('Document uploaded successfully!');
            setSelectedFile(null);
            setDescription('');
            // Reset input
            const fileInput = document.getElementById('patient-doc-upload-input');
            if (fileInput) fileInput.value = '';

            setUploading(false);
            fetchDocuments();
        } catch (err) {
            setUploading(false);
            console.error("Error uploading document:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to upload document.';
            setError(msg);
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
            console.error("Error opening document:", err);
            setError("Failed to open document. Please ensure you are authorized.");
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
            console.error("Error downloading document:", err);
            setError("Failed to download document.");
        }
    };

    const handleDelete = async (doc) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${doc.originalFileName}"?`)) {
            return;
        }

        setDeletingId(doc.id);
        setError('');
        setSuccessMsg('');

        try {
            await axios.delete(`http://localhost:8080/api/documents/${doc.id}`, config);
            setSuccessMsg(`Document "${doc.originalFileName}" deleted successfully.`);
            setDeletingId(null);
            fetchDocuments();
        } catch (err) {
            setDeletingId(null);
            console.error("Error deleting document:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to delete document.';
            setError(msg);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getFileIcon = (fileType, originalName) => {
        const name = (originalName || '').toLowerCase();
        if (fileType?.includes('pdf') || name.endsWith('.pdf')) {
            return <FaFilePdf className="text-red-500" size={18} />;
        }
        if (fileType?.includes('image') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) {
            return <FaFileImage className="text-blue-500" size={18} />;
        }
        return <FaFileAlt className="text-gray-500" size={18} />;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <FaFolderOpen size={20} className="text-blue-100" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Patient Documents</h3>
                            <p className="text-xs text-blue-100">
                                {patient.firstName} {patient.lastName} (Patient #{patient.id} {patient.nic ? `• NIC: ${patient.nic}` : ''})
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

                {/* Content Body */}
                <div className="p-6 overflow-y-auto space-y-6 text-sm">
                    {/* Alerts */}
                    {error && (
                        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                            <FaExclamationCircle size={15} className="flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl font-medium flex items-center gap-2">
                            <FaCheckCircle size={15} className="flex-shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Section 1: Upload New Document */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-2">
                            <FaFileUpload className="text-blue-600" /> Upload New Document
                        </h4>
                        <form onSubmit={handleUpload} className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Select File (PDF, JPG, PNG - Max 5 MB) *
                                    </label>
                                    <input
                                        id="patient-doc-upload-input"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        required
                                        className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 border border-gray-300 rounded-lg p-1 bg-white cursor-pointer"
                                    />
                                    {selectedFile && (
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Description / Document Category
                                    </label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="e.g. Lab Report, NIC Scan, Discharge Summary"
                                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-1">
                                <button
                                    type="submit"
                                    disabled={uploading || !selectedFile}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <FaFileUpload /> Upload Document
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Section 2: Uploaded Documents Table */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Existing Documents ({documents.length})
                            </h4>
                            <button
                                onClick={fetchDocuments}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Refresh
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-gray-500 text-xs">
                                <FaSpinner className="animate-spin inline mr-2 text-blue-600" size={16} />
                                Loading documents...
                            </div>
                        ) : documents.length > 0 ? (
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                                        <tr>
                                            <th className="p-3 font-semibold">Document</th>
                                            <th className="p-3 font-semibold">Description</th>
                                            <th className="p-3 font-semibold">Size</th>
                                            <th className="p-3 font-semibold">Uploaded</th>
                                            <th className="p-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {documents.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-slate-50 transition">
                                                <td className="p-3 text-gray-800 font-medium flex items-center gap-2 max-w-xs truncate">
                                                    {getFileIcon(doc.fileType, doc.originalFileName)}
                                                    <span title={doc.originalFileName} className="truncate">
                                                        {doc.originalFileName}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-600">
                                                    {doc.description || <span className="text-gray-400 italic">None</span>}
                                                </td>
                                                <td className="p-3 text-gray-500 font-mono">
                                                    {formatFileSize(doc.fileSize)}
                                                </td>
                                                <td className="p-3 text-gray-500">
                                                    <div>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '-'}</div>
                                                    <div className="text-[10px] text-gray-400">by {doc.uploadedBy || 'Staff'}</div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleView(doc)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="View Inline in Browser"
                                                        >
                                                            <FaEye size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownload(doc)}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                            title="Download File"
                                                        >
                                                            <FaDownload size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(doc)}
                                                            disabled={deletingId === doc.id}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                                            title="Delete Document"
                                                        >
                                                            {deletingId === doc.id ? (
                                                                <FaSpinner className="animate-spin" size={13} />
                                                            ) : (
                                                                <FaTrash size={13} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl text-xs">
                                No documents have been uploaded for this patient yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PatientDocumentsModal;
