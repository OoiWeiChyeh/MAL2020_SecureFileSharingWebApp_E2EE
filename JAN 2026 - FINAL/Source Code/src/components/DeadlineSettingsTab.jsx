import { useState } from 'react';
import {
    Calendar,
    ChevronDown,
    ChevronRight,
    Building2,
    BookOpen,
    FileText,
    CheckCircle,
    X,
    AlertCircle,
    Loader2,
    Clock,
    Trash2
} from 'lucide-react';
import { setDeadline, clearDeadline } from '../services/firestoreService';

export default function DeadlineSettingsTab({ departments, onDataChanged }) {
    const [expandedDepts, setExpandedDepts] = useState({});
    const [expandedCourses, setExpandedCourses] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const toggleDept = (deptId) => {
        setExpandedDepts(prev => ({ ...prev, [deptId]: !prev[deptId] }));
    };

    const toggleCourse = (courseId) => {
        setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    const formatDate = (deadline) => {
        if (!deadline) return null;
        const date = deadline.toDate ? deadline.toDate() : new Date(deadline);
        return date.toISOString().split('T')[0];
    };

    const formatDisplayDate = (deadline) => {
        if (!deadline) return null;
        const date = deadline.toDate ? deadline.toDate() : new Date(deadline);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getDaysLeft = (deadline) => {
        if (!deadline) return null;
        const date = deadline.toDate ? deadline.toDate() : new Date(deadline);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getStatusBadge = (deadline) => {
        const daysLeft = getDaysLeft(deadline);
        if (daysLeft === null) return null;

        if (daysLeft < 0) return { text: `Overdue by ${Math.abs(daysLeft)}d`, color: 'bg-red-100 text-red-700' };
        if (daysLeft === 0) return { text: 'Due today', color: 'bg-red-100 text-red-700' };
        if (daysLeft <= 3) return { text: `${daysLeft}d left`, color: 'bg-red-100 text-red-700' };
        if (daysLeft <= 7) return { text: `${daysLeft}d left`, color: 'bg-yellow-100 text-yellow-700' };
        return { text: `${daysLeft}d left`, color: 'bg-green-100 text-green-700' };
    };

    const handleSetDeadline = async (deptId, courseId, subjectId, dateValue) => {
        try {
            setSaving(true);
            setError('');

            if (dateValue) {
                await setDeadline(deptId, courseId, subjectId, dateValue);
                setSuccess('Deadline set successfully!');
            } else {
                await clearDeadline(deptId, courseId, subjectId);
                setSuccess('Deadline cleared!');
            }

            if (onDataChanged) await onDataChanged();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            console.error('Error setting deadline:', err);
            setError('Failed to set deadline');
        } finally {
            setSaving(false);
        }
    };

    const handleClearDeadline = async (deptId, courseId, subjectId) => {
        await handleSetDeadline(deptId, courseId, subjectId, null);
    };

    const getMinDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Resolve effective deadline for display
    const getInheritedDeadline = (dept, courseId = null, subjectId = null) => {
        if (!courseId && !subjectId) return null; // dept level has no parent

        if (courseId && !subjectId) {
            // Course inherits from department
            return dept.deadline ? { from: 'department', deadline: dept.deadline } : null;
        }

        if (courseId && subjectId) {
            // Subject inherits from course first, then department
            const course = (dept.courses || []).find(c => c.courseId === courseId);
            if (course?.deadline) return { from: 'course', deadline: course.deadline };
            if (dept.deadline) return { from: 'department', deadline: dept.deadline };
        }

        return null;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Deadline Settings</h3>
                    <p className="text-sm text-gray-600 mt-1">Set submission deadlines at department, course, or subject level</p>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">📌 How Deadlines Cascade</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                    <li>• <strong>Department deadline</strong> → applies to all courses and subjects inside</li>
                    <li>• <strong>Course deadline</strong> → overrides department for subjects in that course</li>
                    <li>• <strong>Subject deadline</strong> → overrides both course and department</li>
                    <li>• Files uploaded after the deadline will be flagged as <strong>LATE</strong></li>
                </ul>
            </div>

            {/* Notifications */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-800 flex-1">{error}</p>
                    <button onClick={() => setError('')}><X className="w-4 h-4 text-red-600" /></button>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-800">{success}</p>
                </div>
            )}

            {saving && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <p className="text-sm text-blue-800">Saving deadline...</p>
                </div>
            )}

            {/* Department Tree */}
            {departments.length === 0 ? (
                <div className="text-center py-12">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No departments created yet</p>
                    <p className="text-sm text-gray-500">Create departments first in the Departments tab</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {departments.map(dept => {
                        const deptDeadline = dept.deadline;
                        const deptStatus = getStatusBadge(deptDeadline);

                        return (
                            <div key={dept.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Department Header */}
                                <div className="bg-gray-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => toggleDept(dept.id)} className="text-gray-600 hover:text-gray-900">
                                                {expandedDepts[dept.id]
                                                    ? <ChevronDown className="w-5 h-5" />
                                                    : <ChevronRight className="w-5 h-5" />
                                                }
                                            </button>
                                            <Building2 className="w-5 h-5 text-purple-600" />
                                            <div>
                                                <p className="font-semibold text-gray-900">{dept.name}</p>
                                                <p className="text-xs text-gray-500">{dept.code} • {dept.courses?.length || 0} course(s)</p>
                                            </div>
                                        </div>

                                        {/* Department Deadline */}
                                        <div className="flex items-center gap-2">
                                            {deptStatus && (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${deptStatus.color}`}>
                                                    {deptStatus.text}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={formatDate(deptDeadline) || ''}
                                                    min={getMinDate()}
                                                    onChange={(e) => handleSetDeadline(dept.id, null, null, e.target.value)}
                                                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    disabled={saving}
                                                />
                                                {deptDeadline && (
                                                    <button
                                                        onClick={() => handleClearDeadline(dept.id, null, null)}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                        title="Clear deadline"
                                                        disabled={saving}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Courses */}
                                {expandedDepts[dept.id] && (
                                    <div className="pl-8 pr-4 py-2 space-y-2">
                                        {(dept.courses || []).length === 0 ? (
                                            <p className="text-sm text-gray-500 py-3 pl-4">No courses in this department</p>
                                        ) : (
                                            (dept.courses || []).map(course => {
                                                const courseDeadline = course.deadline;
                                                const courseStatus = getStatusBadge(courseDeadline);
                                                const courseInherited = getInheritedDeadline(dept, course.courseId);

                                                return (
                                                    <div key={course.courseId} className="border border-gray-100 rounded-lg">
                                                        {/* Course Header */}
                                                        <div className="bg-white p-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <button onClick={() => toggleCourse(course.courseId)} className="text-gray-600 hover:text-gray-900">
                                                                        {expandedCourses[course.courseId]
                                                                            ? <ChevronDown className="w-4 h-4" />
                                                                            : <ChevronRight className="w-4 h-4" />
                                                                        }
                                                                    </button>
                                                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">{course.courseName}</p>
                                                                        <p className="text-xs text-gray-500">{course.courseCode} • {course.subjects?.length || 0} subject(s)</p>
                                                                    </div>
                                                                </div>

                                                                {/* Course Deadline */}
                                                                <div className="flex items-center gap-2">
                                                                    {courseStatus && (
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${courseStatus.color}`}>
                                                                            {courseStatus.text}
                                                                        </span>
                                                                    )}
                                                                    {!courseDeadline && courseInherited && (
                                                                        <span className="px-2 py-0.5 rounded-full text-xs text-gray-400 bg-gray-50 italic">
                                                                            inherits {formatDisplayDate(courseInherited.deadline)} from {courseInherited.from}
                                                                        </span>
                                                                    )}
                                                                    <div className="flex items-center gap-1">
                                                                        <input
                                                                            type="date"
                                                                            value={formatDate(courseDeadline) || ''}
                                                                            min={getMinDate()}
                                                                            onChange={(e) => handleSetDeadline(dept.id, course.courseId, null, e.target.value)}
                                                                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                                                                            disabled={saving}
                                                                        />
                                                                        {courseDeadline && (
                                                                            <button
                                                                                onClick={() => handleClearDeadline(dept.id, course.courseId, null)}
                                                                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                                                title="Clear deadline"
                                                                                disabled={saving}
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Subjects */}
                                                        {expandedCourses[course.courseId] && (
                                                            <div className="pl-10 pr-4 py-2 space-y-1 bg-gray-50/50">
                                                                {(course.subjects || []).length === 0 ? (
                                                                    <p className="text-xs text-gray-500 py-2">No subjects in this course</p>
                                                                ) : (
                                                                    (course.subjects || []).map(subject => {
                                                                        const subjectDeadline = subject.deadline;
                                                                        const subjectStatus = getStatusBadge(subjectDeadline);
                                                                        const subjectInherited = getInheritedDeadline(dept, course.courseId, subject.subjectId);

                                                                        return (
                                                                            <div key={subject.subjectId} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-100">
                                                                                <div className="flex items-center gap-2">
                                                                                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                                                                                    <span className="text-sm text-gray-900">{subject.subjectCode}</span>
                                                                                    <span className="text-xs text-gray-500">•</span>
                                                                                    <span className="text-xs text-gray-600">{subject.subjectName}</span>
                                                                                    {subject.assignedLecturerName && (
                                                                                        <span className="text-xs text-blue-600 ml-2">
                                                                                            👨‍🏫 {subject.assignedLecturerName}
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Subject Deadline */}
                                                                                <div className="flex items-center gap-2">
                                                                                    {subjectStatus && (
                                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${subjectStatus.color}`}>
                                                                                            {subjectStatus.text}
                                                                                        </span>
                                                                                    )}
                                                                                    {!subjectDeadline && subjectInherited && (
                                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] text-gray-400 bg-gray-50 italic">
                                                                                            from {subjectInherited.from}
                                                                                        </span>
                                                                                    )}
                                                                                    <div className="flex items-center gap-1">
                                                                                        <input
                                                                                            type="date"
                                                                                            value={formatDate(subjectDeadline) || ''}
                                                                                            min={getMinDate()}
                                                                                            onChange={(e) => handleSetDeadline(dept.id, course.courseId, subject.subjectId, e.target.value)}
                                                                                            className="px-2 py-0.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                                                                                            disabled={saving}
                                                                                        />
                                                                                        {subjectDeadline && (
                                                                                            <button
                                                                                                onClick={() => handleClearDeadline(dept.id, course.courseId, subject.subjectId)}
                                                                                                className="p-0.5 text-red-500 hover:bg-red-50 rounded"
                                                                                                title="Clear deadline"
                                                                                                disabled={saving}
                                                                                            >
                                                                                                <Trash2 className="w-3 h-3" />
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
