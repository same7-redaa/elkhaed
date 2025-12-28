import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package
} from 'lucide-react';
import { format, isSameDay, isSameMonth, subDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

export const ReportsPage: React.FC = () => {
    const { orders, expenses, products, customers, hasPermission } = useStore();
    const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'financial' | 'customers'>('sales');
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

    // --- Data Processing Helpers ---

    const filterDataByRange = (data: any[], dateField: string) => {
        const now = new Date();
        if (dateRange === 'all') return data;
        if (dateRange === 'today') {
            return data.filter(item => isSameDay(parseISO(item[dateField]), now));
        }
        if (dateRange === 'week') {
            const weekAgo = subDays(now, 7);
            return data.filter(item => parseISO(item[dateField]) >= weekAgo);
        }
        if (dateRange === 'month') {
            return data.filter(item => isSameMonth(parseISO(item[dateField]), now));
        }
        return data;
    };

    const filteredOrders = useMemo(() => filterDataByRange(orders, 'date'), [orders, dateRange]);
    const filteredExpenses = useMemo(() => filterDataByRange(expenses, 'date'), [expenses, dateRange]);

    // --- Financial Metrics ---

    const totalSales = useMemo(() => filteredOrders.reduce((sum, o) => sum + o.total, 0), [filteredOrders]);
    // Cost of goods sold (COGS)
    const totalCost = useMemo(() => filteredOrders.reduce((sum, o) => {
        return sum + o.items.reduce((isum: number, item: any) => isum + (item.costPrice * item.quantity), 0);
    }, 0), [filteredOrders]);

    const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
    const netProfit = totalSales - totalCost - totalExpenses;

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

    const salesByDay = useMemo(() => {
        const data: Record<string, number> = {};
        filteredOrders.forEach(order => {
            const date = format(parseISO(order.date), 'yyyy-MM-dd');
            data[date] = (data[date] || 0) + order.total;
        });
        return Object.entries(data).map(([date, amount]) => ({
            date: format(parseISO(date), 'dd MMM', { locale: ar }),
            amount
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort might be rough with formatted date strings, simplistic approach
    }, [filteredOrders]);

    const salesByCategory = useMemo(() => {
        const data: Record<string, number> = {};
        filteredOrders.forEach(order => {
            order.items.forEach((item: any) => {
                data[item.category] = (data[item.category] || 0) + (item.price * item.quantity);
            });
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [filteredOrders]);

    const expensesByCategory = useMemo(() => {
        const data: Record<string, number> = {};
        filteredExpenses.forEach(exp => {
            data[exp.category] = (data[exp.category] || 0) + exp.amount;
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [filteredExpenses]);



    if (!hasPermission('reports.view')) {
        return <div className="p-8 text-center text-slate-500">ليس لديك صلاحية لعرض التقارير</div>;
    }

    return (
        <div className="p-6 space-y-6 h-full flex flex-col overflow-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">التقارير والتحليلات</h1>
                    <p className="text-slate-500 text-sm mt-1">نظرة شاملة على أداء المتجر المالي والتشغيلي</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['today', 'week', 'month', 'all'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setDateRange(r)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${dateRange === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {r === 'today' ? 'اليوم' : r === 'week' ? 'أسبوع' : r === 'month' ? 'شهر' : 'الكل'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    title="إجمالي المبيعات"
                    value={totalSales}
                    icon={DollarSign}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
                <MetricCard
                    title="صافي الربح"
                    value={netProfit}
                    icon={TrendingUp}
                    color={netProfit >= 0 ? "text-emerald-600" : "text-red-600"}
                    bg={netProfit >= 0 ? "bg-emerald-50" : "bg-red-50"}
                />
                <MetricCard
                    title="المصروفات"
                    value={totalExpenses}
                    icon={TrendingDown}
                    color="text-orange-600"
                    bg="bg-orange-50"
                />
                <MetricCard
                    title="عدد الطلبات"
                    value={filteredOrders.length}
                    icon={Package}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    isCurrency={false}
                />
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex -mb-px space-x-8 space-x-reverse" aria-label="Tabs">
                    <TabButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')}>
                        المبيعات والأرباح
                    </TabButton>
                    <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')}>
                        المخزون
                    </TabButton>
                    <TabButton active={activeTab === 'financial'} onClick={() => setActiveTab('financial')}>
                        المالية والمصروفات
                    </TabButton>
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-6">

                {activeTab === 'sales' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sales Trend Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm col-span-2">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <TrendingUp size={20} className="text-indigo-500" />
                                اتجاه المبيعات
                            </h3>
                            <div className="h-80 w-full" style={{ direction: 'ltr' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesByDay}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: '#f8fafc' }}
                                        />
                                        <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Selling Categories */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">المبيعات حسب الفئة</h3>
                            <div className="h-64 w-full" style={{ direction: 'ltr' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={salesByCategory}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {salesByCategory.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Selling Products Table */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">الأكثر مبيعاً</h3>
                            <div className="overflow-auto max-h-64">
                                <table className="w-full text-right text-sm">
                                    <thead className="text-xs text-slate-500 font-bold bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="pb-2 pl-2">المنتج</th>
                                            <th className="pb-2">الكمية المباعة</th>
                                            <th className="pb-2">الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {/* Simplified logic for top products from filtered orders */}
                                        {(() => {
                                            const productStats: Record<string, { name: string, qty: number, total: number }> = {};
                                            filteredOrders.forEach(o => o.items.forEach((i: any) => {
                                                if (!productStats[i.id]) productStats[i.id] = { name: i.name, qty: 0, total: 0 };
                                                productStats[i.id].qty += i.quantity;
                                                productStats[i.id].total += i.quantity * i.price;
                                            }));
                                            return Object.values(productStats)
                                                .sort((a, b) => b.total - a.total)
                                                .slice(0, 5)
                                                .map((p, idx) => (
                                                    <tr key={idx}>
                                                        <td className="py-2 text-slate-800 font-medium">{p.name}</td>
                                                        <td className="py-2 text-slate-500">{p.qty}</td>
                                                        <td className="py-2 text-slate-800 font-bold">{p.total.toLocaleString()}</td>
                                                    </tr>
                                                ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h3 className="text-slate-500 text-sm font-bold mb-1">قيمة المخزون (شراء)</h3>
                                <p className="text-2xl font-bold text-slate-800">
                                    {products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0).toLocaleString()} <span className="text-sm text-slate-400">ج.م</span>
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h3 className="text-slate-500 text-sm font-bold mb-1">قيمة المخزون (بيع)</h3>
                                <p className="text-2xl font-bold text-indigo-600">
                                    {products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()} <span className="text-sm text-slate-400">ج.م</span>
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <h3 className="text-slate-500 text-sm font-bold mb-1">عدد المنتجات</h3>
                                <p className="text-2xl font-bold text-slate-800">
                                    {products.length} <span className="text-sm text-slate-400">منتج</span>
                                </p>
                            </div>
                        </div>

                        {/* Low Stock Table */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="font-bold text-lg text-red-600 flex items-center gap-2">
                                    <TrendingDown size={20} />
                                    تنبيهات انخفاض المخزون
                                </h3>
                            </div>
                            <table className="w-full text-right">
                                <thead className="bg-slate-50 text-slate-500 font-bold text-sm">
                                    <tr>
                                        <th className="p-4">المنتج</th>
                                        <th className="p-4">الباركود</th>
                                        <th className="p-4">المخزون الحالي</th>
                                        <th className="p-4">الحد الأدنى</th>
                                        <th className="p-4">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {products.filter(p => p.stock <= p.minStockLevel).map(product => (
                                        <tr key={product.id} className="hover:bg-red-50/50">
                                            <td className="p-4 font-bold text-slate-800">{product.name}</td>
                                            <td className="p-4 text-slate-500 font-mono text-xs">{product.barcode}</td>
                                            <td className="p-4 font-bold text-red-600">{product.stock}</td>
                                            <td className="p-4 text-slate-600">{product.minStockLevel}</td>
                                            <td className="p-4">
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">منخفض جداً</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.filter(p => p.stock <= p.minStockLevel).length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-400">
                                                ممتاز! جميع المنتجات متوفرة بكميات كافية.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">توزيع المصروفات</h3>
                            <div className="h-64 w-full" style={{ direction: 'ltr' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expensesByCategory}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {expensesByCategory.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">الأرباح والخسائر للعملاء (الديون)</h3>
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl mb-4">
                                <div>
                                    <p className="text-sm font-bold text-red-700">إجمالي الديون (لنا)</p>
                                    <p className="text-xs text-red-500">أموال لدى العملاء</p>
                                </div>
                                <p className="text-2xl font-bold text-red-700">
                                    {customers.reduce((acc, c) => acc + c.totalDebt, 0).toLocaleString()}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <p className="font-bold text-slate-700 text-sm">أعلى 5 عملاء مدينين:</p>
                                {customers
                                    .sort((a, b) => b.totalDebt - a.totalDebt)
                                    .slice(0, 5)
                                    .map(c => (
                                        <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">{c.name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                                                    <p className="text-xs text-slate-500">{c.phone}</p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-red-600">{c.totalDebt.toLocaleString()}</p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Sub-components for Cleaner Code

const MetricCard = ({ title, value, icon: Icon, color, bg, isCurrency = true }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <Icon size={24} />
            </div>
            {/* Optional: Add percentage trend here if feasible */}
        </div>
        <div>
            <p className="text-slate-500 font-bold text-sm mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">
                {typeof value === 'number' ? value.toLocaleString() : value}
                {isCurrency && <span className="text-sm text-slate-400 mr-1">ج.م</span>}
            </h3>
        </div>
    </div>
);

const TabButton = ({ active, children, onClick }: any) => (
    <button
        onClick={onClick}
        className={`pb-4 px-1 border-b-2 font-bold text-sm transition-colors ${active
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
    >
        {children}
    </button>
);
