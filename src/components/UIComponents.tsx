import React from 'react';
import { createPortal } from 'react-dom';
// ToastContainer is now handled inside the Sidebar for a cleaner UI
// We keep the component export to avoid breaking imports, but it renders nothing.
export const ToastContainer: React.FC = () => {
    return null;
};

// Also exporting ConfirmDialog
import { Info, AlertOctagon } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen, title, message, onConfirm, onCancel,
    confirmText = 'تأكيد', cancelText = 'إلغاء', isDangerous = false
}) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-full ${isDangerous ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {isDangerous ? <AlertOctagon size={24} /> : <Info size={24} />}
                    </div>
                    <h3 className="font-bold text-xl text-slate-900">{title}</h3>
                </div>
                <p className="text-slate-500 mb-8 leading-relaxed font-medium">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">{cancelText}</button>
                    <button onClick={onConfirm} className={`flex-1 py-3 font-bold rounded-xl text-white shadow-lg transition transform active:scale-95 ${isDangerous ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}>{confirmText}</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export const AccessDenied: React.FC = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-in fade-in py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <AlertOctagon size={40} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-600 mb-2">غير مصرح لك بالوصول</h2>
            <p className="text-slate-500 max-w-sm text-center">عفواً، لا تمتلك الصلاحيات الكافية لعرض هذه الصفحة. يرجى مراجعة المدير العام.</p>
        </div>
    );
};
