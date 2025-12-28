
// File System Access API Utility

let dirHandle: FileSystemDirectoryHandle | null = null;

// أسماء الملفات المطلوبة
export const DATA_FILES = {
    products: 'products.json',
    customers: 'customers.json',
    suppliers: 'suppliers.json',
    users: 'users.json',
    settings: 'settings.json',
    orders: 'invoices.json', // الفواتير = المبيعات
    discountCodes: 'discountCodes.json',
    offers: 'offers.json',
    expenses: 'expenses.json',
    units: 'units.json'
};

// حفظ واسترجاع الـ handle من IndexedDB
const HANDLE_DB_NAME = 'FileSystemHandles';
const HANDLE_STORE_NAME = 'handles';
const HANDLE_KEY = 'dataDirectory';

async function saveHandleToIndexedDB(handle: FileSystemDirectoryHandle) {
    const db = await openDB();
    const transaction = db.transaction(HANDLE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(HANDLE_STORE_NAME);
    await store.put(handle, HANDLE_KEY);
}

async function getHandleFromIndexedDB(): Promise<FileSystemDirectoryHandle | null> {
    try {
        const db = await openDB();
        const transaction = db.transaction(HANDLE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(HANDLE_STORE_NAME);
        const handle = await store.get(HANDLE_KEY);
        return (handle as any) || null;
    } catch (error) {
        console.error('Error getting handle from IndexedDB:', error);
        return null;
    }
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(HANDLE_DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(HANDLE_STORE_NAME)) {
                db.createObjectStore(HANDLE_STORE_NAME);
            }
        };
    });
}

// استرجاع الـ handle عند بدء التطبيق
export async function restoreDirectoryHandle() {
    if (!dirHandle) {
        const savedHandle = await getHandleFromIndexedDB();
        if (savedHandle) {
            try {
                // نتأكد إن عندنا permission (بعض المتصفحات مش بتدعم queryPermission)
                const handle = savedHandle as any;
                if (typeof handle.queryPermission === 'function') {
                    const permission = await handle.queryPermission({ mode: 'readwrite' });
                    if (permission === 'granted') {
                        dirHandle = savedHandle;
                        console.log('✅ Directory handle restored from IndexedDB');
                        return true;
                    } else {
                        // نطلب الـ permission تاني
                        const newPermission = await handle.requestPermission({ mode: 'readwrite' });
                        if (newPermission === 'granted') {
                            dirHandle = savedHandle;
                            console.log('✅ Directory permission granted');
                            return true;
                        }
                    }
                } else {
                    // المتصفح مش بيدعم queryPermission، نجرب نستخدم الـ handle مباشرة
                    try {
                        // نحاول نوصل للـ handle عشان نتأكد إنه شغال
                        await savedHandle.getFileHandle('test-access.tmp', { create: false }).catch(() => { });
                        dirHandle = savedHandle;
                        console.log('✅ Directory handle restored (no permission check)');
                        return true;
                    } catch {
                        console.log('⚠️ Saved handle is not accessible');
                    }
                }
            } catch (error) {
                console.error('Error restoring directory handle:', error);
            }
        }
    }
    return !!dirHandle;
}

export const selectDirectory = async () => {
    try {
        dirHandle = await (window as any).showDirectoryPicker();
        // حفظ في IndexedDB
        if (dirHandle) {
            await saveHandleToIndexedDB(dirHandle);
            // حفظ الاسم في localStorage عشان نعرضه
            localStorage.setItem('dataDirectoryName', dirHandle.name);
            console.log('✅ Directory selected and saved:', dirHandle.name);
        }
        return true;
    } catch (error) {
        console.error('Error selecting directory:', error);
        return false;
    }
};

export const saveToFile = async (filename: string, data: any) => {
    if (!dirHandle) {
        throw new Error('No directory selected');
    }

    try {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        console.log(`💾 Saved: ${filename} (${Array.isArray(data) ? data.length : 'object'} items)`);
        return true;
    } catch (error) {
        console.error(`❌ Error saving ${filename}:`, error);
        throw error;
    }
};

export const readFromFile = async (filename: string) => {
    if (!dirHandle) {
        throw new Error('No directory selected');
    }

    try {
        const fileHandle = await dirHandle.getFileHandle(filename);
        const file = await fileHandle.getFile();
        const text = await file.text();
        return JSON.parse(text);
    } catch (error) {
        console.error('Error reading file:', error);
        return null; // نرجع null بدل throw عشان لو الملف مش موجود
    }
};

// دالة لقراءة كل ملفات البيانات من المجلد
export const loadAllDataFromDirectory = async () => {
    if (!dirHandle) {
        return null;
    }

    try {
        const data: any = {};

        // نقرأ كل الملفات المتاحة
        for (const [key, filename] of Object.entries(DATA_FILES)) {
            const fileData = await readFromFile(filename);
            if (fileData !== null) {
                data[key] = fileData;
            }
        }

        return Object.keys(data).length > 0 ? data : null;
    } catch (error) {
        console.error('Error loading data from directory:', error);
        return null;
    }
};

// دالة لحفظ كل البيانات في ملفات
export const saveAllDataToDirectory = async (data: any) => {
    if (!dirHandle) {
        throw new Error('No directory selected');
    }

    try {
        let savedFiles = 0;
        // نحفظ كل نوع بيانات في ملفه
        if (data.products) {
            await saveToFile(DATA_FILES.products, data.products);
            savedFiles++;
        }
        if (data.customers) {
            await saveToFile(DATA_FILES.customers, data.customers);
            savedFiles++;
        }
        if (data.users) {
            await saveToFile(DATA_FILES.users, data.users);
            savedFiles++;
        }
        if (data.settings) {
            await saveToFile(DATA_FILES.settings, data.settings);
            savedFiles++;
        }
        if (data.orders) {
            await saveToFile(DATA_FILES.orders, data.orders);
            savedFiles++;
        }
        if (data.discountCodes) {
            await saveToFile(DATA_FILES.discountCodes, data.discountCodes);
            savedFiles++;
        }
        if (data.offers) {
            await saveToFile(DATA_FILES.offers, data.offers);
            savedFiles++;
        }

        console.log(`✅ Saved ${savedFiles} files to directory: ${dirHandle.name}`);
        return true;
    } catch (error) {
        console.error('Error saving all data:', error);
        throw error;
    }
};

// فحص إذا كان فيه ملفات بيانات في المجلد
export const checkExistingDataFiles = async () => {
    if (!dirHandle) return [];

    const existingFiles: string[] = [];

    for (const filename of Object.values(DATA_FILES)) {
        try {
            await dirHandle.getFileHandle(filename);
            existingFiles.push(filename);
        } catch {
            // الملف مش موجود، ماشي
        }
    }

    return existingFiles;
};

export const hasDirectoryHandle = () => !!dirHandle;

export const getDirectoryName = () => dirHandle?.name || localStorage.getItem('dataDirectoryName') || null;

export const getDirHandle = () => dirHandle;
