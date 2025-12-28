import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, ZapOff } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface CameraScannerProps {
    onScan: (result: string) => void;
    onClose: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReader = useRef<BrowserMultiFormatReader | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [torchOn, setTorchOn] = useState(false);

    const hasScanned = useRef(false);

    useEffect(() => {
        // Initialize Reader only when component mounts (modal opens)
        codeReader.current = new BrowserMultiFormatReader();

        // Start Decoding
        codeReader.current.decodeFromVideoDevice(
            null, // Use default or user-facing camera
            videoRef.current!,
            (result, err) => {
                if (result && !hasScanned.current) {
                    hasScanned.current = true;
                    // Play success sound
                    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
                    audio.play().catch(() => { });

                    onScan(result.getText());
                    // Don't close immediately to allow continuous scanning if needed, 
                    // but usually better to close or debounce.
                    // For this request, let's close to prevent double scan or let parent handle.
                    onClose();
                }
                if (err && !(err instanceof Object)) { // ZXing throws benign errors while scanning
                    console.warn(err);
                }
            }
        ).catch(err => {
            console.error(err);
            setError('تعذر الوصول للكاميرا. تأكد من السماح بالصلاحيات.');
        });

        // Cleanup: Stop Camera when unmounting (modal closes)
        return () => {
            if (codeReader.current) {
                codeReader.current.reset();
            }
        };
    }, []);

    const toggleTorch = async () => {
        // Advanced: Torch support depends on browser/hardware
        // Placeholder for visual toggle
        setTorchOn(!torchOn);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">

            {/* Header */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                <div className="text-white">
                    <h3 className="font-bold text-lg">ماسح الباركود</h3>
                    <p className="text-xs text-white/70">وجه الكاميرا نحو الباركود</p>
                </div>
                <button onClick={onClose} className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition">
                    <X size={24} />
                </button>
            </div>

            {/* Main Scanner Area */}
            <div className="relative w-full h-[60vh] max-w-lg bg-black overflow-hidden shadow-2xl rounded-2xl">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                />

                {/* Scanning Overlay (Red Line & Frame) */}
                <div className="absolute inset-0 border-2 border-white/20 m-8 rounded-xl pointer-events-none">
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>

                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-indigo-500 -ml-[2px] -mt-[2px] rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-indigo-500 -mr-[2px] -mt-[2px] rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-indigo-500 -ml-[2px] -mb-[2px] rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-indigo-500 -mr-[2px] -mb-[2px] rounded-br-lg"></div>
                </div>

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center">
                        <div className="bg-red-900/50 p-6 rounded-xl border border-red-500">
                            <p className="font-bold mb-2">خطأ!</p>
                            <p className="text-sm">{error}</p>
                            <button onClick={onClose} className="mt-4 px-4 py-2 bg-white text-black rounded-lg font-bold text-sm">إغلاق</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 flex gap-6">
                <button
                    onClick={toggleTorch}
                    className={`p-4 rounded-full transition ${torchOn ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {torchOn ? <ZapOff size={24} /> : <Zap size={24} />}
                </button>
            </div>

        </div>,
        document.body
    );
};
