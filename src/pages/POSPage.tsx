import React, { useState, useMemo, memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../store/useStore';
import type { Customer, Product } from '../store/useStore';
import { Trash2, ShoppingBag, Banknote, Scan, Barcode, User, UserPlus, X, AlertTriangle, Search, Tag, Smartphone } from 'lucide-react';
import { io } from 'socket.io-client'; // Import Socket.io
import { useScanDetection } from '../hooks/useScanDetection';
import { useDebounce } from '../hooks/useDebounce';
import { CameraScanner } from '../components/CameraScanner';

// Memoized Product Card Wrapper to prevent re-renders
const ProductCardWrapper = memo(({ product, offer, onClick }: { product: Product, offer?: any, onClick: () => void }) => {
    let effectivePrice = product.price;
    if (offer) {
        if (offer.type === 'percentage') {
            effectivePrice = product.price - (product.price * (offer.value / 100));
        } else {
            effectivePrice = product.price - offer.value;
        }
        if (effectivePrice < 0) effectivePrice = 0;
    }

    return (
        <div className="relative group">
            {offer && (
                <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    عرض
                </div>
            )}
            {/* We pass a new object, but ProductCard logic is simple. The wrapper prevents parent re-renders from affecting this if props unchanged. */}
            <div onClick={onClick}>
                <ProductCard product={{ ...product, price: effectivePrice }} />
            </div>
        </div>
    );
}, (prev, next) => {
    return prev.product.id === next.product.id &&
        prev.product.price === next.product.price &&
        prev.product.name === next.product.name &&
        prev.offer === next.offer;
});

export const POSPage: React.FC = () => {
    // Select state slices individually to prevent unnecessary re-renders
    const cart = useStore(state => state.cart);
    const products = useStore(state => state.products);
    const customers = useStore(state => state.customers);
    const settings = useStore(state => state.settings);
    const discountCodes = useStore(state => state.discountCodes);
    const offers = useStore(state => state.offers);
    const addToCart = useStore(state => state.addToCart);
    const removeFromCart = useStore(state => state.removeFromCart);
    const clearCart = useStore(state => state.clearCart);
    const addOrder = useStore(state => state.addOrder);
    const addCustomer = useStore(state => state.addCustomer);
    const addCustomerTransaction = useStore(state => state.addCustomerTransaction);
    const incrementDiscountCodeUsage = useStore(state => state.incrementDiscountCodeUsage);
    const incrementOfferUsage = useStore(state => state.incrementOfferUsage);

    const [showCamera, setShowCamera] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms delay

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 24;

    // Scroll Ref for Products Grid
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Reset page when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery]);

    // Scroll to top when page changes
    React.useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    // Checkout Dialog State
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [searchCustomer, setSearchCustomer] = useState('');

    // Warning State
    const [debtWarning, setDebtWarning] = useState<string | null>(null);

    // Quick Add Customer State
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickName, setQuickName] = useState('');
    const [quickPhone, setQuickPhone] = useState('');

    // Discount State
    const [showDiscount, setShowDiscount] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [manualDiscount, setManualDiscount] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<{ type: 'percentage' | 'fixed', value: number, code?: string } | null>(null);

    // --- Socket.io Listener for Remote Barcode ---
    React.useEffect(() => {
        const socket = io(`http://${window.location.hostname}:3001`);

        socket.on('RECEIVE_BARCODE', (barcode: string) => {
            console.log("RECEIVED BARCODE FROM PHONE:", barcode);

            // Find product
            const allProducts = useStore.getState().products; // Access fresh state
            const product = allProducts.find(p => p.barcode === barcode);

            if (product) {
                addToCart(product);
                setLastScanned(`تم إضافة: ${product.name}`);
                setTimeout(() => setLastScanned(null), 3000);

                // Play beep sound
                const audio = new Audio('/beep.mp3'); // Ensure beep.mp3 exists or remove if annoying
                audio.play().catch(e => console.log("Audio play failed", e));

            } else {
                setLastScanned(`منتج غير موجود: ${barcode}`);
                setTimeout(() => setLastScanned(null), 3000);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);


    // Handle Scan Logic
    const handleScan = (code: string) => {
        const product = products.find(p => p.barcode === code);
        if (product) {
            addToCart(product);
            setLastScanned(`${product.name} (${product.price} ${settings.currency})`);
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-supermarket-scanner-beep-2996.mp3');
            audio.play().catch(e => console.log('Audio play failed', e));
            setTimeout(() => setLastScanned(null), 3000);
            setShowCamera(false);
        }
    };

    useScanDetection({ onScan: handleScan });

    const filteredItems = useMemo(() => {
        // If no search query, return empty to show "Scan Mode"
        if (!debouncedSearchQuery.trim()) {
            return [];
        }

        const q = debouncedSearchQuery.toLowerCase();

        const matchingProducts = products.filter(p => p.name.toLowerCase().includes(q) || p.barcode.includes(q));
        const matchingOffers = offers ? offers.filter(o => o.isActive && o.name.toLowerCase().includes(q)) : [];

        return [...matchingOffers, ...matchingProducts];
    }, [products, offers, debouncedSearchQuery]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        return filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredItems, currentPage, itemsPerPage]);

    const handleAddOffer = (offer: any) => {
        if (!offer.targetProductIds || offer.targetProductIds.length === 0) return;

        let addedCount = 0;
        offer.targetProductIds.forEach((id: string) => {
            const p = products.find(prod => prod.id === id);
            if (p) {
                // Calculate discounted price for this specific product context
                let newPrice = p.price;
                if (offer.type === 'percentage') {
                    newPrice = p.price - (p.price * (offer.value / 100));
                } else {
                    // For fixed, we assume the fixed amount is deducted from EACH product 
                    // OR if it's a bundle price, it's more complex. 
                    // Based on previous logic, it's deduction per unit.
                    newPrice = p.price - offer.value;
                }
                if (newPrice < 0) newPrice = 0;

                addToCart({ ...p, price: newPrice });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            incrementOfferUsage(offer.id); // Track usage
            setLastScanned(`تم إضافة العرض: ${offer.name}`);
            setTimeout(() => setLastScanned(null), 3000);
        }
    };

    // Helper to get offer for a product
    const getProductOffer = (productId: string) => {
        return offers?.find((o: any) => o.targetProductIds.includes(productId) && o.isActive);
    };

    // ... existing totals calculation ...
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let discountAmount = 0;
    if (appliedDiscount) {
        if (appliedDiscount.type === 'percentage') {
            discountAmount = subtotal * (appliedDiscount.value / 100);
        } else {
            discountAmount = appliedDiscount.value;
        }
    }
    if (discountAmount > subtotal) discountAmount = subtotal;

    const totalAfterDiscount = subtotal - discountAmount;
    const tax = totalAfterDiscount * (settings.taxRate / 100);
    const finalTotal = totalAfterDiscount + tax;

    const applyDiscountCode = () => {
        const code = discountCodes.find(c => c.code === discountCode && c.active);
        if (code) {
            setAppliedDiscount({ type: code.type, value: code.value, code: code.code });
            incrementDiscountCodeUsage(code.code); // Track usage
            setManualDiscount('');
            setDiscountCode('');
        } else {
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-error-tone-2845.mp3');
            audio.play().catch(() => { });
            alert('كود الخصم غير صحيح أو غير فعال');
        }
    };

    const applyManualDiscount = () => {
        const val = parseFloat(manualDiscount);
        if (!isNaN(val) && val >= 0) {
            setAppliedDiscount({ type: 'fixed', value: val });
            setDiscountCode('');
        }
    };

    const clearDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode('');
        setManualDiscount('');
    };

    const printReceipt = (orderId: string, orderData: any) => {
        const printData = {
            order: orderData,
            settings: settings,
            customerName: customers.find(c => c.id === orderData.customerId)?.name || 'عميل نقدي'
        };
        sessionStorage.setItem(`print_data_${orderId}`, JSON.stringify(printData));
        window.open(`/print-receipt/${orderId}`, '_blank', 'width=600,height=800');
    };

    const handleCashCheckout = () => {
        if (cart.length === 0) return;

        const newOrderId = `ORD-${Date.now()}`;
        const orderData = {
            id: newOrderId,
            items: [...cart],
            subtotal,
            discount: discountAmount,
            tax,
            total: finalTotal,
            date: new Date().toISOString(),
            paymentMethod: 'cash' as const,
            discountCode: appliedDiscount?.code,
            status: 'completed' as const
        };

        addOrder(orderData);
        clearCart();
        clearDiscount();

        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-cash-register-purchase-873.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));

        setLastScanned('تم تسجيل العملية بنجاح');
        setTimeout(() => setLastScanned(null), 3000);

        printReceipt(newOrderId, orderData);
    };

    const handleSelectCustomer = (c: Customer) => {
        setSelectedCustomerId(c.id);
        if (c.maxDebtLimit && (c.totalDebt + finalTotal) > c.maxDebtLimit) {
            setDebtWarning(`تنبيه: هذا العميل سيتجاوز الحد الائتماني المسموح (${c.maxDebtLimit}). الدين الجديد سيصبح ${(c.totalDebt + finalTotal).toLocaleString()}`);
        } else if (c.nextPaymentDate && new Date(c.nextPaymentDate) < new Date()) {
            setDebtWarning(`تنبيه: هذا العميل متأخر عن موعد السداد المحدد بتاريخ ${new Date(c.nextPaymentDate).toLocaleDateString()}`);
        } else {
            setDebtWarning(null);
        }
    };

    const handleCreditCheckout = () => {
        if (!selectedCustomerId) return;
        const newOrderId = `ORD-${Date.now()}`;

        const orderData = {
            id: newOrderId,
            items: [...cart],
            subtotal,
            discount: discountAmount,
            tax,
            total: finalTotal,
            date: new Date().toISOString(),
            paymentMethod: 'credit' as const,
            customerId: selectedCustomerId,
            discountCode: appliedDiscount?.code,
            status: 'completed' as const
        };

        addOrder(orderData);

        addCustomerTransaction(selectedCustomerId, {
            id: `TRX-${Date.now()}`,
            date: new Date().toISOString(),
            type: 'purchase',
            amount: finalTotal,
            note: `فاتورة مبيعات #${newOrderId}`,
            orderId: newOrderId
        });

        clearCart();
        clearDiscount();
        setIsCreditModalOpen(false);
        setLastScanned('تم تسجيل البيع الآجل بنجاح');
        setTimeout(() => setLastScanned(null), 3000);

        printReceipt(newOrderId, orderData);
    };

    const filteredCustomersList = customers.filter(c => c.name.includes(searchCustomer) || c.phone.includes(searchCustomer));

    const handleQuickAddCustomer = () => {
        if (!quickName) return;
        const newCustomer: Customer = {
            id: Date.now().toString(),
            name: quickName,
            phone: quickPhone,
            totalDebt: 0,
            transactions: []
        };
        addCustomer(newCustomer);
        setSelectedCustomerId(newCustomer.id);
        setIsQuickAddOpen(false);
        setQuickName('');
        setQuickPhone('');
        setDebtWarning(null);
    };

    return (
        <div className="animate-in fade-in duration-500 h-full flex flex-col p-6 overflow-hidden">
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Products Section */}
                <div className="col-span-12 lg:col-span-8 flex flex-col relative h-full min-h-0">
                    {lastScanned && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
                            <Scan size={20} />
                            <span className="font-bold">تم إضافة: {lastScanned}</span>
                        </div>
                    )}

                    <div className="flex gap-2 mb-4 shrink-0">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-xs transition-all focus-within:max-w-md">
                            <input
                                type="text"
                                placeholder="بحث (اسم / باركود)..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-300 hover:text-slate-500">
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <button onClick={() => setShowCamera(true)} className="bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition shadow-lg shadow-slate-800/20">
                            <Barcode size={20} />
                            <span className="hidden md:inline">مسح</span>
                        </button>

                        {/* Remote Scan Button */}
                        <button
                            onClick={() => {
                                const socket = io(`http://${window.location.hostname}:3001`);
                                socket.emit('REQUEST_SCAN', { requester: 'POS' });
                                // Optional: Show toast "Check your phone"
                                setLastScanned('تم إرسال طلب المسح للهاتف 📱');
                                setTimeout(() => setLastScanned(null), 3000);
                            }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
                            title="افتح الكاميرا في الهاتف المتصل"
                        >
                            <Smartphone size={20} />
                            <span className="hidden md:inline">مسح بالهاتف</span>
                        </button>
                    </div>

                    <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto pr-2 pb-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {paginatedItems.map((item: any) => {
                                // Check if it's an offer (has targetProductIds)
                                if (item.targetProductIds) {
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleAddOffer(item)}
                                            className="bg-indigo-50/80 rounded-xl shadow-sm border-2 border-indigo-100 border-dashed p-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-between gap-3 h-full min-h-[70px] group"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                    <Tag size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-indigo-900 text-sm truncate leading-tight">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-[10px] text-indigo-600 font-bold mt-1 bg-white/50 px-2 py-0.5 rounded-full w-fit">
                                                        {item.type === 'percentage' ? `خصم ${item.value}%` : `خصم ${item.value} ج.م`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // It's a product
                                const activeOffer = getProductOffer(item.id);
                                return (
                                    <ProductCardWrapper
                                        key={item.id}
                                        product={item}
                                        offer={activeOffer}
                                        onClick={() => addToCart(item)}
                                    />
                                );
                            })}

                            {paginatedItems.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-16 h-full border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                                    <Scan size={64} className="mb-6 text-slate-300 animate-pulse" />
                                    <p className="text-xl font-bold text-slate-500 mb-2">جاهز للبيع</p>
                                    <p className="text-sm text-slate-400">ابدأ بمسح الباركود أو البحث عن منتج لإضافته</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pagination - Fixed at Bottom */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between py-3 pt-4 border-t border-slate-100 bg-white mt-auto shrink-0">
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
                </div>

                {/* Cart Section */}
                <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="text-indigo-600" size={20} />
                            <h2 className="font-bold text-slate-800">الفاتورة</h2>
                        </div>
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{cart.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                <ShoppingBag size={48} className="mb-2" />
                                <p>السلة فارغة</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-500">{item.name.charAt(0)}</div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-800 break-words whitespace-normal max-w-[120px] sm:max-w-[150px] leading-tight">{item.name}</h4>
                                            <p className="text-xs text-slate-500">{item.price} × {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-indigo-600 text-sm">{item.price * item.quantity}</span>
                                        <button onClick={() => removeFromCart(item.id)} className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                        {/* Discount Section */}
                        <div className="mb-4">
                            <button onClick={() => setShowDiscount(!showDiscount)} className="text-xs text-indigo-600 font-bold hover:underline mb-2 flex items-center gap-1">
                                {showDiscount ? 'إخفاء الخصم' : 'إضافة خصم / كود'}
                            </button>

                            {showDiscount && (
                                <div className="bg-white p-3 rounded-xl border border-indigo-100 mb-3 animate-in slide-in-from-top-2">
                                    {appliedDiscount ? (
                                        <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg border border-green-100">
                                            <div className="text-sm text-green-700 font-bold">
                                                خصم {appliedDiscount.code ? `(كود: ${appliedDiscount.code})` : 'يدوي'}: {appliedDiscount.type === 'percentage' ? `%${appliedDiscount.value}` : appliedDiscount.value}
                                            </div>
                                            <button onClick={clearDiscount} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="كود الخصم"
                                                    className="flex-1 p-2 text-sm border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={discountCode}
                                                    onChange={e => setDiscountCode(e.target.value)}
                                                />
                                                <button onClick={applyDiscountCode} className="bg-indigo-600 text-white px-3 rounded-lg text-sm font-bold">تطبيق</button>
                                            </div>
                                            <div className="text-center text-xs text-slate-400">- أو -</div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="خصم مباشر (مبلغ)"
                                                    className="flex-1 p-2 text-sm border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={manualDiscount}
                                                    onChange={e => setManualDiscount(e.target.value)}
                                                />
                                                <button onClick={applyManualDiscount} className="bg-slate-700 text-white px-3 rounded-lg text-sm font-bold">خصم</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>المجموع الفرعي</span>
                                <span>{subtotal.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-bold">
                                    <span>الخصم</span>
                                    <span>-{discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>الضريبة ({settings.taxRate}%)</span>
                                <span>{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-slate-800 pt-2 border-t border-slate-200">
                                <span>الإجمالي</span>
                                <span>{finalTotal.toFixed(2)} {settings.currency}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handleCashCheckout} disabled={cart.length === 0} className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white hover:bg-green-600 font-bold rounded-xl shadow-lg disabled:opacity-50 transition">
                                <Banknote size={18} />
                                كاش
                            </button>
                            <button
                                onClick={() => setIsCreditModalOpen(true)}
                                disabled={cart.length === 0}
                                className="flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-xl shadow-lg disabled:opacity-50 transition"
                            >
                                <User size={18} />
                                آجل / دين
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Camera Modal */}
            {showCamera && <CameraScanner onScan={handleScan} onClose={() => setShowCamera(false)} />}

            {/* Credit / Customer Selection Modal */}
            {isCreditModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl">اختر العميل للبيع الآجل</h3>
                            <button onClick={() => setIsCreditModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>

                        {debtWarning && (
                            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl mb-4 flex gap-2 border border-red-100">
                                <AlertTriangle size={20} className="shrink-0" />
                                <p>{debtWarning}</p>
                            </div>
                        )}

                        {!isQuickAddOpen ? (
                            <>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="بحث عن عميل..."
                                        className="flex-1 p-3 bg-slate-50 border rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 transition outline-none"
                                        value={searchCustomer}
                                        onChange={e => setSearchCustomer(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={() => setIsQuickAddOpen(true)} className="p-3 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200" title="عميل جديد">
                                        <UserPlus size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                                    {filteredCustomersList.map(c => {
                                        const isRisky = (c.maxDebtLimit && c.totalDebt > c.maxDebtLimit) || (c.nextPaymentDate && new Date(c.nextPaymentDate) < new Date());
                                        return (
                                            <div
                                                key={c.id}
                                                onClick={() => handleSelectCustomer(c)}
                                                className={`p-3 rounded-xl border cursor-pointer transition flex justify-between items-center ${selectedCustomerId === c.id
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : isRisky ? 'border-red-100 bg-red-50/30 hover:bg-red-50' : 'border-slate-100 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-800">{c.name}</p>
                                                    <div className="flex text-xs text-slate-400 gap-2">
                                                        <span>{c.phone}</span>
                                                        {(c.maxDebtLimit && c.maxDebtLimit > 0) && (
                                                            <span className={c.totalDebt > c.maxDebtLimit ? 'text-red-500 font-bold' : ''}>
                                                                (الحد: {c.maxDebtLimit})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {c.totalDebt > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold">{c.totalDebt} دين</span>}
                                            </div>
                                        )
                                    })}
                                </div>

                                <button
                                    onClick={handleCreditCheckout}
                                    disabled={!selectedCustomerId}
                                    className={`w-full py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg transition transform active:scale-95 ${debtWarning ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    {debtWarning ? 'تأكيد البيع رغم المخاطرة' : `تأكيد البيع الآجل (${finalTotal.toFixed(2)})`}
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-700">بيانات العميل الجديد</h4>
                                    <button onClick={() => setIsQuickAddOpen(false)} className="text-sm text-indigo-600 hover:underline">رجوع للبحث</button>
                                </div>
                                <input type="text" placeholder="اسم العميل" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={quickName} onChange={e => setQuickName(e.target.value)} autoFocus />
                                <input type="text" placeholder="رقم الهاتف" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={quickPhone} onChange={e => setQuickPhone(e.target.value)} />
                                <button onClick={handleQuickAddCustomer} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg">إضافة واختيار</button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
