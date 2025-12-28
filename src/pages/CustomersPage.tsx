import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import type { Customer, Order } from '../store/useStore';
import {
    Users, UserPlus, Search, Wallet, FileText, ArrowDownLeft, X, Phone, Clock, Eye, AlertCircle, Edit
} from 'lucide-react';


import { AccessDenied } from '../components/UIComponents';

export const CustomersPage: React.FC = () => {
    const { customers, orders, addCustomer, updateCustomer, addCustomerTransaction, settings, hasPermission } = useStore();

    if (!hasPermission('customers.manage')) return <AccessDenied />;
    const { showToast } = useUI();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);

    const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Customer>>({
        name: '', phone: '', maxDebtLimit: 0, nextPaymentDate: ''
    });

    const [selectedCustomerForPay, setSelectedCustomerForPay] = useState<Customer | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const filteredCustomers = customers.filter(c =>
        c.name.includes(searchTerm) || c.phone.includes(searchTerm)
    );

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Scroll to top when page changes
    React.useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    const openAddModal = () => {
        setEditingId(null);
        setFormData({ name: '', phone: '', maxDebtLimit: 0, nextPaymentDate: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingId(customer.id);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            maxDebtLimit: customer.maxDebtLimit || 0,
            nextPaymentDate: customer.nextPaymentDate || ''
        });
        setIsModalOpen(true);
    };

    const handleSaveCustomer = () => {
        if (!formData.name) return;
        if (editingId) {
            updateCustomer(editingId, formData);
            showToast('تم تحديث بيانات العميل', 'success');
        } else {
            addCustomer({
                id: Date.now().toString(),
                name: formData.name!,
                phone: formData.phone || '',
                totalDebt: 0,
                transactions: [],
                maxDebtLimit: formData.maxDebtLimit,
                nextPaymentDate: formData.nextPaymentDate
            });
            showToast('تم إضافة العميل بنجاح', 'success');
        }
        setIsModalOpen(false);
    };

    const handlePayment = () => {
        if (!selectedCustomerForPay || !paymentAmount) return;
        const amount = Number(paymentAmount);
        addCustomerTransaction(selectedCustomerForPay.id, {
            id: `TRX-${Date.now()}`,
            date: new Date().toISOString(),
            type: 'payment',
            amount: amount,
            note: 'سداد نقدي من العميل'
        });
        showToast('تم تسجيل الدفعة بنجاح', 'success');
        setIsPayModalOpen(false);
        setPaymentAmount('');
        setSelectedCustomerForPay(null);
    };

    const openPayModal = (customer: Customer, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCustomerForPay(customer);
        setIsPayModalOpen(true);
    };

    const openStatement = (customer: Customer) => {
        setViewingCustomer(customer);
    };

    const openInvoiceDetails = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order) setViewingOrder(order);
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-4 font-stc animate-in fade-in duration-500 overflow-hidden">
            {/* Info Cards - Compact */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-none">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs mb-1 font-bold">إجمالي الديون</p>
                        <h3 className="text-xl font-bold text-red-500">
                            {customers.reduce((sum, c) => sum + c.totalDebt, 0).toLocaleString()} <span className="text-xs">{settings.currency}</span>
                        </h3>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg text-red-500">
                        <ArrowDownLeft size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs mb-1 font-bold">عدد العملاء</p>
                        <h3 className="text-xl font-bold text-slate-800">{customers.length}</h3>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-500">
                        <Users size={20} />
                    </div>
                </div>

                <button
                    onClick={openAddModal}
                    className="col-span-2 bg-indigo-600 text-white px-6 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 hover:bg-indigo-700 transition group"
                >
                    <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition">
                        <UserPlus size={20} />
                    </div>
                    <span className="font-bold">إضافة عميل جديد</span>
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 flex-none">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="بحث باسم العميل أو رقم الهاتف..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 h-full py-2" // Added h-full and py-2
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List - Compact Grid - SCROLLABLE CONTAINER */}
            <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto pr-2 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                    {paginatedCustomers.map(customer => {
                        const isOverLimit = customer.maxDebtLimit && customer.totalDebt > customer.maxDebtLimit;
                        return (
                            <div key={customer.id} className={`bg-white rounded-xl border ${isOverLimit ? 'border-red-200' : 'border-slate-200'} shadow-sm hover:shadow-md transition group overflow-hidden flex flex-col h-full min-h-[160px]`}>

                                {/* Header: Name & Edit */}
                                <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex justify-between items-start">
                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${customer.totalDebt > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {customer.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-slate-800 text-base leading-tight break-words whitespace-normal mb-1">
                                                {customer.name}
                                            </h3>
                                            <span className="text-xs text-slate-500 block">{customer.phone || '---'}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => openEditModal(customer)} className="text-slate-400 hover:text-indigo-600 p-1 shrink-0"><Edit size={16} /></button>
                                </div>

                                {/* Body: Debt Info */}
                                <div className="p-4 flex-1 flex flex-col justify-center gap-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm text-slate-500 font-medium">الرصيد الحالي</span>
                                        <span className={`font-bold text-lg ${(customer.totalDebt || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {(customer.totalDebt || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    {isOverLimit && <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-center block w-full">تجاوز الحد ({customer.maxDebtLimit})</span>}
                                </div>

                                {/* Actions */}
                                <div className="p-2 border-t border-slate-100 grid grid-cols-2 gap-2 mt-auto">
                                    <button
                                        onClick={(e) => openPayModal(customer, e)}
                                        className="py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-bold text-sm transition flex items-center justify-center gap-2"
                                        title="سداد"
                                    >
                                        <Wallet size={16} />
                                        سداد
                                    </button>
                                    <button
                                        onClick={() => openStatement(customer)}
                                        className="py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-bold text-sm transition flex items-center justify-center gap-2"
                                        title="كشف حساب"
                                    >
                                        <FileText size={16} />
                                        كشف
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between py-3 pt-4 border-t border-slate-200 bg-white mt-auto shrink-0 z-10">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    >
                        السابق
                    </button>
                    <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        الصفحة {currentPage} من {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    >
                        التالي
                    </button>
                </div>
            )}

            {/* Modals */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl">{editingId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">اسم العميل <span className="text-red-500">*</span></label>
                                    <input type="text" className="w-full p-3 border rounded-xl font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                                    <input type="text" className="w-full p-3 border rounded-xl" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                                <h4 className="font-bold text-sm text-indigo-900 border-b border-indigo-100 pb-2 mb-2 flex items-center gap-2"><AlertCircle size={16} /> ضوابط الديون</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">الحد الأقصى للدين</label>
                                        <input type="number" className="w-full p-3 border rounded-xl" placeholder="0 = مفتوح" value={formData.maxDebtLimit} onChange={e => setFormData({ ...formData, maxDebtLimit: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">موعد السداد القادم</label>
                                        <input type="date" className="w-full p-3 border rounded-xl" value={formData.nextPaymentDate} onChange={e => setFormData({ ...formData, nextPaymentDate: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleSaveCustomer} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 mt-4 shadow-lg shadow-indigo-500/20">حفظ البيانات</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Customer Statement Modal */}
            {viewingCustomer && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right text-slate-800 animate-in zoom-in-95">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-bold text-2xl">
                                    {viewingCustomer.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{viewingCustomer.name}</h2>
                                    <p className="text-slate-400 text-sm flex items-center gap-2">
                                        <Phone size={14} /> {viewingCustomer.phone}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setViewingCustomer(null)} className="p-2 hover:bg-white/10 rounded-full transition"><X size={24} /></button>
                        </div>
                        <div className="grid grid-cols-3 divide-x divide-x-reverse border-b border-slate-100 bg-slate-50">
                            <div className="p-4 text-center">
                                <p className="text-slate-500 text-xs font-bold mb-1">إجمالي المشتريات</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {(viewingCustomer.transactions || []).filter(t => t.type === 'purchase').reduce((a, b) => a + b.amount, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-4 text-center">
                                <p className="text-slate-500 text-xs font-bold mb-1">إجمالي المسدد</p>
                                <p className="text-lg font-bold text-green-600">
                                    {(viewingCustomer.transactions || []).filter(t => t.type === 'payment').reduce((a, b) => a + b.amount, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-4 text-center bg-red-50/50">
                                <p className="text-slate-500 text-xs font-bold mb-1">متبقي عليه (دين)</p>
                                <p className="text-xl font-bold text-red-600">
                                    {(viewingCustomer.totalDebt || 0).toLocaleString()} {settings.currency}
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Clock size={18} />
                                سجل العمليات
                            </h4>
                            <div className="space-y-3 relative before:absolute before:right-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200">
                                {viewingCustomer.transactions.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((trx, idx) => (
                                    <div key={idx} className="relative pr-10">
                                        <div className={`absolute right-3 top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${trx.type === 'purchase' ? 'bg-indigo-500' : trx.type === 'payment' ? 'bg-green-500' : 'bg-orange-500'
                                            }`} />
                                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${trx.type === 'purchase' ? 'bg-indigo-100 text-indigo-700' : trx.type === 'payment' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {trx.type === 'purchase' ? 'فاتورة شراء' : trx.type === 'payment' ? 'دفعة سداد' : 'مرتجع'}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{new Date(trx.date).toLocaleString('ar-EG')}</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-700">{trx.note || '---'}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`font-bold text-lg ${trx.type === 'payment' || trx.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {trx.type === 'payment' || trx.type === 'refund' ? '-' : '+'} {trx.amount} {settings.currency}
                                                </span>
                                                {trx.orderId && (
                                                    <button
                                                        onClick={() => openInvoiceDetails(trx.orderId!)}
                                                        className="p-2 hover:bg-slate-100 text-indigo-600 rounded-lg transition"
                                                        title="عرض تفاصيل الفاتورة"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Viewing Invoice Modal */}
            {viewingOrder && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in text-right">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold">تفاصيل الفاتورة #{viewingOrder.id.slice(-6).toUpperCase()}</h3>
                            <button onClick={() => setViewingOrder(null)} className="p-1 hover:bg-slate-200 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                            {viewingOrder.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0">
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">{item.name}</p>
                                        <p className="text-xs text-slate-500">{item.quantity} × {item.price}</p>
                                    </div>
                                    <span className="font-bold">{item.quantity * item.price}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between font-bold">
                            <span>الإجمالي</span>
                            <span>{viewingOrder.total} {settings.currency}</span>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Pay Modal */}
            {isPayModalOpen && selectedCustomerForPay && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 text-right animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                        <h3 className="font-bold text-xl mb-4 text-center">سداد دفعة من العميل <br /><span className="text-indigo-600">{selectedCustomerForPay.name}</span></h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">المبلغ المدفوع</label>
                                <input type="number" placeholder="0.00" className="w-full p-4 border rounded-xl text-center text-2xl font-bold text-green-600 focus:ring-2 focus:ring-green-500 outline-none" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} autoFocus />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button onClick={() => setIsPayModalOpen(false)} className="py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">إلغاء</button>
                                <button onClick={handlePayment} className="py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-500/20 transition">تأكيد السداد</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
