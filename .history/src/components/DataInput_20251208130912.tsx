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
    item: Course | Classroom;
    type: 'courses' | 'classrooms';
    mode: 'add' | 'edit';
    onClose: () => void;
    onSave: (updatedItem: any) => void;
}

const EditModal: React.FC<EditModalProps> = ({ item, type, mode, onClose, onSave }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<any>({ ...item });

    const isCourse = type === 'courses';

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
        if (!isCourse && (typeof finalData.capacity !== 'number' || isNaN(finalData.capacity))) {
            finalData.capacity = 0;
        }
        onSave(finalData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">
                        {mode === 'add' ? t('dataInput.addNew') : t('common.edit')} {isCourse ? t('dataInput.courses') : t('dataInput.classrooms')}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {isCourse ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.courseCode')}</label>
                                <input type="text" name="code" value={formData.code} onChange={handleChange} className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.courseName')}</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.enrolledStudents')}</label>
                                <input
                                    type="text"
                                    name="enrolledStudents"
                                    value={formData.enrolledStudents}
                                    readOnly
                                    className="w-full rounded-lg border-slate-200 border px-3 py-2 bg-slate-100 text-slate-500 focus:outline-none cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-400 mt-1">{t('dataInput.calculatedAutomatically')}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.roomName')}</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.building')}</label>
                                <input type="text" name="building" value={formData.building} onChange={handleChange} className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dataInput.capacity')}</label>
                                <input
                                    type="text"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                        </>
                    )}

                    <div className="pt-4 flex gap-3 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm">{mode === 'add' ? t('common.save') : t('common.save')}</button>
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editingItem, setEditingItem] = useState<Course | Classroom | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('edit');
    const [isClearMenuOpen, setIsClearMenuOpen] = useState(false);

    const handleClearData = async (type: 'all' | 'courses' | 'classrooms' | 'students') => {
        const confirmMessage = type === 'all'
            ? t('dataInput.confirmDeleteAll')
            : t('dataInput.confirmDeleteSection', { section: type });

        if (window.confirm(confirmMessage)) {
            if (type === 'all') {
                await window.api.clearCourses();
                await window.api.clearClassrooms();
                await window.api.clearStudents();
                setCourses([]);
                setClassrooms([]);
                setStudents([]);
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
        fileInputRef.current?.click();
    };

    const handleEditClick = (item: Course | Classroom) => {
        setEditingItem(item);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        if (activeTab === 'students') return;

        setModalMode('add');
        if (activeTab === 'courses') {
            setEditingItem({ id: '', code: '', name: '', enrolledStudents: 0 });
        } else if (activeTab === 'classrooms') {
            setEditingItem({ id: '', name: '', capacity: 0, building: '' });
        }
        setIsModalOpen(true);
    };

    const handleSaveItem = async (updatedItem: any) => {
        if (activeTab === 'courses') {
            if (modalMode === 'add') {
                const newItem = { ...updatedItem, id: updatedItem.code };
                // For single add, we might want a single add API, but for now let's use bulk or just update local state?
                // The user asked to fix "Imported data", but manual add should probably also persist.
                // The current plan focused on Import. Let's stick to fixing Import first, but ideally we should fix manual add too.
                // However, the current `addCourse` in preload only takes `course`.
                // Let's assume for now we just update state for manual add, or better, call the API if available.
                // `window.api.addCourse` exists.
                await window.api.addCourse(newItem);
                setCourses(prev => [...prev, newItem]);
            } else {
                // Update not implemented in backend yet for single item update.
                // Just update local state for now.
                setCourses(prev => prev.map(c => c.id === updatedItem.id ? updatedItem : c));
            }
        } else if (activeTab === 'classrooms') {
            if (modalMode === 'add') {
                const newItem = { ...updatedItem, id: updatedItem.name };
                // No single add API for classrooms yet in my plan, but I can use bulk with 1 item.
                await window.api.addClassroomsBulk([newItem]);
                setClassrooms(prev => [...prev, newItem]);
            } else {
                setClassrooms(prev => prev.map(c => c.id === updatedItem.id ? updatedItem : c));
            }
        }
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const parseCourseListFile = async (rows: string[]) => {
        const newCourses: Course[] = [];

        rows.forEach((row) => {
            if (row.includes("ALL OF THE COURSES") || !row.trim()) return;

            const code = row.trim();
            newCourses.push({
                id: code,
                code: code,
                name: `Course ${code}`,
                enrolledStudents: 0,

            });
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
                // In `DataInput.tsx` line 211: `id: code`.
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

                newRooms.push({
                    id: name,
                    name: name,
                    capacity: isNaN(capacity) ? 0 : capacity,

                    building: 'Main Hall'
                });
            }
        });

        if (newRooms.length > 0) {
            await window.api.addClassroomsBulk(newRooms);
            const savedRooms = await window.api.getClassrooms();
            const mappedRooms = savedRooms.map((r: any) => ({
                id: r.name,
                name: r.name,
                capacity: r.capacity,
                building: r.building
            }));

            setClassrooms(prev => {
                const existingIds = new Set(prev.map(r => r.id));
                const uniqueNew = mappedRooms.filter((r: any) => !existingIds.has(r.id));
                return [...prev, ...uniqueNew];
            });
            showNotification(t('dataInput.importedClassrooms', { count: newRooms.length }), 'success');
        }
    };

    const parseStudentAttendanceFile = async (rows: string[]) => {
        const studentMap = new Map<string, Set<string>>();
        let currentCourseCode = '';

        rows.forEach(row => {
            const cleanRow = row.trim();
            if (!cleanRow) return;

            if (cleanRow.startsWith('[')) {
                if (!currentCourseCode) return;

                const content = cleanRow.slice(1, -1);
                const studentIds = content.split(',').map(s => {
                    return s.trim().replace(/^['"]|['"]$/g, '');
                });

                studentIds.forEach(sId => {
                    if (!sId) return;
                    if (!studentMap.has(sId)) {
                        studentMap.set(sId, new Set());
                    }
                    studentMap.get(sId)?.add(currentCourseCode);
                });

            } else {
                if (cleanRow.length < 50) {
                    currentCourseCode = cleanRow;
                }
            }
        });

        const newStudents: any[] = [];
        studentMap.forEach((coursesSet, studentId) => {
            newStudents.push({
                studentNumber: studentId,
                name: `Student ${studentId.split('_')[2] || studentId}`,
                enrolledCourses: Array.from(coursesSet)
            });
        });

        if (newStudents.length > 0) {
            await window.api.addStudentsBulk(newStudents);

            // Fetch updated students
            const savedStudents = await window.api.getStudents();
            const mappedStudents = savedStudents.map((s: any) => ({
                id: s.student_number,
                name: s.name,
                email: `${s.student_number.toLowerCase()}@uni.edu`,
                enrolledCourses: s.enrolled_courses
            }));

            setStudents(mappedStudents);

            // Also refresh courses to update enrolled counts
            const savedCourses = await window.api.getCourses();
            const mappedCourses = savedCourses.map((c: any) => ({
                id: c.code,
                code: c.code,
                name: c.name,
                enrolledStudents: c.enrolled_students
            }));
            setCourses(mappedCourses);

            showNotification(t('dataInput.processedAttendance', { count: newStudents.length }), 'success');
        } else {
            showNotification(t('dataInput.noStudents'), 'error');
        }
    };

    const processCSV = (text: string) => {
        const rows = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);
        if (rows.length === 0) return;

        if (activeTab === 'classrooms') {
            if (text.includes(';') || rows[0].includes('CLASSROOMS')) {
                parseClassroomFile(rows);
            } else {
                showNotification(t('dataInput.formatError'), 'error');
            }
        } else if (activeTab === 'courses') {
            if (rows[0].includes('COURSES IN THE SYSTEM') || rows.some(r => r.startsWith('CourseCode_'))) {
                parseCourseListFile(rows);
            } else {
                showNotification(t('dataInput.formatError'), 'error');
            }
        } else if (activeTab === 'students') {
            if (text.includes('[') && text.includes(']')) {
                parseStudentAttendanceFile(rows);
            } else {
                showNotification(t('dataInput.formatError'), 'error');
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                processCSV(text);
            } catch (err) {
                console.error("Failed to parse file", err);
                showNotification(t('dataInput.parseError'), 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const renderTable = () => {
        if (activeTab === 'courses') {
            return (
                <div className="overflow-auto flex-1 w-full">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 bg-slate-50">{t('dataInput.courseCode')}</th>
                                <th className="px-6 py-3 bg-slate-50">{t('dataInput.courseName')}</th>

                                <th className="px-6 py-3 bg-slate-50">{t('dataInput.enrolledStudents')}</th>
                                <th className="px-6 py-3 bg-slate-50">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((c) => (
                                <tr key={c.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{c.code}</td>
                                    <td className="px-6 py-4">{c.name}</td>

                                    <td className="px-6 py-4">{c.enrolledStudents}</td>
                                    <td
                                        className="px-6 py-4 text-indigo-600 hover:underline cursor-pointer"
                                        onClick={() => handleEditClick(c)}
                                    >
                                        {t('common.edit')}
                                    </td>
                                </tr>
                            ))}
                            {courses.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">{t('dataInput.noCourses')}</td></tr>
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
                                <th className="px-6 py-3 bg-slate-50">{t('dataInput.capacity')}</th>

                                <th className="px-6 py-3 bg-slate-50">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classrooms.map((r) => (
                                <tr key={r.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{r.name}</td>
                                    <td className="px-6 py-4">{r.building}</td>
                                    <td className="px-6 py-4">{r.capacity}</td>

                                    <td
                                        className="px-6 py-4 text-indigo-600 hover:underline cursor-pointer"
                                        onClick={() => handleEditClick(r)}
                                    >
                                        {t('common.edit')}
                                    </td>
                                </tr>
                            ))}
                            {classrooms.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">{t('dataInput.noClassrooms')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            );
        }
        if (activeTab === 'students') {
            const displayStudents = students.slice(0, 100);
            return (
                <div className="flex flex-col h-full">
                    <div className="overflow-auto flex-1 w-full">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 bg-slate-50">{t('dataInput.studentId')}</th>
                                    <th className="px-6 py-3 bg-slate-50">{t('dataInput.studentNameGenerated')}</th>
                                    <th className="px-6 py-3 bg-slate-50">{t('dataInput.email')}</th>
                                    <th className="px-6 py-3 bg-slate-50">{t('dataInput.enrolledCourses')}</th>
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
                                                        <span key={c} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs border border-indigo-100">
                                                            {c}
                                                        </span>
                                                    ))}
                                                    {s.enrolledCourses.length > 3 && (
                                                        <span className="text-xs text-slate-400 self-center">+{s.enrolledCourses.length - 3} more</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">None</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">{t('dataInput.noStudents')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {students.length > 100 && (
                        <div className="p-2 bg-slate-50 border-t border-slate-200 text-xs text-center text-slate-500 shrink-0">
                            {t('dataInput.showingStudents', { count: students.length })}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative">
            {isModalOpen && editingItem && (activeTab === 'courses' || activeTab === 'classrooms') && (
                <EditModal
                    item={editingItem}
                    type={activeTab as 'courses' | 'classrooms'}
                    mode={modalMode}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveItem}
                />
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.txt"
                onChange={handleFileChange}
            />

            <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">{t('common.dataManagement')}</h2>
                    <p className="text-sm text-slate-500">{t('dataInput.dataManagementDescription')}</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setIsClearMenuOpen(!isClearMenuOpen)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
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
                    <button
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        {t('dataInput.importFile')}
                    </button>
                    <button
                        onClick={handleAddClick}
                        disabled={activeTab === 'students'}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${activeTab === 'students'
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
                        {t('dataInput.addNew')}
                    </button>
                </div>
            </div>

            <div className="flex border-b border-slate-200 shrink-0">
                {(['courses', 'classrooms', 'students'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium capitalize focus:outline-none ${activeTab === tab
                            ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {t(`dataInput.${tab}`)}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-hidden relative flex flex-col">
                {renderTable()}
            </div>
        </div >
    );
};
