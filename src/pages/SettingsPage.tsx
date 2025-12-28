import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import { Save, Store, Receipt, Database, Trash2, FolderOpen, HardDrive, Palette, Calculator, ChevronLeft } from 'lucide-react';
import { ConfirmDialog, AccessDenied } from '../components/UIComponents';
import { selectDirectory, getDirectoryName, checkExistingDataFiles } from '../utils/fileSystem';
import { createPortal } from 'react-dom';

export const SettingsPage: React.FC = () => {
    const { settings, updateSettings, hasPermission, loadDataFromFiles, saveDataToFiles } = useStore();

    if (!hasPermission('settings.manage')) return <AccessDenied />;
    const { showToast } = useUI();

    // UI State
    const [openSection, setOpenSection] = useState<string | null>(null);

    // Form State (Sync with store initially)
    const [formData, setFormData] = useState(settings);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [connectedDir, setConnectedDir] = useState<string | null>(getDirectoryName());

    const handleSave = () => {
        updateSettings(formData);
        showToast('تم حفظ الإعدادات بنجاح', 'success');
        setOpenSection(null); // Close modal on save
    };

    const handleFactoryReset = () => {
        window.location.reload();
        localStorage.clear();
        showToast('تم إعادة تعيين النظام (يرجى تحديث الصفحة)', 'warning');
        setShowResetConfirm(false);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'headerLogoUrl' | 'footerLogoUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            showToast('حجم الصورة كبير. يفضل استخدام صور أقل من 1 ميجابايت.', 'warning');
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setFormData(prev => ({ ...prev, [field]: event.target?.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const settingsCards = [
        {
            id: 'identity',
            title: 'هوية المتجر',
            description: 'اسم المتجر، الشعار، العنوان، ومعلومات التواصل الفاتورة.',
            icon: Store,
            color: 'bg-blue-100 text-blue-600',
            border: 'hover:border-blue-300'
        },
        {
            id: 'financial',
            title: 'الإعدادات المالية',
            description: 'العملة، الضريبة، وسياسات الدفع.',
            icon: Calculator,
            color: 'bg-green-100 text-green-600',
            border: 'hover:border-green-300'
        },
        {
            id: 'receipt',
            title: 'تصميم الفاتورة',
            description: 'تخصيص شكل الفاتورة، اللوجو، والنصوص الإضافية.',
            icon: Receipt,
            color: 'bg-indigo-100 text-indigo-600',
            border: 'hover:border-indigo-300'
        },
        {
            id: 'data',
            title: 'إدارة البيانات',
            description: 'ربط التخزين، النسخ الاحتياطي، واستيراد البيانات.',
            icon: Database,
            color: 'bg-amber-100 text-amber-600',
            border: 'hover:border-amber-300'
        },

    ];

    return (
        <div className="h-full flex flex-col font-stc animate-in fade-in p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Palette className="bg-slate-100 p-2 rounded-xl w-10 h-10 text-slate-600" />
                لوحة الإعدادات
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settingsCards.map(card => (
                    <button
                        key={card.id}
                        onClick={() => setOpenSection(card.id)}
                        className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-right transition-all duration-300 group hover:shadow-lg hover:-translate-y-1 ${card.border}`}
                    >
                        <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            <card.icon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{card.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{card.description}</p>
                    </button>
                ))}
            </div>

            {/* FULL SCREEN SETTINGS MODAL */}
            {openSection && createPortal(
                <div className="fixed inset-0 z-[9999] bg-slate-100 animate-in slide-in-from-bottom-5 duration-300 font-stc flex flex-col">
                    {/* Modal Header */}
                    <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200 shadow-sm shrink-0">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setOpenSection(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition"
                            >
                                <ChevronLeft size={24} className="text-slate-600" />
                            </button>
                            <h3 className="text-xl font-bold text-slate-800">
                                {settingsCards.find(c => c.id === openSection)?.title}
                            </h3>
                        </div>

                        {openSection !== 'danger' && openSection !== 'data' && (
                            <button
                                onClick={handleSave}
                                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                            >
                                <Save size={18} />
                                حفظ التغييرات
                            </button>
                        )}
                    </div>

                    {/* Modal Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
                        <div className="max-w-7xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[500px]">

                            {/* IDENTITY SETTINGS */}
                            {openSection === 'identity' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <h4 className="font-bold text-lg text-slate-700 border-b pb-2 mb-4">معلومات المتجر الأساسية</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المتجر</label>
                                            <input
                                                type="text"
                                                value={formData.storeName}
                                                onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                                                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                                            <input
                                                type="text"
                                                value={formData.storePhone}
                                                onChange={e => setFormData({ ...formData, storePhone: e.target.value })}
                                                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white"
                                            />
                                        </div>
                                        <div className="">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">العنوان</label>
                                            <input
                                                type="text"
                                                value={formData.storeAddress}
                                                onChange={e => setFormData({ ...formData, storeAddress: e.target.value })}
                                                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* FINANCIAL SETTINGS */}
                            {openSection === 'financial' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <h4 className="font-bold text-lg text-slate-700 border-b pb-2 mb-4">الإعدادات المالية والضريبية</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">العملة</label>
                                            <input
                                                type="text"
                                                value={formData.currency}
                                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition bg-slate-50 focus:bg-white"
                                                placeholder="مثال: ج.م"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">نسبة الضريبة (%)</label>
                                            <input
                                                type="number"
                                                value={formData.taxRate}
                                                onChange={e => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                                                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition bg-slate-50 focus:bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* RECEIPT SETTINGS */}
                            {openSection === 'receipt' && (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start animate-in fade-in">
                                    {/* Header Section */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-full">
                                        <h4 className="font-bold text-indigo-700 mb-6 flex items-center gap-2 text-lg">
                                            <span className="w-3 h-8 bg-indigo-500 rounded-full"></span>
                                            ترويسة الفاتورة (Header)
                                        </h4>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Logo Control */}
                                            <div className="space-y-4">
                                                <label className="block text-sm font-bold text-slate-700">لوجو الترويسة</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleLogoUpload(e, 'headerLogoUrl')}
                                                        className="w-full p-3 bg-white border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                                    />
                                                    {formData.headerLogoUrl && (
                                                        <button onClick={() => setFormData({ ...formData, headerLogoUrl: '' })} className="text-red-500 hover:bg-red-50 p-3 rounded-xl border border-transparent hover:border-red-100 transition"><Trash2 size={20} /></button>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap w-20">الحجم: {formData.headerLogoWidth || 50}%</span>
                                                    <input type="range" min="10" max="100" value={formData.headerLogoWidth || 50} onChange={e => setFormData({ ...formData, headerLogoWidth: Number(e.target.value) })} className="w-full accent-indigo-600 h-2 rounded-lg cursor-pointer" />
                                                </div>

                                                {formData.headerLogoUrl && (
                                                    <div className="p-4 bg-white border rounded-xl inline-block shadow-sm w-full flex justify-center h-24 items-center">
                                                        <img src={formData.headerLogoUrl} alt="Preview" className="h-full object-contain" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Text Control */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-3">نص الترويسة الإضافي</label>
                                                <textarea
                                                    value={formData.receiptHeader}
                                                    onChange={e => setFormData({ ...formData, receiptHeader: e.target.value })}
                                                    className="w-full p-4 border rounded-xl h-40 text-base focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white"
                                                    placeholder="مثال: أهلاً بكم في متجرنا..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Section */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-full">
                                        <h4 className="font-bold text-indigo-700 mb-6 flex items-center gap-2 text-lg">
                                            <span className="w-3 h-8 bg-indigo-500 rounded-full"></span>
                                            تذييل الفاتورة (Footer)
                                        </h4>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Logo Control */}
                                            <div className="space-y-4">
                                                <label className="block text-sm font-bold text-slate-700">لوجو التذييل</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleLogoUpload(e, 'footerLogoUrl')}
                                                        className="w-full p-3 bg-white border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                                    />
                                                    {formData.footerLogoUrl && (
                                                        <button onClick={() => setFormData({ ...formData, footerLogoUrl: '' })} className="text-red-500 hover:bg-red-50 p-3 rounded-xl border border-transparent hover:border-red-100 transition"><Trash2 size={20} /></button>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap w-20">الحجم: {formData.footerLogoWidth || 50}%</span>
                                                    <input type="range" min="10" max="100" value={formData.footerLogoWidth || 50} onChange={e => setFormData({ ...formData, footerLogoWidth: Number(e.target.value) })} className="w-full accent-indigo-600 h-2 rounded-lg cursor-pointer" />
                                                </div>

                                                {formData.footerLogoUrl && (
                                                    <div className="p-4 bg-white border rounded-xl inline-block shadow-sm w-full flex justify-center h-24 items-center">
                                                        <img src={formData.footerLogoUrl} alt="Preview" className="h-full object-contain" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Text Control */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-3">نص التذييل</label>
                                                <textarea
                                                    value={formData.receiptFooter}
                                                    onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
                                                    className="w-full p-4 border rounded-xl h-40 text-base focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white"
                                                    placeholder="مثال: شكراً لزيارتكم..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* DATA SETTINGS */}
                            {openSection === 'data' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95 items-start">
                                    <div className="lg:col-span-2 bg-amber-50 rounded-3xl border-2 border-dashed border-amber-200 p-8 flex flex-col items-center text-center w-full">
                                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4 shadow-inner">
                                            <HardDrive size={32} />
                                        </div>
                                        <h4 className="text-2xl font-bold text-slate-800 mb-2">التخزين المباشر</h4>
                                        <p className="text-slate-500 text-base leading-relaxed max-w-lg mb-6">
                                            نظامنا يدعم الحفظ المباشر في جهازك لضمان عدم ضياع البيانات.
                                        </p>

                                        <button
                                            onClick={async () => {
                                                const success = await selectDirectory();
                                                if (success) {
                                                    const dirName = getDirectoryName();
                                                    setConnectedDir(dirName);
                                                    showToast(`تم الاتصال بالمجلد: ${dirName}`, 'success');

                                                    const existingFiles = await checkExistingDataFiles();
                                                    if (existingFiles.length > 0) {
                                                        showToast(`تم العثور على ${existingFiles.length} ملف بيانات، جاري استيرادهم...`, 'info');
                                                        const loaded = await loadDataFromFiles();
                                                        if (loaded) {
                                                            showToast('✅ تم استيراد البيانات بنجاح!', 'success');
                                                        } else {
                                                            showToast('❌ فشل الاستيراد', 'error');
                                                        }
                                                    } else {
                                                        showToast('📁 المجلد فارغ - سيتم إنشاء ملفات جديدة', 'info');
                                                        await saveDataToFiles();
                                                    }
                                                }
                                            }}
                                            className={`w-full max-w-md py-4 rounded-xl font-bold flex items-center justify-center gap-3 text-lg shadow-lg transition-all ${connectedDir
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
                                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30'}`}
                                        >
                                            <FolderOpen size={24} />
                                            {connectedDir ? `متصل بـ: ${connectedDir}` : 'تحديد مجلد الحفظ'}
                                        </button>

                                        {connectedDir && (
                                            <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 text-sm">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                </span>
                                                مزامنة تلقائية نشطة
                                            </div>
                                        )}
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="lg:col-span-1 h-fit flex flex-col items-center justify-center p-6 bg-red-50 rounded-3xl border border-red-100 text-center h-full">
                                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                            <Trash2 size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-red-600 mb-2">منطقة الخطر!</h3>
                                        <p className="text-slate-600 text-sm mb-6">
                                            إعادة تعيين المصنع ستقوم بمسح جميع البيانات.
                                        </p>

                                        <button
                                            onClick={() => setShowResetConfirm(true)}
                                            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/20"
                                        >
                                            حذف وإعادة تعيين
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* DANGER ZONE */}
                            {openSection === 'danger' && (
                                <div className="flex flex-col items-center justify-center p-8 space-y-8 animate-in zoom-in-95">
                                    <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                        <Trash2 size={48} />
                                    </div>
                                    <div className="text-center max-w-xl">
                                        <h3 className="text-3xl font-bold text-red-600 mb-4">منطقة الخطر!</h3>
                                        <p className="text-slate-600 text-lg mb-8">
                                            أنت على وشك القيام بعملية <strong>لا يمكن التراجع عنها</strong>.
                                            إعادة تعيين المصنع ستقوم بمسح جميع البيانات المخزنة محلياً في المتصفح وإعادة تحميل الصفحة.
                                        </p>

                                        <button
                                            onClick={() => setShowResetConfirm(true)}
                                            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-xl hover:bg-red-700 transition shadow-xl shadow-red-500/30"
                                        >
                                            تأكيد حذف البيانات وإعادة التعيين
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>,
                document.body
            )}

            <ConfirmDialog
                isOpen={showResetConfirm}
                title="تأكيد حذف البيانات"
                message="هل أنت متأكد تماماً؟ سيتم حذف جميع المنتجات والعملاء والفواتير ولا يمكن التراجع عن ذلك."
                isDangerous
                confirmText="نعم، احذف كل شيء"
                onConfirm={handleFactoryReset}
                onCancel={() => setShowResetConfirm(false)}
            />
        </div>
    );
};
