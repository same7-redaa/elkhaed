import React from 'react';
import type { Order, SystemSettings } from '../store/useStore';

interface ReceiptTemplateProps {
    order: Order;
    settings: SystemSettings;
    customerName?: string;
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ order, settings, customerName }) => {
    return (
        <div id="receipt-print-area">
            {/* Header */}
            <div className="mb-2 pb-2 border-b border-black dashed flex flex-col items-center justify-center text-center">
                {settings.headerLogoUrl && (
                    <div className="w-full flex justify-center mb-2">
                        <img
                            src={settings.headerLogoUrl}
                            alt="Logo"
                            style={{
                                width: `${settings.headerLogoWidth || 50}%`,
                                display: 'block',
                                margin: '0 auto'
                            }}
                        />
                    </div>
                )}
                <h1 className="text-xl font-bold mb-1 w-full text-center">{settings.storeName || 'متجري'}</h1>
                <p className="text-sm" dir="ltr">{settings.storePhone}</p>
                <p className="text-sm">{settings.storeAddress}</p>
                {settings.receiptHeader && <p className="text-xs mt-2 whitespace-pre-wrap">{settings.receiptHeader}</p>}
            </div>

            {/* Meta Data */}
            <div className="mb-2 text-xs font-bold leading-relaxed pb-2 border-b border-black dashed">
                <div className="mb-1">
                    <span>رقم: #{order.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="mb-1">
                    <span dir="ltr">{new Date(order.date).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="mb-1">
                    <span>{order.paymentMethod === 'cash' ? 'نقدي' : 'آجل'}</span>
                </div>
                {customerName && (
                    <div className="mt-1">
                        <span>العميل: {customerName}</span>
                    </div>
                )}
            </div>

            {/* Items */}
            <table className="w-full mb-2 text-xs">
                <thead>
                    <tr>
                        <th>الصنف</th>
                        <th>ع</th>
                        <th>سعر</th>
                        <th>مجموع</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="font-bold pt-1">{item.name}</td>
                            <td className="pt-1">{item.quantity}</td>
                            <td className="pt-1">{item.price}</td>
                            <td className="pt-1">{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex flex-col gap-1 text-sm border-t border-black dashed pt-2 mb-2 items-center">
                <div className="font-bold">
                    <span>المجموع: {(order.total / (1 + settings.taxRate / 100)).toLocaleString()} {settings.currency}</span>
                </div>
                {settings.taxRate > 0 && (
                    <div className="text-xs">
                        <span>الضريبة ({settings.taxRate}%): {(order.total - (order.total / (1 + settings.taxRate / 100))).toLocaleString()}</span>
                    </div>
                )}
                <div className="text-xl font-bold mt-1 pt-1 border-t border-black dashed w-full text-center">
                    <span>الإجمالي: {order.total.toLocaleString()} {settings.currency}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-xs space-y-2 pt-2 border-t border-black dashed flex flex-col items-center">
                {settings.receiptFooter && <p className="whitespace-pre-wrap font-bold text-center">{settings.receiptFooter}</p>}

                {settings.footerLogoUrl && (
                    <div className="w-full flex justify-center mt-2">
                        <img
                            src={settings.footerLogoUrl}
                            alt="Footer Logo"
                            style={{
                                width: `${settings.footerLogoWidth || 50}%`,
                                display: 'block',
                                margin: '0 auto'
                            }}
                        />
                    </div>
                )}

                <div className="w-full flex justify-center mt-2">
                    <span className="font-mono text-[10px] border border-black px-2 rounded">
                        {order.id.slice(0, 12)}
                    </span>
                </div>
                <p className="text-[10px] text-center">*** شكرا لزيارتكم ***</p>
            </div>
        </div>
    );
};
