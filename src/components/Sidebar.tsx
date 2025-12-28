import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Settings,
    LogOut,
    ChevronRight,
    ChevronLeft,
    FileText,
    CheckCircle,
    AlertTriangle,
    AlertCircle,
    Info,
    X,
    Shield,
    Tag,
    DollarSign,
    BarChart,
    Truck
} from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';

interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleCollapse }) => {
    const { logout, hasPermission } = useStore();
    const { toasts, removeToast } = useUI();
    const [hoveredItem, setHoveredItem] = useState<{ label: string, top: number } | null>(null);

    const activeToast = toasts.length > 0 ? toasts[toasts.length - 1] : null;

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'النظرة العامة', permission: 'dashboard.view' },
        { to: '/pos', icon: ShoppingCart, label: 'نقطة البيع (Kishier)', permission: 'pos.access' },
        { to: '/products', icon: Package, label: 'المنتجات والمخزون', permission: 'products.view' },
        { to: '/sales', icon: FileText, label: 'الفواتير والمبيعات', permission: 'sales.view' },
        { to: '/customers', icon: Users, label: 'العملاء والديون', permission: 'customers.manage' },
        { to: '/suppliers', icon: Truck, label: 'الموردين', permission: 'suppliers.manage' },
        { to: '/promotions', icon: Tag, label: 'العروض والخصومات', permission: 'offers.view' },
        { to: '/expenses', icon: DollarSign, label: 'المصروفات', permission: 'expenses.view' },
        { to: '/reports', icon: BarChart, label: 'التقارير', permission: 'reports.view' },
        { to: '/staff', icon: Shield, label: 'إدارة الموظفين', permission: 'staff.manage' },
        { to: '/settings', icon: Settings, label: 'الإعدادات', permission: 'settings.manage' },
    ];

    const visibleNavItems = navItems.filter(item => hasPermission(item.permission));

    const handleMouseEnter = (e: React.MouseEvent, label: string) => {
        if (!isCollapsed) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredItem({ label, top: rect.top });
    };

    const getToastStyles = (type: string) => {
        switch (type) {
            case 'success': return { bg: 'bg-green-500', text: 'text-white', icon: CheckCircle, label: 'تم بنجاح' };
            case 'error': return { bg: 'bg-red-500', text: 'text-white', icon: AlertCircle, label: 'خطأ' };
            case 'warning': return { bg: 'bg-amber-500', text: 'text-white', icon: AlertTriangle, label: 'تنبيه' };
            default: return { bg: 'bg-indigo-500', text: 'text-white', icon: Info, label: 'معلومة' };
        }
    };

    const toastStyle = activeToast ? getToastStyles(activeToast.type) : null;
    const FooterIcon = activeToast ? toastStyle!.icon : LogOut;
    const footerLabel = activeToast ? activeToast.message : 'تسجيل خروج';
    const footerBg = activeToast ? toastStyle!.bg : 'text-red-400 hover:bg-red-500/10 hover:text-red-300';
    const footerText = activeToast ? toastStyle!.text : '';

    return (
        <>
            <aside
                className={clsx(
                    "fixed top-0 right-0 h-screen bg-white text-slate-700 transition-all duration-300 z-40 flex flex-col shadow-2xl font-stc border-l border-slate-100",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                {/* Header / Logo */}
                <div className="h-[70px] flex items-center justify-between px-4 border-b border-slate-100 bg-white">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 animate-in fade-in duration-300">
                            <img src="/ELKHALED.png" alt="Logo" className="w-8 h-8 object-contain" />
                            <h1 className="font-bold text-lg truncate max-w-[120px] text-indigo-900">ELKHALED</h1>
                        </div>
                    )}
                    <button
                        onClick={toggleCollapse}
                        className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-indigo-600"
                    >
                        {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200">
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-bold"
                                    : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                            )}
                        >
                            <item.icon size={22} className="shrink-0" />

                            {!isCollapsed && (
                                <span className="whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-300">
                                    {item.label}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer (Notification or Logout) */}
                < div className="p-4 border-t border-slate-100 bg-slate-50" >
                    <div
                        className="relative"
                        onMouseEnter={(e) => handleMouseEnter(e, footerLabel)}
                        onMouseLeave={() => setHoveredItem(null)}
                    >
                        {activeToast && !isCollapsed && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeToast(activeToast.id);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 left-3 z-50 text-white/70 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        )}

                        <button
                            className={clsx(
                                "flex items-center gap-4 w-full px-3 py-3 rounded-xl transition-all duration-300 group overflow-hidden",
                                footerBg, footerText
                            )}
                            onClick={() => {
                                if (activeToast) removeToast(activeToast.id);
                                else logout();
                            }}
                        >
                            <div className="shrink-0 animate-in zoom-in spin-in-180 duration-500">
                                <FooterIcon size={22} className={activeToast ? "animate-pulse" : ""} />
                            </div>

                            {!isCollapsed && (
                                <span className="font-bold text-sm truncate animate-in slide-in-from-right-4 fade-in duration-300">
                                    {footerLabel}
                                </span>
                            )}
                        </button>
                    </div>
                </div >
            </aside >

            {/* FLOATING TOOLTIP PORTAL */}
            {
                isCollapsed && hoveredItem && (
                    <div
                        className={clsx(
                            "fixed z-[9999] text-xs font-bold px-3 py-2 rounded-lg shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap border",
                            activeToast && hoveredItem.label === activeToast.message
                                ? `text-white border-transparent ${getToastStyles(activeToast.type).bg}`
                                : "bg-white text-slate-700 border-slate-100"
                        )}
                        style={{
                            top: hoveredItem.top + 10,
                            right: '5.5rem'
                        }}
                    >
                        {hoveredItem.label}
                        <div className={clsx(
                            "absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rotate-45 border-t border-r",
                            activeToast && hoveredItem.label === activeToast.message
                                ? `border-transparent ${getToastStyles(activeToast.type).bg}`
                                : "bg-white border-slate-100"
                        )}></div>
                    </div>
                )
            }
        </>
    );
};
