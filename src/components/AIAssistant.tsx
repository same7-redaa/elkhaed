import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, BrainCircuit, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useUI } from '../store/useUI';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import type { Customer } from '../store/useStore';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    isError?: boolean;
}

interface Context {
    type: 'product' | 'customer' | 'cart' | 'settings' | 'sales';
    id?: string;
    data?: any;
}

const normalize = (text: string) => text.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ًٌٍَُِّْ]/g, '').trim();

export const AIAssistant: React.FC = () => {
    const { isChatOpen, toggleChat } = useUI();
    const store = useStore();
    const navigate = useNavigate();

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: 'أهلاً بك! أنا تدربت الآن على كل كبيرة وصغيرة في النظام. جربني في أي حاجة (مخازن، عملاء، ديون، مبيعات)! 🧠🔧', sender: 'ai', timestamp: new Date() }
    ]);
    const [isTyping, setIsTyping] = useState(false); // Restored

    // ... (keep refs)

    // ... (keep logic)

    // Inside JSX:
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
        {messages.map((msg) => (
            <div key={msg.id} className={clsx("max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm relative animate-in slide-in-from-bottom-2 duration-300",
                msg.sender === 'user' ? "bg-slate-800 text-white self-end mr-auto rounded-tr-none"
                    : (msg.isError ? "bg-red-50 text-red-800 border border-red-100 self-start ml-auto rounded-tl-none" : "bg-white text-slate-700 border border-slate-200 self-start ml-auto rounded-tl-none font-medium"))}>
                {msg.text}
            </div>
        ))}
        {isTyping && (
            <div className="text-xs text-slate-400 p-2 animate-pulse self-start ml-auto">
                جاري الكتابة...
            </div>
        )}
    </div>

    // THE AGENT MEMORY
    const contextRef = useRef<Context | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
        if (isChatOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [messages, isChatOpen]);

    // --- FULL SYSTEM TRAINING BRAIN 🧠 ---
    const processCommand = (rawText: string): { response: string, action?: () => void, isError?: boolean } => {
        const text = normalize(rawText);
        const numbers = rawText.match(/\d+(\.\d+)?/g)?.map(Number) || [];

        // ---------------------------------------------------------
        // 1. CONTEXT & SUBJECT RESOLUTION
        // ---------------------------------------------------------
        let currentSubject: { type: 'product' | 'customer', item: any } | null = null;

        const foundProduct = store.products.find(p => text.includes(normalize(p.name)));
        const foundCustomer = store.customers.find(c => text.includes(normalize(c.name)));

        if (foundProduct) {
            currentSubject = { type: 'product', item: foundProduct };
            contextRef.current = { type: 'product', id: foundProduct.id };
        } else if (foundCustomer) {
            currentSubject = { type: 'customer', item: foundCustomer };
            contextRef.current = { type: 'customer', id: foundCustomer.id };
        } else if (contextRef.current?.id) {
            const continuityKeywords = ['سعره', 'مخزونه', 'خليه', 'غيره', 'امسحه', 'هو', 'ديونه', 'حسابه', 'منه', 'له', 'عليه', 'بياناته'];
            if (continuityKeywords.some(k => text.includes(k)) || (numbers.length > 0 && !text.includes('جديد'))) {
                if (contextRef.current.type === 'product') {
                    const p = store.products.find(x => x.id === contextRef.current?.id);
                    if (p) currentSubject = { type: 'product', item: p };
                } else if (contextRef.current.type === 'customer') {
                    const c = store.customers.find(x => x.id === contextRef.current?.id);
                    if (c) currentSubject = { type: 'customer', item: c };
                }
            }
        }

        // ---------------------------------------------------------
        // 2. INTENT CLASSIFICATION
        // ---------------------------------------------------------
        const intents = {
            add: ['ضيف', 'زود', 'هات', 'حط', 'انشاء', 'سجل', 'جديد', 'بيع', 'ادخل'],
            remove: ['امسح', 'حذف', 'شيل', 'الغاء', 'رمي', 'تفريغ'],
            update: ['تعديل', 'تغيير', 'بدل', 'خلي', 'اجعل', 'ضبط', 'حدث', 'غير', 'سدد', 'دفع'],
            info: ['عرض', 'فتح', 'وريني', 'شوف', 'تقرير', 'كام', 'كم', 'اجمالي', 'مجموع', 'احسب', 'تفاصيل', 'بيانات', 'فين', 'مين'],
        };
        let intent: string = 'unknown';
        for (const [key, keywords] of Object.entries(intents)) {
            if (keywords.some(k => text.includes(k))) intent = key;
        }
        if (intent === 'unknown' && currentSubject && numbers.length > 0) intent = 'update';

        // ---------------------------------------------------------
        // 3. EXECUTION LOGIC (TRAINED SKILLS)
        // ---------------------------------------------------------

        // === SKILL: SALES & POS ===
        const isCart = text.includes('فاتوره') || text.includes('سله') || text.includes('كاشير');
        if (isCart && intent === 'remove') {
            return { response: 'تم تفريغ الفاتورة بالكامل.', action: () => { store.clearCart(); navigate('/pos'); } };
        }

        // === SKILL: PRODUCTS & INVENTORY ===
        if (currentSubject?.type === 'product' || (text.includes('منتج') && intent === 'add')) {
            const product = currentSubject?.item as Product;

            // Info
            if (intent === 'info' && product) {
                const p = product as any;
                return { response: `📦 ${p.name}\n💰 السعر: ${p.price}\n📊 المخزون: ${p.stock}\n🛑 حد الطلب: ${p.minStockLevel}` };
            }
            // Add to Cart
            if (intent === 'add' && product && !text.includes('جديد')) {
                const qty = numbers[0] || 1;
                return { response: `تم إضافة ${qty} ${product.name} للفاتورة.`, action: () => { store.addToCart({ ...(product as any), quantity: qty }); navigate('/pos'); } };
            }
            // Create New
            if (intent === 'add' && !product) {
                const price = numbers.find(n => n < 100000) || 0;
                const stock = numbers.find(n => n !== price && n < 1000) || 10;
                let name = rawText.replace(/\d+/g, '').replace(/(?:ضيف|جديد|منتج|صنف|سعر|مخزون|و|ب)/g, '').trim();
                if (name.length < 2) name = "منتج جديد";
                return {
                    response: `تم إضافة "${name}" للمخزن (سعر: ${price}).`,
                    action: () => {
                        const newP = { id: Date.now().toString(), name, price, category: 'عام', stock, minStockLevel: 5, barcode: Date.now().toString().slice(-6), status: 'active' as const, costPrice: price * 0.8 };
                        store.addProduct(newP);
                        contextRef.current = { type: 'product', id: newP.id };
                        navigate('/products');
                    }
                };
            }
            // Update
            if (intent === 'update' && product) {
                if (text.includes('مخزون') || text.includes('كميه')) {
                    const newStock = numbers[0];
                    if (newStock !== undefined) return { response: `تم تعديل مخزون ${product.name} إلى ${newStock}.`, action: () => store.updateProduct(product.id, { stock: newStock }) };
                }
                // If keyword 'سعر' is present or just a number
                const newPrice = numbers[0];
                if (newPrice !== undefined) return { response: `تم تغيير سعر ${product.name} إلى ${newPrice}.`, action: () => store.updateProduct(product.id, { price: newPrice }) };
            }
            // Remove
            if (intent === 'remove' && product) {
                contextRef.current = null;
                return { response: `تم حذف المنتج ${product.name} من النظام.`, action: () => store.deleteProduct(product.id) };
            }
        }

        // === SKILL: CUSTOMERS & DEBT ===
        if (currentSubject?.type === 'customer' || (text.includes('عميل') && intent === 'add')) {
            const customer = currentSubject?.item as Customer;

            // Info / Debt Check
            if (intent === 'info' && customer) {
                const lastTrx = customer.transactions[0] ? `(آخر عملية: ${new Date(customer.transactions[0].date).toLocaleDateString()})` : '';
                return { response: `👤 ${customer.name}\n📱 ${customer.phone}\n💸 عليه: ${customer.totalDebt} ${store.settings.currency} ${lastTrx}` };
            }
            // Pay Debt (New Skill!)
            if (intent === 'update' && customer && (text.includes('سدد') || text.includes('دفع'))) {
                const amount = numbers[0];
                if (amount) {
                    return {
                        response: `تم تسجيل سداد بقيمة ${amount} للعميل ${customer.name}.`,
                        action: () => store.addCustomerTransaction(customer.id, {
                            id: Date.now().toString(), date: new Date().toISOString(), type: 'payment', amount, note: 'سداد عبر المساعد الذكي'
                        })
                    };
                }
                return { response: 'كم المبلغ الذي دفعه العميل؟', isError: true };
            }
            // Create New
            if (intent === 'add' && !customer) {
                let name = rawText.replace(/\d+/g, '').replace(/(?:عميل|جديد|ضيف|رقم|تليفون|و|اسم|اسمه)/g, '').trim();
                const phone = numbers[0] ? numbers[0].toString() : '';
                return {
                    response: `تم تسجيل العميل الجديد "${name}".`,
                    action: () => {
                        const newC = { id: Date.now().toString(), name, phone, totalDebt: 0, transactions: [] };
                        store.addCustomer(newC);
                        contextRef.current = { type: 'customer', id: newC.id };
                        navigate('/customers');
                    }
                };
            }
        }

        // === SKILL: REPORTS & ANALYTICS ===
        if (intent === 'info') {
            if (text.includes('مبيعات') || text.includes('دخل')) {
                const today = new Date().toISOString().split('T')[0];
                const daily = store.orders.filter(o => o.date.startsWith(today)).reduce((a, b) => a + b.total, 0);
                const total = store.orders.reduce((a, b) => a + b.total, 0);
                return { response: `📊 تقرير المبيعات:\n- اليوم: ${daily.toLocaleString()}\n- الكلي: ${total.toLocaleString()}` };
            }
            if (text.includes('ديون') || text.includes('لينا')) {
                const totalDebt = store.customers.reduce((a, b) => a + b.totalDebt, 0);
                const debtCount = store.customers.filter(c => c.totalDebt > 0).length;
                return { response: `📉 تقرير الديون:\n- إجمالي المستحق: ${totalDebt.toLocaleString()}\n- عدد العملاء المدينين: ${debtCount}` };
            }
            if (text.includes('نواقص') || text.includes('خلص')) {
                const low = store.products.filter(p => p.stock <= p.minStockLevel);
                if (low.length === 0) return { response: '✅ المخزون تمام! مفيش نواقص.' };
                return { response: `⚠️ منتجات اوشكت على الانتهاء:\n${low.map(p => `- ${p.name} (${p.stock})`).join('\n')}` };
            }
        }

        // === SKILL: SETTINGS ===
        if (text.includes('اعدادات') || text.includes('نظام')) {
            if (text.includes('ضريبه') && numbers[0] !== undefined) {
                return { response: `تم تحديث الضريبة لـ ${numbers[0]}%`, action: () => store.updateSettings({ taxRate: numbers[0] }) };
            }
            if (text.includes('اسم')) {
                const name = rawText.replace(/(?:تغيير|اسم|المحل|المتجر|الى|لـ)/g, '').trim();
                return { response: `اسم المتجر الجديد: ${name}`, action: () => store.updateSettings({ storeName: name }) };
            }
            return { response: 'فتح شاشة الإعدادات.', action: () => navigate('/settings') };
        }

        // === SKILL: NAVIGATION ===
        if (text.includes('عملاء')) return { response: 'فتح العملاء.', action: () => navigate('/customers') };
        if (text.includes('منتجات') || text.includes('مخزن')) return { response: 'فتح المخزن.', action: () => navigate('/products') };

        // Fallback with context hint
        return {
            response: 'أنا مدرب على كل حاجة، ممكن الأمر ماكانش واضح. جرب: "ضيف عميل"، "تقرير مبيعات"، "سدد دين فلان"..',
            isError: true
        };
    };

    const handleSend = () => {
        if (!input.trim()) return;
        const userText = input;

        setMessages(prev => [...prev, { id: Date.now().toString(), text: userText, sender: 'user', timestamp: new Date() }]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const result = processCommand(userText);
            if (result.action) {
                try { result.action(); }
                catch (e) { console.error(e); result.response = "حدث خطأ غير متوقع."; result.isError = true; }
            }
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: result.response,
                sender: 'ai',
                timestamp: new Date(),
                isError: result.isError
            }]);
            setIsTyping(false);
        }, 400); // Faster response
    };

    return (
        <div
            className={clsx(
                "fixed top-0 left-0 bottom-0 w-full md:w-96 bg-white shadow-2xl border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out z-40 font-stc",
                isChatOpen ? "translate-x-0" : "-translate-x-full"
            )}
            style={{ direction: 'rtl' }}
        >
            <div className="bg-white border-b border-slate-100 px-4 flex items-center justify-between shrink-0 h-[70px]">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
                        <BrainCircuit size={22} className="fill-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">وكيل النظام</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Full System Access</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setMessages([])} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                    <button onClick={toggleChat} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
                {messages.map((msg) => (
                    <div key={msg.id} className={clsx("max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm relative animate-in slide-in-from-bottom-2 duration-300",
                        msg.sender === 'user' ? "bg-slate-800 text-white self-end mr-auto rounded-tr-none"
                            : (msg.isError ? "bg-red-50 text-red-800 border border-red-100 self-start ml-auto rounded-tl-none" : "bg-white text-slate-700 border border-slate-200 self-start ml-auto rounded-tl-none font-medium"))}>
                        {msg.text}
                    </div>
                ))}
            </div>

            <div className="p-3 bg-white border-t border-slate-100">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-inner">
                    <button type="submit" disabled={!input.trim()} className="p-2.5 m-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0 active:scale-95"><ChevronLeft size={18} /></button>
                    <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="اكتب للوكيل..." className="w-full bg-transparent border-none px-3 py-3 text-sm focus:ring-0 text-right font-medium text-slate-700 placeholder:text-slate-400" dir="auto" />
                </form>
            </div>
        </div>
    );
};
