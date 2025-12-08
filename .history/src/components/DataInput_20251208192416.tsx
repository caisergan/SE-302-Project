import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import { Course, Classroom, Student } from '../types';
import Papa from 'papaparse';

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
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl p-6 w-96 shadow-2xl transform transition-all scale-100">
                <h3 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">
                    {mode === 'add' ? t('common.add') : t('common.edit')} {t(`dataInput.${type}`)}
                </h3>
                <div className="space-y-4">
                    {type === 'courses' && (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Code</label>
                                <input name="code" value={formData.code || ''} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Name</label>
                                <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </>
                    )}
                    {type === 'classrooms' && (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Name</label>
                                <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Capacity</label>
                                <input type="number" name="capacity" value={formData.capacity || ''} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Building</label>
                                <input name="building" value={formData.building || ''} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </>
                    )}
                    {type === 'students' && (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Student #</label>
                                <input name="studentNumber" disabled={mode === 'edit'} value={formData.studentNumber || formData.id || ''} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded-lg bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Name</label>
                                <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </>
                    )}
                </div>
                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">{t('common.cancel')}</button>
                    <button onClick={() => onSave(formData)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-transform active:scale-95 font-medium">{t('common.save')}</button>
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
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentItem, setCurrentItem] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- CRUD OPERATIONS (FIXED REFRESH DATA) ---

    const refreshData = async () => {
        try {
            if (activeTab === 'courses') {
                const rawCourses = await window.api.getCourses();
                // Map Backend (snake_case) -> Frontend (camelCase)
                setCourses(rawCourses.map((c: any) => ({
                    id: c.id.toString(),
                    code: c.code,
                    name: c.name,
                    enrolledStudents: c.enrolled_students // DB'den gelen enrolled_students
                })));
            } 
            else if (activeTab === 'classrooms') {
                const rawClassrooms = await window.api.getClassrooms();
                setClassrooms(rawClassrooms.map((r: any) => ({
                    id: r.id.toString(),
                    name: r.name,
                    capacity: r.capacity,
                    building: r.building
                })));
            } 
            else if (activeTab === 'students') {
                const rawStudents = await window.api.getStudents();
                // Map Backend -> Frontend
                setStudents(rawStudents.map((s: any) => ({
                    id: s.id.toString(),
                    studentNumber: s.student_number, // DB: student_number -> UI: studentNumber
                    name: s.name,
                    email: `${s.student_number}@uni.edu`,
                    enrolledCourses: s.enrolled_courses || [] // undefined kontrolü
                })));
            }
        } catch (error) {
            console.error("Refresh Data Error:", error);
            showNotification("Failed to refresh data", "error");
        }
    };

    const handleSaveItem = async (formData: any) => {
        try {
            if (activeTab === 'courses') {
                if (modalMode === 'add') await window.api.addCourse({ ...formData, enrolledStudents: 0 });
                else await window.api.updateCourse(formData);
            } else if (activeTab === 'classrooms') {
                if (modalMode === 'add') await window.api.addClassroomsBulk([formData]); 
                else await window.api.updateClassroom(formData);
            } else if (activeTab === 'students') {
                if (modalMode === 'edit') await window.api.updateStudent(formData);
                else showNotification("Please import students via CSV", "error"); 
            }
            
            await refreshData();
            setIsModalOpen(false);
            showNotification(t('dataInput.addSuccess', 'Operation successful'), 'success');
        } catch (error) {
            console.error(error);
            showNotification(t('dataInput.error', 'Operation failed'), 'error');
        }
    };

    const handleDelete = async (id: number | string) => {
        if (!confirm(t('common.confirmDelete', 'Are you sure you want to delete this item?'))) return;
        try {
            const numId = Number(id); // Ensure ID is number for backend
            if (activeTab === 'courses') await window.api.deleteCourse(numId);
            else if (activeTab === 'classrooms') await window.api.deleteClassroom(numId);
            else if (activeTab === 'students') await window.api.deleteStudent(numId);

            await refreshData();
            showNotification('Item deleted successfully', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Failed to delete item', 'error');
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const data = results.data;
                    
                    if (activeTab === 'courses') {
                        // 1. Dersleri Yükle
                        const formatted = data.map((row: any) => ({
                            code: row.code?.trim(),
                            name: row.name?.trim(),
                            enrolledStudents: 0 // Başlangıçta 0, öğrenciler yüklenince artacak
                        })).filter((c: any) => c.code && c.name); // Boş satırları filtrele

                        await window.api.addCoursesBulk(formatted);
                        showNotification(t('dataInput.importSuccess', 'Courses imported'), 'success');
                    } 
                    else if (activeTab === 'classrooms') {
                        // 2. Sınıfları Yükle
                        const formatted = data.map((row: any) => ({
                            name: row.name?.trim(),
                            capacity: parseInt(row.capacity || '0'),
                            building: row.building?.trim()
                        })).filter((r: any) => r.name);

                        await window.api.addClassroomsBulk(formatted);
                        showNotification(t('dataInput.importSuccess', 'Classrooms imported'), 'success');
                    } 
                    else if (activeTab === 'students') {
                        // 3. Öğrencileri Yükle (VE ENROLLMENT YAP)
                        const formatted = data.map((row: any) => {
                            // KRİTİK DÜZELTME:
                            // Hem noktalı virgül (;) hem de virgül (,) ile ayırmayı destekle.
                            // Ayrıca boşlukları temizle.
                            let courses: string[] = [];
                            
                            if (row.enrolledCourses) {
                                // Regex: [;,]+ demek virgül veya noktalı virgül gördüğün yerden böl demektir.
                                courses = row.enrolledCourses
                                    .split(/[;,]+/) 
                                    .map((c: string) => c.trim()) // " CS101 " -> "CS101"
                                    .filter((c: string) => c.length > 0); // Boşları at
                            }

                            return {
                                studentNumber: row.studentNumber?.trim(),
                                name: row.name?.trim(),
                                enrolledCourses: courses
                            };
                        }).filter((s: any) => s.studentNumber && s.name);

                        console.log("Backend'e gönderilen öğrenci verisi:", formatted); // Debug için

                        await window.api.addStudentsBulk(formatted);
                        showNotification(t('dataInput.importSuccess', 'Students imported & enrolled'), 'success');
                    }
                    
                    // İşlem bitince tabloyu yenile
                    await refreshData();
                    
                } catch (error) {
                    console.error("CSV Import Hatası:", error);
                    showNotification(t('dataInput.importError', 'Error importing file'), 'error');
                }
                
                // Input'u sıfırla ki aynı dosyayı tekrar seçebilelim
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    const handleClearData = async () => {
        if (!confirm(t('common.confirmClear', 'Are you sure?'))) return;
        if (activeTab === 'courses') await window.api.clearCourses();
        else if (activeTab === 'classrooms') await window.api.clearClassrooms();
        else if (activeTab === 'students') await window.api.clearStudents();
        await refreshData();
        showNotification('Data cleared', 'success');
    };

    const openEdit = (item: any) => {
        setCurrentItem(item);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{t('common.dataManagement')}</h2>
                    <p className="text-sm text-slate-500">{t('dataInput.subtitle', 'Manage your resources')}</p>
                </div>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        {t('common.importCSV', 'Import')}
                    </button>
                    <button onClick={handleClearData} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        {t('common.clear', 'Clear')}
                    </button>
                    <button onClick={() => { setModalMode('add'); setCurrentItem({}); setIsModalOpen(true); }} 
                        disabled={activeTab === 'students'}
                        className={`flex items-center gap-2 px-3 py-2 text-white rounded-lg font-medium shadow-sm ${activeTab === 'students' ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        {t('dataInput.addNew')}
                    </button>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200">
                    {(['courses', 'classrooms', 'students'] as Tab[]).map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}>
                            {t(`dataInput.${tab}`)}
                        </button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                {activeTab === 'courses' && <><th className="px-6 py-3">Code</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Enrolled</th></>}
                                {activeTab === 'classrooms' && <><th className="px-6 py-3">Name</th><th className="px-6 py-3">Capacity</th><th className="px-6 py-3">Building</th></>}
                                {activeTab === 'students' && <><th className="px-6 py-3">Student #</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Courses</th></>}
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activeTab === 'courses' && courses.map((course) => (
                                <tr key={course.id} className="hover:bg-slate-50/50 group">
                                    <td className="px-6 py-3 font-medium text-slate-900">{course.code}</td>
                                    <td className="px-6 py-3 text-slate-600">{course.name}</td>
                                    <td className="px-6 py-3 text-slate-600">{course.enrolledStudents}</td>
                                    <td className="px-6 py-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(course)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                                        <button onClick={() => handleDelete(course.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                                    </td>
                                </tr>
                            ))}
                            {activeTab === 'classrooms' && classrooms.map((room) => (
                                <tr key={room.id} className="hover:bg-slate-50/50 group">
                                    <td className="px-6 py-3 font-medium text-slate-900">{room.name}</td>
                                    <td className="px-6 py-3 text-slate-600">{room.capacity}</td>
                                    <td className="px-6 py-3 text-slate-600">{room.building}</td>
                                    <td className="px-6 py-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(room)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                                        <button onClick={() => handleDelete(room.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                                    </td>
                                </tr>
                            ))}
                            {activeTab === 'students' && students.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50/50 group">
                                    <td className="px-6 py-3 font-mono text-slate-600">{student.studentNumber}</td>
                                    <td className="px-6 py-3 font-medium text-slate-900">{student.name}</td>
                                    <td className="px-6 py-3 text-slate-600">{student.enrolledCourses.length}</td>
                                    <td className="px-6 py-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(student)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                                        <button onClick={() => handleDelete(student.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <EditModal item={currentItem} type={activeTab} mode={modalMode} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} />}
        </div>
    );
};