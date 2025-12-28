import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { saveAllDataToDirectory, loadAllDataFromDirectory } from '../utils/fileSystem';

// --- Exporting Interfaces ---
export interface Product {
    id: string;
    name: string;
    barcode: string;
    price: number;
    costPrice: number;
    category: string;
    stock: number;
    minStockLevel: number;
    image?: string;
    description?: string;
    status: 'active' | 'archived';
}

export interface Offer {
    id: string;
    name: string;
    targetProductIds: string[];
    type: 'percentage' | 'fixed';
    value: number;
    startDate: string;
    endDate: string;
    usageCount?: number;
    isActive: boolean;
}

export interface DiscountCode {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    startDate?: string;
    endDate?: string;
    usageCount?: number;
    active: boolean;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface OrderItem extends CartItem {
    returnedQuantity?: number;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    totalDebt: number;
    maxDebtLimit?: number;
    nextPaymentDate?: string;
    transactions: Transaction[];
}

export interface Transaction {
    id: string;
    date: string;
    type: 'purchase' | 'payment' | 'refund';
    amount: number;
    orderId?: string;
    note?: string;
}

export interface Order {
    id: string;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    date: string;
    paymentMethod: 'cash' | 'credit';
    customerId?: string;
    status?: 'completed' | 'returned' | 'partially_returned';
    cashierId?: string;
    discountCode?: string; // If used
}

export interface SystemSettings {
    storeName: string;
    storeAddress: string;
    storePhone: string;
    currency: string;
    taxRate: number;
    receiptHeader: string;
    receiptFooter: string;
    enableStockAlerts: boolean;
    enableDebtAlerts: boolean;

    // Logo & Layout Customization
    headerLogoUrl?: string;
    headerLogoWidth?: number; // percentage
    footerLogoUrl?: string;
    footerLogoWidth?: number; // percentage
    showThankYouNote?: boolean;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    date: string;
    read: boolean;
    linkTo?: string;
}

export interface Expense {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    createdBy: string; // user id
}

// --- NEW AUTH TYPES ---
export type Role = 'admin' | 'manager' | 'cashier';

const INITIAL_EXPENSES: Expense[] = [];

// --- ALL PERMISSIONS ---
export const ALL_PERMISSIONS = [
    { id: 'dashboard.view', label: 'عرض لوحة التحكم', category: 'لوحة التحكم' },
    { id: 'reports.view', label: 'عرض التقارير', category: 'لوحة التحكم' },

    // POS
    { id: 'pos.access', label: 'الدخول لنقطة البيع', category: 'نقطة البيع' },

    // Products
    { id: 'products.view', label: 'عرض المنتجات والمخزون', category: 'المنتجات' },
    { id: 'products.add', label: 'إضافة منتجات جديدة', category: 'المنتجات' },
    { id: 'products.edit', label: 'تعديل المنتجات والأسعار', category: 'المنتجات' },
    { id: 'products.delete', label: 'حذف المنتجات', category: 'المنتجات' },

    // Sales
    { id: 'sales.view', label: 'عرض سجل المبيعات', category: 'المبيعات' },
    { id: 'sales.return', label: 'إمكانية عمل مرتجع', category: 'المبيعات' },

    // Offers & Discounts
    { id: 'offers.view', label: 'عرض العروض والخصومات', category: 'العروض والخصومات' },
    { id: 'offers.manage', label: 'إدارة العروض والخصومات', category: 'العروض والخصومات' },

    // Expenses
    { id: 'expenses.view', label: 'عرض المصروفات', category: 'المصروفات' },
    { id: 'expenses.manage', label: 'إدارة المصروفات', category: 'المصروفات' },

    // Suppliers
    { id: 'suppliers.manage', label: 'إدارة الموردين', category: 'الموردين' },

    // Others
    { id: 'customers.manage', label: 'إدارة العملاء والديون', category: 'العملاء' },
    { id: 'staff.manage', label: 'إدارة الموظفين', category: 'الموظفين' },
    { id: 'settings.manage', label: 'الإعدادات العامة', category: 'الإعدادات' },
];

export interface SupplierTransaction {
    id: string;
    date: string;
    type: 'purchase' | 'payment'; // purchase = we bought on credit (debt increases), payment = we paid them (debt decreases)
    amount: number;
    note?: string;
}

export interface Supplier {
    id: string;
    name: string;
    phone: string;
    contactPerson?: string;
    totalDebt: number; // Money we owe them
    transactions: SupplierTransaction[];
}

export interface User {
    id: string;
    username: string;
    password: string; // In real app, this should be hashed!
    name: string;
    role: Role;
    permissions: string[]; // List of permission IDs
}

interface AppState {
    products: Product[];
    cart: CartItem[];
    orders: Order[];
    customers: Customer[];
    suppliers: Supplier[];
    notifications: AppNotification[];
    settings: SystemSettings;
    discountCodes: DiscountCode[];
    offers: Offer[];
    expenses: Expense[];

    // Auth State
    currentUser: User | null;
    users: User[];

    // System Setup State
    isSystemSetup: boolean;
    completeSystemSetup: (settings: Partial<SystemSettings>, adminUser: Partial<User>) => void;

    // Actions
    addToCart: (item: Product) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
    addProduct: (product: Product) => void;
    updateProduct: (id: string, product: Partial<Product>) => void;
    deleteProduct: (id: string) => void;

    // Discount Actions
    addDiscountCode: (code: DiscountCode) => void;
    deleteDiscountCode: (id: string) => void;

    // Offer Actions
    addOffer: (offer: Offer) => void;
    deleteOffer: (id: string) => void;
    toggleOfferStatus: (id: string) => void;
    incrementDiscountCodeUsage: (code: string) => void;
    incrementOfferUsage: (id: string) => void;

    // Expense Actions
    addExpense: (expense: Expense) => void;
    deleteExpense: (id: string) => void;

    // Supplier Actions
    addSupplier: (supplier: Supplier) => void;
    updateSupplier: (id: string, data: Partial<Supplier>) => void;
    deleteSupplier: (id: string) => void;
    addSupplierTransaction: (supplierId: string, transaction: SupplierTransaction) => void;

    addOrder: (order: Order) => void;
    returnOrderItems: (orderId: string, itemsToReturn: { itemId: string, quantity: number }[]) => void;

    addCustomer: (customer: Customer) => void;
    updateCustomer: (id: string, data: Partial<Customer>) => void;
    addCustomerTransaction: (customerId: string, transaction: Transaction) => void;

    updateSettings: (settings: Partial<SystemSettings>) => void;
    importData: (data: Partial<AppState>) => void;

    addNotification: (notification: Omit<AppNotification, 'read'>) => void;
    markNotificationAsRead: (id: string) => void;
    clearNotifications: () => void;

    checkDebtStatus: () => void;

    // User Management Actions
    login: (username: string, password: string) => boolean;
    logout: () => void;
    addUser: (user: User) => void;
    updateUser: (id: string, data: Partial<User>) => void;
    deleteUser: (id: string) => void;
    hasPermission: (permissionId: string) => boolean;

    // File System Actions
    loadDataFromFiles: () => Promise<boolean>;
    saveDataToFiles: () => Promise<void>;
}

// --- Initial Data ---
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_CUSTOMERS: Customer[] = [];
const INITIAL_SUPPLIERS: Supplier[] = [];
const INITIAL_USERS: User[] = [
    {
        id: '1', name: 'المدير العام', username: 'admin', password: '123', role: 'admin',
        permissions: ALL_PERMISSIONS.map(p => p.id)
    }
];
const INITIAL_DISCOUNT_CODES: DiscountCode[] = [];
const INITIAL_OFFERS: Offer[] = [];

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            products: INITIAL_PRODUCTS,
            customers: INITIAL_CUSTOMERS,
            suppliers: INITIAL_SUPPLIERS,
            users: INITIAL_USERS,
            discountCodes: INITIAL_DISCOUNT_CODES,
            offers: INITIAL_OFFERS,
            expenses: INITIAL_EXPENSES,
            currentUser: null, // Start logged out
            isSystemSetup: false, // Default is false, requiring setup
            cart: [],
            orders: [],
            notifications: [],
            settings: {
                storeName: 'ELKHALED Store',
                storeAddress: '',
                storePhone: '',
                taxRate: 14,
                currency: 'EGP',
                receiptHeader: 'أهلاً بكم',
                receiptFooter: 'شكراً لزيارتكم',
                enableStockAlerts: true,
                enableDebtAlerts: true
            },

            completeSystemSetup: (newSettings, adminData) => set((state) => {
                const updatedUsers = state.users.map(u =>
                    u.role === 'admin' ? { ...u, ...adminData } : u
                );
                const newState = {
                    settings: { ...state.settings, ...newSettings },
                    users: updatedUsers,
                    isSystemSetup: true
                };
                return newState;
            }),

            addToCart: (item) => set((state) => {
                const existing = state.cart.find((i) => i.id === item.id);
                if (existing) {
                    return { cart: state.cart.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
                }
                return { cart: [...state.cart, { ...item, quantity: 1 }] };
            }),

            removeFromCart: (id) => set((state) => ({ cart: state.cart.filter((i) => i.id !== id) })),
            clearCart: () => set({ cart: [] }),

            addProduct: (product) => set((state) => {
                const newState = { products: [...state.products, product] };
                return newState;
            }),

            updateProduct: (id, p) => set((state) => {
                const updatedProducts = state.products.map((x) => x.id === id ? { ...x, ...p } : x);
                const product = updatedProducts.find(x => x.id === id);
                let newNotifications = state.notifications;
                if (product && product.stock > product.minStockLevel) {
                    newNotifications = state.notifications.filter(n => !(n.type === 'warning' && n.id.includes(id)));
                }
                const newState = { products: updatedProducts, notifications: newNotifications };
                return newState;
            }),

            deleteProduct: (id) => set((state) => {
                const newState = { products: state.products.filter((p) => p.id !== id) };
                return newState;
            }),

            // Discount Actions
            addDiscountCode: (code) => set((state) => {
                const newState = { discountCodes: [...state.discountCodes, code] };
                return newState;
            }),
            deleteDiscountCode: (id) => set((state) => {
                const newState = { discountCodes: state.discountCodes.filter(c => c.id !== id) };
                return newState;
            }),

            // Offer Actions
            addOffer: (offer) => set((state) => {
                const newState = { offers: [...state.offers, offer] };
                return newState;
            }),
            deleteOffer: (id) => set((state) => {
                const newState = { offers: state.offers.filter(o => o.id !== id) };
                return newState;
            }),
            toggleOfferStatus: (id) => set((state) => {
                const newState = {
                    offers: state.offers.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o)
                };
                return newState;
            }),

            // Expense Actions
            addExpense: (expense) => set((state) => {
                const newState = { expenses: [expense, ...state.expenses] };
                return newState;
            }),
            deleteExpense: (id) => set((state) => {
                const newState = { expenses: state.expenses.filter(e => e.id !== id) };
                return newState;
            }),

            // Supplier Actions
            addSupplier: (supplier) => set((state) => {
                const newState = { suppliers: [...state.suppliers, supplier] };
                return newState;
            }),
            updateSupplier: (id, data) => set((state) => {
                const newState = {
                    suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...data } : s)
                };
                return newState;
            }),
            deleteSupplier: (id) => set((state) => {
                const newState = { suppliers: state.suppliers.filter(s => s.id !== id) };
                return newState;
            }),
            addSupplierTransaction: (supplierId, trx) => set((state) => {
                const supplier = state.suppliers.find(s => s.id === supplierId);
                let newDebt = supplier?.totalDebt || 0;
                if (trx.type === 'purchase') newDebt += trx.amount; // Bought on credit -> Owe MORE
                else if (trx.type === 'payment') newDebt -= trx.amount; // Paid -> Owe LESS

                const newState = {
                    suppliers: state.suppliers.map(s => s.id === supplierId ? { ...s, totalDebt: newDebt, transactions: [trx, ...s.transactions] } : s)
                };
                return newState;
            }),

            addOrder: (order) => set((state) => {
                const newProducts = state.products.map(p => {
                    const itemInCart = order.items.find(i => i.id === p.id);
                    if (itemInCart) return { ...p, stock: p.stock - itemInCart.quantity };
                    return p;
                });

                // Simplified notification logic
                const newNotifications = [...state.notifications];
                if (state.settings.enableStockAlerts) {
                    newNotifications.push(...newProducts.reduce((acc, p) => {
                        if (p.stock <= p.minStockLevel) {
                            const nid = `stock - ${p.id} `;
                            if (!state.notifications.find(n => n.id === nid)) {
                                acc.push({
                                    id: nid, title: 'تنبيه مخزون', message: `المنتج ${p.name} وصل للحد الأدنى(${p.stock})`,
                                    type: 'warning', date: new Date().toISOString(), linkTo: '/products', read: false
                                });
                            }
                        }
                        return acc;
                    }, [] as AppNotification[]));
                }

                const newState = {
                    orders: [order, ...state.orders],
                    products: newProducts,
                    notifications: newNotifications
                };
                return newState;
            }),

            returnOrderItems: (orderId, itemsToReturn) => set((state) => {
                const orderIndex = state.orders.findIndex(o => o.id === orderId);
                if (orderIndex === -1) return state;

                const order = state.orders[orderIndex];

                const newProducts = [...state.products];
                const newItems = order.items.map(item => {
                    const returnedItem = itemsToReturn.find(r => r.itemId === item.id);
                    if (returnedItem) {
                        // Update stock
                        const productIndex = newProducts.findIndex(p => p.id === item.id);
                        if (productIndex > -1) {
                            newProducts[productIndex] = {
                                ...newProducts[productIndex],
                                stock: newProducts[productIndex].stock + returnedItem.quantity
                            };
                        }
                        // Update item record
                        return { ...item, returnedQuantity: (item.returnedQuantity || 0) + returnedItem.quantity };
                    }
                    return item;
                });

                // Update status if fully returned
                const allReturned = newItems.every(i => i.quantity === (i.returnedQuantity || 0));
                const someReturned = newItems.some(i => (i.returnedQuantity || 0) > 0);
                const newStatus = allReturned ? 'returned' : someReturned ? 'partially_returned' : 'completed';

                const updatedOrders = [...state.orders];
                updatedOrders[orderIndex] = { ...order, items: newItems, status: newStatus };

                const newState = { orders: updatedOrders, products: newProducts };
                return newState;
            }),

            addCustomer: (customer) => set((state) => {
                const newState = { customers: [...state.customers, customer] };
                return newState;
            }),
            updateCustomer: (id, data) => set((state) => {
                const newState = {
                    customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c)
                };
                return newState;
            }),
            addCustomerTransaction: (customerId, trx) => set((state) => {
                const customer = state.customers.find(c => c.id === customerId);
                let newDebt = customer?.totalDebt || 0;
                if (trx.type === 'purchase') newDebt += trx.amount;
                else if (trx.type === 'payment') newDebt -= trx.amount;

                const newState = {
                    customers: state.customers.map(c => c.id === customerId ? { ...c, totalDebt: newDebt, transactions: [trx, ...c.transactions] } : c)
                };
                return newState;
            }),

            checkDebtStatus: () => set((state) => {
                let newNotifications = [...state.notifications];
                if (state.settings.enableDebtAlerts) {
                    state.customers.forEach(c => {
                        if (c.maxDebtLimit && c.totalDebt > c.maxDebtLimit) {
                            const nid = `debt - ${c.id} `;
                            if (!newNotifications.find(n => n.id === nid)) {
                                newNotifications.unshift({
                                    id: nid, title: 'تجاوز حد الائتمان', message: `العميل ${c.name} تجاوز الحد المسموح(${c.totalDebt})`,
                                    type: 'warning', date: new Date().toISOString(), linkTo: '/customers', read: false
                                });
                            }
                        }
                    });
                }
                return { notifications: newNotifications };
            }),

            updateSettings: (s) => set((state) => {
                const newState = { settings: { ...state.settings, ...s } };
                return newState;
            }),
            importData: (data) => set((state) => ({ ...state, ...data })),
            addNotification: (n) => set(s => ({ notifications: [{ ...n, read: false }, ...s.notifications] })),
            markNotificationAsRead: (id) => set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
            clearNotifications: () => set({ notifications: [] }),

            incrementDiscountCodeUsage: (code) => set((state) => {
                const newState = {
                    discountCodes: state.discountCodes.map(c =>
                        c.code === code ? { ...c, usageCount: (c.usageCount || 0) + 1 } : c
                    )
                };
                return newState;
            }),

            incrementOfferUsage: (id) => set((state) => {
                const newState = {
                    offers: state.offers?.map(o =>
                        o.id === id ? { ...o, usageCount: (o.usageCount || 0) + 1 } : o
                    )
                };
                return newState;
            }),

            // --- AUTH ACTIONS ---
            login: (username, password) => {
                const user = get().users.find(u => u.username === username && u.password === password);
                if (user) {
                    set({ currentUser: user });
                    return true;
                }
                return false;
            },
            logout: () => set({ currentUser: null }),
            addUser: (user) => set(state => {
                const newState = { users: [...state.users, user] };
                return newState;
            }),
            updateUser: (id, data) => set(state => {
                const updatedUsers = state.users.map(u => u.id === id ? { ...u, ...data } : u);
                // If updating the current logged in user, update currentUser too to reflect changes immediately
                const updatedCurrentUser = state.currentUser?.id === id ? { ...state.currentUser, ...data } : state.currentUser;
                const newState = { users: updatedUsers, currentUser: updatedCurrentUser };
                return newState;
            }),
            deleteUser: (id) => set(state => {
                const newState = { users: state.users.filter(u => u.id !== id) };
                return newState;
            }),

            hasPermission: (permissionId) => {
                const user = get().currentUser;
                if (!user) return false;
                if (user.role === 'admin') return true;
                return user.permissions?.includes(permissionId) || false;
            },

            // --- FILE SYSTEM ACTIONS ---
            loadDataFromFiles: async () => {
                const data = await loadAllDataFromDirectory();
                if (data) {
                    // --- PRODUCTS MAPPING ---
                    const sanitizedProducts = data.products?.map((p: any) => ({
                        ...p,
                        price: Number(p.price) || 0,
                        costPrice: Number(p.purchasePrice) || Number(p.costPrice) || 0, // Map purchasePrice
                        stock: Number(p.quantity) || Number(p.stock) || 0, // Map quantity
                        minStockLevel: Number(p.minStockLevel) || 5,
                        // Ensure optional fields exist if needed
                        category: p.category || 'عام',
                        status: p.status || 'active'
                    })) || get().products;

                    // --- CUSTOMERS MAPPING ---
                    const sanitizedCustomers = data.customers?.map((c: any) => ({
                        ...c,
                        totalDebt: Number(c.debt) || Number(c.totalDebt) || 0, // Map debt
                        maxDebtLimit: Number(c.maxDebtLimit) || 0,
                        transactions: Array.isArray(c.transactions) ? c.transactions.map((t: any) => ({
                            ...t,
                            amount: Number(t.amount) || 0
                        })) : []
                    })) || get().customers;

                    // --- SUPPLIERS MAPPING ---
                    const sanitizedSuppliers = data.suppliers?.map((s: any) => ({
                        ...s,
                        totalDebt: Number(s.debt) || Number(s.totalDebt) || 0,
                        transactions: Array.isArray(s.transactions) ? s.transactions.map((t: any) => ({
                            ...t,
                            amount: Number(t.amount) || 0
                        })) : []
                    })) || get().suppliers;

                    // --- ORDERS MAPPING ---
                    const sanitizedOrders = data.orders?.map((o: any) => {
                        // Map Discount
                        let discountValue = 0;
                        if (typeof o.discount === 'object' && o.discount !== null) {
                            discountValue = Number(o.discount.value) || 0;
                        } else {
                            discountValue = Number(o.discount) || 0;
                        }

                        // Map Tax
                        let taxValue = 0;
                        if (typeof o.tax === 'object' && o.tax !== null) {
                            taxValue = Number(o.tax.value) || 0;
                        } else {
                            taxValue = Number(o.tax) || 0;
                        }

                        // Map Customer
                        let customerId = o.customerId;
                        if (!customerId && o.customer && typeof o.customer === 'object') {
                            customerId = o.customer.id;
                        }

                        // Map Items (Flatten product object)
                        const items = Array.isArray(o.items) ? o.items.map((i: any) => {
                            const baseItem = i.product || i; // Handle { product: {...}, qty } structure
                            return {
                                ...baseItem,
                                id: baseItem.id || i.id, // Fallback
                                price: Number(i.price) || Number(baseItem.price) || 0,
                                costPrice: Number(baseItem.purchasePrice) || Number(baseItem.costPrice) || 0,
                                quantity: Number(i.quantity) || 0
                            };
                        }) : [];

                        return {
                            ...o,
                            subtotal: Number(o.subtotal) || 0,
                            discount: discountValue,
                            tax: taxValue,
                            total: Number(o.total) || 0,
                            items: items,
                            customerId: customerId,
                            paymentMethod: o.paymentType === 'نقدي' ? 'cash' : (o.paymentMethod || 'cash'), // Map paymentType
                            cashierId: o.createdById || o.cashierId, // Map createdById
                            status: o.status || 'completed'
                        };
                    }) || get().orders;

                    // --- USERS MAPPING ---
                    const sanitizedUsers = data.users?.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        username: u.username || u.name, // Fallback
                        password: u.password,
                        role: u.role || (u.id === 'u1' ? 'admin' : 'cashier'), // Basic logic
                        permissions: Array.isArray(u.permissions) ? u.permissions : [] // Reset complex permission objects
                    })) || get().users;

                    // --- EXPENSES MAPPING ---
                    const sanitizedExpenses = data.expenses?.map((e: any) => ({
                        ...e,
                        amount: Number(e.amount) || 0
                    })) || get().expenses;

                    set((state) => ({
                        products: sanitizedProducts,
                        customers: sanitizedCustomers,
                        suppliers: sanitizedSuppliers,
                        users: sanitizedUsers,
                        orders: sanitizedOrders,
                        expenses: sanitizedExpenses,
                        settings: data.settings || state.settings,
                        discountCodes: data.discountCodes || state.discountCodes,
                        offers: data.offers || state.offers,
                        isSystemSetup: data.settings ? true : state.isSystemSetup
                    }));
                    return true;
                }
                return false;
            },

            saveDataToFiles: async () => {
                const state = get();
                await saveAllDataToDirectory({
                    products: state.products,
                    customers: state.customers,
                    suppliers: state.suppliers,
                    users: state.users,
                    orders: state.orders,
                    settings: state.settings,
                    discountCodes: state.discountCodes,
                    offers: state.offers,
                    expenses: state.expenses
                });
            }
        }),
        {
            name: 'pos-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist lightweight/critical UI state to localStorage
                // Heavy data (products, orders, customers) is loaded from FileSystem on boot
                settings: state.settings,
                discountCodes: state.discountCodes,
                offers: state.offers,
                isSystemSetup: state.isSystemSetup,
                currentUser: state.currentUser,
                users: state.users, // Users are small enough usually
                notifications: state.notifications,
                cart: state.cart // Keep cart in localStorage so it survives refresh even if FS fails
            }),
        }
    )
);
