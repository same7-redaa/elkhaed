import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { AIAssistant } from '../components/AIAssistant';
import { Bell, Search, User, Trash2, Package, Sparkles, Smartphone, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import { Peer } from 'peerjs';
import { clsx } from 'clsx';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { products, customers, orders, notifications, markNotificationAsRead, clearNotifications } = useStore();
    const { isChatOpen } = useUI();

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Notification State
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // QR Modal State
    const [isQROpen, setIsQROpen] = useState(false);

    // P2P State
    const [peerId, setPeerId] = useState<string>('');

    // Initialize PeerJS Host
    useEffect(() => {
        // Prevent server-side or multiple inits
        if (typeof window === 'undefined') return;

        const peer = new Peer(); // Auto-generate ID

        peer.on('open', (id) => {
            console.log('📡 Host Peer ID:', id);
            setPeerId(id);
        });

        peer.on('connection', (conn) => {
            console.log('📲 New Mobile Connection:', conn.peer);

            // Send Data Refresh to Mobile immediately
            conn.on('open', () => {
                const syncData = {
                    type: 'SYNC',
                    products: useStore.getState().products
                };
                conn.send(syncData);
                console.log('Phone Connected!');
            });

            // Listen for Barcodes from Mobile
            conn.on('data', (data: any) => {
                if (data.type === 'SCAN') {
                    const barcode = data.barcode;
                    const allProducts = useStore.getState().products;
                    const product = allProducts.find(p => p.barcode === barcode);

                    if (product) {
                        useStore.getState().addToCart(product);
                        const audio = new Audio('/beep.mp3');
                        audio.play().catch(() => { });
                    } else {
                        alert(`منتج غير موجود: ${barcode}`);
                    }
                }
            });
        });

        return () => {
            peer.destroy();
        };
    }, []);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter Logic
    const filteredProducts = searchQuery ? products.filter(p => p.name.includes(searchQuery) || p.barcode.includes(searchQuery)).slice(0, 3) : [];
    const filteredCustomers = searchQuery ? customers.filter(c => c.name.includes(searchQuery) || c.phone.includes(searchQuery)).slice(0, 3) : [];
    const filteredOrders = searchQuery ? orders.filter(o => o.id.includes(searchQuery)).slice(0, 3) : [];
    const hasResults = filteredProducts.length > 0 || filteredCustomers.length > 0 || filteredOrders.length > 0;

    const handleResultClick = (path: string) => {
        navigate(path);
        setSearchQuery('');
        setShowResults(false);
    };

    const getPageTitle = (path: string) => {
        switch (path) {
            case '/': return 'النظرة العامة';
            case '/pos': return 'نقطة البيع';
            case '/products': return 'قائمة المنتجات';
            case '/sales': return 'المبيعات والفواتير';
            case '/customers': return 'العملاء والديون';
            case '/settings': return 'الإعدادات';
            case '/staff': return 'إدارة الموظفين';
            default: return 'لوحة التحكم';
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="flex h-screen bg-slate-50 font-stc overflow-hidden">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <div
                className={clsx(
                    "flex-1 flex flex-col transition-all duration-300 ease-in-out h-full",
                    isSidebarCollapsed ? "mr-20" : "mr-64",
                    isChatOpen ? "ml-0 md:ml-96" : "ml-0"
                )}
            >
                <header className="h-[70px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm flex-none z-20">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-800">{getPageTitle(location.pathname)}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block w-96" ref={searchRef}>
                            <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="بحث شامل (منتجات، عملاء، فواتير)..."
                                className="w-full bg-slate-100 border-none rounded-xl py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowResults(true);
                                }}
                                onFocus={() => setShowResults(true)}
                            />

                            {showResults && searchQuery && (
                                <div className="absolute top-full right-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                                    {!hasResults ? (
                                        <div className="p-3 text-center text-slate-500 text-sm">لا توجد نتائج مطابقة</div>
                                    ) : (
                                        <div className="space-y-1">
                                            {filteredProducts.map(p => (
                                                <div key={p.id} onClick={() => handleResultClick('/products')} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Package size={16} /></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{p.name}</p>
                                                        <p className="text-xs text-slate-500">{p.price} ج.م</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredCustomers.map(c => (
                                                <div key={c.id} onClick={() => handleResultClick('/customers')} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><User size={16} /></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{c.name}</p>
                                                        <p className="text-xs text-slate-500">{c.phone}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mobile Connect Button */}
                        <button
                            onClick={() => setIsQROpen(true)}
                            className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition flex items-center gap-2"
                        >
                            <Smartphone size={18} />
                            <span className="hidden lg:inline">ربط الهاتف</span>
                        </button>

                        <div className="relative" ref={notifRef}>
                            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                                )}
                            </button>

                            {isNotificationsOpen && (
                                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                        <h3 className="font-bold text-slate-800 text-sm">الإشعارات ({unreadCount})</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={clearNotifications} className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1">
                                                <Trash2 size={12} /> مسح الكل
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm">لا توجد إشعارات جديدة</div>
                                        ) : (
                                            <div className="divide-y divide-slate-50">
                                                {notifications.map(notification => (
                                                    <div key={notification.id} onClick={() => markNotificationAsRead(notification.id)} className={clsx("p-3 hover:bg-slate-50 transition cursor-pointer flex gap-3", !notification.read && "bg-indigo-50/30")}>
                                                        <div className="mt-1">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                                <Sparkles size={14} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-slate-800 leading-snug">{notification.message}</p>
                                                            <p className="text-[10px] text-slate-400 mt-1">{new Date(notification.date).toLocaleTimeString('ar-EG')}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6 relative">
                    {children}
                </main>
            </div>

            <AIAssistant />

            {/* QR Code Modal for P2P Connection */}
            {isQROpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
                        <button
                            onClick={() => setIsQROpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center space-y-4">
                            {!peerId ? (
                                <div className="text-center p-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                                    <p className="text-slate-500">جاري إنشاء قناة اتصال آمنة...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                        <Smartphone size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800">ربط الهاتف</h2>
                                    <p className="text-slate-500 text-sm">امسح الرمز أدناه بكاميرا هاتفك</p>

                                    <div className="bg-white p-4 rounded-xl border-2 border-slate-900 inline-block mx-auto">
                                        <QRCode
                                            value={`${window.location.origin}/mobile?host=${peerId}`}
                                            size={200}
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                            viewBox={`0 0 256 256`}
                                        />
                                    </div>

                                    <p className="text-xs text-slate-400 mt-2">يعمل على أي جهاز (Android/iOS) بدون تثبيت</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
