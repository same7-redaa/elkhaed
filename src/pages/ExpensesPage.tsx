import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, Trash2, Calendar, FileText, DollarSign, Filter } from 'lucide-react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const ExpensesPage: React.FC = () => {
    const { expenses, addExpense, deleteExpense, hasPermission, currentUser } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'general',
        date: new Date().toISOString().split('T')[0]
    });

    const CATEGORIES = [
        { id: 'general', label: 'نثريات عامة' },
        { id: 'rent', label: 'إيجار' },
        { id: 'electricity', label: 'كهرباء ومياه' },
        { id: 'salaries', label: 'رواتب' },
        { id: 'maintenance', label: 'صيانة' },
        { id: 'goods', label: 'شراء بضاعة' }, // If not tracked in products
        { id: 'marketing', label: 'تسويق وإعلانات' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || !formData.amount) return;

        addExpense({
            id: crypto.randomUUID(),
            description: formData.description,
            amount: Number(formData.amount),
            category: formData.category,
            date: formData.date,
            createdBy: currentUser?.id || 'unknown'
        });

        setIsAddModalOpen(false);
        setFormData({
            description: '',
            amount: '',
            category: 'general',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const filteredExpenses = useMemo(() => {
        let result = expenses;

        if (selectedCategory !== 'all') {
            result = result.filter(e => e.category === selectedCategory);
        }

        if (searchQuery) {
            result = result.filter(e => e.description.includes(searchQuery));
        }

        // Sort by date desc
        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, searchQuery, selectedCategory]);

    const totalExpenses = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    }, [filteredExpenses]);

    if (!hasPermission('expenses.view')) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                ليس لديك صلاحية لعرض هذه الصفحة
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">المصروفات</h1>
                    <p className="text-slate-500 text-sm mt-1">تتبع وإدارة مصروفات المتجر</p>
                </div>

                {hasPermission('expenses.manage') && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-indigo-500/30 font-bold"
                    >
                        <Plus size={20} />
                        تسجيل مصروف
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold">إجمالي المصروفات</p>
                        <p className="text-xl font-bold text-slate-800">{totalExpenses.toLocaleString()} ج.م</p>
                    </div>
                </div>
                {/* You can add more stats here like "Monthly Average" */}
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex gap-4 items-center flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="بحث في المصروفات..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="text-slate-400" size={18} />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-slate-50 border-none rounded-lg text-sm py-2 px-4 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600"
                        >
                            <option value="all">كل الفئات</option>
                            {CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 md:bg-slate-50/90 backdrop-blur-sm z-10">
                            <tr>
                                <th className="p-4 rounded-tr-xl">التاريخ</th>
                                <th className="p-4">الوصف</th>
                                <th className="p-4">الفئة</th>
                                <th className="p-4">المبلغ</th>
                                <th className="p-4">بواسطة</th>
                                <th className="p-4 rounded-tl-xl text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-slate-400" />
                                                {format(new Date(expense.date), 'dd MMMM yyyy', { locale: ar })}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-slate-800">{expense.description}</td>
                                        <td className="p-4">
                                            <span className={clsx(
                                                "px-2 py-1 rounded-md text-xs font-bold border",
                                                expense.category === 'salaries' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                    expense.category === 'rent' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                                        "bg-slate-100 text-slate-600 border-slate-200"
                                            )}>
                                                {CATEGORIES.find(c => c.id === expense.category)?.label || expense.category}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-red-600">
                                            -{expense.amount.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-slate-500 text-xs">
                                            {/* Ideally we would look up user name from ID */}
                                            {expense.createdBy}
                                        </td>
                                        <td className="p-4 text-center">
                                            {hasPermission('expenses.manage') && (
                                                <button
                                                    onClick={() => deleteExpense(expense.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={32} className="opacity-20" />
                                            ل توجد مصروفات مسجلة
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Modal */}
            {isAddModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-stc animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Plus className="text-indigo-600" size={20} /> تسجيل مصروف جديد
                            </h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                &#x2715;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">وصف المصروف</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: فاتورة كهرباء شهر 5"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold text-slate-800"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">المبلغ</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold text-slate-800"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                        <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">ج.م</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">التاريخ</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold text-slate-800 text-sm"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">الفئة</label>
                                <select
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold text-slate-800"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                                >
                                    حفظ المصروف
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
