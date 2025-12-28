import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI'; // Toasts
import type { Order } from '../store/useStore';
import { ConfirmDialog, AccessDenied } from '../components/UIComponents'; // Custom Confirm & AccessDenied
import { FileText, Search, ArrowDownUp, CheckCircle, Eye, RefreshCcw, X, Minus, Plus, AlertTriangle } from 'lucide-react';
import { ReceiptTemplate } from '../components/ReceiptTemplate';

export const SalesPage: React.FC = () => {
    const { orders, customers, returnOrderItems, settings, hasPermission } = useStore();

    if (!hasPermission('sales.view')) return <AccessDenied />;
    const { showToast } = useUI();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Partial Return State
    const [isReturnMode, setIsReturnMode] = useState(false);
    const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

    // Confirmation State
    const [showConfirmReturn, setShowConfirmReturn] = useState(false);

    // Print Logic
    const handlePrint = () => {
        if (!selectedOrder) return;

        // Prepare data for the print window to avoid store hydration issues
        const printData = {
            order: selectedOrder,
            settings: settings,
            customerName: getCustomerName(selectedOrder.customerId)
        };

        // Save to sessionStorage
        sessionStorage.setItem(`print_data_${selectedOrder.id}`, JSON.stringify(printData));

        // Open print window
        window.open(`/print-receipt/${selectedOrder.id}`, '_blank', 'width=600,height=800');

        showToast('جاري فتح نافذة الطباعة...', 'info');
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
        setIsReturnMode(false);
        setReturnQuantities({});
    };

    const toggleReturnMode = () => {
        setIsReturnMode(!isReturnMode);
        setReturnQuantities({});
    };

    const handleQuantityChange = (itemId: string, max: number, delta: number) => {
        setReturnQuantities(prev => {
            const current = prev[itemId] || 0;
            const newValue = Math.min(Math.max(0, current + delta), max);
            if (newValue === 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: newValue };
        });
    };

    const triggerConfirmReturn = () => {
        if (Object.keys(returnQuantities).length === 0) return;
        setShowConfirmReturn(true);
    };

    const processReturn = () => {
        if (!selectedOrder) return;
        const itemsToReturn = Object.entries(returnQuantities).map(([itemId, qty]) => ({
            itemId, quantity: qty
        }));

        returnOrderItems(selectedOrder.id, itemsToReturn);

        // UI Updates
        showToast('تم استرجاع الأصناف وإعادة المخزون', 'success');
        setShowConfirmReturn(false);
        setIsDetailsOpen(false);
        setIsReturnMode(false);
        setReturnQuantities({});
    };

    const getCustomerName = (id?: string) => {
        if (!id) return 'عميل نقدي';
        return customers.find(c => c.id === id)?.name || 'غير معروف';
    };

    const currentReturnCount = Object.values(returnQuantities).reduce((a, b) => a + b, 0);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const toggleSort = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    };

    return (
        <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500 p-6">
            {/* Hidden Print Component - Will be visible on print via CSS */}
            {/* Receipt Template - Visible only during print via CSS */}
            {selectedOrder && (
                <ReceiptTemplate
                    order={selectedOrder}
                    settings={settings}
                    customerName={getCustomerName(selectedOrder.customerId)}
                />
            )}

            {/* Stats & Title Replacement */}
            <div className="flex flex-wrap items-center justify-between gap-4 flex-none">
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 flex-1 md:flex-none">
                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                            <FileText size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 font-bold">عدد الطلبات</span>
                            <span className="font-bold text-lg text-slate-800">{orders.filter(o => o.status !== 'returned').length}</span>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 flex-1 md:flex-none">
                        <div className="bg-green-50 p-2 rounded-lg text-green-600">
                            <CheckCircle size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 font-bold">إجمالي الدخل</span>
                            <span className="font-bold text-lg text-green-600">
                                {orders.filter(o => o.status !== 'returned').reduce((acc, curr) => acc + curr.total, 0).toLocaleString()} {settings.currency}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 bg-white rounded-xl shadow-sm border border-slate-100">
                    <Search className="absolute right-3 top-3.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="بحث برقم الفاتورة..."
                        className="w-full pl-4 pr-10 py-3 rounded-xl focus:outline-none"
                        dir="auto"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    onClick={toggleSort}
                    className={`bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition ${sortOrder === 'asc' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : ''}`}
                >
                    <ArrowDownUp size={18} className={sortOrder === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                    <span>{sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
                </button>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex-1 overflow-auto">
                <table className="w-full text-right font-stc relative">
                    <thead className="bg-slate-50/95 text-slate-500 text-sm sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                        <tr>
                            <th className="p-4">رقم الفاتورة</th>
                            <th className="p-4">العميل</th>
                            <th className="p-4">التاريخ</th>
                            <th className="p-4">عدد الأصناف</th>
                            <th className="p-4">طريقة الدفع</th>
                            <th className="p-4">الإجمالي</th>
                            <th className="p-4">الحالة</th>
                            <th className="p-4 text-center">عرض</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOrders.map((order) => {
                            const statusConfig = {
                                'returned': { color: 'bg-red-100 text-red-600', text: 'مرتجع بالكامل', icon: RefreshCcw },
                                'partially_returned': { color: 'bg-orange-100 text-orange-600', text: 'مرتجع جزئي', icon: AlertTriangle },
                                'completed': { color: 'bg-green-100 text-green-600', text: 'مكتمل', icon: CheckCircle },
                                undefined: { color: 'bg-green-100 text-green-600', text: 'مكتمل', icon: CheckCircle }
                            }[order.status || 'completed'];
                            const StatusIcon = statusConfig.icon;

                            return (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-4 font-bold text-indigo-600 flex items-center gap-2">
                                        <FileText size={16} />
                                        #{order.id.slice(-6).toUpperCase()}
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm font-medium">
                                        {getCustomerName(order.customerId)}
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm">
                                        {new Date(order.date).toLocaleString('ar-EG')}
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {order.items.length > 0 ? order.items.reduce((a, b) => a + b.quantity, 0) : '-'} عنصر
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {order.paymentMethod === 'cash' ? 'كاش' : 'آجل'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-slate-800">
                                        {order.total.toLocaleString()} {settings.currency}
                                    </td>
                                    <td className="p-4">
                                        <div className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg w-fit ${statusConfig.color}`}>
                                            <StatusIcon size={14} />
                                            {statusConfig.text}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const printData = {
                                                        order: order,
                                                        settings: settings,
                                                        customerName: getCustomerName(order.customerId)
                                                    };
                                                    sessionStorage.setItem(`print_data_${order.id}`, JSON.stringify(printData));
                                                    window.open(`/print-receipt/${order.id}`, '_blank', 'width=600,height=800');
                                                }}
                                                className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
                                                title="طباعة"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleViewDetails(order)}
                                                className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition"
                                                title="عرض التفاصيل"
                                            >
                                                <Eye size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {filteredOrders.length === 0 && (
                    <div className="p-10 text-center text-slate-400">لا يوجد سجل مبيعات يطابق البحث</div>
                )}
            </div>

            {/* INVOICE DETAILS MODAL */}
            {isDetailsOpen && selectedOrder && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200 font-stc">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">

                        {/* Header */}
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-bold text-slate-800">فاتورة #{selectedOrder.id.slice(-6).toUpperCase()}</h2>
                                </div>
                                <p className="text-sm text-slate-500">{new Date(selectedOrder.date).toLocaleString('ar-EG')}</p>
                            </div>
                            <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={20} /></button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Customer Info */}
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-indigo-900 text-sm mb-1">العميل</h4>
                                    <span className="text-indigo-700 font-medium">{getCustomerName(selectedOrder.customerId)}</span>
                                </div>
                                <span className="text-xs bg-white px-2 py-1 rounded text-indigo-600 border border-indigo-200 font-bold">
                                    {selectedOrder.paymentMethod === 'cash' ? 'دفع نقدي' : 'دفع آجل'}
                                </span>
                            </div>

                            {/* Products List with Refund Logic */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-slate-700">المنتجات</h4>
                                    {isReturnMode && <span className="text-xs text-red-500 font-bold animate-pulse">حدد الكميات المراد إرجاعها</span>}
                                </div>

                                <div className="border border-slate-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-slate-50 text-slate-500">
                                            <tr>
                                                <th className="p-3">المنتج</th>
                                                <th className="p-3">السعر</th>
                                                <th className="p-3 text-center">الكمية المشتراة</th>
                                                <th className="p-3 text-center text-red-500">م. سابقاً</th>
                                                {isReturnMode && <th className="p-3 text-center bg-red-50 text-red-600">إرجاع الآن</th>}
                                                {!isReturnMode && <th className="p-3">الإجمالي</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedOrder.items.map((item, idx) => {
                                                const availableToReturn = item.quantity - (item.returnedQuantity || 0);
                                                const currentReturnQty = returnQuantities[item.id] || 0;

                                                return (
                                                    <tr key={idx} className={currentReturnQty > 0 ? 'bg-red-50/50' : ''}>
                                                        <td className="p-3 font-medium text-slate-800">{item.name}</td>
                                                        <td className="p-3">{item.price}</td>
                                                        <td className="p-3 text-center font-bold">{item.quantity}</td>
                                                        <td className="p-3 text-center text-red-400 font-mono">{item.returnedQuantity || '-'}</td>

                                                        {isReturnMode ? (
                                                            <td className="p-3 bg-red-50">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        disabled={currentReturnQty <= 0}
                                                                        onClick={() => handleQuantityChange(item.id, availableToReturn, -1)}
                                                                        className="w-6 h-6 rounded bg-white border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-100 disabled:opacity-50"
                                                                    >
                                                                        <Minus size={14} />
                                                                    </button>
                                                                    <span className="font-bold w-4 text-center">{currentReturnQty}</span>
                                                                    <button
                                                                        disabled={currentReturnQty >= availableToReturn}
                                                                        onClick={() => handleQuantityChange(item.id, availableToReturn, 1)}
                                                                        className="w-6 h-6 rounded bg-white border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-100 disabled:opacity-50"
                                                                    >
                                                                        <Plus size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        ) : (
                                                            <td className="p-3 font-bold">{item.price * item.quantity}</td>
                                                        )}
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            {!isReturnMode && (
                                <div className="flex justify-end">
                                    <div className="w-1/2 space-y-2">
                                        <div className="flex justify-between font-bold text-xl text-slate-800 border-t pt-2">
                                            <span>الإجمالي النهائي:</span>
                                            <span>{selectedOrder.total.toFixed(2)} {settings.currency}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-4">
                            {!isReturnMode ? (
                                <>
                                    <button
                                        onClick={handlePrint}
                                        className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                    >
                                        <FileText size={18} />
                                        طباعة الفاتورة
                                    </button>
                                    {selectedOrder.status !== 'returned' && hasPermission('sales.return') && (
                                        <button
                                            onClick={toggleReturnMode}
                                            className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 flex items-center gap-2 transition"
                                        >
                                            <RefreshCcw size={18} />
                                            استرجاع أصناف
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={toggleReturnMode}
                                        className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={triggerConfirmReturn}
                                        disabled={currentReturnCount === 0}
                                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle size={18} />
                                        تأكيد استرجاع المحدد ({currentReturnCount})
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={showConfirmReturn}
                title="تأكيد الاسترجاع"
                message={`هل أنت متأكد من استرجاع ${currentReturnCount} أصناف؟ سيتم إعادة الكمية للمخزون واسترجاع المبلغ للعميل.`}
                isDangerous
                confirmText="نعم، استرجاع"
                onConfirm={processReturn}
                onCancel={() => setShowConfirmReturn(false)}
            />
        </div>
    );
};
