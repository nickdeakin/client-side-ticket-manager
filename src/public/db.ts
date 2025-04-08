interface Project {
    id?: number;
    title: string;
    description: string;
    created: Date;
    lastModified: Date;
}

interface Feature {
    id?: number;
    projectId: number;
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

const DB_NAME = 'client-side-ticket-manager';
const DB_VERSION = 1;
const STORES = {
    PROJECTS: 'projects',
    FEATURES: 'features',
    TASKS: 'tasks',
};

export default class Database {
    private dbPromise: Promise<IDBDatabase>;

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

                const featureStore = db.createObjectStore(STORES.FEATURES, { keyPath: 'id', autoIncrement: true });
                featureStore.createIndex('projectId', 'projectId', { unique: false });
                featureStore.createIndex('status', 'status', { unique: false });
                featureStore.createIndex('created', 'created', { unique: false });

                const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id', autoIncrement: true });
                taskStore.createIndex('featureId', 'featureId', { unique: false });
                taskStore.createIndex('status', 'status', { unique: false });
                taskStore.createIndex('created', 'created', { unique: false });

                const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id', autoIncrement: true });
                projectStore.createIndex('created', 'created', { unique: false });
            };
        });
    }

    // Project methods
    async addProject(project: Project): Promise<number> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.PROJECTS, 'readwrite');
        const store = tx.objectStore(STORES.PROJECTS);
        const request = store.add({ ...project, created: new Date(), lastModified: new Date() });
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as number);
            request.onerror = () => reject(request.error);
        });
    }

    async getProject(id: number): Promise<Project> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.PROJECTS, 'readonly');
        const store = tx.objectStore(STORES.PROJECTS);
        const request = store.get(id);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result );
            request.onerror = () => reject(request.error);
        });
    }

    async getAllProjects(): Promise<Project[]> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.PROJECTS, 'readonly');
        const store = tx.objectStore(STORES.PROJECTS);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteProject(id: number): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction([STORES.PROJECTS, STORES.FEATURES, STORES.TASKS], 'readwrite');
        const projectStore = tx.objectStore(STORES.PROJECTS);
        const featureStore = tx.objectStore(STORES.FEATURES);
        const taskStore = tx.objectStore(STORES.TASKS);

        // Delete project
        projectStore.delete(id);

        // Delete related features
        const featureIndex = featureStore.index('projectId');
        const features = await new Promise<Feature[]>((resolve, reject) => {
            const request = featureIndex.getAll(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        for (const feature of features) {
            featureStore.delete(feature.id!);
            const taskIndex = taskStore.index('featureId');
            const tasks = await new Promise<Task[]>((resolve, reject) => {
                const request = taskIndex.getAll(feature.id!);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            for (const task of tasks) {
                taskStore.delete(task.id!);
            }
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    // Feature methods
    async addFeature(feature: Feature): Promise<number> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.FEATURES, 'readwrite');
        const store = tx.objectStore(STORES.FEATURES);
        const request = store.add({ ...feature, created: new Date(), lastModified: new Date() });
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

    async getFeaturesByProject(projectId: number): Promise<Feature[]> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.FEATURES, 'readonly');
        const store = tx.objectStore(STORES.FEATURES);
        const index = store.index('projectId');
        const request = index.getAll(projectId);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFeature(id: number): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction([STORES.FEATURES, STORES.TASKS], 'readwrite');
        const featureStore = tx.objectStore(STORES.FEATURES);
        const taskStore = tx.objectStore(STORES.TASKS);

        featureStore.delete(id);
        const taskIndex = taskStore.index('featureId');
        const tasks = await new Promise<Task[]>((resolve, reject) => {
            const request = taskIndex.getAll(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        for (const task of tasks) {
            taskStore.delete(task.id!);
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    // Task methods (unchanged except interface)
    async addTask(task: Task): Promise<number> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORES.TASKS, 'readwrite');
        const store = tx.objectStore(STORES.TASKS);
        const request = store.add({ ...task, created: new Date(), lastModified: new Date() });
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
        const store = tx.objectStore(STORES.TASKS );
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