// Define interfaces for our data structures
interface Feature {
    id?: number;
    title: string;
    description: string;
    status: string;
    created: Date;
    lastModified: Date;
}

interface Task {
    id?: number;
    featureId: number;
    title: string;
    description: string;
    status: string;
    created: Date;
    lastModified: Date;
}

// Database configuration
const DB_NAME = 'client-side-ticket-manager';
const DB_VERSION = 1;
export const STORES = {
    FEATURES: 'features',
    TASKS: 'tasks',
};

// Database class to manage IndexedDB operations
export class Database {
    private readonly dbPromise: Promise<IDBDatabase>;

    constructor() {
        this.dbPromise = this.initDB();
    }

    private initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                const featureStore = db.createObjectStore(STORES.FEATURES, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                featureStore.createIndex('status', 'status', { unique: false });
                featureStore.createIndex('created', 'created', { unique: false });

                const taskStore = db.createObjectStore(STORES.TASKS, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                taskStore.createIndex('featureId', 'featureId', { unique: false });
                taskStore.createIndex('status', 'status', { unique: false });
                taskStore.createIndex('created', 'created', { unique: false });
            };
        });
    }

    async addFeature(feature: Feature): Promise<number> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.FEATURES, 'readwrite');
        const store = tx.objectStore(STORES.FEATURES);

        const request = store.add({
            ...feature,
            created: new Date(),
            lastModified: new Date(),
        });

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as number);
            request.onerror = () => reject(request.error);
        });
    }

    async getFeature(id: number): Promise<Feature> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.FEATURES, 'readonly');
        const store = tx.objectStore(STORES.FEATURES);

        const request = store.get(id);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllFeatures(): Promise<Feature[]> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.FEATURES, 'readonly');
        const store = tx.objectStore(STORES.FEATURES);

        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFeature(id: number): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.FEATURES, 'readwrite');
        const store = tx.objectStore(STORES.FEATURES);

        const request = store.delete(id);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async addTask(task: Task): Promise<number> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.TASKS, 'readwrite');
        const store = tx.objectStore(STORES.TASKS);

        const request = store.add({
            ...task,
            created: new Date(),
            lastModified: new Date(),
        });

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as number);
            request.onerror = () => reject(request.error);
        });
    }

    async getTasksByFeature(featureId: number): Promise<Task[]> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.TASKS, 'readonly');
        const store = tx.objectStore(STORES.TASKS);
        const index = store.index('featureId');

        const request = index.getAll(featureId);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateTask(task: Task): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.TASKS, 'readwrite');
        const store = tx.objectStore(STORES.TASKS);

        const request = store.put(task);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTask(id: number): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.TASKS, 'readwrite');
        const store = tx.objectStore(STORES.TASKS);

        const request = store.delete(id);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}