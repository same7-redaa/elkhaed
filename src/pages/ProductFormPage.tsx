import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import type { Product } from '../store/useStore';
import { useScanDetection } from '../hooks/useScanDetection';
import { CameraScanner } from '../components/CameraScanner';
import {
    Save, Package, DollarSign, Image as ImageIcon,
    AlertTriangle, Camera, ArrowRight, Plus
} from 'lucide-react';
import { clsx } from 'clsx';

export const ProductFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { products, addProduct, updateProduct, settings, hasPermission } = useStore();
    const { showToast } = useUI();

    const isEditMode = !!id;

    // Permissions Check
    useEffect(() => {
        if (isEditMode && !hasPermission('products.edit')) {
            showToast('ليس لديك صلاحية لتعديل المنتجات', 'error');
            navigate('/products');
        }
        if (!isEditMode && !hasPermission('products.add')) {
            showToast('ليس لديك صلاحية لإضافة منتجات جديدة', 'error');
            navigate('/products');
        }
    }, [isEditMode, hasPermission, navigate, showToast]);

    // Internal State
    const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'inventory' | 'media'>('general');
    const [showCamera, setShowCamera] = useState(false);
    // Removed unused cameraMode state

    const [formData, setFormData] = useState<Partial<Product>>({
        name: '', barcode: '', category: '', description: '',
        price: 0, costPrice: 0,
        stock: 0, minStockLevel: 5, status: 'active'
    });

    // Load Data if Edit Mode
    useEffect(() => {
        if (isEditMode) {
            const product = products.find(p => p.id === id);
            if (product) {
                setFormData({
                    ...product,
                    name: product.name || '',
                    barcode: product.barcode || '',
                    category: product.category || '',
                    description: product.description || '',
                    price: product.price || 0,
                    costPrice: product.costPrice || 0,
                    stock: product.stock || 0,
                    minStockLevel: product.minStockLevel || 5,
                    status: product.status || 'active'
                });
            } else {
                showToast('لم يتم العثور على المنتج', 'error');
                navigate('/products');
            }
        }
    }, [id, isEditMode, products, navigate, showToast]);

    const handleScan = (code: string) => {
        setFormData(prev => ({ ...prev, barcode: code }));
        showToast('تم التقاط الباركود: ' + code, 'success');
        setShowCamera(false);
    };

    useScanDetection({ onScan: handleScan });

    const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

    const handleSave = () => {
        if (!formData.name || !formData.price) {
            showToast('يرجى ملء الاسم والسعر على الأقل', 'error');
            return;
        }

        if (isEditMode && id) {
            updateProduct(id, formData);
            showToast('تم تحديث المنتج بنجاح', 'success');
        } else {
            addProduct({
                id: Date.now().toString(),
                ...formData
            } as Product);
            showToast('تم إضافة منتج جديد', 'success');
        }
        navigate('/products');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/products')}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-500"
                    >
                        <ArrowRight size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            {isEditMode ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {isEditMode ? `ID: #${id?.slice(-6)}` : 'إدخال بيانات منتج جديد للمخزون'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/products')}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        <Save size={20} />
                        حفظ التغييرات
                    </button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Fixed Sidebar Navigation for Large Screens */}
                <div className="w-full lg:w-72 bg-white rounded-2xl border border-slate-100 p-4 space-y-2 shrink-0 shadow-sm">
                    {[
                        { id: 'general', label: 'البيانات الأساسية', icon: Package, desc: 'الاسم، الوصف، الباركود' },
                        { id: 'pricing', label: 'التسعير والمخزون', icon: DollarSign, desc: 'السعر، التكلفة، حدود التنبيه' },
                        { id: 'media', label: 'الصور والوسائط', icon: ImageIcon, desc: 'معرض صور المنتج' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={clsx(
                                "w-full text-right p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 group relative overflow-hidden",
                                activeTab === tab.id
                                    ? 'bg-indigo-50 border-indigo-100 shadow-sm'
                                    : 'bg-transparent border-transparent hover:bg-slate-50'
                            )}
                        >
                            <div className={clsx(
                                "mt-1 p-2 rounded-lg transition-colors",
                                activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                            )}>
                                <tab.icon size={20} />
                            </div>
                            <div>
                                <h4 className={clsx("font-bold text-sm", activeTab === tab.id ? 'text-indigo-900' : 'text-slate-700')}>
                                    {tab.label}
                                </h4>
                                <p className={clsx("text-xs mt-1", activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400')}>
                                    {tab.desc}
                                </p>
                            </div>
                            {activeTab === tab.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                        </button>
                    ))}
                </div>

                {/* Form Content Area */}
                <div className="flex-1 w-full space-y-6">
                    {activeTab === 'general' && (
                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المنتج <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-lg placeholder:text-slate-300"
                                    placeholder="مثال: آيفون 15 برو ماكس..."
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">القسم</label>
                                    <input
                                        list="categories"
                                        type="text"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                                        placeholder="اختر او اكتب قسماً..."
                                    />
                                    <datalist id="categories">{categories.filter(c => c !== 'All').map((c, idx) => <option key={`${c}-${idx}`} value={c} />)}</datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الباركود</label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowCamera(true)}
                                            className="absolute left-2 top-2 bottom-2 px-4 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition flex items-center gap-2 font-bold text-xs z-10"
                                        >
                                            <Camera size={16} />
                                            مسح
                                        </button>
                                        <input
                                            type="text"
                                            value={formData.barcode}
                                            onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                            className="w-full p-4 pl-24 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono tracking-wider text-slate-600"
                                            placeholder="SCAN-CODE..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">الوصف</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-32 resize-none text-slate-600"
                                    placeholder="مواصفات المنتج..."
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'pricing' && (
                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">سعر البيع</label>
                                    <div className="relative">
                                        <span className="absolute right-4 top-4 text-slate-400 font-bold">{settings.currency}</span>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                            className="w-full p-4 pr-12 bg-indigo-50/50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-2xl text-indigo-600"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">سعر التكلفة</label>
                                    <div className="relative">
                                        <span className="absolute right-4 top-4 text-slate-400 font-bold">{settings.currency}</span>
                                        <input
                                            type="number"
                                            value={formData.costPrice}
                                            onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                                            className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-2xl text-slate-600"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-50">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">الكمية الحالية</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono font-bold text-slate-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">حد التنبيه (Low Stock)</label>
                                    <input
                                        type="number"
                                        value={formData.minStockLevel}
                                        onChange={e => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono font-bold text-slate-800"
                                    />
                                    <p className="text-xs text-orange-500 flex items-center gap-1 mt-1 font-medium">
                                        <AlertTriangle size={12} />
                                        تنبيه عند الوصول لهذا الرقم
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div className="bg-white p-16 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-2">
                            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200 ring-8 ring-slate-50 transform hover:scale-105 transition-all duration-300">
                                <ImageIcon size={64} />
                            </div>
                            <h3 className="font-bold text-slate-800 text-xl mb-3">صور المنتج</h3>
                            <p className="text-slate-500 mb-8 max-w-sm leading-relaxed">اسحب وأفلت الصور هنا لرفعها، أو اضغط على الزر أدناه لتصفح الملفات من جهازك.</p>
                            <button className="px-8 py-4 bg-white border-2 border-dashed border-indigo-200 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center gap-2">
                                <Plus size={20} />
                                استعراض الملفات
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Camera Full Screen Overlay */}
            {showCamera && (
                <CameraScanner
                    onScan={handleScan}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </div>
    );
};
