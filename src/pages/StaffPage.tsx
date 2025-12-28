import React, { useState, useMemo } from 'react';
import { useStore, ALL_PERMISSIONS } from '../store/useStore';
import type { User } from '../store/useStore';
import { UserPlus, Trash2, Shield, Edit, X, ChevronLeft, CheckCircle, Lock, User as UserIcon, Key } from 'lucide-react';
import { useUI } from '../store/useUI';
import { clsx } from 'clsx';
import { AccessDenied } from '../components/UIComponents';
import { createPortal } from 'react-dom';

export const StaffPage: React.FC = () => {
    const { users, currentUser, addUser, updateUser, deleteUser, hasPermission } = useStore();
    const { showToast } = useUI();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    // Form State
    const [newName, setNewName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [userRole, setUserRole] = useState<'admin' | 'manager' | 'cashier'>('cashier');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['pos.access']);

    // Permission Categories
    const categories = useMemo(() => Array.from(new Set(ALL_PERMISSIONS.map(p => p.category))), []);
    const [activeCategory, setActiveCategory] = useState<string>(categories[0]);

    if (!hasPermission('staff.manage')) {
        return <AccessDenied />;
    }

    const resetForm = () => {
        setNewName('');
        setNewUsername('');
        setNewPassword('');
        setUserRole('cashier');
        setSelectedPermissions(['pos.access']);
        setActiveCategory(categories[0]);
        setEditingUserId(null);
        setCurrentStep(1);
    };

    const openAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEditClick = (user: User) => {
        resetForm();
        setEditingUserId(user.id);
        setNewName(user.name);
        setNewUsername(user.username);
        setNewPassword(user.password); // In real app, don't show password
        setUserRole(user.role);
        setSelectedPermissions(user.permissions || []);
        setIsModalOpen(true);
    };

    const togglePermission = (id: string) => {
        setSelectedPermissions(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const validateStep1 = () => {
        if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
            showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
            return false;
        }
        // Check duplicate username
        const isDuplicate = users.some(u => u.username === newUsername && u.id !== editingUserId);
        if (isDuplicate) {
            showToast('اسم المستخدم مستخدم بالفعل', 'error');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (validateStep1()) setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const handleSaveUser = () => {
        const userData = {
            name: newName,
            username: newUsername,
            password: newPassword,
            role: userRole,
            permissions: userRole === 'admin' ? ALL_PERMISSIONS.map(p => p.id) : selectedPermissions
        };

        if (editingUserId) {
            updateUser(editingUserId, userData);
            showToast('تم تعديل بيانات الموظف بنجاح', 'success');
        } else {
            addUser({
                id: Date.now().toString(),
                ...userData
            });
            showToast('تم إضافة الموظف بنجاح', 'success');
        }

        setIsModalOpen(false);
        resetForm();
    };

    // Modal Components
    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-8 px-4">
            <div className="flex items-center w-full max-w-lg relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
                <div
                    className="absolute top-1/2 right-0 h-1 bg-indigo-500 -z-0 rounded-full transition-all duration-300"
                    style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
                ></div>

                {[1, 2, 3].map((step) => (
                    <div key={step} className="flex-1 flex justify-center">
                        <div className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all duration-300 z-10",
                            currentStep >= step
                                ? "bg-indigo-600 border-indigo-100 text-white shadow-indigo-200 shadow-lg scale-110"
                                : "bg-white border-slate-200 text-slate-400"
                        )}>
                            {step === 1 && <UserIcon size={18} />}
                            {step === 2 && <Key size={18} />}
                            {step === 3 && <CheckCircle size={18} />}
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute top-24 w-full flex justify-between px-16 max-w-lg text-xs font-bold text-slate-500 hidden sm:flex">
                <span>البيانات الأساسية</span>
                <span>الصلاحيات</span>
                <span>المراجعة</span>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col space-y-4 font-stc animate-in fade-in duration-500 pb-10 p-6">
            {/* Header Bar */}
            <div className="flex bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-none justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">إدارة فريق العمل</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {users.length} موظف مسجل في النظام
                        </p>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-500/20 font-bold active:scale-95"
                >
                    <UserPlus size={20} />
                    <span>موظف جديد</span>
                </button>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-4 p-1">
                {users.map(user => (
                    <div key={user.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-4">
                                <div className={clsx(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-lg transform group-hover:scale-105 transition-transform",
                                    user.role === 'admin' ? "bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/20" :
                                        "bg-gradient-to-br from-blue-400 to-cyan-500 shadow-blue-500/20"
                                )}>
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{user.name}</h3>
                                    <p className="text-slate-500 text-sm font-mono mt-0.5">@{user.username}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={clsx(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                            user.role === 'admin'
                                                ? "bg-purple-50 text-purple-700 border-purple-100"
                                                : "bg-blue-50 text-blue-700 border-blue-100"
                                        )}>
                                            {user.role === 'admin' ? 'مدير عام' : user.role === 'manager' ? 'مشرف' : 'كاشير'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleEditClick(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
                                    <Edit size={18} />
                                </button>
                                {user.id !== currentUser?.id && (
                                    <button onClick={() => { if (confirm('حذف الموظف؟')) deleteUser(user.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 mb-3 flex justify-between">
                                <span>صلاحيات الوصول</span>
                                <span className="bg-white px-2 py-0.5 rounded-md shadow-sm text-indigo-600">
                                    {user.role === 'admin' ? 'الكل' : user.permissions?.length || 0}
                                </span>
                            </h4>
                            <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto custom-scrollbar">
                                {user.role === 'admin' ? (
                                    <span className="text-xs font-bold text-purple-600 flex items-center gap-1 w-full justify-center py-2">
                                        <Shield size={14} /> وصول كامل للنظام
                                    </span>
                                ) : (
                                    user.permissions?.slice(0, 5).map(pid => (
                                        <span key={pid} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-600">
                                            {ALL_PERMISSIONS.find(p => p.id === pid)?.label}
                                        </span>
                                    ))
                                )}
                                {user.role !== 'admin' && (user.permissions?.length || 0) > 5 && (
                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded-lg">+ المزيد</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* FULL SCREEN MODAL WIZARD */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-white px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">
                                    {editingUserId ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">اتبع الخطوات لإعداد الموظف وصلاحياته</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">

                            <StepIndicator />

                            {/* STEP 1: BASIC INFO */}
                            {currentStep === 1 && (
                                <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">اسم الموظف</label>
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={e => setNewName(e.target.value)}
                                                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white"
                                                placeholder="مثال: محمد أحمد"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم</label>
                                                <input
                                                    type="text"
                                                    value={newUsername}
                                                    onChange={e => setNewUsername(e.target.value)}
                                                    className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white"
                                                    placeholder="user123"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
                                                <input
                                                    type="text"
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                    className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white font-mono"
                                                    placeholder="••••••"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <label className="block text-sm font-bold text-slate-700 mb-3">الدور الوظيفي</label>
                                            <div className="grid grid-cols-3 gap-4">
                                                {[
                                                    { id: 'cashier', label: 'كاشير', icon: UserIcon },
                                                    { id: 'manager', label: 'مشرف', icon: Key },
                                                    { id: 'admin', label: 'مدير عام', icon: Shield }
                                                ].map(role => (
                                                    <div
                                                        key={role.id}
                                                        onClick={() => setUserRole(role.id as any)}
                                                        className={clsx(
                                                            "cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                                                            userRole === role.id
                                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                                : "border-slate-200 bg-white hover:border-indigo-200"
                                                        )}
                                                    >
                                                        <role.icon size={24} className={userRole === role.id ? "text-indigo-600" : "text-slate-400"} />
                                                        <span className="font-bold text-sm">{role.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-3 px-1">
                                                * <strong>المدير العام:</strong> صلاحيات كاملة. <strong>المشرف:</strong> صلاحيات مخصصة + إدارة. <strong>الكاشير:</strong> نقاط البيع فقط افتراضياً.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: PERMISSIONS */}
                            {currentStep === 2 && (
                                <div className="animate-in slide-in-from-right-8 fade-in duration-300">
                                    {userRole === 'admin' ? (
                                        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                                            <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
                                                <Shield size={40} />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">صلاحيات المدير العام</h3>
                                            <p className="text-slate-500 max-w-sm">
                                                يمتلك المدير العام جميع الصلاحيات في النظام تلقائياً ولا يمكن تقييد وصوله.
                                                اضغط على "التالي" للمتابعة.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col lg:flex-row gap-6 h-[400px]">
                                            {/* Categories */}
                                            <div className="w-full lg:w-1/4 bg-white rounded-2xl border border-slate-200 p-2 overflow-y-auto">
                                                {categories.map(cat => {
                                                    const catPermissions = ALL_PERMISSIONS.filter(p => p.category === cat);
                                                    const catPermIds = catPermissions.map(p => p.id);
                                                    const isAllSelected = catPermIds.every(id => selectedPermissions.includes(id));
                                                    const isPartiallySelected = catPermIds.some(id => selectedPermissions.includes(id)) && !isAllSelected;

                                                    return (
                                                        <div
                                                            key={cat}
                                                            onClick={() => setActiveCategory(cat)}
                                                            className={clsx(
                                                                "p-3 rounded-xl cursor-pointer mb-1 transition flex items-center justify-between",
                                                                activeCategory === cat ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            <span>{cat}</span>
                                                            <div className={clsx(
                                                                "w-2 h-2 rounded-full",
                                                                isAllSelected ? "bg-indigo-500" : isPartiallySelected ? "bg-orange-400" : "bg-slate-200"
                                                            )}></div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Permissions Grid */}
                                            <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 overflow-y-auto">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h4 className="font-bold text-lg text-slate-800">{activeCategory}</h4>
                                                    <button
                                                        onClick={() => {
                                                            const catPerms = ALL_PERMISSIONS.filter(p => p.category === activeCategory).map(p => p.id);
                                                            const allSelected = catPerms.every(id => selectedPermissions.includes(id));
                                                            setSelectedPermissions(prev =>
                                                                allSelected
                                                                    ? prev.filter(id => !catPerms.includes(id))
                                                                    : [...Array.from(new Set([...prev, ...catPerms]))]
                                                            );
                                                        }}
                                                        className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition"
                                                    >
                                                        تحديد / إلغاء الكل
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {ALL_PERMISSIONS.filter(p => p.category === activeCategory).map(p => (
                                                        <label key={p.id} className={clsx(
                                                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition select-none",
                                                            selectedPermissions.includes(p.id)
                                                                ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                                                : "bg-white border-slate-100 hover:border-slate-300"
                                                        )}>
                                                            <div className={clsx(
                                                                "w-5 h-5 rounded flex items-center justify-center transition border",
                                                                selectedPermissions.includes(p.id) ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                                                            )}>
                                                                {selectedPermissions.includes(p.id) && <CheckCircle size={14} className="text-white" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={selectedPermissions.includes(p.id)}
                                                                onChange={() => togglePermission(p.id)}
                                                            />
                                                            <span className={clsx("text-sm font-medium", selectedPermissions.includes(p.id) ? "text-indigo-900" : "text-slate-600")}>
                                                                {p.label}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 3: REVIEW */}
                            {currentStep === 3 && (
                                <div className="max-w-xl mx-auto animate-in slide-in-from-right-8 fade-in duration-300">
                                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                                        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center font-bold text-2xl text-slate-600">
                                                {newName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl text-slate-800">{newName}</h3>
                                                <p className="text-slate-500">@{newUsername}</p>
                                            </div>
                                            <div className="mr-auto">
                                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold text-sm">
                                                    {userRole === 'admin' ? 'مدير عام' : userRole === 'manager' ? 'مشرف' : 'كاشير'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                                                <span className="text-slate-600 font-bold">كلمة المرور</span>
                                                <span className="font-mono text-slate-800">{newPassword}</span>
                                            </div>

                                            <div className="bg-slate-50 p-4 rounded-xl">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-slate-600 font-bold">الصلاحيات الممنوحة</span>
                                                    <span className="bg-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                                                        {userRole === 'admin' ? 'الكل' : selectedPermissions.length}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {userRole === 'admin' ? (
                                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">وصول كامل</span>
                                                    ) : (
                                                        selectedPermissions.length > 0 ? (
                                                            selectedPermissions.map(pid => (
                                                                <span key={pid} className="text-[10px] bg-white border px-2 py-1 rounded-md text-slate-600">
                                                                    {ALL_PERMISSIONS.find(p => p.id === pid)?.label}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-red-500">لا توجد صلاحيات محددة</span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                            <Lock size={20} className="text-blue-500 mt-0.5" />
                                            <p className="text-sm text-blue-700 leading-relaxed">
                                                تأكد من صحة البيانات قبل الحفظ. يمكن للمدير العام فقط تعديل هذه البيانات لاحقاً.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="bg-white px-8 py-5 border-t border-slate-100 flex justify-between items-center">
                            <button
                                onClick={currentStep === 1 ? () => setIsModalOpen(false) : handleBack}
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition"
                            >
                                {currentStep === 1 ? 'إلغاء' : 'رجوع'}
                            </button>

                            {currentStep < 3 ? (
                                <button
                                    onClick={handleNext}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                                >
                                    <span>التالي</span>
                                    <ChevronLeft size={20} className="mt-0.5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSaveUser}
                                    className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                >
                                    <CheckCircle size={20} />
                                    <span>تأكيد وحفظ</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
