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

document.addEventListener('DOMContentLoaded', async () => {
    const featureId = getFeatureIdFromUrl();
    if (featureId) {
        const feature = await db.getFeature(featureId);
        if (feature) new TaskView(app, db, featureId);
        else new FeatureList(app, db);
    } else {
        new FeatureList(app, db);
    }
});

window.addEventListener('popstate', async () => {
    const featureId = getFeatureIdFromUrl();
    if (featureId) {
        const feature = await db.getFeature(featureId);
        if (feature) new TaskView(app, db, featureId);
        else new FeatureList(app, db);
    } else {
        new FeatureList(app, db);
    }
});

app.addEventListener('click', async (e: Event) => {
    const target = e.target as HTMLElement;

    const featureItem = target.closest('.feature-item') as HTMLElement;
    if (featureItem && !target.classList.contains('delete-feature')) {
        const featureId = parseInt(featureItem.dataset.featureId || '0', 10);
        history.pushState(null, '', `/feature/${featureId}`);
        new TaskView(app, db, featureId);
    }
});

app.addEventListener('navigate', () => {
    new FeatureList(app, db);
});

function getFeatureIdFromUrl(): number | null {
    const path = window.location.pathname;
    const match = path.match(/\/feature\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}