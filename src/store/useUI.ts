import { create } from 'zustand';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
}

interface UIState {
    toasts: Toast[];
    isChatOpen: boolean;

    showToast: (message: string, type?: Toast['type']) => void;
    removeToast: (id: string) => void;
    toggleChat: () => void;
    setChatOpen: (isOpen: boolean) => void;
}

export const useUI = create<UIState>((set, get) => ({
    toasts: [],
    isChatOpen: false,

    showToast: (message, type = 'info') => {
        // Prevent duplicate toasts
        const existing = get().toasts.find(t => t.message === message && t.type === type);
        if (existing) return;

        const id = Date.now().toString() + Math.random().toString().slice(2, 6);
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));

        // Auto remove after 3 seconds (reduced from 5 to be snappier)
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 3000);
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

    toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
    setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
}));
