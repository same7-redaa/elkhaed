import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { login } = useStore();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate network delay for feel
        setTimeout(() => {
            const success = login(username, password);
            if (success) {
                navigate('/');
            } else {
                setError('بيانات الدخول غير صحيحة');
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-stc relative overflow-hidden">
            {/* Background Effects - Light Theme */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(48,84,255,0.05),transparent_50%)]"></div>
            <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="bg-white border border-slate-100 p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-white border border-slate-100 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-4 transform hover:scale-105 transition-transform duration-300">
                        <img src="/ELKHALED.png" alt="ELKHALED" className="w-12 h-12 object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">تسجيل الدخول</h1>
                    <p className="text-slate-500 text-sm">أهلاً بك في نظام ELKHALED</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2 font-bold">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 mr-1 block">اسم المستخدم</label>
                        <div className="relative group">
                            <User className="absolute right-3 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition outline-none placeholder:text-slate-400 font-bold"
                                placeholder="admin"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 mr-1 block">كلمة المرور</label>
                        <div className="relative group">
                            <Lock className="absolute right-3 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition outline-none placeholder:text-slate-400 font-bold"
                                placeholder="••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>تسجيل الدخول</span>
                                <LogIn size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-50 text-center text-xs text-slate-400">
                    <p>كلمة المرور الافتراضية: <span className="text-slate-600 font-bold font-mono bg-slate-100 px-2 py-1 rounded">123</span></p>
                </div>
            </div>
        </div>
    );
};
