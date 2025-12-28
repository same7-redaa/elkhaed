import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Store, User, ArrowRight, CheckCircle, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { useUI } from '../store/useUI';

export const SetupPage: React.FC = () => {
    const { completeSystemSetup } = useStore();
    const { showToast } = useUI();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [storeName, setStoreName] = useState('ELKHALED Store');
    const [currency, setCurrency] = useState('ج.م');
    const [adminName, setAdminName] = useState('المدير العام');
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('123');

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    React.useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the PWA prompt');
                } else {
                    console.log('User dismissed the PWA prompt');
                }
                setDeferredPrompt(null);
            });
        }
    };

    const handleFinish = () => {
        completeSystemSetup(
            { storeName, currency },
            { name: adminName, username, password }
        );
        showToast('تم إعداد النظام بنجاح! مرحباً بك', 'success');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-stc relative overflow-hidden p-6">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(48,84,255,0.05),transparent_50%)]"></div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500 flex flex-col md:flex-row">

                {/* Sidebar / Progress */}
                <div className="bg-indigo-600 text-white p-8 md:w-1/3 flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                            <img src="/logo_full.png" alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <h2 className="text-xl font-bold mb-1">إعداد النظام</h2>
                        <p className="text-indigo-200 text-xs">خطوات بسيطة للبدء</p>

                        <div className="mt-8 space-y-4">
                            <div className={clsx("flex items-center gap-3 text-sm transition-all", step >= 1 ? 'opacity-100 font-bold' : 'opacity-50')}>
                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center border-2", step > 1 ? 'bg-white text-indigo-600 border-white' : 'border-white/50 text-white')}>
                                    {step > 1 ? <CheckCircle size={16} /> : '1'}
                                </div>
                                <span>بيانات المتجر</span>
                            </div>
                            <div className={clsx("flex items-center gap-3 text-sm transition-all", step >= 2 ? 'opacity-100 font-bold' : 'opacity-50')}>
                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center border-2", step > 2 ? 'bg-white text-indigo-600 border-white' : 'border-white/50 text-white')}>
                                    {step > 2 ? <CheckCircle size={16} /> : '2'}
                                </div>
                                <span>حساب المدير</span>
                            </div>
                            <div className={clsx("flex items-center gap-3 text-sm transition-all", step >= 3 ? 'opacity-100 font-bold' : 'opacity-50')}>
                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center border-2", step === 3 ? 'bg-white text-indigo-600 border-white' : 'border-white/50 text-white')}>
                                    3
                                </div>
                                <span>تثبيت التطبيق</span>
                            </div>
                        </div>
                    </div>
                    {/* Decorative Circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-10 -left-10 w-40 h-40 bg-indigo-500/50 rounded-full blur-2xl"></div>
                </div>

                {/* Content Area */}
                <div className="p-8 md:w-2/3 flex flex-col bg-white">
                    <div className="flex-1">
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Store className="text-indigo-600" />
                                    بيانات المتجر الأساسية
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">اسم المتجر</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition font-bold"
                                        value={storeName}
                                        onChange={e => setStoreName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">العملة</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition"
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value)}
                                    >
                                        <option value="ج.م">جنيه مصري (EGP)</option>
                                        <option value="ر.س">ريال سعودي (SAR)</option>
                                        <option value="$">دولار أمريكي (USD)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <User className="text-indigo-600" />
                                    بيانات حساب المدير
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-600">الاسم الكامل</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition"
                                        value={adminName}
                                        onChange={e => setAdminName(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-600">اسم المستخدم</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-600">كلمة المرور</label>
                                        <input
                                            type="password"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-center py-4">
                                <h3 className="text-xl font-bold text-slate-800">جاهز للانطلاق!</h3>
                                <p className="text-slate-500">تم حفظ إعداداتك بنجاح. يمكنك الآن تثبيت التطبيق على جهازك للوصول السريع.</p>

                                {deferredPrompt ? (
                                    <button
                                        onClick={handleInstallClick}
                                        className="mx-auto flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-black transition transform hover:scale-105"
                                    >
                                        <Download size={20} />
                                        <span>تثبيت التطبيق (Install App)</span>
                                    </button>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 text-sm text-center">
                                        <p className="font-bold mb-1">التثبيت التلقائي غير متاح</p>
                                        <p className="text-xs text-slate-400">
                                            يرجى النقر على أيقونة التثبيت (
                                            <span className="inline-block px-1 border rounded bg-white mx-1">
                                                <Download size={10} className="inline" />
                                            </span>
                                            أو أيقونة الشاشة/الكمبيوتر) الموجودة في شريط عنوان المتصفح بالأعلى.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold transition"
                            >
                                سابق
                            </button>
                        ) : <div></div>}

                        {step < 3 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition flex items-center gap-2 font-bold"
                            >
                                التالي
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                className="px-8 py-3 bg-green-600 text-white rounded-xl shadow-lg shadow-green-600/20 hover:bg-green-700 transition flex items-center gap-2 font-bold animate-pulse"
                            >
                                بدء الاستخدام
                                <CheckCircle size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
