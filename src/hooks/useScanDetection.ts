import { useEffect, useState } from 'react';

export const useScanDetection = ({ onScan }: { onScan: (code: string) => void }) => {
    const [barcode, setBarcode] = useState('');

    useEffect(() => {
        let timeout: any;

        const handleKeyDown = (e: KeyboardEvent) => {
            // If user is typing in an input field, ignore strict scan logic usually,
            // but strictly for global scanning we might want to be careful.
            // For now, we'll allow scanning anywhere unless it interferes significantly.
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === 'Enter') {
                if (barcode) {
                    onScan(barcode);
                    setBarcode('');
                }
            } else if (e.key.length === 1) {
                // Append character
                setBarcode(prev => prev + e.key);

                // Clear buffer if too slow (manual typing distinction)
                // Handheld scanners are very fast (<50ms usually)
                clearTimeout(timeout);
                timeout = setTimeout(() => setBarcode(''), 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timeout);
        };
    }, [barcode, onScan]);
};
