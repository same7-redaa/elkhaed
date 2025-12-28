import React from 'react';
import { useStore } from '../store/useStore';
import { ShoppingCart, DollarSign, Wallet, Package, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
    const { orders, customers, products, settings } = useStore();
    const navigate = useNavigate();

    // --- Calculations ---

    // 1. Total Sales (Revenue)
    const totalSales = orders
        .filter(o => o.status !== 'returned')
        .reduce((acc, curr) => acc + curr.total, 0);

    // 2. Net Profit (Approximation: Sales - Cost of Sold Goods)
    const totalCost = orders
        .filter(o => o.status !== 'returned')
        .flatMap(o => o.items)
        .reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);

    const netProfit = totalSales - totalCost;

    // 3. Debts
    const totalDebts = customers.reduce((acc, c) => acc + c.totalDebt, 0);

    // 4. Low Stock
    const lowStockCount = products.filter(p => p.stock <= p.minStockLevel).length;

    // 5. Recent Activity (Last 5 orders)
    const recentOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return (
        <div className="h-full overflow-y-auto p-6 space-y-8 font-stc animate-in fade-in duration-500 scrollbar-thin scrollbar-thumb-slate-300">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">أهلاً بك في {settings.storeName} 👋</h1>
                    <p className="text-slate-500 mt-1">إليك نظرة عامة على أداء متجرك اليوم.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/pos')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                        <ShoppingCart size={18} />
                        بيع جديد
                    </button>
                    <button onClick={() => navigate('/products')} className="bg-white text-slate-700 border border-slate-200 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition flex items-center gap-2">
                        <Package size={18} />
                        إضافة منتج
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="إجمالي المبيعات"
                    value={totalSales}
                    currency={settings.currency}
                    icon={TrendingUp}
                    color="indigo"
                    trend="+12%" // Dummy trend for visuals
                />
                <StatCard
                    title="صافي الأرباح"
                    value={netProfit}
                    currency={settings.currency}
                    icon={DollarSign}
                    color="green"
                    trend="+8%"
                />
                <StatCard
                    title="الديون (لنا)"
                    value={totalDebts}
                    currency={settings.currency}
                    icon={Wallet}
                    color="orange"
                    trend="-2%"
                />
                <StatCard
                    title="تنبيهات المخزون"
                    value={lowStockCount}
                    suffix="منتج"
                    icon={AlertTriangle}
                    color="red"
                    isAlert
                />
            </div>

            {/* Main Content Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Activity size={20} className="text-indigo-600" />
                            أحدث العمليات
                        </h3>
                        <button onClick={() => navigate('/sales')} className="text-sm text-indigo-600 font-bold hover:underline">عرض الكل</button>
                    </div>
                    <div className="p-0">
                        {recentOrders.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">لا توجد عمليات بيع حتى الان</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${order.status === 'returned' ? 'bg-red-500' : 'bg-green-500'}`}>
                                                {order.status === 'returned' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">فاتورة #{order.id.slice(-4)}</p>
                                                <p className="text-xs text-slate-500">{new Date(order.date).toLocaleTimeString('ar-EG')}</p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-slate-800">{order.total} {settings.currency}</p>
                                            <p className="text-xs text-slate-500">{order.paymentMethod === 'cash' ? 'نقدي' : 'آجل'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats / Stock Alerts */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Package size={20} />
                            حالة المخزون
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-300">إجمالي المنتجات</span>
                                <span className="font-bold">{products.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-300">قيمة المخزون (تلفة)</span>
                                <span className="font-bold">{products.reduce((a, b) => a + (b.stock * b.costPrice), 0).toLocaleString()} {settings.currency}</span>
                            </div>
                            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                                <div className="bg-indigo-500 h-full w-[70%]" />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">المخزون الصحي يمثل 70% من السعة</p>
                        </div>
                    </div>

                    {/* Low Stock List */}
                    {lowStockCount > 0 && (
                        <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                            <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                                <AlertTriangle size={18} />
                                نواقص يجب شراؤها
                            </h3>
                            <div className="space-y-2">
                                {products.filter(p => p.stock <= p.minStockLevel).slice(0, 3).map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-red-100">
                                        <span className="text-sm font-medium text-slate-700">{p.name}</span>
                                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">باقي {p.stock}</span>
                                    </div>
                                ))}
                                {lowStockCount > 3 && (
                                    <button onClick={() => navigate('/products')} className="text-xs text-red-600 font-bold hover:underline w-full text-center mt-2">
                                        عرض الكل ({lowStockCount})
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Helper Components ---

const StatCard = ({ title, value, currency, suffix, icon: Icon, color, trend, isAlert }: any) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        red: 'bg-red-50 text-red-600 border-red-100',
    };
    const activeColor = colors[color as keyof typeof colors] || colors.indigo;

    return (
        <div className={`bg-white p-6 rounded-2xl border ${isAlert ? 'border-red-200 shadow-red-50' : 'border-slate-100'} shadow-sm flex flex-col justify-between hover:shadow-md transition`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${activeColor}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-slate-500 font-medium text-sm mb-1">{title}</p>
                <h3 className="text-3xl font-extrabold text-slate-800">
                    {value.toLocaleString()}
                    <span className="text-base font-medium text-slate-400 mr-1">{currency || suffix || ''}</span>
                </h3>
            </div>
        </div>
    );
};
