import React, { useEffect, useState } from 'react';
import { Peer } from 'peerjs';
import { useStore } from '../store/useStore';
import { Search, Wifi, WifiOff, Camera, X } from 'lucide-react';
import { CameraScanner } from '../components/CameraScanner';
import type { Product } from '../types';

export const MobileApp: React.FC = () => {
    // const { products } = useStore(); // We use Local State sync now
    const [conn, setConn] = useState<any>(null); // Connection instance
    const [isConnected, setIsConnected] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Offline Data State
    const [localProducts, setLocalProducts] = useState<Product[]>([]);

    // Determine Host ID from URL
    const queryParams = new URLSearchParams(window.location.search);
    const hostId = queryParams.get('host');

    // PeerJS Connection Logic
    useEffect(() => {
        if (!hostId) return;

        const peer = new Peer();

        peer.on('open', (id) => {
            console.log('📱 Mobile Peer ID:', id);

            // Connect to Host
            const connection = peer.connect(hostId);

            connection.on('open', () => {
                console.log("✅ Connected to PC Host");
                setIsConnected(true);
                setConn(connection);
            });

            connection.on('data', (data: any) => {
                console.log("📥 Received Data:", data);
                if (data.type === 'SYNC') {
                    setLocalProducts(data.products);
                    if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback on sync
                }
            });

            connection.on('close', () => setIsConnected(false));
            connection.on('error', () => setIsConnected(false));
        });

        peer.on('error', (err) => {
            console.error("Peer Error:", err);
            setIsConnected(false);
        });

        return () => {
            peer.destroy();
        };
    }, [hostId]);

    const handleScan = (code: string) => {
        // 1. Send to PC via PeerJS
        if (conn && isConnected) {
            conn.send({ type: 'SCAN', barcode: code });
            // Success Feedback
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }

        // 2. Also search locally (Show result on phone too)
        setSearchQuery(code);

        // Close Camera automatically after scan
        setIsCameraOpen(false);
    };

    // Filter Logic
    const filteredProducts = localProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery)
    );

    return (
        <div className="min-h-screen bg-slate-50 font-stc pb-safe">

            {/* Mobile Header */}
            <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-slate-800">قارئ الأسعار 🔍</h1>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                        {isConnected ? 'متصل بالسيستم' : 'وضع الأوفلاين'}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute right-3 top-3 text-slate-400" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث باسم المنتج أو الباركود..."
                        className="w-full bg-slate-100 border-none rounded-xl py-3 pr-10 pl-4 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute left-3 top-3 text-slate-400">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Product List or Results */}
            <div className="p-4 space-y-3">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <Search size={48} className="mx-auto mb-4 opacity-50" />
                        <p>لا توجد منتجات مطابقة</p>
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center active:scale-[0.99] transition-transform">
                            <div>
                                <h3 className="font-bold text-slate-800">{product.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">المخزون: <span className="font-bold text-indigo-600">{product.stock}</span></p>
                            </div>
                            <div className="text-left">
                                <span className="block text-lg font-black text-slate-900">{product.price.toLocaleString()}</span>
                                <span className="text-xs text-slate-400 font-bold">جنيه</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Call To Action: Scan Button (Floating) */}
            <button
                onClick={() => setIsCameraOpen(true)}
                className="fixed bottom-6 left-6 right-6 bg-indigo-600 text-white py-4 rounded-2xl shadow-xl shadow-indigo-300 font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform z-20"
            >
                <Camera size={24} />
                مسح باركود
            </button>

            {/* Camera Overlay */}
            {isCameraOpen && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col">
                    <div className="flex-1 relative">
                        <CameraScanner onScan={handleScan} onClose={() => setIsCameraOpen(false)} />

                        <button
                            onClick={() => setIsCameraOpen(false)}
                            className="absolute top-6 right-6 bg-white/20 p-2 rounded-full text-white backdrop-blur-md"
                        >
                            <X size={24} />
                        </button>

                        <div className="absolute bottom-10 left-0 right-0 text-center text-white/80 font-bold">
                            وجه الكاميرا نحو الباركود
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
