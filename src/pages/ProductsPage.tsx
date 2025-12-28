import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import { useScanDetection } from '../hooks/useScanDetection';
import { CameraScanner } from '../components/CameraScanner';
import { ConfirmDialog, AccessDenied } from '../components/UIComponents';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Edit2, Trash2, X,
    Barcode, Package, AlertTriangle, Check, Camera
} from 'lucide-react';

const getStockStatus = (stock: number, min: number) => {
    if (stock <= 0) return { label: 'نفد المخزون', color: 'bg-red-100 text-red-700', icon: X };
    if (stock <= min) return { label: 'منخفض', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
    return { label: 'متوفر', color: 'bg-green-100 text-green-700', icon: Check };
};

const ProductRow = React.memo(({ product, currency, canEdit, canDelete, onEdit, onDelete }: any) => {
    const stockStatus = getStockStatus(product.stock, product.minStockLevel || 5);
    const StockIcon = stockStatus.icon;

    return (
        <tr className="hover:bg-slate-50/80 transition-colors group">
            <td className="p-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden">
                        {product.image ? <img src={product.image} className="w-full h-full object-cover" alt={product.name} loading="lazy" /> : product.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm break-words whitespace-normal max-w-[200px] sm:max-w-xs">{product.name}</h3>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block border border-slate-200">
                            {product.category}
                        </span>
                    </div>
                </div>
            </td>
            <td className="p-5 font-mono text-sm text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded border border-slate-200 w-fit">
                    <Barcode size={16} className="text-slate-400" />
                    {product.barcode || '---'}
                </div>
            </td>
            <td className="p-5">
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{product.price.toLocaleString()} {currency}</span>
                    {product.costPrice > 0 && <span className="text-xs text-slate-400">التكلفة: {product.costPrice}</span>}
                </div>
            </td>
            <td className="p-5">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${stockStatus.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ')}`}>
                    <StockIcon size={14} />
                    {stockStatus.label} ({product.stock})
                </div>
            </td>
            <td className="p-5">
                <div className="flex items-center justify-center gap-2">
                    {canEdit && (
                        <button
                            onClick={onEdit}
                            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-100"
                            title="تعديل"
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={onDelete}
                            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-100"
                            title="حذف"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
});

export const ProductsPage: React.FC = () => {
    const navigate = useNavigate();
    const { products, deleteProduct, settings, hasPermission } = useStore();

    if (!hasPermission('products.view')) return <AccessDenied />;
    const { showToast } = useUI();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Confirm Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Camera State
    const [showCamera, setShowCamera] = useState(false);

    const handleScan = (code: string) => {
        setSearchTerm(code);
        const found = products.find(p => p.barcode === code);
        if (found) showToast(`تم العثور على: ${found.name}`, 'success');
        else showToast('لم يتم العثور على منتج بهذا الباركود', 'warning');
        setShowCamera(false);
    };

    useScanDetection({ onScan: handleScan });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Reset pagination when search or filter changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory]);

    // Scroll to top when page changes
    React.useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    const categories = React.useMemo(() => {
        return ['All', ...Array.from(new Set(products.map(p => p.category)))];
    }, [products]);

    const filteredProducts = React.useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.includes(searchTerm) || (p.barcode && p.barcode.includes(searchTerm));
            const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, filterCategory]);

    const totalPages = React.useMemo(() => Math.ceil(filteredProducts.length / itemsPerPage), [filteredProducts.length]);

    const paginatedProducts = React.useMemo(() => {
        return filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredProducts, currentPage, itemsPerPage]);

    const confirmDelete = () => {
        if (deleteId) {
            deleteProduct(deleteId);
            showToast('تم حذف المنتج', 'info');
            setDeleteId(null);
        }
    };



    return (
        <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500 p-6">
            {/* Toolbar with Actions */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 flex-none">
                <div className="flex w-full gap-2">
                    {hasPermission('products.add') && (
                        <button
                            onClick={() => navigate('/products/new')}
                            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition shadow-md font-bold whitespace-nowrap"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline">منتج جديد</span>
                        </button>
                    )}

                    <button
                        onClick={() => setShowCamera(true)}
                        className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition shadow-md"
                        title="مسح بالكاميرا"
                    >
                        <Camera size={20} />
                    </button>

                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="بحث باسم المنتج، الباركود..."
                            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex-grow md:flex-grow-0 border ${filterCategory === cat
                                ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {cat === 'All' ? 'الكل' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 overflow-auto flex flex-col">
                <div ref={scrollContainerRef} className="flex-1 overflow-auto">
                    <table className="w-full text-right relative">
                        <thead className="bg-slate-50/95 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <tr>
                                <th className="p-5">تفاصيل المنتج</th>
                                <th className="p-5">الباركود / SKU</th>
                                <th className="p-5">التسعير</th>
                                <th className="p-5">حالة المخزون</th>
                                <th className="p-5 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedProducts.map((product) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    currency={settings.currency}
                                    canEdit={hasPermission('products.edit')}
                                    canDelete={hasPermission('products.delete')}
                                    onEdit={() => navigate(`/products/edit/${product.id}`)}
                                    onDelete={() => setDeleteId(product.id)}
                                />
                            ))}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/50">
                            <Package size={64} className="mb-4 text-slate-300" />
                            <p className="text-lg font-medium text-slate-500">لا توجد منتجات مطابقة للبحث</p>
                            <button onClick={() => { setSearchTerm(''); setFilterCategory('All'); }} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">
                                مسح الفلاتر
                            </button>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
                        <div className="text-sm text-slate-500 font-bold">
                            صفحة {currentPage} من {totalPages} (إجمالي {filteredProducts.length} منتج)
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                            >
                                السابق
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                            >
                                التالي
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Camera Full Screen Overlay */}
            {showCamera && (
                <CameraScanner
                    onScan={handleScan}
                    onClose={() => setShowCamera(false)}
                />
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteId}
                title="حذف المنتج"
                message="هل أنت متأكد من رغبتك في حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
                isDangerous
                confirmText="حذف المنتج"
            />
        </div>
    );
};
