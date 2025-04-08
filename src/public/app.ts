import Database from './db';
import { ProjectList } from './components/ProjectList/ProjectList';
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
    projectId: number;
    title: string;
    description: string;
    status: string;
    created: Date;
    lastModified: Date;
}

interface Project {
    id?: number;
    title: string;
    description: string;
    created: Date;
    lastModified: Date;
}

const db = new Database();
const app = document.getElementById('app') as HTMLElement;

document.addEventListener('DOMContentLoaded', async () => {
    const { projectId, featureId } = getIdsFromUrl();
    if (featureId && projectId) {
        const feature = await db.getFeature(featureId);
        if (feature && feature.projectId === projectId) new TaskView(app, db, projectId, featureId);
        else if (projectId) new FeatureList(app, db, projectId);
        else new ProjectList(app, db);
    } else if (projectId) {
        const project = await db.getProject(projectId);
        if (project) new FeatureList(app, db, projectId);
        else new ProjectList(app, db);
    } else {
        new ProjectList(app, db);
    }
});

window.addEventListener('popstate', async () => {
    const { projectId, featureId } = getIdsFromUrl();
    if (featureId && projectId) {
        const feature = await db.getFeature(featureId);
        if (feature && feature.projectId === projectId) new TaskView(app, db, projectId, featureId);
        else if (projectId) new FeatureList(app, db, projectId);
        else new ProjectList(app, db);
    } else if (projectId) {
        const project = await db.getProject(projectId);
        if (project) new FeatureList(app, db, projectId);
        else new ProjectList(app, db);
    } else {
        new ProjectList(app, db);
    }
});

app.addEventListener('click', async (e: Event) => {
    const target = e.target as HTMLElement;

    const projectItem = target.closest('.project-item') as HTMLElement;
    if (projectItem && !target.classList.contains('delete-project')) {
        const projectId = parseInt(projectItem.dataset.projectId || '0', 10);
        history.pushState(null, '', `/project/${projectId}`);
        new FeatureList(app, db, projectId);
    }

    const featureItem = target.closest('.feature-item') as HTMLElement;
    if (featureItem && !target.classList.contains('delete-feature')) {
        const featureId = parseInt(featureItem.dataset.featureId || '0', 10);
        const projectId = (await db.getFeature(featureId))?.projectId;
        if (projectId) {
            history.pushState(null, '', `/project/${projectId}/feature/${featureId}`);
            new TaskView(app, db, projectId, featureId);
        }
    }
});

app.addEventListener('navigate', async () => {
    const { projectId } = getIdsFromUrl();
    if (projectId) {
        new FeatureList(app, db, projectId);
    } else {
        new ProjectList(app, db);
    }
});

function getIdsFromUrl(): { projectId: number | null; featureId: number | null } {
    const path = window.location.pathname;
    const featureMatch = path.match(/\/project\/(\d+)\/feature\/(\d+)/);
    if (featureMatch) {
        return { projectId: parseInt(featureMatch[1], 10), featureId: parseInt(featureMatch[2], 10) };
    }
    const projectMatch = path.match(/\/project\/(\d+)/);
    if (projectMatch) {
        return { projectId: parseInt(projectMatch[1], 10), featureId: null };
    }
    return { projectId: null, featureId: null };
}