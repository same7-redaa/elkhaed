import React from 'react';
import { Package } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
    product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-between gap-3 h-full min-h-[70px]">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Package size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight break-words whitespace-normal mb-1">
                        {product.name}
                    </h3>
                    <p className="text-xs text-indigo-600 font-bold">
                        {product.price} ج.م
                    </p>
                </div>
            </div>
        </div>
    );
};
