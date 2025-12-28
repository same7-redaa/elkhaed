import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Tag, Plus, Trash2, Calendar, CheckCircle, XCircle, X } from 'lucide-react';
import { useUI } from '../store/useUI';
import { createPortal } from 'react-dom';
import { AccessDenied } from '../components/UIComponents';

export const PromotionsPage: React.FC = () => {
    const { discountCodes, addDiscountCode, deleteDiscountCode, offers, addOffer, deleteOffer, products, hasPermission } = useStore();
    const { showToast } = useUI();

    if (!hasPermission('offers.view')) return <AccessDenied />;
    const [activeTab, setActiveTab] = useState<'codes' | 'offers'>('codes');

    // Modal States
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);

    // Code State
    const [newCode, setNewCode] = useState({
        code: '', type: 'percentage' as const, value: 0,
        startDate: '', endDate: '', usageLimit: 0
    });

    // Offer State
    const [newOffer, setNewOffer] = useState({
        name: '', type: 'percentage' as const, value: 0,
        startDate: '', endDate: '', targetProductIds: [] as string[]
    });

    const [productSearch, setProductSearch] = useState('');

    const handleAddCode = () => {
        if (!newCode.code || newCode.value <= 0) return;
        addDiscountCode({
            id: Date.now().toString(),
            code: newCode.code.toUpperCase(),
            type: newCode.type,
            value: newCode.value,
            startDate: newCode.startDate || new Date().toISOString(),
            endDate: newCode.endDate || new Date(Date.now() + 86400000 * 30).toISOString(),
            usageCount: 0,
            active: true
        });
        showToast('تم إضافة كود الخصم بنجاح', 'success');
        setNewCode({ code: '', type: 'percentage', value: 0, startDate: '', endDate: '', usageLimit: 0 });
        setShowCodeModal(false);
    };

    const handleAddOffer = () => {
        if (!newOffer.name || newOffer.value <= 0) return;
        addOffer({
            id: Date.now().toString(),
            name: newOffer.name,
            type: newOffer.type,
            value: newOffer.value,
            startDate: newOffer.startDate || new Date().toISOString(),
            endDate: newOffer.endDate || new Date(Date.now() + 86400000 * 7).toISOString(),
            targetProductIds: newOffer.targetProductIds,
            usageCount: 0,
            isActive: true
        });
        showToast('تم إضافة العرض بنجاح', 'success');
        setNewOffer({ name: '', type: 'percentage', value: 0, startDate: '', endDate: '', targetProductIds: [] });
        setShowOfferModal(false);
    };

    const toggleProductSelection = (id: string) => {
        setNewOffer(prev => {
            const exists = prev.targetProductIds.includes(id);
            return {
                ...prev,
                targetProductIds: exists
                    ? prev.targetProductIds.filter(pid => pid !== id)
                    : [...prev.targetProductIds, id]
            };
        });
    };

    return (
        <div className="h-full flex flex-col font-stc animate-in fade-in p-6">
            {/* Tabs */}
            <div className="flex gap-3 mb-4">
                <button
                    onClick={() => setActiveTab('codes')}
                    className={`px-6 py-2.5 rounded-xl font-bold transition ${activeTab === 'codes' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
                >
                    أكواد الخصم
                </button>
                <button
                    onClick={() => setActiveTab('offers')}
                    className={`px-6 py-2.5 rounded-xl font-bold transition ${activeTab === 'offers' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
                >
                    عروض المنتجات
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 overflow-hidden flex flex-col">
                {activeTab === 'codes' ? (
                    <div className="flex flex-col h-full">
                        {/* Header with Add Button */}
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-bold text-slate-700">قائمة أكواد الخصم</h2>
                            {hasPermission('offers.manage') && (
                                <button
                                    onClick={() => setShowCodeModal(true)}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg"
                                >
                                    <Plus size={18} />
                                    إضافة كود خصم
                                </button>
                            )}
                        </div>

                        {/* Codes Grid */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {discountCodes.map(code => (
                                    <div key={code.id} className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl border-2 border-indigo-100 hover:border-indigo-300 transition shadow-sm hover:shadow-md">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-indigo-700 tracking-wider mb-2">{code.code}</h3>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-sm rounded-full font-bold">
                                                        {code.type === 'percentage' ? `${code.value}%` : `${code.value} ج.م`}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full font-bold">نشط</span>
                                                </div>
                                            </div>
                                            {hasPermission('offers.manage') && (
                                                <button
                                                    onClick={() => deleteDiscountCode(code.id)}
                                                    className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 text-sm text-slate-600">
                                            {code.startDate && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={13} />
                                                    <span className="text-xs">من: {new Date(code.startDate).toLocaleDateString('ar-EG')}</span>
                                                </div>
                                            )}
                                            {code.endDate && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={13} />
                                                    <span className="text-xs">إلى: {new Date(code.endDate).toLocaleDateString('ar-EG')}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 font-bold text-slate-700 pt-1.5 border-t border-indigo-100">
                                                <CheckCircle size={13} />
                                                <span className="text-xs">استخدم {code.usageCount || 0} مرة</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {discountCodes.length === 0 && (
                                    <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                        <Tag size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-lg">لا توجد أكواد خصم مضافة</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Header with Add Button */}
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-bold text-slate-700">قائمة العروض</h2>
                            {hasPermission('offers.manage') && (
                                <button
                                    onClick={() => setShowOfferModal(true)}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg"
                                >
                                    <Plus size={18} />
                                    إضافة عرض جديد
                                </button>
                            )}
                        </div>

                        {/* Offers Grid */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {offers?.map(offer => (
                                    <div key={offer.id} className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border-2 border-purple-100 hover:border-purple-300 transition shadow-sm hover:shadow-md">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-base font-bold text-slate-800 flex-1">{offer.name}</h3>
                                            {hasPermission('offers.manage') && (
                                                <button
                                                    onClick={() => deleteOffer(offer.id)}
                                                    className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-2xl font-bold text-purple-600">{offer.value}</span>
                                            <span className="text-xs font-medium text-slate-500">{offer.type === 'percentage' ? '%' : 'جنيه'}</span>
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mr-auto">خصم</span>
                                        </div>

                                        <div className="space-y-1.5 text-sm text-slate-600 mb-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={13} />
                                                <span className="text-xs">{new Date(offer.startDate).toLocaleDateString('ar-EG')} - {new Date(offer.endDate).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 font-bold text-slate-700">
                                                <CheckCircle size={13} />
                                                <span className="text-xs">استخدم {offer.usageCount || 0} مرة</span>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-purple-100 text-xs text-slate-500">
                                            <span className="font-bold">المنتجات المشمولة: </span>
                                            <span className="text-purple-600 font-bold">{offer.targetProductIds.length}</span>
                                        </div>
                                    </div>
                                ))}

                                {(!offers || offers.length === 0) && (
                                    <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                        <Tag size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-lg">لا توجد عروض نشطة حالياً</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Code Modal - Full Screen */}
            {showCodeModal && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-screen h-screen flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 shrink-0 bg-slate-50">
                            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                <Tag className="text-indigo-600" size={24} />
                                إضافة كود خصم جديد
                            </h3>
                            <button onClick={() => setShowCodeModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-6xl mx-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Column 1 */}
                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">الكود</label>
                                            <input
                                                type="text"
                                                placeholder="مثال: SAVE20"
                                                className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition outline-none text-lg font-bold tracking-wider"
                                                value={newCode.code}
                                                onChange={e => setNewCode({ ...newCode, code: e.target.value })}
                                                autoFocus
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-bold text-slate-700 mb-2 block">النوع</label>
                                                <select
                                                    className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition outline-none"
                                                    value={newCode.type}
                                                    onChange={e => setNewCode({ ...newCode, type: e.target.value as any })}
                                                >
                                                    <option value="percentage">نسبة مئوية (%)</option>
                                                    <option value="fixed">مبلغ ثابت</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-sm font-bold text-slate-700 mb-2 block">القيمة</label>
                                                <input
                                                    type="number"
                                                    className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition outline-none"
                                                    value={newCode.value}
                                                    onChange={e => setNewCode({ ...newCode, value: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2 */}
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-bold text-slate-700 mb-2 block">تاريخ البدء</label>
                                                <input
                                                    type="date"
                                                    className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition outline-none"
                                                    value={newCode.startDate}
                                                    onChange={e => setNewCode({ ...newCode, startDate: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-bold text-slate-700 mb-2 block">تاريخ الانتهاء</label>
                                                <input
                                                    type="date"
                                                    className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition outline-none"
                                                    value={newCode.endDate}
                                                    onChange={e => setNewCode({ ...newCode, endDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 border-t border-slate-200 shrink-0 bg-slate-50">
                            <button
                                onClick={handleAddCode}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg"
                            >
                                إضافة الكود
                            </button>
                            <button
                                onClick={() => setShowCodeModal(false)}
                                className="px-8 py-3 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Add Offer Modal - Full Screen */}
            {showOfferModal && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-screen h-screen flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 shrink-0 bg-slate-50">
                            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                <Tag className="text-purple-600" size={24} />
                                إضافة عرض جديد
                            </h3>
                            <button onClick={() => setShowOfferModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Content - 3 Column Layout */}
                        <div className="flex-1 p-6 overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                                {/* Left Column - Basic Info */}
                                <div className="space-y-4 flex flex-col">
                                    <h4 className="font-bold text-slate-700 border-b pb-2">معلومات العرض</h4>

                                    <div>
                                        <label className="text-sm font-bold text-slate-700 mb-2 block">اسم العرض</label>
                                        <input
                                            type="text"
                                            placeholder="مثال: خصم الصيف"
                                            className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition outline-none"
                                            value={newOffer.name}
                                            onChange={e => setNewOffer({ ...newOffer, name: e.target.value })}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">نوع الخصم</label>
                                            <select
                                                className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition outline-none"
                                                value={newOffer.type}
                                                onChange={e => setNewOffer({ ...newOffer, type: e.target.value as any })}
                                            >
                                                <option value="percentage">نسبة مئوية (%)</option>
                                                <option value="fixed">مبلغ ثابت</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">القيمة</label>
                                            <input
                                                type="number"
                                                className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition outline-none"
                                                value={newOffer.value}
                                                onChange={e => setNewOffer({ ...newOffer, value: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">تاريخ البدء</label>
                                            <input
                                                type="date"
                                                className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition outline-none"
                                                value={newOffer.startDate}
                                                onChange={e => setNewOffer({ ...newOffer, startDate: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">تاريخ الانتهاء</label>
                                            <input
                                                type="date"
                                                className="w-full p-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition outline-none"
                                                value={newOffer.endDate}
                                                onChange={e => setNewOffer({ ...newOffer, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Middle Column - Available Products */}
                                <div className="flex flex-col min-h-0">
                                    <div className="shrink-0 mb-3">
                                        <h4 className="font-bold text-slate-700 border-b pb-2 mb-3 flex items-center justify-between">
                                            <span>المنتجات المتاحة</span>
                                            <span className="text-sm bg-slate-100 px-2 py-1 rounded-full text-slate-600">
                                                {products.filter(p => !newOffer.targetProductIds.includes(p.id) &&
                                                    p.name.toLowerCase().includes(productSearch.toLowerCase())).length}
                                            </span>
                                        </h4>
                                        <input
                                            type="text"
                                            placeholder="ابحث عن المنتجات..."
                                            className="w-full p-2.5 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition outline-none text-sm"
                                            value={productSearch}
                                            onChange={e => setProductSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto border-2 border-slate-200 rounded-lg p-3 bg-slate-50">
                                        {products
                                            .filter(p => !newOffer.targetProductIds.includes(p.id))
                                            .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                            .map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => toggleProductSelection(p.id)}
                                                    className="p-2.5 bg-white hover:bg-purple-50 cursor-pointer rounded-lg border border-slate-200 hover:border-purple-300 transition flex justify-between items-center group text-sm"
                                                >
                                                    <span className="font-medium text-slate-700 group-hover:text-purple-700 truncate">{p.name}</span>
                                                    <Plus size={16} className="text-purple-600 opacity-0 group-hover:opacity-100 transition shrink-0" />
                                                </div>
                                            ))
                                        }
                                        {products.filter(p => !newOffer.targetProductIds.includes(p.id) &&
                                            p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                                                <div className="p-8 text-center text-slate-400 text-sm">لا توجد منتجات متاحة</div>
                                            )}
                                    </div>
                                </div>

                                {/* Right Column - Selected Products */}
                                <div className="flex flex-col min-h-0">
                                    <div className="shrink-0">
                                        <h4 className="font-bold text-purple-700 border-b border-purple-200 pb-2 mb-3 flex items-center justify-between">
                                            <span>المنتجات المحددة</span>
                                            <span className="text-sm bg-purple-100 px-2 py-1 rounded-full">
                                                {newOffer.targetProductIds.length}
                                            </span>
                                        </h4>

                                        {newOffer.targetProductIds.length > 0 && (
                                            <button
                                                onClick={() => setNewOffer({ ...newOffer, targetProductIds: [] })}
                                                className="text-xs text-red-500 hover:underline mb-2"
                                            >
                                                مسح الكل
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto border-2 border-purple-200 bg-purple-50/30 rounded-lg p-3">
                                        {newOffer.targetProductIds.map(id => {
                                            const p = products.find(prod => prod.id === id);
                                            return (
                                                <div
                                                    key={id}
                                                    className="p-2.5 bg-white hover:bg-red-50 cursor-pointer rounded-lg border border-purple-200 hover:border-red-300 transition flex justify-between items-center group text-sm"
                                                    onClick={() => toggleProductSelection(id)}
                                                >
                                                    <span className="font-medium text-purple-700 group-hover:text-red-600 truncate">{p?.name}</span>
                                                    <XCircle size={16} className="text-red-500 opacity-0 group-hover:opacity-100 transition shrink-0" />
                                                </div>
                                            );
                                        })}
                                        {newOffer.targetProductIds.length === 0 && (
                                            <div className="p-8 text-center text-slate-400 text-sm">لم يتم تحديد منتجات بعد</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 border-t border-slate-200 shrink-0 bg-slate-50">
                            <button
                                onClick={handleAddOffer}
                                className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition shadow-lg"
                            >
                                إضافة العرض
                            </button>
                            <button
                                onClick={() => setShowOfferModal(false)}
                                className="px-8 py-3 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
