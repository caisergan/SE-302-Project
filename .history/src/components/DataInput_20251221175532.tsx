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

type Tab = 'courses' | 'classrooms' | 'students'|'enrollments';

interface EditModalProps {
    item: Course | Classroom | Student;
    type: Tab;
    mode: 'add' | 'edit';
    onClose: () => void;
    onSave: (updatedItem: Course | Classroom | Student) => void;
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

    const [editingItem, setEditingItem] = useState<Course | Classroom | Student | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('edit');
    const [isClearMenuOpen, setIsClearMenuOpen] = useState(false);
    const [isStudentImportModalOpen, setIsStudentImportModalOpen] = useState(false);

    // Status state for the modal
    const [studentInfoStatus, setStudentInfoStatus] = useState<ImportStatus | null>(null);
    const [attendanceStatus, setAttendanceStatus] = useState<ImportStatus | null>(null);

    // Buffers for storing data during modal session
    const tempStudentMap = useRef<Map<string, string>>(new Map()); // ID -> Name
    const tempAttendanceMap = useRef<Map<string, Set<string>>>(new Map()); // ID -> Set<CourseCode>

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
   // Helper function to detect the type of the imported file based on its content
    const detectFileType = (text: string): string => {
        const cleanText = text.trim();
        if (cleanText.includes('ALL OF THE COURSES')) return 'courses';
        if (cleanText.includes('ALL OF THE CLASSROOMS')) return 'classrooms';
        if (cleanText.includes('ALL OF THE STUDENTS')) return 'students';
        // Check for the specific Python-like list format: [ 'STD001', ... ]
        if (cleanText.includes('[') && cleanText.includes(']')) return 'enrollments';
        return 'unknown';
    };
    
 const handleAttendanceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // CONSTRAINT: Prevent import if primary data (courses/students) is missing
        const studentsAvailable = students.length > 0 || tempStudentMap.current.size > 0;
        if (courses.length === 0 || !studentsAvailable) {
            showNotification("Dependency Error: Please import Courses and student information first!", 'error');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            
            // VALIDATION: Check if the file content matches the Enrollment format
            const detected = detectFileType(text);
            if (detected !== 'enrollments') {
                showNotification("Format Error: This file is not a valid attendance list file!", 'error');
                return;
            }

            try {
                const rows = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);
                const map = extractAttendanceMap(rows);
                map.forEach((val, key) => {
                    if (!tempAttendanceMap.current.has(key)) tempAttendanceMap.current.set(key, new Set());
                    val.forEach(c => tempAttendanceMap.current.get(key)?.add(c));
                });
                setAttendanceStatus({ fileName: file.name, count: map.size });
            } catch (err) {
                showNotification("Parse Error: Failed to analyze the attendance file.", 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleImportClick = () => {
        if (activeTab === 'students') {
            // Reset status and buffers when opening
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
        // Do not close modal here anymore
        studentInfoFileInputRef.current?.click();
    };

    const handleAttendanceImport = () => {
        // Do not close modal here anymore
        attendanceFileInputRef.current?.click();
    };
    

    const handleEditClick = (item: Course | Classroom | Student) => {
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
            // Refresh from DB to be sure or just update state
            const savedCourses = await window.api.getCourses();
            // Map DB result to frontend type if needed, but they are similar.
            // DB has `enrolled_students`, frontend `enrolledStudents`.
            // We need to map it.
            const mappedCourses = savedCourses.map((c: any) => ({
                id: c.code, // Use code as ID for frontend consistency or c.id? Frontend uses string ID often.
                // The current frontend uses `code` as `id` for courses often.
                // Let's check `Course` type.
                // In `types/index.ts` (not seen but inferred), `id` is likely string or number.
                // In `DataInput.tsx` line 211: `id` is `code`.
                // So let's keep using code as ID for now or map properly.
                code: c.code,
                name: c.name,
                enrolledStudents: c.enrolled_students
            }));

            setCourses(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const uniqueNew = mappedCourses.filter((c: any) => !existingIds.has(c.id));
                return [...prev, ...uniqueNew];
            });
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


    // --- Pure Parsing Logic ---

    const extractStudentMap = (rows: string[]): Map<string, string> => {
        const map = new Map<string, string>();
        rows.forEach(row => {
            const cleanRow = row.trim();
            if (!cleanRow || cleanRow.includes("ALL OF THE STUDENTS")) return;
            // Assuming format: ID;Name
            // The previous logic was: const [student_id, student_name] = row.split(';');
            // But parseSimpleStudentList used just cleanRow as ID and generated name.
            // Let's check parseSimpleStudentList again.
            // It did: studentId = cleanRow; name = Student {studentId}
            // Wait, the original `parseSimpleStudentList` I saw in Step 29/30 had split(';') logic commented out or replaced?
            // In Step 29, line 316: `const studentId = cleanRow;`
            // In Step 18 (summary): `realData_AllStudents.csv` format `student_id;student_name`.
            // The code in Step 29 seemed to simplify it.
            // Let's try to handle both if possible, or stick to what the code was doing.
            // The code at line 424 (viewed in Step 138) was: `const studentId = cleanRow;`
            // And name: `Student ${studentId}`
            // BUT the user says "Student Information" file.
            // Let's look at `realData_AllStudents.csv` content from Step 18 summary: `student_id;student_name`
            // If the code was just taking the whole row as ID, that might be a bug or I misread.
            // Let's try to split by semicolon if present.
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
                // The regex replace might be needed for quoted strings
                const studentIds = content.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
                studentIds.forEach(sId => {
                    if (!sId) return;
                    if (!map.has(sId)) map.set(sId, new Set());
                    map.get(sId)?.add(currentCourseCode);
                });
            } else {
                // Heuristic for course code vs empty line
                if (cleanRow.length < 50 && !cleanRow.startsWith('[')) currentCourseCode = cleanRow;
            }
        });
        return map;
    };

    const saveMergedData = async () => {
        // Merge buffers
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

            // Refresh data
            const savedStudents = await window.api.getStudents();
            const mappedStudents = savedStudents.map((s: any) => ({
                id: s.student_number,
                name: s.name,
                email: `${s.student_number.toLowerCase()}@uni.edu`,
                enrolledCourses: s.enrolled_courses
            }));
            setStudents(mappedStudents);

            // Refresh courses for enrolled counts
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



    // --- Parsing Wrappers for ProcessCSV (Legacy/Direct) ---

    
    const processCSV = (text: string) => {
        const rows = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);
        if (rows.length === 0) return;

        if (activeTab === 'classrooms') {
            parseClassroomFile(rows);
        } else if (activeTab === 'courses') {
            parseCourseListFile(rows);
        } else {
            // This case should ideally not be reached due to handleFileChange's detectFileType and activeTab check,
            // but as a safeguard, we can notify if an unexpected tab is encountered.
            showNotification(t('dataInput.formatError'), 'error');
        }
    };

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const detectedType = detectFileType(text);

            if (detectedType === 'unknown') {
                showNotification(t('dataInput.unrecognizedFileFormat'), 'error');
                e.target.value = '';
                return;
            }

            if (detectedType !== activeTab) {
                showNotification(t('dataInput.tabMismatchError', { detected: detectedType, active: activeTab }), 'error');
                e.target.value = '';
                return;
            }

            try {
                processCSV(text);
                showNotification(t('dataInput.fileProcessed', { type: activeTab }), 'success');
            } catch (err) {
                console.error("Error processing CSV:", err);
                showNotification(t('dataInput.importError'), 'error');
            }
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
                // Buffer Mode
                const map = extractStudentMap(rows);
                map.forEach((val, key) => tempStudentMap.current.set(key, val));
                const count = map.size; // Showing map.size is count from this file
                setStudentInfoStatus({ fileName: file.name, count });
            } catch (err) {
                console.error("Failed to parse student info file", err);
                showNotification(t('dataInput.parseError'), 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

   

    // Clear search and sort when switching tabs
    React.useEffect(() => {
        setSearchQuery('');
        setSortConfig(null);
    }, [activeTab]);

    // Toggle sort for a column
    const toggleSort = (column: string) => {
        setSortConfig(prev => {
            if (prev?.column === column) {
                // Toggle direction or clear if already desc
                if (prev.direction === 'asc') {
                    return { column, direction: 'desc' };
                }
                return null; // Clear sort
            }
            return { column, direction: 'asc' };
        });
    };

    // Sort icon component
    const SortIcon = ({ column }: { column: string }) => {
        const isActive = sortConfig?.column === column;
        const isAsc = isActive && sortConfig?.direction === 'asc';
        const isDesc = isActive && sortConfig?.direction === 'desc';

        return (
            <span className="ml-1 inline-flex flex-col">
                <svg
                    className={`w-3 h-3 -mb-1 ${isAsc ? 'text-indigo-600' : 'text-slate-300'}`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M7 14l5-5 5 5z" />
                </svg>
                <svg
                    className={`w-3 h-3 ${isDesc ? 'text-indigo-600' : 'text-slate-300'}`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M7 10l5 5 5-5z" />
                </svg>
            </span>
        );
    };

    // Get filtered and sorted data
    const getFilteredData = () => {
        const query = searchQuery.toLowerCase().trim();

        // Filter
        let filteredCourses = query
            ? courses.filter(c =>
                c.code.toLowerCase().includes(query) ||
                c.name.toLowerCase().includes(query)
            )
            : [...courses];

        let filteredClassrooms = query
            ? classrooms.filter(r =>
                r.name.toLowerCase().includes(query) ||
                r.building.toLowerCase().includes(query)
            )
            : [...classrooms];

        let filteredStudents = query
            ? students.filter(s =>
                s.id.toLowerCase().includes(query) ||
                s.name.toLowerCase().includes(query) ||
                s.enrolledCourses.some(c => c.toLowerCase().includes(query))
            )
            : [...students];

        // Sort
        if (sortConfig) {
            const { column, direction } = sortConfig;
            const multiplier = direction === 'asc' ? 1 : -1;

            if (column === 'enrolledStudents') {
                filteredCourses.sort((a, b) => (a.enrolledStudents - b.enrolledStudents) * multiplier);
            } else if (column === 'capacity') {
                filteredClassrooms.sort((a, b) => (a.capacity - b.capacity) * multiplier);
            } else if (column === 'studentId') {
                filteredStudents.sort((a, b) => a.id.localeCompare(b.id) * multiplier);
            }
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

                                <th
                                    className="px-6 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                    onClick={() => toggleSort('enrolledStudents')}
                                >
                                    <span className="flex items-center">
                                        {t('dataInput.enrolledStudents')}
                                        <SortIcon column="enrolledStudents" />
                                    </span>
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
                            {filteredCourses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        {hasSearchQuery ? t('dataInput.noSearchResults', { query: searchQuery }) : t('dataInput.noCourses')}
                                    </td>
                                </tr>
                            )}
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
                                <th
                                    className="px-6 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                    onClick={() => toggleSort('capacity')}
                                >
                                    <span className="flex items-center">
                                        {t('dataInput.capacity')}
                                        <SortIcon column="capacity" />
                                    </span>
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
                                    <td className="px-6 py-4 text-indigo-600 hover:underline cursor-pointer"
                                        onClick={() => handleEditClick(r)}

                                    >
                                        {t('common.edit')}
                                    </td>
                                </tr>
                            ))}
                            {filteredClassrooms.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        {hasSearchQuery ? t('dataInput.noSearchResults', { query: searchQuery }) : t('dataInput.noClassrooms')}
                                    </td>
                                </tr>
                            )}
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
                                    <th
                                        className="px-6 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                        onClick={() => toggleSort('studentId')}
                                    >
                                        <span className="flex items-center">
                                            {t('dataInput.studentId')}
                                            <SortIcon column="studentId" />
                                        </span>
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
                                {filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                            {hasSearchQuery ? t('dataInput.noSearchResults', { query: searchQuery }) : t('dataInput.noStudents')}
                                        </td>
                                    </tr>
                                )}
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

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.txt"
                onChange={handleFileChange}
            />

            <input
                type="file"
                ref={studentInfoFileInputRef}
                className="hidden"
                accept=".csv,.txt"
                onChange={handleStudentInfoFileChange}
            />

            <input
                type="file"
                ref={attendanceFileInputRef}
                className="hidden"
                accept=".csv,.txt"
                onChange={handleAttendanceFileChange}
            />

            <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">{t('common.dataManagement')}</h2>
                    <p className="text-sm text-slate-500">{t('dataInput.dataManagementDescription')}</p>
                </div>

                {/* Search Input */}
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
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
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
