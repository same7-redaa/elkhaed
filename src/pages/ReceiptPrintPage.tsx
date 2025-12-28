import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReceiptTemplate } from '../components/ReceiptTemplate';
import type { Order } from '../store/useStore';

export const ReceiptPrintPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();

    // Note: useStore might be empty in new window if not hydrated. 
    // We will rely on sessionStorage for the order, but we might need settings too.
    // Ideally settings are also passed or we rely on them being default/loaded.

    // To be safe, let's try to get full state from sessionStorage if we decide to pass it all, 
    // OR just accept that settings might be default if not persisted. 
    // BUT, since we are moving towards a system where the user wants "perfect" printing, 
    // we should ensure settings (Logo, etc) are correct.

    // Let's assume for now we pass 'settings' and 'customerName' inside the wrapper object in sessionStorage 
    // to avoid store dependency issues in this ephemeral window.

    const [printData, setPrintData] = useState<{
        order: Order;
        settings: any;
        customerName: string;
    } | null>(null);

    useEffect(() => {
        if (!orderId) return;

        try {
            const storedData = sessionStorage.getItem(`print_data_${orderId}`);
            if (storedData) {
                const parsed = JSON.parse(storedData);
                setPrintData(parsed);

                // trigger print after a short delay
                setTimeout(() => {
                    window.print();
                    // Auto-close for a seamless experience
                    window.close();
                }, 500);
            }
        } catch (e) {
            console.error("Failed to load print data", e);
        }
    }, [orderId]);

    if (!printData) {
        return <div className="p-10 text-center">جاري تحميل الفاتورة... (أو لم يتم العثور على بيانات)</div>;
    }

    return (
        <div className="w-full min-h-screen bg-white flex items-start justify-center p-0 m-0">
            {/* We render the template directly. 
                 The CSS for print is global, but we also want it to look good on screen 
                 in this popup before it hits the printer. */}
            <ReceiptTemplate
                order={printData.order}
                settings={printData.settings}
                customerName={printData.customerName}
            />
        </div>
    );
};
