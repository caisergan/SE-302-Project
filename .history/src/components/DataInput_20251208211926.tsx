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

// ... EditModal bileşeni aynı kalabilir (koddan tasarruf için buraya yazmıyorum, eski kodundaki EditModal'ı koru) ...
// Eğer EditModal'ı sildiysen önceki mesajımdan kopyalayabilirsin. Aşağısı ana bileşen:

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
            <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">
                    {mode === 'add' ? t('common.add') : t('common.edit')} {type}
                </h3>
                <div className="space-y-4">
                    {Object.keys(formData).map(key => {
                        if (key === 'id' || key === 'enrolledCourses' || key === 'enrolledStudents') return null;
                        return (
                            <div key={key}>
                                <label className="text-xs font-semibold text-slate-500 uppercase">{key}</label>
                                <input 
                                    name={key} 
                                    value={formData[key]} 
                                    onChange={handleChange} 
                                    className="w-full border border-slate-300 p-2 rounded-lg" 
                                />
                            </div>
                        )
                    })}
                </div>
                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">{t('common.cancel')}</button>
                    <button onClick={() => onSave(formData)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{t('common.save')}</button>
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

    const refreshData = async () => {
        try {
            if (activeTab === 'courses') {
                const raw = await window.api.getCourses();
                setCourses(raw.map((c: any) => ({ ...c, id: c.id.toString(), enrolledStudents: c.enrolled_students })));
            } else if (activeTab === 'classrooms') {
                const raw = await window.api.getClassrooms();
                setClassrooms(raw.map((r: any) => ({ ...r, id: r.id.toString() })));
            } else if (activeTab === 'students') {
                const raw = await window.api.getStudents();
                setStudents(raw.map((s: any) => ({
                    id: s.id.toString(),
                    studentNumber: s.student_number,
                    name: s.name,
                    email: s.email,
                    enrolledCourses: s.enrolled_courses || []
                })));
            }
        } catch (e) { console.error(e); }
    };

    const handleSaveItem = async (formData: any) => {
        // ... (Eski koddaki save mantığı aynı kalacak) ...
        // Kısa tutmak için burayı atlıyorum, önceki kodunuzdaki CRUD mantığını kullanın.
        setIsModalOpen(false);
        await refreshData();
    };

    const handleDelete = async (id: number | string) => {
        // ... (Eski koddaki delete mantığı aynı kalacak) ...
        await refreshData();
    };

    // --- ÖZEL DOSYA OKUYUCU (Custom Parsers) ---
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            try {
                // 1. DERSLER (Courses) - Sample Data Formatı
                if (activeTab === 'courses') {
                    // "ALL OF THE COURSES..." satırını atla ve satır satır oku
                    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith('ALL OF'));
                    
                    const formatted = lines.map(line => ({
                        code: line.trim(),
                        name: line.trim(), // İsim verilmediği için kodu isim yapıyoruz
                        enrolledStudents: 0
                    }));

                    await window.api.addCoursesBulk(formatted);
                    showNotification("Courses Imported Successfully", "success");
                }

                // 2. SINIFLAR (Classrooms) - Sample Data Formatı (; ile ayrılmış)
                else if (activeTab === 'classrooms') {
                    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith('ALL OF'));
                    
                    const formatted = lines.map(line => {
                        const [name, cap] = line.split(';');
                        return {
                            name: name?.trim(),
                            capacity: parseInt(cap?.trim() || '0'),
                            building: 'Main Building' // Dosyada bina yok, varsayılan atadık
                        };
                    }).filter(r => r.name);

                    await window.api.addClassroomsBulk(formatted);
                    showNotification("Classrooms Imported Successfully", "success");
                }

                // 3. ÖĞRENCİLER (Students) - Sadece ID Listesi
                else if (activeTab === 'students') {
                    
                    // DURUM A: Attendance Listesi mi Yüklendi? (CourseCode_01 ... ['Std_...'])
                    if (text.includes("CourseCode_") && text.includes("[")) {
                        console.log("Attendance Listesi Tespit Edildi...");
                        
                        // Dosyayı bloklara böl (Boş satırlarla ayrılmış)
                        const blocks = text.split(/\r?\n\r?\n/);
                        const enrollments: { studentNumber: string, courseCode: string }[] = [];

                        blocks.forEach(block => {
                            const lines = block.trim().split(/\r?\n/);
                            if (lines.length >= 2) {
                                const courseCode = lines[0].trim(); // İlk satır ders kodu
                                // İkinci satır Python listesi gibi: ['Std_1', 'Std_2']
                                // Regex ile temizle: [' ve '] ve ' karakterlerini sil
                                const studentString = lines.slice(1).join("").replace(/[\[\]']/g, ""); 
                                const studentIDs = studentString.split(",").map(s => s.trim()).filter(s => s);

                                studentIDs.forEach(stdId => {
                                    enrollments.push({ studentNumber: stdId, courseCode: courseCode });
                                });
                            }
                        });

                        console.log(`${enrollments.length} adet kayıt bulundu.`);
                        // Yeni backend fonksiyonunu çağır
                        if (window.api.addEnrollmentsBulk) {
                            await window.api.addEnrollmentsBulk(enrollments);
                            showNotification(`Attendance Imported: ${enrollments.length} records`, "success");
                        } else {
                            alert("Preload updated değil! addEnrollmentsBulk bulunamadı.");
                        }
                    } 
                    // DURUM B: Normal Öğrenci Listesi (Std_ID_001...)
                    else {
                        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith('ALL OF'));
                        
                        const formatted = lines.map(line => ({
                            studentNumber: line.trim(),
                            name: `Student ${line.trim().split('_').pop()}`, // İsim yok, ID'den uyduruyoruz
                            email: `${line.trim().toLowerCase()}@uni.edu`,
                            enrolledCourses: []
                        }));

                        await window.api.addStudentsBulk(formatted);
                        showNotification("Students List Imported", "success");
                    }
                }

                await refreshData();

            } catch (error) {
                console.error("Import Error:", error);
                showNotification("Import Failed: " + error, "error");
            }
            
            if (fileInputRef.current) fileInputRef.current.value = '';
        };

        reader.readAsText(file);
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
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Import File
                    </button>

                    <button onClick={handleClearData} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        {t('common.clear', 'Clear')}
                    </button>
                    
                    <button onClick={() => { setModalMode('add'); setCurrentItem({}); setIsModalOpen(true); }} 
                        className={`flex items-center gap-2 px-3 py-2 text-white rounded-lg font-medium shadow-sm bg-indigo-600 hover:bg-indigo-700`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        {t('dataInput.addNew')}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200">
                    {(['courses', 'classrooms', 'students'] as Tab[]).map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}>
                            {t(`dataInput.${tab}`)}
                        </button>
                    ))}
                </div>
                
                {/* TABLE VIEW */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                {activeTab === 'courses' && <><th className="px-6 py-3">Code</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Enrolled</th></>}
                                {activeTab === 'classrooms' && <><th className="px-6 py-3">Name</th><th className="px-6 py-3">Capacity</th><th className="px-6 py-3">Building</th></>}
                                {activeTab === 'students' && <><th className="px-6 py-3">ID</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Courses</th></>}
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* COURSES */}
                            {activeTab === 'courses' && courses.map((course) => (
                                <tr key={course.id} className="hover:bg-slate-50/50 group">
                                    <td className="px-6 py-3 font-medium text-slate-900">{course.code}</td>
                                    <td className="px-6 py-3 text-slate-600">{course.name}</td>
                                    <td className="px-6 py-3 text-slate-600">{course.enrolledStudents}</td>
                                    <td className="px-6 py-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDelete(course.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {/* CLASSROOMS */}
                            {activeTab === 'classrooms' && classrooms.map((room) => (
                                <tr key={room.id} className="hover:bg-slate-50/50 group">
                                    <td className="px-6 py-3 font-medium text-slate-900">{room.name}</td>
                                    <td className="px-6 py-3 text-slate-600">{room.capacity}</td>
                                    <td className="px-6 py-3 text-slate-600">{room.building}</td>
                                    <td className="px-6 py-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDelete(room.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {/* STUDENTS */}
                            {activeTab === 'students' && students.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50/50 group">
                                    <td className="px-6 py-3 font-mono text-slate-600">{student.studentNumber}</td>
                                    <td className="px-6 py-3 font-medium text-slate-900">{student.name}</td>
                                    <td className="px-6 py-3 text-slate-600">{student.enrolledCourses.length}</td>
                                    <td className="px-6 py-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">Delete</button>
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