import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
    Upload,
    Download,
    FileSpreadsheet,
    Users,
    Building2,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
    Eye,
    Trash2
} from 'lucide-react';
import {
    addPreRegisteredUsers,
    batchImportDepartmentStructure,
    getDepartments,
    getAllUsers,
    getAllPreRegisteredUsers
} from '../services/firestoreService';

export default function BatchImportTab({ departments, allUsers, onDataChanged }) {
    const [activeSection, setActiveSection] = useState('users'); // 'users' or 'departments'
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewHeaders, setPreviewHeaders] = useState([]);
    const [importResults, setImportResults] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // ==================== EXCEL PARSING ====================

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');
        setImportResults(null);

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            setError('Please upload an Excel file (.xlsx, .xls) or CSV file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const workbook = XLSX.read(evt.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                if (jsonData.length === 0) {
                    setError('The uploaded file is empty.');
                    return;
                }

                const headers = Object.keys(jsonData[0]);
                setPreviewHeaders(headers);
                setPreviewData(jsonData);
            } catch (err) {
                setError('Failed to parse Excel file. Please check the format.');
                console.error('Excel parse error:', err);
            }
        };
        reader.readAsBinaryString(file);

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ==================== USER IMPORT ====================

    const handleImportUsers = async () => {
        if (!previewData || previewData.length === 0) return;

        setUploading(true);
        setError('');
        setImportResults(null);

        try {
            // Map Excel columns to expected format
            const users = previewData.map(row => {
                // Find matching department by name or code
                const deptName = row['Department'] || row['department'] || '';
                const matchedDept = departments.find(
                    d => d.name?.toLowerCase() === deptName.toLowerCase() || d.code?.toLowerCase() === deptName.toLowerCase()
                );

                return {
                    name: row['Name'] || row['name'] || row['Full Name'] || row['full_name'] || '',
                    email: row['Email'] || row['email'] || row['Email Address'] || '',
                    role: (row['Role'] || row['role'] || 'lecturer').toLowerCase(),
                    departmentId: matchedDept?.id || null,
                    departmentName: matchedDept?.name || deptName,
                    subjects: []
                };
            });

            const results = await addPreRegisteredUsers(users);
            setImportResults(results);
            setPreviewData(null);
            setPreviewHeaders([]);

            if (onDataChanged) onDataChanged();
        } catch (err) {
            setError(`Import failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    // ==================== DEPARTMENT IMPORT ====================

    const handleImportDepartments = async () => {
        if (!previewData || previewData.length === 0) return;

        setUploading(true);
        setError('');
        setImportResults(null);

        try {
            // Map Excel columns
            const rows = previewData.map(row => ({
                departmentName: row['Department Name'] || row['department_name'] || row['Department'] || '',
                deptCode: row['Department Code'] || row['dept_code'] || row['Dept Code'] || '',
                courseName: row['Course Name'] || row['course_name'] || row['Course'] || '',
                courseCode: row['Course Code'] || row['course_code'] || '',
                subjectName: row['Subject Name'] || row['subject_name'] || row['Subject'] || '',
                subjectCode: row['Subject Code'] || row['subject_code'] || ''
            }));

            const results = await batchImportDepartmentStructure(rows);
            setImportResults(results);
            setPreviewData(null);
            setPreviewHeaders([]);

            if (onDataChanged) onDataChanged();
        } catch (err) {
            setError(`Import failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    // ==================== TEMPLATE DOWNLOADS ====================

    const downloadUserTemplate = () => {
        const headers = ['Name', 'Email', 'Role', 'Department'];
        const exampleRow = ['John Doe', 'john@example.com', 'lecturer', 'Computer Science'];
        const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Users');

        // Set column widths
        ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 25 }];

        XLSX.writeFile(wb, 'user_import_template.xlsx');
    };

    const downloadUserExport = async () => {
        try {
            const users = allUsers || await getAllUsers();
            const data = users.map(u => ({
                'Name': u.displayName || '',
                'Email': u.email || '',
                'Role': u.role || '',
                'Department': departments.find(d => d.id === u.department)?.name || ''
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Users');
            ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 25 }];

            XLSX.writeFile(wb, 'current_users_export.xlsx');
        } catch (err) {
            setError('Failed to export users');
        }
    };

    const downloadDeptTemplate = () => {
        const headers = ['Department Name', 'Department Code', 'Course Name', 'Course Code', 'Subject Name', 'Subject Code'];
        const example1 = ['Computer Science', 'CS', 'BSc Computer Science', 'BCS', 'Intro to Programming', 'CS101'];
        const example2 = ['Computer Science', 'CS', 'BSc Computer Science', 'BCS', 'Data Structures', 'CS102'];
        const example3 = ['Computer Science', 'CS', 'Diploma IT', 'DIT', 'Networking', 'IT101'];

        const ws = XLSX.utils.aoa_to_sheet([headers, example1, example2, example3]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Departments');
        ws['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 }];

        XLSX.writeFile(wb, 'department_import_template.xlsx');
    };

    const downloadDeptExport = async () => {
        try {
            const depts = departments.length > 0 ? departments : await getDepartments();
            const data = [];

            for (const dept of depts) {
                if (!dept.courses || dept.courses.length === 0) {
                    data.push({
                        'Department Name': dept.name,
                        'Department Code': dept.code,
                        'Course Name': '',
                        'Course Code': '',
                        'Subject Name': '',
                        'Subject Code': ''
                    });
                } else {
                    for (const course of dept.courses) {
                        if (!course.subjects || course.subjects.length === 0) {
                            data.push({
                                'Department Name': dept.name,
                                'Department Code': dept.code,
                                'Course Name': course.courseName,
                                'Course Code': course.courseCode,
                                'Subject Name': '',
                                'Subject Code': ''
                            });
                        } else {
                            for (const subject of course.subjects) {
                                data.push({
                                    'Department Name': dept.name,
                                    'Department Code': dept.code,
                                    'Course Name': course.courseName,
                                    'Course Code': course.courseCode,
                                    'Subject Name': subject.subjectName,
                                    'Subject Code': subject.subjectCode
                                });
                            }
                        }
                    }
                }
            }

            if (data.length === 0) {
                data.push({
                    'Department Name': '',
                    'Department Code': '',
                    'Course Name': '',
                    'Course Code': '',
                    'Subject Name': '',
                    'Subject Code': ''
                });
            }

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Departments');
            ws['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 }];

            XLSX.writeFile(wb, 'current_departments_export.xlsx');
        } catch (err) {
            setError('Failed to export departments');
        }
    };

    return (
        <div>
            {/* Section Toggle */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => { setActiveSection('users'); setPreviewData(null); setImportResults(null); setError(''); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeSection === 'users'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    User Import
                </button>
                <button
                    onClick={() => { setActiveSection('departments'); setPreviewData(null); setImportResults(null); setError(''); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeSection === 'departments'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <Building2 className="w-4 h-4" />
                    Department Structure Import
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                    <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Import Results */}
            {importResults && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="font-medium text-green-800">Import Complete!</p>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                        {activeSection === 'users' ? (
                            <>
                                <p>✅ {importResults.added} user(s) added to whitelist</p>
                                <p>⏭️ {importResults.skipped} skipped (already exists)</p>
                                {importResults.errors?.length > 0 && (
                                    <div className="mt-2 text-red-700">
                                        <p className="font-medium">Errors:</p>
                                        {importResults.errors.map((err, i) => <p key={i}>• {err}</p>)}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <p>🏢 {importResults.departments} department(s) created</p>
                                <p>📚 {importResults.courses} course(s) created</p>
                                <p>📖 {importResults.subjects} subject(s) created</p>
                                <p>⏭️ {importResults.skipped} skipped (already exists)</p>
                                {importResults.errors?.length > 0 && (
                                    <div className="mt-2 text-red-700">
                                        <p className="font-medium">Errors:</p>
                                        {importResults.errors.map((err, i) => <p key={i}>• {err}</p>)}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* USER IMPORT SECTION */}
            {activeSection === 'users' && (
                <div className="space-y-6">
                    {/* Description */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 How User Import Works</h3>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Upload an Excel file with user details (Name, Email, Role, Department)</li>
                            <li>• Users are added to a <strong>whitelist</strong> (pre-registered)</li>
                            <li>• When they self-register with the same email, they are <strong>auto-approved</strong></li>
                            <li>• No password sharing needed — users set their own credentials</li>
                        </ul>
                    </div>

                    {/* Template Downloads */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={downloadUserTemplate}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4 text-green-600" />
                            Download Empty Template
                        </button>
                        <button
                            onClick={downloadUserExport}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4 text-blue-600" />
                            Export Current Users
                        </button>
                    </div>

                    {/* File Upload */}
                    {!previewData && (
                        <div>
                            <label htmlFor="user-excel-upload" className="cursor-pointer">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-900 mb-1">Click to upload Excel file</p>
                                    <p className="text-xs text-gray-500">Supports .xlsx, .xls, .csv</p>
                                </div>
                            </label>
                            <input
                                ref={fileInputRef}
                                id="user-excel-upload"
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileUpload}
                            />
                        </div>
                    )}

                    {/* Data Preview */}
                    {previewData && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-gray-600" />
                                    <p className="text-sm font-semibold text-gray-900">Preview ({previewData.length} rows)</p>
                                </div>
                                <button
                                    onClick={() => { setPreviewData(null); setPreviewHeaders([]); }}
                                    className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" /> Clear
                                </button>
                            </div>
                            <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">#</th>
                                            {previewHeaders.map(h => (
                                                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-700">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {previewData.slice(0, 20).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-3 py-1.5 text-xs text-gray-500">{i + 1}</td>
                                                {previewHeaders.map(h => (
                                                    <td key={h} className="px-3 py-1.5 text-xs text-gray-700">{row[h]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                        {previewData.length > 20 && (
                                            <tr>
                                                <td colSpan={previewHeaders.length + 1} className="px-3 py-2 text-center text-xs text-gray-500">
                                                    ... and {previewData.length - 20} more rows
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Import Button */}
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={handleImportUsers}
                                    disabled={uploading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:bg-blue-400"
                                >
                                    {uploading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                                    ) : (
                                        <><Upload className="w-4 h-4" /> Import {previewData.length} Users</>
                                    )}
                                </button>
                                <button
                                    onClick={() => { setPreviewData(null); setPreviewHeaders([]); }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* DEPARTMENT IMPORT SECTION */}
            {activeSection === 'departments' && (
                <div className="space-y-6">
                    {/* Description */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-purple-900 mb-2">🏢 How Department Import Works</h3>
                        <ul className="text-xs text-purple-800 space-y-1">
                            <li>• Upload an Excel file with the academic structure</li>
                            <li>• Columns: Department Name, Dept Code, Course Name, Course Code, Subject Name, Subject Code</li>
                            <li>• Existing departments/courses/subjects will be skipped (no duplicates)</li>
                            <li>• New entries will be created automatically</li>
                        </ul>
                    </div>

                    {/* Template Downloads */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={downloadDeptTemplate}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4 text-green-600" />
                            Download Empty Template
                        </button>
                        <button
                            onClick={downloadDeptExport}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4 text-purple-600" />
                            Export Current Structure
                        </button>
                    </div>

                    {/* File Upload */}
                    {!previewData && (
                        <div>
                            <label htmlFor="dept-excel-upload" className="cursor-pointer">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-900 mb-1">Click to upload Excel file</p>
                                    <p className="text-xs text-gray-500">Supports .xlsx, .xls, .csv</p>
                                </div>
                            </label>
                            <input
                                ref={fileInputRef}
                                id="dept-excel-upload"
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileUpload}
                            />
                        </div>
                    )}

                    {/* Data Preview */}
                    {previewData && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-gray-600" />
                                    <p className="text-sm font-semibold text-gray-900">Preview ({previewData.length} rows)</p>
                                </div>
                                <button
                                    onClick={() => { setPreviewData(null); setPreviewHeaders([]); }}
                                    className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" /> Clear
                                </button>
                            </div>
                            <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">#</th>
                                            {previewHeaders.map(h => (
                                                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-700">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {previewData.slice(0, 20).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-3 py-1.5 text-xs text-gray-500">{i + 1}</td>
                                                {previewHeaders.map(h => (
                                                    <td key={h} className="px-3 py-1.5 text-xs text-gray-700">{row[h]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                        {previewData.length > 20 && (
                                            <tr>
                                                <td colSpan={previewHeaders.length + 1} className="px-3 py-2 text-center text-xs text-gray-500">
                                                    ... and {previewData.length - 20} more rows
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Import Button */}
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={handleImportDepartments}
                                    disabled={uploading}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:bg-purple-400"
                                >
                                    {uploading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                                    ) : (
                                        <><Upload className="w-4 h-4" /> Import Structure</>
                                    )}
                                </button>
                                <button
                                    onClick={() => { setPreviewData(null); setPreviewHeaders([]); }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
