import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import { Course, Classroom, Student } from '../types';

interface DataInputProps {
    courses: Course[];
    setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
    classrooms: Classroom[];
    setClassrooms: React.Dispatch<React.SetStateAction<Classroom[]>>;
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

type Tab = 'courses' | 'classrooms' | 'students';

interface EditModalProps {
    item: any;
    type: Tab;
    mode: 'add' | 'edit';
    onClose: () => void;
    onSave: (updatedItem: any) => void;
}

const EditModal: React.FC<EditModalProps> = ({ item, type, mode, onClose, onSave }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<any>({ ...item });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type: inputType } = e.target;

        if (name === 'capacity') {
            if (value === '') {
                setFormData((prev: any) => ({ ...prev, [name]: '' }));
            } else if (/^\d+$/.test(value)) {
                setFormData((prev: any) => ({ ...prev, [name]: parseInt(value, 10) }));
            }
            return;
        }

        setFormData((prev: any) => ({
            ...prev,
            [name]: inputType === 'number' ? parseInt(value, 10) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData };
        if (type === 'classrooms' && (typeof finalData.capacity !== 'number' || isNaN(finalData.capacity))) {
            finalData.capacity = 0;
        }
        onSave(finalData);
    };

    const renderFormContent = () => {
        switch (type) {
            case 'courses':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.courseCode')}</label>
                            <input required type="text" name="code" value={formData.code} onChange={handleChange} className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.courseName')}</label>
                            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.enrolledStudents')}</label>
                            <input
                                type="text"
                                name="enrolledStudents"
                                value={formData.enrolledStudents || 0}
                                readOnly
                                className="w-full rounded-lg border-slate-200 border px-3 py-2 bg-slate-100 text-slate-500 focus:outline-none cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-400 mt-1">{t('dataInput.calculatedAutomatically')}</p>
                        </div>
                    </>
                );
            case 'classrooms':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.roomName')}</label>
                            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.building')}</label>
                            <input type="text" name="building" value={formData.building} onChange={handleChange} className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.capacity')}</label>
                            <input
                                required
                                type="text"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </>
                );
            case 'students':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.studentId')}</label>
                            <input 
                                required 
                                type="text" 
                                name="id" 
                                value={formData.id} 
                                onChange={handleChange} 
                                placeholder="Ex: 2023001"
                                className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                readOnly={mode === 'edit'} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.studentNameGenerated')}</label>
                            <input 
                                required 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                placeholder="Name Surname"
                                className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.email')}</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                placeholder="student@uni.edu"
                                className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 capitalize">
                        {mode === 'add' ? t('dataInput.addNew') : t('common.edit')} {t(`dataInput.${type}`)}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {renderFormContent()}
                    <div className="pt-4 flex gap-3 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ImportStatus {
    fileName: string;
    count: number;
}

interface StudentImportModalProps {
    onClose: () => void;
    onSelectStudentInfo: () => void;
    onSelectAttendance: () => void;
    studentInfoStatus: ImportStatus | null;
    attendanceStatus: ImportStatus | null;
    onSave: () => void;
}

const StudentImportModal: React.FC<StudentImportModalProps> = ({
    onClose,
    onSelectStudentInfo,
    onSelectAttendance,
    studentInfoStatus,
    attendanceStatus,
    onSave
}) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">
                        {t('dataInput.importStudentsTitle') || 'Import Student Data'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 mb-4">
                        {t('dataInput.importStudentsDesc') || 'Select the type of file you want to import:'}
                    </p>

                    <div
                        className={`border rounded-lg p-4 cursor-pointer transition-all group ${studentInfoStatus ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                        onClick={onSelectStudentInfo}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg transition-colors ${studentInfoStatus ? 'bg-indigo-200 text-indigo-600' : 'bg-indigo-100 text-indigo-500 group-hover:bg-indigo-200'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-800 mb-1">
                                    {t('dataInput.importStudentInfo') || 'Student Information'}
                                </h4>
                                <p className="text-sm text-slate-500">
                                    {studentInfoStatus
                                        ? <span>{studentInfoStatus.fileName} <br /><span className="font-medium text-indigo-600">{studentInfoStatus.count} records found</span></span>
                                        : (t('dataInput.importStudentInfoDesc') || 'Import a file containing student IDs (e.g., realData_AllStudents.csv)')
                                    }
                                </p>
                            </div>
                            <div className={`transition-colors ${studentInfoStatus ? 'text-indigo-500' : 'text-slate-400 group-hover:text-indigo-500'}`}>
                                {studentInfoStatus ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                )}
                            </div>
                        </div>
                    </div>

                    <div
                        className={`border rounded-lg p-4 cursor-pointer transition-all group ${attendanceStatus ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'}`}
                        onClick={onSelectAttendance}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg transition-colors ${attendanceStatus ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-800 mb-1">
                                    {t('dataInput.importAttendance') || 'Attendance Data'}
                                </h4>
                                <p className="text-sm text-slate-500">
                                    {attendanceStatus
                                        ? <span>{attendanceStatus.fileName} <br /><span className="font-medium text-emerald-700">{attendanceStatus.count} records found</span></span>
                                        : (t('dataInput.importAttendanceDesc') || 'Import a file containing course-student enrollments (e.g., realData_AllAttendanceLists.csv)')
                                    }
                                </p>
                            </div>
                            <div className={`transition-colors ${attendanceStatus ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'}`}>
                                {attendanceStatus ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors"
                    >
                        {t('common.done') || 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const DataInput: React.FC<DataInputProps> = ({
    courses, setCourses, classrooms, setClassrooms, students, setStudents
}) => {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<Tab>('courses');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const studentInfoFileInputRef = useRef<HTMLInputElement>(null);
    const attendanceFileInputRef = useRef<HTMLInputElement>(null);

    const [editingItem, setEditingItem] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('edit');
    const [isClearMenuOpen, setIsClearMenuOpen] = useState(false);
    const [isStudentImportModalOpen, setIsStudentImportModalOpen] = useState(false);

    const [studentInfoStatus, setStudentInfoStatus] = useState<ImportStatus | null>(null);
    const [attendanceStatus, setAttendanceStatus] = useState<ImportStatus | null>(null);

    const tempStudentMap = useRef<Map<string, string>>(new Map());
    const tempAttendanceMap = useRef<Map<string, Set<string>>>(new Map());

    const handleClearData = async (type: 'all' | 'courses' | 'classrooms' | 'students') => {
        const confirmMessage = type === 'all'
            ? t('dataInput.confirmDeleteAll')
            : t('dataInput.confirmDeleteSection', { section: type });

        if (window.confirm(confirmMessage)) {
            if (type === 'all') {
                await window.api.clearCourses();
                await window.api.clearClassrooms();
                await window.api.clearStudents();
                setCourses([]); setClassrooms([]); setStudents([]);
            } else if (type === 'courses') {
                await window.api.clearCourses();
                setCourses([]);
            } else if (type === 'classrooms') {
                await window.api.clearClassrooms();
                setClassrooms([]);
            } else if (type === 'students') {
                await window.api.clearStudents();
                setStudents([]);
            }
            setIsClearMenuOpen(false);
        }
    };

    const handleImportClick = () => {
        if (activeTab === 'students') {
            setStudentInfoStatus(null);
            setAttendanceStatus(null);
            tempStudentMap.current.clear();
            tempAttendanceMap.current.clear();
            setIsStudentImportModalOpen(true);
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleStudentInfoImport = () => {
        studentInfoFileInputRef.current?.click();
    };

    const handleAttendanceImport = () => {
        attendanceFileInputRef.current?.click();
    };

    const handleEditClick = (item: any) => {
        setEditingItem(item);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setModalMode('add');
        if (activeTab === 'courses') {
            setEditingItem({ id: '', code: '', name: '', enrolledStudents: 0 });
        } else if (activeTab === 'classrooms') {
            setEditingItem({ id: '', name: '', capacity: 0, building: '' });
        } else if (activeTab === 'students') {
            setEditingItem({ id: '', name: '', email: '', enrolledCourses: [] });
        }
        setIsModalOpen(true);
    };

    const handleSaveItem = async (updatedItem: any) => {
        try {
            if (activeTab === 'courses') {
                if (modalMode === 'add') {
                    const newItem = { ...updatedItem, id: updatedItem.code };
                    await window.api.addCourse(newItem);
                    setCourses(prev => [...prev, newItem]);
                } else {
                    setCourses(prev => prev.map(c => c.id === updatedItem.id ? updatedItem : c));
                }
            } else if (activeTab === 'classrooms') {
                if (modalMode === 'add') {
                    const newItem = { ...updatedItem, id: updatedItem.name };
                    await window.api.addClassroomsBulk([newItem]);
                    setClassrooms(prev => [...prev, newItem]);
                } else {
                    setClassrooms(prev => prev.map(c => c.id === updatedItem.id ? updatedItem : c));
                }
            } else if (activeTab === 'students') {
                if (modalMode === 'add') {
                    const newItem = {
                        ...updatedItem,
                        email: updatedItem.email || `${updatedItem.id.toLowerCase()}@uni.edu`,
                        enrolledCourses: []
                    };
                    await window.api.addStudentsBulk([
                        {
                            studentNumber: newItem.id,
                            name: newItem.name,
                            enrolledCourses: []
                        }
                    ]);
                    setStudents(prev => [...prev, newItem]);
                    showNotification(t('dataInput.studentAdded', 'Student added successfully'), 'success');
                } else {
                    setStudents(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s));
                }
            }
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Save error:", error);
            showNotification("Failed to save item", 'error');
        }
    };

    const parseCourseListFile = async (rows: string[]) => {
        const newCourses: Course[] = [];
        rows.forEach((row) => {
            if (row.includes("ALL OF THE COURSES") || !row.trim()) return;
            const code = row.trim();
            newCourses.push({ id: code, code: code, name: `Course ${code}`, enrolledStudents: 0 });
        });
        if (newCourses.length > 0) {
            await window.api.addCoursesBulk(newCourses);
            const saved = await window.api.getCourses();
            setCourses(saved.map((c: any) => ({ id: c.code, code: c.code, name: c.name, enrolledStudents: c.enrolled_students })));
            showNotification(t('dataInput.importedCourses', { count: newCourses.length }), 'success');
        }
    };

    const parseClassroomFile = async (rows: string[]) => {
        const newRooms: Classroom[] = [];
        rows.forEach((row) => {
            if (row.includes("ALL OF THE CLASSROOMS") || !row.trim()) return;
            const parts = row.split(';');
            if (parts.length >= 2) {
                const name = parts[0].trim();
                const capacity = parseInt(parts[1].trim(), 10);
                newRooms.push({ id: name, name: name, capacity: isNaN(capacity) ? 0 : capacity, building: 'Main Hall' });
            }
        });
        if (newRooms.length > 0) {
            await window.api.addClassroomsBulk(newRooms);
            const saved = await window.api.getClassrooms();
            setClassrooms(saved.map((r: any) => ({ id: r.name, name: r.name, capacity: r.capacity, building: r.building })));
            showNotification(t('dataInput.importedClassrooms', { count: newRooms.length }), 'success');
        }
    };

    const extractStudentMap = (rows: string[]): Map<string, string> => {
        const map = new Map<string, string>();
        rows.forEach(row => {
            const cleanRow = row.trim();
            if (!cleanRow || cleanRow.includes("ALL OF THE STUDENTS")) return;
            if (cleanRow.includes(';')) {
                const [id, name] = cleanRow.split(';');
                if (id) map.set(id.trim(), name?.trim() || `Student ${id.trim()}`);
            } else {
                map.set(cleanRow, `Student ${cleanRow}`);
            }
        });
        return map;
    };

    const extractAttendanceMap = (rows: string[]): Map<string, Set<string>> => {
        const map = new Map<string, Set<string>>();
        let currentCourseCode = '';
        rows.forEach(row => {
            const cleanRow = row.trim();
            if (!cleanRow) return;
            if (cleanRow.startsWith('[')) {
                if (!currentCourseCode) return;
                const content = cleanRow.slice(1, -1);
                const studentIds = content.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
                studentIds.forEach(sId => {
                    if (!sId) return;
                    if (!map.has(sId)) map.set(sId, new Set());
                    map.get(sId)?.add(currentCourseCode);
                });
            } else {
                if (cleanRow.length < 50 && !cleanRow.startsWith('[')) currentCourseCode = cleanRow;
            }
        });
        return map;
    };

    const saveMergedData = async () => {
        const allStudentIds = new Set([...tempStudentMap.current.keys(), ...tempAttendanceMap.current.keys()]);
        const newStudents: any[] = [];

        allStudentIds.forEach(id => {
            const name = tempStudentMap.current.get(id) || `Student ${id.split('_')[2] || id}`;
            const courses = tempAttendanceMap.current.get(id) || new Set();
            newStudents.push({
                studentNumber: id,
                name: name,
                enrolledCourses: Array.from(courses)
            });
        });

        if (newStudents.length > 0) {
            await window.api.addStudentsBulk(newStudents);
            const savedStudents = await window.api.getStudents();
            const mappedStudents = savedStudents.map((s: any) => ({
                id: s.student_number,
                name: s.name,
                email: `${s.student_number.toLowerCase()}@uni.edu`,
                enrolledCourses: s.enrolled_courses
            }));
            setStudents(mappedStudents);
            const savedCourses = await window.api.getCourses();
            const mappedCourses = savedCourses.map((c: any) => ({
                id: c.code,
                code: c.code,
                name: c.name,
                enrolledStudents: c.enrolled_students
            }));
            setCourses(mappedCourses);
            showNotification(t('dataInput.importedStudents', { count: newStudents.length }), 'success');
        }
        setIsStudentImportModalOpen(false);
    };

    const parseSimpleStudentList = async (rows: string[]) => {
        const map = extractStudentMap(rows);
        const newStudents: any[] = [];
        map.forEach((name, id) => {
            newStudents.push({
                studentNumber: id,
                name: name,
                enrolledCourses: []
            });
        });

        if (newStudents.length > 0) {
            await window.api.addStudentsBulk(newStudents);
            const saved = await window.api.getStudents();
            setStudents(saved.map((s: any) => ({ id: s.student_number, name: s.name, email: `${s.student_number.toLowerCase()}@uni.edu`, enrolledCourses: s.enrolled_courses })));
            showNotification(t('dataInput.importedStudents', { count: newStudents.length }), 'success');
        } else {
            showNotification(t('dataInput.formatError'), 'error');
        }
    };

    const parseStudentAttendanceFile = async (rows: string[]) => {
        const map = extractAttendanceMap(rows);
        const newStudents: any[] = [];
        map.forEach((courses, id) => {
            newStudents.push({
                studentNumber: id,
                name: `Student ${id.split('_')[2] || id}`,
                enrolledCourses: Array.from(courses)
            });
        });

        if (newStudents.length > 0) {
            await window.api.addStudentsBulk(newStudents);
            const savedS = await window.api.getStudents();
            setStudents(savedS.map((s: any) => ({ id: s.student_number, name: s.name, email: `${s.student_number.toLowerCase()}@uni.edu`, enrolledCourses: s.enrolled_courses })));
            const savedC = await window.api.getCourses();
            setCourses(savedC.map((c: any) => ({ id: c.code, code: c.code, name: c.name, enrolledStudents: c.enrolled_students })));
            showNotification(t('dataInput.processedAttendance', { count: newStudents.length }), 'success');
        } else {
            showNotification(t('dataInput.noStudents'), 'error');
        }
    };

    const processCSV = (text: string) => {
        const rows = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);
        if (rows.length === 0) return;
        if (activeTab === 'classrooms') {
            if (text.includes(';') || rows[0].includes('CLASSROOMS')) parseClassroomFile(rows);
            else showNotification(t('dataInput.formatError'), 'error');
        } else if (activeTab === 'courses') {
            if (rows[0].includes('COURSES IN THE SYSTEM') || rows.some(r => r.startsWith('CourseCode_'))) parseCourseListFile(rows);
            else showNotification(t('dataInput.formatError'), 'error');
        } else if (activeTab === 'students') {
            if (text.includes('[') && text.includes(']')) parseStudentAttendanceFile(rows);
            else if (rows[0].includes('ALL OF THE STUDENTS') || rows.some(r => r.startsWith('Std_ID_'))) parseSimpleStudentList(rows);
            else showNotification(t('dataInput.formatError'), 'error');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try { processCSV(text); } catch (err) { console.error("Failed to parse file", err); showNotification(t('dataInput.parseError'), 'error'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleStudentInfoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            try {
                const rows = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);
                const map = extractStudentMap(rows);
                map.forEach((val, key) => tempStudentMap.current.set(key, val));
                setStudentInfoStatus({ fileName: file.name, count: map.size });
            } catch (err) {
                console.error("Failed to parse student info file", err);
                showNotification(t('dataInput.parseError'), 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleAttendanceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            try {
                const rows = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);
                const map = extractAttendanceMap(rows);
                map.forEach((val, key) => {
                    if (!tempAttendanceMap.current.has(key)) tempAttendanceMap.current.set(key, new Set());
                    val.forEach(c => tempAttendanceMap.current.get(key)?.add(c));
                });
                setAttendanceStatus({ fileName: file.name, count: map.size });
            } catch (err) {
                console.error("Failed to parse attendance file", err);
                showNotification(t('dataInput.parseError'), 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    React.useEffect(() => {
        setSearchQuery('');
        setSortConfig(null);
    }, [activeTab]);

    const toggleSort = (column: string) => {
        setSortConfig(prev => {
            if (prev?.column === column) {
                if (prev.direction === 'asc') return { column, direction: 'desc' };
                return null;
            }
            return { column, direction: 'asc' };
        });
    };

    const SortIcon = ({ column }: { column: string }) => {
        const isActive = sortConfig?.column === column;
        const isAsc = isActive && sortConfig?.direction === 'asc';
        const isDesc = isActive && sortConfig?.direction === 'desc';
        return (
            <span className="ml-1 inline-flex flex-col">
                <svg className={`w-3 h-3 -mb-1 ${isAsc ? 'text-indigo-500' : 'text-slate-300'}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z" /></svg>
                <svg className={`w-3 h-3 ${isDesc ? 'text-indigo-500' : 'text-slate-300'}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
            </span>
        );
    };

    const getFilteredData = () => {
        const query = searchQuery.toLowerCase().trim();
        let filteredCourses = query ? courses.filter(c => c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)) : [...courses];
        let filteredClassrooms = query ? classrooms.filter(r => r.name.toLowerCase().includes(query) || r.building.toLowerCase().includes(query)) : [...classrooms];
        let filteredStudents = query ? students.filter(s => s.id.toLowerCase().includes(query) || s.name.toLowerCase().includes(query) || s.enrolledCourses.some(c => c.toLowerCase().includes(query))) : [...students];

        if (sortConfig) {
            const { column, direction } = sortConfig;
            const multiplier = direction === 'asc' ? 1 : -1;
            if (column === 'enrolledStudents') filteredCourses.sort((a, b) => (a.enrolledStudents - b.enrolledStudents) * multiplier);
            else if (column === 'capacity') filteredClassrooms.sort((a, b) => (a.capacity - b.capacity) * multiplier);
            else if (column === 'studentId') filteredStudents.sort((a, b) => a.id.localeCompare(b.id) * multiplier);
        }
        return { filteredCourses, filteredClassrooms, filteredStudents };
    };

    const renderTable = () => {
        const { filteredCourses, filteredClassrooms, filteredStudents } = getFilteredData();
        const hasSearchQuery = searchQuery.trim().length > 0;

        if (activeTab === 'courses') {
            return (
                <div className="overflow-auto flex-1 w-full">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 bg-slate-50">{t('dataInput.courseCode')}</th>
                                <th className="px-6 py-3 bg-slate-50">{t('dataInput.courseName')}</th>
                                <th className="px-6 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => toggleSort('enrolledStudents')}>
                                    <span className="flex items-center">{t('dataInput.enrolledStudents')} <SortIcon column="enrolledStudents" /></span>
                                </th>
                                <th className="px-6 py-3 bg-slate-50">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.map((c) => (
                                <tr key={c.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{c.code}</td>
                                    <td className="px-6 py-4">{c.name}</td>
                                    <td className="px-6 py-4">{c.enrolledStudents}</td>
                                    <td className="px-6 py-4 text-indigo-600 hover:underline cursor-pointer" onClick={() => handleEditClick(c)}>{t('common.edit')}</td>
                                </tr>
                            ))}
                            {filteredCourses.length === 0 && (<tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">{hasSearchQuery ? t('dataInput.noSearchResults', { query: searchQuery }) : t('dataInput.noCourses')}</td></tr>)}
                        </tbody>
                    </table>
                </div>
            );
        }
        if (activeTab === 'classrooms') {
            return (
                <div className="overflow-auto flex-1 w-full">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 bg-slate-50">{t('dataInput.roomName')}</th>
                                <th className="px-6 py-3 bg-slate-50">{t('dataInput.building')}</th>
                                <th className="px-6 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => toggleSort('capacity')}>
                                    <span className="flex items-center">{t('dataInput.capacity')} <SortIcon column="capacity" /></span>
                                </th>
                                <th className="px-6 py-3 bg-slate-50">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClassrooms.map((r) => (
                                <tr key={r.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{r.name}</td>
                                    <td className="px-6 py-4">{r.building}</td>
                                    <td className="px-6 py-4">{r.capacity}</td>
                                    <td className="px-6 py-4 text-indigo-600 hover:underline cursor-pointer" onClick={() => handleEditClick(r)}>{t('common.edit')}</td>
                                </tr>
                            ))}
                            {filteredClassrooms.length === 0 && (<tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">{hasSearchQuery ? t('dataInput.noSearchResults', { query: searchQuery }) : t('dataInput.noClassrooms')}</td></tr>)}
                        </tbody>
                    </table>
                </div>
            );
        }
        if (activeTab === 'students') {
            const displayStudents = filteredStudents.slice(0, 100);
            return (
                <div className="flex flex-col h-full">
                    <div className="overflow-auto flex-1 w-full">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => toggleSort('studentId')}>
                                        <span className="flex items-center">{t('dataInput.studentId')} <SortIcon column="studentId" /></span>
                                    </th>
                                    <th className="px-6 py-3 bg-slate-50">{t('dataInput.studentNameGenerated')}</th>
                                    <th className="px-6 py-3 bg-slate-50">{t('dataInput.email')}</th>
                                    <th className="px-6 py-3 bg-slate-50">{t('dataInput.enrolledCourses')}</th>
                                    <th className="px-6 py-3 bg-slate-50">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayStudents.map((s) => (
                                    <tr key={s.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{s.id}</td>
                                        <td className="px-6 py-4">{s.name}</td>
                                        <td className="px-6 py-4">{s.email}</td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={s.enrolledCourses.join(', ')}>
                                            {s.enrolledCourses.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {s.enrolledCourses.slice(0, 3).map(c => (
                                                        <span key={c} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs border border-indigo-100">{c}</span>
                                                    ))}
                                                    {s.enrolledCourses.length > 3 && (<span className="text-xs text-slate-400 self-center">+{s.enrolledCourses.length - 3} more</span>)}
                                                </div>
                                            ) : (<span className="text-slate-400 italic">None</span>)}
                                        </td>
                                        <td className="px-6 py-4 text-indigo-600 hover:underline cursor-pointer" onClick={() => handleEditClick(s)}>{t('common.edit')}</td>
                                    </tr>
                                ))}
                                {filteredStudents.length === 0 && (<tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">{hasSearchQuery ? t('dataInput.noSearchResults', { query: searchQuery }) : t('dataInput.noStudents')}</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                    {filteredStudents.length > 100 && (
                        <div className="p-2 bg-slate-50 border-t border-slate-200 text-xs text-center text-slate-500 shrink-0">
                            {t('dataInput.showingStudents', { count: filteredStudents.length })}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative">
            {isModalOpen && editingItem && (
                <EditModal
                    item={editingItem}
                    type={activeTab}
                    mode={modalMode}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveItem}
                />
            )}

            {isStudentImportModalOpen && (
                <StudentImportModal
                    onClose={() => setIsStudentImportModalOpen(false)}
                    onSelectStudentInfo={handleStudentInfoImport}
                    onSelectAttendance={handleAttendanceImport}
                    studentInfoStatus={studentInfoStatus}
                    attendanceStatus={attendanceStatus}
                    onSave={saveMergedData}
                />
            )}

            <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileChange} />
            <input type="file" ref={studentInfoFileInputRef} className="hidden" accept=".csv,.txt" onChange={handleStudentInfoFileChange} />
            <input type="file" ref={attendanceFileInputRef} className="hidden" accept=".csv,.txt" onChange={handleAttendanceFileChange} />

            <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">{t('common.dataManagement')}</h2>
                    <p className="text-sm text-slate-500">{t('dataInput.dataManagementDescription')}</p>
                </div>

                <div className="flex-1 max-w-md mx-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('dataInput.searchPlaceholder', { tab: t(`dataInput.${activeTab}`) })}
                            className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <button onClick={() => setIsClearMenuOpen(!isClearMenuOpen)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            {t('dataInput.clearData')}
                        </button>
                        {isClearMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsClearMenuOpen(false)}></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 animate-fade-in">
                                    <button onClick={() => handleClearData('courses')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{t('dataInput.clearCourses')}</button>
                                    <button onClick={() => handleClearData('classrooms')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{t('dataInput.clearClassrooms')}</button>
                                    <button onClick={() => handleClearData('students')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{t('dataInput.clearStudents')}</button>
                                    <div className="h-px bg-slate-100 my-1"></div>
                                    <button onClick={() => handleClearData('all')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">{t('dataInput.clearAllData')}</button>
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        {t('dataInput.importFile')}
                    </button>
                    <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
                        {t('dataInput.addNew')}
                    </button>
                </div>
            </div>

            <div className="flex border-b border-slate-200 shrink-0">
                {(['courses', 'classrooms', 'students'] as Tab[]).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-medium capitalize focus:outline-none ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>{t(`dataInput.${tab}`)}</button>
                ))}
            </div>

            <div className="flex-1 overflow-hidden relative flex flex-col">
                {renderTable()}
            </div>
        </div>
    );
};
