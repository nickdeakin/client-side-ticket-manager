import { Database } from './db';

// Define interfaces (aligned with db.ts)
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

// Initialize the database
const db = new Database();
const app = document.getElementById('app') as HTMLElement;

// Initial render based on URL
document.addEventListener('DOMContentLoaded', async () => {
    const featureId = getFeatureIdFromUrl();
    if (featureId) {
        const feature = await db.getFeature(featureId);
        if (feature) {
            await renderTaskView(featureId);
        } else {
            await renderHome();
        }
    } else {
        await renderHome();
    }
});

// Handle browser back/forward navigation
window.addEventListener('popstate', async () => {
    const featureId = getFeatureIdFromUrl();
    if (featureId) {
        const feature = await db.getFeature(featureId);
        if (feature) {
            await renderTaskView(featureId);
        } else {
            await renderHome();
        }
    } else {
        await renderHome();
    }
});

// Event delegation for all button clicks
app.addEventListener('click', async (e: Event) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains('back-button')) {
        await renderHome();
        return;
    }

    if (target.classList.contains('delete-feature')) {
        const featureId = parseInt(target.dataset.featureId || '0', 10);
        await deleteFeature(featureId);
        return;
    }

    const featureItem = target.closest('.feature-item') as HTMLElement;
    if (featureItem && !target.classList.contains('delete-feature')) {
        const featureId = parseInt(featureItem.dataset.featureId || '0', 10);
        await renderTaskView(featureId);
        return;
    }

    if (target.classList.contains('edit-task')) {
        const featureId = parseInt(target.dataset.featureId || '0', 10);
        const taskId = parseInt(target.dataset.taskId || '0', 10);
        await editTask(featureId, taskId);
        return;
    }

    if (target.classList.contains('delete-task')) {
        const featureId = parseInt(target.dataset.featureId || '0', 10);
        const taskId = parseInt(target.dataset.taskId || '0', 10);
        await deleteTask(featureId, taskId);
        return;
    }
});

// Get feature ID from URL
function getFeatureIdFromUrl(): number | null {
    const path = window.location.pathname;
    const match = path.match(/\/feature\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

// Home View: List Features
async function renderHome(): Promise<void> {
    history.pushState(null, '', '/');
    app.innerHTML = `
    <h1>Feature & Task Manager</h1>
    <div class="feature-list">
      <div id="feature-container"></div>
      <form class="add-feature-form">
        <input type="text" id="feature-input" placeholder="Add a new feature..." required>
        <button type="submit">Add Feature</button>
      </form>
    </div>
  `;

    const featureContainer = document.getElementById('feature-container') as HTMLElement;
    const features = await db.getAllFeatures();
    features.forEach(feature => {
        const div = document.createElement('div');
        div.classList.add('feature-item');
        div.dataset.featureId = feature.id!.toString();
        div.innerHTML = `
      <h2>${feature.title}</h2>
      <button class="delete-feature" data-feature-id="${feature.id}">Delete</button>
    `;
        featureContainer.appendChild(div);
    });

    const featureForm = app.querySelector('.add-feature-form') as HTMLFormElement;
    featureForm.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        const featureInput = featureForm.querySelector('#feature-input') as HTMLInputElement;
        const featureTitle = featureInput.value.trim();
        if (featureTitle) {
            const feature: Feature = {
                title: featureTitle,
                description: '',
                status: 'open',
                created: new Date(),
                lastModified: new Date(),
            };
            await db.addFeature(feature);
            await renderHome();
        }
    });
}

// Task View: Show and Manage Tasks for a Feature
async function renderTaskView(featureId: number): Promise<void> {
    const feature = await db.getFeature(featureId);
    if (!feature) return renderHome();

    const tasks = await db.getTasksByFeature(featureId);

    history.pushState(null, '', `/feature/${featureId}`);
    app.innerHTML = `
    <h1>${feature.title}</h1>
    <div class="task-view">
      <button class="back-button">Back to Features</button>
      <form class="task-form">
        <input type="text" id="task-input" placeholder="Add a task..." required>
        <button type="submit">Add Task</button>
      </form>
      <ul class="task-list" id="task-list"></ul>
    </div>
  `;

    const taskList = document.getElementById('task-list') as HTMLUListElement;
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.classList.add('task-item');
        if (task.status === 'completed') li.classList.add('completed');
        li.innerHTML = `
      <span>${task.title}</span>
      <div class="task-actions">
        <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''}>
        <button class="edit-task edit" data-feature-id="${feature.id}" data-task-id="${task.id}">Edit</button>
        <button class="delete-task delete" data-feature-id="${feature.id}" data-task-id="${task.id}">Delete</button>
      </div>
    `;
        const checkbox = li.querySelector('input[type="checkbox"]') as HTMLInputElement;
        checkbox.addEventListener('change', async () => {
            task.status = checkbox.checked ? 'completed' : 'open';
            task.lastModified = new Date();
            await db.updateTask(task);
            await renderTaskView(featureId);
        });
        taskList.appendChild(li);
    });

    const taskForm = app.querySelector('.task-form') as HTMLFormElement;
    taskForm.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        const taskInput = taskForm.querySelector('#task-input') as HTMLInputElement;
        const taskTitle = taskInput.value.trim();
        if (taskTitle) {
            const task: Task = {
                featureId: featureId,
                title: taskTitle,
                description: '',
                status: 'open',
                created: new Date(),
                lastModified: new Date(),
            };
            await db.addTask(task);
            await renderTaskView(featureId);
        }
    });
}

// Delete Feature
async function deleteFeature(featureId: number): Promise<void> {
    await db.deleteFeature(featureId);
    await renderHome();
}

// Delete Task
async function deleteTask(featureId: number, taskId: number): Promise<void> {
    await db.deleteTask(taskId);
    await renderTaskView(featureId);
}

// Edit Task
async function editTask(featureId: number, taskId: number): Promise<void> {
    const feature = await db.getFeature(featureId);
    const tasks = await db.getTasksByFeature(featureId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newTitle = prompt('Edit task:', task.title);
    if (newTitle !== null && newTitle.trim()) {
        task.title = newTitle.trim();
        task.lastModified = new Date();
        await db.updateTask(task);
        await renderTaskView(featureId);
    }
}