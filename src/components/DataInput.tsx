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

// --- EDIT MODAL (Sadeleştirilmiş, önceki kodun aynısı) ---
interface EditModalProps { item: any; type: Tab; mode: 'add' | 'edit'; onClose: () => void; onSave: (updatedItem: any) => void; }
const EditModal: React.FC<EditModalProps> = ({ item, type, mode, onClose, onSave }) => {
    const [formData, setFormData] = useState<any>({ ...item });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
                <h3 className="text-xl font-bold mb-4">{mode} {type}</h3>
                <div className="space-y-3">
                    {Object.keys(formData).map(key => (
                        key !== 'id' && key !== 'enrolledCourses' && key !== 'enrolledStudents' && 
                        <div key={key}><label className="text-xs font-bold uppercase">{key}</label><input name={key} value={formData[key]} onChange={handleChange} className="w-full border p-2 rounded" /></div>
                    ))}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                    <button onClick={() => onSave(formData)} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                </div>
            </div>
        </div>
    );
};

export const DataInput: React.FC<DataInputProps> = ({ courses, setCourses, classrooms, setClassrooms, students, setStudents }) => {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<Tab>('courses');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentItem, setCurrentItem] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- TÜM VERİLERİ YENİLE ---
    const refreshData = async () => {
        try {
            const rawCourses = await window.api.getCourses();
            setCourses(rawCourses.map((c: any) => ({ ...c, id: c.id.toString(), enrolledStudents: c.enrolled_students })));

            const rawClassrooms = await window.api.getClassrooms();
            setClassrooms(rawClassrooms.map((r: any) => ({ ...r, id: r.id.toString() })));

            const rawStudents = await window.api.getStudents();
            setStudents(rawStudents.map((s: any) => ({
                id: s.id.toString(),
                studentNumber: s.student_number,
                name: s.name,
                email: s.email,
                enrolledCourses: s.enrolled_courses || []
            })));
        } catch (e) { console.error(e); }
    };

    // --- AKILLI DOSYA OKUYUCU ---
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;
            
            try {
                // DOSYA İÇERİĞİNE GÖRE TİP BELİRLEME
                
                // 1. ATTENDANCE (İçinde "Course" ve "['" geçen özel format)
                if (text.includes("Course") && text.includes("['") && text.includes("']")) {
                    console.log("Attendance Dosyası Algılandı...");
                    const blocks = text.split(/\r?\n\r?\n/);
                    const enrollments: { studentNumber: string, courseCode: string }[] = [];

                    blocks.forEach(block => {
                        const lines = block.trim().split(/\r?\n/);
                        if (lines.length >= 2) {
                            const courseCode = lines[0].trim();
                            // Python listesini temizle: ['A', 'B'] -> A, B
                            const studentListRaw = lines.slice(1).join(" "); 
                            const cleanList = studentListRaw.replace(/[\[\]']/g, ""); 
                            const studentIDs = cleanList.split(",").map(s => s.trim()).filter(s => s);

                            studentIDs.forEach(stdId => enrollments.push({ studentNumber: stdId, courseCode: courseCode }));
                        }
                    });
                    await window.api.addEnrollmentsBulk(enrollments);
                    showNotification(`Attendance Loaded: ${enrollments.length} records.`, "success");
                }
                
                // 2. CLASSROOMS (Noktalı virgül içeren)
                else if (text.includes(";") && activeTab === 'classrooms') {
                     const lines = text.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith('ALL OF'));
                     const formatted = lines.map(line => {
                         const parts = line.split(';');
                         return { name: parts[0]?.trim(), capacity: parseInt(parts[1]?.trim() || '40'), building: 'Main Building' };
                     }).filter(r => r.name);
                     await window.api.addClassroomsBulk(formatted);
                     showNotification("Classrooms Imported", "success");
                }

                // 3. STUDENTS (CSV formatı veya düz liste)
                else if (activeTab === 'students') {
                    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith('ALL OF'));
                    const formatted = lines.map(line => {
                        // Eğer CSV ise virgülle ayır, değilse düz al
                        const parts = line.includes(',') ? line.split(',') : [line]; 
                        return {
                            studentNumber: parts[0].trim(),
                            name: parts[1] ? parts[1].trim() : `Student ${parts[0].trim().split('_').pop()}`,
                            email: parts[2] ? parts[2].trim() : `${parts[0].trim().toLowerCase()}@uni.edu`,
                        };
                    });
                    await window.api.addStudentsBulk(formatted);
                    showNotification("Students Imported", "success");
                }

                // 4. COURSES (Düz liste)
                else if (activeTab === 'courses') {
                    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith('ALL OF'));
                    const formatted = lines.map(line => ({
                        code: line.split(',')[0].trim(), // Virgül varsa ilkini al
                        name: line.includes(',') ? line.split(',')[1].trim() : line.trim(),
                        enrolledStudents: 0
                    }));
                    await window.api.addCoursesBulk(formatted);
                    showNotification("Courses Imported", "success");
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

    // --- CRUD İŞLEMLERİ ---
    const handleSaveItem = async (formData: any) => {
        if (activeTab === 'courses') modalMode === 'add' ? await window.api.addCourse(formData) : await window.api.updateCourse(formData);
        else if (activeTab === 'classrooms') modalMode === 'add' ? await window.api.addClassroomsBulk([formData]) : await window.api.updateClassroom(formData);
        else if (activeTab === 'students') modalMode === 'edit' ? await window.api.updateStudent(formData) : alert("Use import for new students");
        await refreshData(); setIsModalOpen(false);
    };
    const handleDelete = async (id: any) => {
        if(!confirm("Delete?")) return;
        if (activeTab === 'courses') await window.api.deleteCourse(Number(id));
        else if (activeTab === 'classrooms') await window.api.deleteClassroom(Number(id));
        else if (activeTab === 'students') await window.api.deleteStudent(Number(id));
        await refreshData();
    };
    const handleClearData = async () => {
        if(!confirm("Clear ALL data?")) return;
        await window.api.clearCourses(); await window.api.clearClassrooms(); await window.api.clearStudents();
        await refreshData();
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded shadow">
                <h2 className="text-xl font-bold">Data Management</h2>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-50 text-blue-600 rounded">Import File</button>
                    <button onClick={handleClearData} className="px-4 py-2 bg-red-50 text-red-600 rounded">Clear All</button>
                    <button onClick={() => { setModalMode('add'); setCurrentItem({}); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded">Add New</button>
                </div>
            </div>
            
            <div className="bg-white rounded shadow overflow-hidden">
                <div className="flex border-b">
                    {(['courses', 'classrooms', 'students'] as Tab[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 capitalize ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>{tab}</button>
                    ))}
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {activeTab === 'courses' && <><th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">Enrolled</th></>}
                            {activeTab === 'classrooms' && <><th className="p-3">Name</th><th className="p-3">Capacity</th></>}
                            {activeTab === 'students' && <><th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Courses</th></>}
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeTab === 'courses' && courses.map(c => <tr key={c.id} className="border-b"><td className="p-3">{c.code}</td><td className="p-3">{c.name}</td><td className="p-3">{c.enrolledStudents}</td><td className="p-3 text-right"><button onClick={()=> {setCurrentItem(c); setModalMode('edit'); setIsModalOpen(true)}} className="text-blue-500 mr-2">Edit</button><button onClick={()=>handleDelete(c.id)} className="text-red-500">Del</button></td></tr>)}
                        {activeTab === 'classrooms' && classrooms.map(r => <tr key={r.id} className="border-b"><td className="p-3">{r.name}</td><td className="p-3">{r.capacity}</td><td className="p-3 text-right"><button onClick={()=> {setCurrentItem(r); setModalMode('edit'); setIsModalOpen(true)}} className="text-blue-500 mr-2">Edit</button><button onClick={()=>handleDelete(r.id)} className="text-red-500">Del</button></td></tr>)}
                        {activeTab === 'students' && students.map(s => <tr key={s.id} className="border-b"><td className="p-3">{s.studentNumber}</td><td className="p-3">{s.name}</td><td className="p-3">{s.enrolledCourses.length}</td><td className="p-3 text-right"><button onClick={()=> {setCurrentItem(s); setModalMode('edit'); setIsModalOpen(true)}} className="text-blue-500 mr-2">Edit</button><button onClick={()=>handleDelete(s.id)} className="text-red-500">Del</button></td></tr>)}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <EditModal item={currentItem} type={activeTab} mode={modalMode} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} />}
        </div>
    );
};