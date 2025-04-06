import { Database } from './db';
import { FeatureList } from './components/FeatureList/FeatureList';
import { TaskView } from './components/TaskView/TaskView';

interface Task {
    id?: number;
    featureId: number;
    title: string;
    description: string;
    status: string;
    created: Date;
    lastModified: Date;
}

interface Feature {
    id?: number;
    title: string;
    description: string;
    status: string;
    created: Date;
    lastModified: Date;
    tasks?: Task[];
}

const db = new Database();
const app = document.getElementById('app') as HTMLElement;

// Initial render based on URL
document.addEventListener('DOMContentLoaded', async () => {
    const featureId = getFeatureIdFromUrl();
    if (featureId) {
        const feature = await db.getFeature(featureId);
        if (feature) {
            new TaskView(app, db, featureId);
        } else {
            new FeatureList(app, db);
        }
    } else {
        new FeatureList(app, db);
    }
});

// Handle browser back/forward navigation
window.addEventListener('popstate', async () => {
    const featureId = getFeatureIdFromUrl();
    if (featureId) {
        const feature = await db.getFeature(featureId);
        if (feature) {
            new TaskView(app, db, featureId);
        } else {
            new FeatureList(app, db);
        }
    } else {
        new FeatureList(app, db);
    }
});

// Event delegation for navigation and actions
app.addEventListener('click', async (e: Event) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains('back-button')) {
        history.pushState(null, '', '/');
        new FeatureList(app, db);
        return;
    }

    if (target.classList.contains('delete-feature')) {
        const featureId = parseInt(target.dataset.featureId || '0', 10);
        await db.deleteFeature(featureId);
        new FeatureList(app, db);
        return;
    }

    const featureItem = target.closest('.feature-item') as HTMLElement;
    if (featureItem && !target.classList.contains('delete-feature')) {
        const featureId = parseInt(featureItem.dataset.featureId || '0', 10);
        history.pushState(null, '', `/feature/${featureId}`);
        new TaskView(app, db, featureId);
        return;
    }

    if (target.classList.contains('edit-task')) {
        const featureId = parseInt(target.dataset.featureId || '0', 10);
        const taskId = parseInt(target.dataset.taskId || '0', 10);
        const tasks = await db.getTasksByFeature(featureId);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const newTitle = prompt('Edit task:', task.title);
            if (newTitle !== null && newTitle.trim()) {
                task.title = newTitle.trim();
                task.lastModified = new Date();
                await db.updateTask(task);
                new TaskView(app, db, featureId);
            }
        }
        return;
    }

    if (target.classList.contains('delete-task')) {
        const featureId = parseInt(target.dataset.featureId || '0', 10);
        const taskId = parseInt(target.dataset.taskId || '0', 10);
        await db.deleteTask(taskId);
        new TaskView(app, db, featureId);
        return;
    }
});

// Get feature ID from URL
function getFeatureIdFromUrl(): number | null {
    const path = window.location.pathname;
    const match = path.match(/\/feature\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}