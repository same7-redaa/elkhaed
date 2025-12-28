import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { Supplier } from '../store/useStore';
import {
    Users,
    Search,
    Plus,
    Edit,
    Trash2,
    DollarSign,
    History,
    ArrowUpRight,
    ArrowDownLeft,
    FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { createPortal } from 'react-dom';

export const SuppliersPage: React.FC = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier, addSupplierTransaction, hasPermission } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<Supplier | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

    const selectedSupplier = useMemo(() =>
        suppliers.find(s => s.id === selectedSupplierId) || null
        , [suppliers, selectedSupplierId]);

    // Filters and Sorting
    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.phone.includes(searchTerm)
        );
    }, [suppliers, searchTerm]);

    const handleAddSupplier = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newSupplier: Supplier = {
            id: `sup-${Date.now()}`,
            name: formData.get('name') as string,
            phone: formData.get('phone') as string,
            contactPerson: formData.get('contactPerson') as string || undefined,
            totalDebt: 0,
            transactions: []
        };
        addSupplier(newSupplier);
        setIsAddModalOpen(false);
    };

    const handleUpdateSupplier = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedSupplierForEdit) return;
        const formData = new FormData(e.currentTarget);
        updateSupplier(selectedSupplierForEdit.id, {
            name: formData.get('name') as string,
            phone: formData.get('phone') as string,
            contactPerson: formData.get('contactPerson') as string || undefined,
        });
        setSelectedSupplierForEdit(null);
    };

    const handleDeleteSupplier = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المورد؟')) {
            deleteSupplier(id);
            if (selectedSupplierId === id) setSelectedSupplierId(null);
        }
    };

    if (!hasPermission('suppliers.manage')) {
        return <div className="p-8 text-center text-slate-500">ليس لديك صلاحية لإدارة الموردين</div>;
    }

    return (
        <div className="p-6 space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">إدارة الموردين</h1>
                    <p className="text-slate-500 text-sm mt-1">سجل الموردين والمشتريات الآجلة</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm font-bold"
                >
                    <Plus size={20} />
                    مورد جديد
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-bold">إجمالي الموردين</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{suppliers.length}</p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
                        <Users size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-bold">إجمالي الديون (للموردين)</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">
                            {suppliers.reduce((acc, s) => acc + s.totalDebt, 0).toLocaleString()} <span className="text-sm">ج.م</span>
                        </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-red-600">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="بحث باسم المورد أو رقم الهاتف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 p-1">
                    <table className="w-full text-right relative">
                        <thead className="bg-slate-50 text-slate-500 font-bold text-sm sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4">المورد</th>
                                <th className="p-4">رقم الهاتف</th>
                                <th className="p-4">إجمالي الديون</th>
                                <th className="p-4">أخر تحديث</th>
                                <th className="p-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSuppliers.map(supplier => (
                                <tr
                                    key={supplier.id}
                                    className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                                    onClick={() => setSelectedSupplierId(supplier.id)}
                                >
                                    <td className="p-4 font-bold text-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                                {supplier.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p>{supplier.name}</p>
                                                {supplier.contactPerson && <p className="text-xs text-slate-400 font-normal">{supplier.contactPerson}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600 font-mono text-sm">{supplier.phone}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${supplier.totalDebt > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {supplier.totalDebt.toLocaleString()} ج.م
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 text-xs">
                                        {supplier.transactions.length > 0
                                            ? format(new Date(supplier.transactions[0].date), 'dd/MM/yyyy', { locale: ar })
                                            : '-'
                                        }
                                    </td>
                                    <td className="p-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedSupplierForEdit(supplier); }}
                                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                                            title="تعديل"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteSupplier(supplier.id); }}
                                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                                            title="حذف"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredSuppliers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={32} className="opacity-20" />
                                            <p>لا توجد نتائج مطابقة لبحثك</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {isAddModalOpen && (
                <SupplierFormModal
                    title="إضافة مورد جديد"
                    onSubmit={handleAddSupplier}
                    onClose={() => setIsAddModalOpen(false)}
                />
            )}
            {selectedSupplierForEdit && (
                <SupplierFormModal
                    title="تعديل بيانات المورد"
                    initialData={selectedSupplierForEdit}
                    onSubmit={handleUpdateSupplier}
                    onClose={() => setSelectedSupplierForEdit(null)}
                />
            )}

            {/* Details Modal (Replaces Side Panel) */}
            {selectedSupplier && (
                <ModalPortal>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <SupplierDetails
                            supplier={selectedSupplier}
                            addTransaction={addSupplierTransaction}
                            onClose={() => setSelectedSupplierId(null)}
                        />
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

const SupplierDetails = ({ supplier, addTransaction, onClose }: { supplier: Supplier, addTransaction: any, onClose: () => void }) => {
    const [transactionType, setTransactionType] = useState<'purchase' | 'payment'>('purchase');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const handleTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        addTransaction(supplier.id, {
            id: `trx-${Date.now()}`,
            date: new Date().toISOString(),
            type: transactionType,
            amount: Number(amount),
            note
        });
        setAmount('');
        setNote('');
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-start shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
                        {supplier.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{supplier.name}</h2>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                            {supplier.phone}
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            {supplier.totalDebt > 0 ? <span className="text-red-500 font-bold">مدين</span> : <span className="text-emerald-500 font-bold">خالص</span>}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
                    <span className="text-xl leading-none block h-5 w-5 flex items-center justify-center">&times;</span>
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Transaction Form Section */}
                <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-l border-slate-200 bg-white overflow-y-auto">
                    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <p className="text-sm font-bold text-slate-500 mb-1">الرصيد المستحق (للمورد)</p>
                        <div className={`text-3xl font-bold ${supplier.totalDebt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {supplier.totalDebt.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">جنيه مصري</p>
                    </div>

                    <h3 className="font-bold text-slate-800 mb-4">إضافة معاملة</h3>
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                        <button
                            onClick={() => setTransactionType('purchase')}
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${transactionType === 'purchase' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            شراء (دين)
                        </button>
                        <button
                            onClick={() => setTransactionType('payment')}
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${transactionType === 'payment' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            سداد
                        </button>
                    </div>
                    <form onSubmit={handleTransaction} className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">المبلغ</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">ملاحظات</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none h-20"
                                placeholder="تفاصيل الفاتورة أو السداد..."
                            />
                        </div>
                        <button className={`w-full py-2.5 rounded-lg font-bold text-white shadow-sm transition-colors text-sm ${transactionType === 'purchase' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                            {transactionType === 'purchase' ? 'تسجيل المبلغ' : 'تسجيل السداد'}
                        </button>
                    </form>
                </div>

                {/* History Section */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <History size={18} className="text-slate-500" />
                        سجل المعاملات
                    </h3>
                    <div className="space-y-3">
                        {supplier.transactions.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <FileText size={48} className="opacity-20 mb-2" />
                                <p className="text-sm">لا توجد معاملات مسجلة</p>
                            </div>
                        )}
                        {supplier.transactions.map((trx) => (
                            <div key={trx.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
                                <div className={`mt-0.5 p-2 rounded-full shrink-0 ${trx.type === 'purchase' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {trx.type === 'purchase' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={`font-bold text-sm ${trx.type === 'purchase' ? 'text-red-700' : 'text-emerald-700'}`}>
                                                {trx.type === 'purchase' ? 'شراء بضاعة (آجل)' : 'سداد دفعة للمورد'}
                                            </p>
                                            <p className="text-slate-400 text-xs mt-0.5">
                                                {format(new Date(trx.date), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                                            </p>
                                        </div>
                                        <p className={`font-bold text-lg ${trx.type === 'purchase' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {trx.amount.toLocaleString()}
                                        </p>
                                    </div>
                                    {trx.note && (
                                        <div className="mt-2 bg-slate-50 p-2 rounded-lg text-xs text-slate-600">
                                            {trx.note}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal Component
const ModalPortal = ({ children }: { children: React.ReactNode }) => {
    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {children}
        </div>,
        document.body
    );
};

const SupplierFormModal = ({ title, initialData, onSubmit, onClose }: any) => (
    <ModalPortal>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-2 transition-colors">
                    <span className="text-xl leading-none block h-5 w-5 flex items-center justify-center">&times;</span>
                </button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">اسم المورد</label>
                    <input
                        name="name"
                        defaultValue={initialData?.name}
                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف</label>
                    <input
                        name="phone"
                        defaultValue={initialData?.phone}
                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">الشخص المسؤول (اختياري)</label>
                    <input
                        name="contactPerson"
                        defaultValue={initialData?.contactPerson}
                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="pt-4 flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">إلغاء</button>
                    <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">حفظ</button>
                </div>
            </form>
        </div>
    </ModalPortal>
);
