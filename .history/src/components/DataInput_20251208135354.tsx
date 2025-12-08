import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import { Course, Classroom, Student } from '../types';
import Papa from 'papaparse'; // CSV ayrıştırma için gerekli

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

// Basit Edit Modal Bileşeni (Mevcut kodunuzdaki yapıyı koruyoruz)
const EditModal: React.FC<EditModalProps> = ({ item, type, mode, onClose, onSave }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<any>({ ...item });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                <h3 className="text-lg font-bold mb-4">
                    {mode === 'add' ? t('common.add') : t('common.edit')} {type}
                </h3>
                <div className="space-y-3">
                    {/* Course Fields */}
                    {type === 'courses' && (
                        <>
                            <input name="code" placeholder="Code" value={formData.code || ''} onChange={handleChange} className="w-full border p-2 rounded" />
                            <input name="name" placeholder="Name" value={formData.name || ''} onChange={handleChange} className="w-full border p-2 rounded" />
                        </>
                    )}
                    {/* Classroom Fields */}
                    {type === 'classrooms' && (
                        <>
                            <input name="name" placeholder="Name" value={formData.name || ''} onChange={handleChange} className="w-full border p-2 rounded" />
                            <input type="number" name="capacity" placeholder="Capacity" value={formData.capacity || ''} onChange={handleChange} className="w-full border p-2 rounded" />
                            <input name="building" placeholder="Building" value={formData.building || ''} onChange={handleChange} className="w-full border p-2 rounded" />
                        </>
                    )}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t('common.cancel')}</button>
                    <button onClick={() => onSave(formData)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">{t('common.save')}</button>
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
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentItem, setCurrentItem] = useState<any>(null);

    // Dosya yükleme referansı
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- CSV IMPORT LOGIC (FR1 DÜZELTMESİ) ---
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
                        // CSV format: code, name, enrolledStudents
                        const formatted = data.map((row: any) => ({
                            code: row.code,
                            name: row.name,
                            enrolledStudents: parseInt(row.enrolledStudents || '0')
                        }));
                        await window.api.addCoursesBulk(formatted);
                        const updated = await window.api.getCourses();
                        setCourses(updated);
                        showNotification(t('dataInput.importSuccess', 'Courses imported successfully'), 'success');
                    } 
                    else if (activeTab === 'classrooms') {
                        // CSV format: name, capacity, building
                        const formatted = data.map((row: any) => ({
                            name: row.name,
                            capacity: parseInt(row.capacity || '0'),
                            building: row.building
                        }));
                        await window.api.addClassroomsBulk(formatted);
                        const updated = await window.api.getClassrooms();
                        setClassrooms(updated);
                        showNotification(t('dataInput.importSuccess', 'Classrooms imported successfully'), 'success');
                    }
                    else if (activeTab === 'students') {
                        // CSV format: studentNumber, name, enrolledCourses (comma separated codes)
                        const formatted = data.map((row: any) => ({
                            studentNumber: row.studentNumber,
                            name: row.name,
                            enrolledCourses: row.enrolledCourses ? row.enrolledCourses.split(';') : []
                        }));
                        await window.api.addStudentsBulk(formatted);
                        const updated = await window.api.getStudents();
                        setStudents(updated);
                        showNotification(t('dataInput.importSuccess', 'Students imported successfully'), 'success');
                    }
                } catch (error) {
                    console.error("Import error:", error);
                    showNotification(t('dataInput.importError', 'Error importing file'), 'error');
                }
                // Input'u temizle ki aynı dosyayı tekrar seçebilelim
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    const handleAddItem = async (item: any) => {
        try {
            if (activeTab === 'courses') {
                await window.api.addCourse({ ...item, enrolledStudents: 0 });
                setCourses(await window.api.getCourses());
            } else if (activeTab === 'classrooms') {
                // Backend tekli ekleme (implement edilmediyse bulk kullanabiliriz veya eklemeliyiz)
                await window.api.addClassroomsBulk([item]); 
                setClassrooms(await window.api.getClassrooms());
            }
            setIsModalOpen(false);
            showNotification(t('dataInput.addSuccess', 'Item added successfully'), 'success');
        } catch (error) {
            showNotification(t('dataInput.error', 'Operation failed'), 'error');
        }
    };

    const handleClearData = async () => {
        if (!confirm(t('common.confirmClear', 'Are you sure you want to clear all data for this category?'))) return;
        
        if (activeTab === 'courses') {
            await window.api.clearCourses();
            setCourses([]);
        } else if (activeTab === 'classrooms') {
            await window.api.clearClassrooms();
            setClassrooms([]);
        } else if (activeTab === 'students') {
            await window.api.clearStudents();
            setStudents([]);
        }
        showNotification(t('dataInput.clearSuccess', 'Data cleared'), 'success');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{t('common.dataManagement')}</h2>
                    <p className="text-sm text-slate-500">{t('dataInput.subtitle', 'Manage your courses, classrooms, and students')}</p>
                </div>
                <div className="flex gap-3">
                    {/* CSV Upload Button - FR1 Requirement */}
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        {t('common.importCSV', 'Import CSV')}
                    </button>

                    <button
                        onClick={handleClearData}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        {t('common.clear', 'Clear')}
                    </button>
                    
                    <button
                        onClick={() => {
                            setModalMode('add');
                            setCurrentItem({});
                            setIsModalOpen(true);
                        }}
                        disabled={activeTab === 'students'} // Students genellikle import edilir, manuel ekleme opsiyonel
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-sm
                            ${activeTab === 'students' 
                            ? 'bg-slate-300 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
                        {t('dataInput.addNew')}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200">
                    {(['courses', 'classrooms', 'students'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-sm font-medium capitalize focus:outline-none transition-colors ${
                                activeTab === tab
                                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {t(`dataInput.${tab}`)}
                        </button>
                    ))}
                </div>

                <div className="p-0">
                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table