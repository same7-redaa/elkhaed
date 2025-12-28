import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { saveToFile, hasDirectoryHandle, DATA_FILES } from '../utils/fileSystem';

export const useAutoSave = () => {
    // We subscribe to specific changes to optimize saving
    const { orders, products, customers, settings, users, discountCodes, offers } = useStore();

    // Refs to track previous values for comparison
    const prevProducts = useRef(products);
    const prevOrders = useRef(orders);
    const prevCustomers = useRef(customers);
    const prevSettings = useRef(settings);
    const prevUsers = useRef(users);
    const prevDiscountCodes = useRef(discountCodes);
    const prevOffers = useRef(offers);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSaves = useRef<Set<keyof typeof DATA_FILES>>(new Set());

    useEffect(() => {
        // Skip saving if no directory selected
        if (!hasDirectoryHandle()) return;

        // Detect changes and mark files as pending save
        let hasChanges = false;

        if (products !== prevProducts.current) {
            pendingSaves.current.add('products');
            prevProducts.current = products;
            hasChanges = true;
        }
        if (orders !== prevOrders.current) {
            pendingSaves.current.add('orders');
            prevOrders.current = orders;
            hasChanges = true;
        }
        if (customers !== prevCustomers.current) {
            pendingSaves.current.add('customers');
            prevCustomers.current = customers;
            hasChanges = true;
        }
        if (settings !== prevSettings.current) {
            pendingSaves.current.add('settings');
            prevSettings.current = settings;
            hasChanges = true;
        }
        if (users !== prevUsers.current) {
            pendingSaves.current.add('users');
            prevUsers.current = users;
            hasChanges = true;
        }
        if (discountCodes !== prevDiscountCodes.current) {
            pendingSaves.current.add('discountCodes');
            prevDiscountCodes.current = discountCodes;
            hasChanges = true;
        }
        if (offers !== prevOffers.current) {
            pendingSaves.current.add('offers');
            prevOffers.current = offers;
            hasChanges = true;
        }

        if (!hasChanges) return;

        // Debounce Execution
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            const saves = Array.from(pendingSaves.current);
            pendingSaves.current.clear(); // Clear immediately to catch new changes during save

            console.log('⏳ Auto-saving changes for:', saves.join(', '));

            try {
                // Execute all pending saves in parallel
                await Promise.all(saves.map(async (key) => {
                    const filename = DATA_FILES[key];
                    let dataToSave;

                    // Get fresh state
                    const state = useStore.getState();

                    switch (key) {
                        case 'products': dataToSave = state.products; break;
                        case 'orders': dataToSave = state.orders; break;
                        case 'customers': dataToSave = state.customers; break;
                        case 'users': dataToSave = state.users; break;
                        case 'settings': dataToSave = state.settings; break;
                        case 'discountCodes': dataToSave = state.discountCodes; break;
                        case 'offers': dataToSave = state.offers; break;
                        default: return; // Should not happen
                    }

                    if (dataToSave && filename) {
                        await saveToFile(filename, dataToSave);
                    }
                }));
                console.log('✅ Auto-save complete');
            } catch (error) {
                console.error('❌ Auto-save failed partially:', error);
                // We could re-add failed saves to pendingSaves here if we wanted strict reliability
            }
        }, 2000); // 2 seconds debounce

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [orders, products, customers, settings, users, discountCodes, offers]);
};
