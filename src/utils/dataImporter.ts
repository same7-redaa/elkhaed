import type { Product, Customer } from '../store/useStore';

// We will try importing directly. 
// Note: This relies on Vite being able to resolve this path.
// @ts-ignore
import legacyProducts from '../../داتا/products.json';
// @ts-ignore
import legacyCustomers from '../../داتا/customers.json';

// Define Legacy Interfaces based on observed JSON
interface LegacyProduct {
    id: string;
    name: string;
    barcode: string;
    price: number;
    purchasePrice: number;
    quantity: number;
    unit?: { id: number; name: string };
    // ... other fields
}

interface LegacyCustomer {
    id: string;
    name: string;
    phone: string;
    debt: number;
    address?: string;
    notes?: string;
    invoiceCount?: number;
    lastTransaction?: string;
}

// Validate JSON files to ensure they are arrays
const validProducts = Array.isArray(legacyProducts) ? legacyProducts : [];
const validCustomers = Array.isArray(legacyCustomers) ? legacyCustomers : [];

export const processLegacyData = () => {
    const products: Product[] = (validProducts as LegacyProduct[]).map(p => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        price: Number(p.price),
        costPrice: Number(p.purchasePrice),
        stock: Number(p.quantity),
        minStockLevel: 5,
        category: 'عام',
        notes: p.unit ? `الوحدة: ${p.unit.name}` : '',
        image: undefined,
        status: 'active'
    }));

    const customers: Customer[] = (validCustomers as LegacyCustomer[]).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        totalDebt: Number(c.debt || 0),
        transactions: []
    }));

    return { products, customers };
};
