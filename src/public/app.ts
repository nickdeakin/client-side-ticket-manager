// Define interfaces for data structure
interface Task {
    id: number;
    text: string;
    completed: boolean;
}

interface Feature {
    id: number;
    text: string;
    tasks: Task[];
}

// Features array from LocalStorage
let features: Feature[] = JSON.parse(localStorage.getItem('features') || '[]');
let currentFeatureId: number | null = null;

const app = document.getElementById('app') as HTMLElement;

// Initial render based on URL
document.addEventListener('DOMContentLoaded', () => {
    const featureId = getFeatureIdFromUrl();
    if (featureId && features.some(f => f.id === featureId)) {
        renderTaskView(featureId);
    } else {
        renderHome();
    }
});

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    const featureId = getFeatureIdFromUrl();
    if (featureId && features.some(f => f.id === featureId)) {
        renderTaskView(featureId);
    } else {
        renderHome();
    }
});

// Event delegation for all button clicks
app.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;

    // Back to Features
    if (target.classList.contains('back-button')) {
        renderHome();
        return;
    }

    // Delete Feature
    if (target.classList.contains('delete-feature')) {
        const featureId = parseInt(target.dataset.featureId || '0', 10);
        deleteFeature(featureId);
        return;
    }

    // Navigate to Task View
    const featureItem = target.closest('.feature-item') as HTMLElement;
    if (featureItem && !target.classList.contains('delete-feature')) {
        const featureId = parseInt(featureItem.dataset.featureId || '0', 10);
        renderTaskView(featureId);
        return;
    }

    // Edit Task
    if (target.classList.contains('edit-task')) {
        const featureId = parseInt(target.dataset.featureId || '0', 10);
        const taskId = parseInt(target.dataset.taskId || '0', 10);
        editTask(featureId, taskId);
        return;
    }

    // Delete Task
    if (target.classList.contains('delete-task')) {
        const featureId = parseInt(target.dataset.featureId || '0', 10);
        const taskId = parseInt(target.dataset.taskId || '0', 10);
        deleteTask(featureId, taskId);
        return;
    }
});

// Get feature ID from URL
function getFeatureIdFromUrl(): number | null {
    const path = window.location.pathname;
    const match = path.match(/\/feature\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

// Save features to LocalStorage
function saveFeatures(): void {
    localStorage.setItem('features', JSON.stringify(features));
}

// Home View: List Features
function renderHome(): void {
    currentFeatureId = null;
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
    features.forEach(feature => {
        const div = document.createElement('div');
        div.classList.add('feature-item');
        div.dataset.featureId = feature.id.toString();
        div.innerHTML = `
      <h2>${feature.text}</h2>
      <button class="delete-feature" data-feature-id="${feature.id}">Delete</button>
    `;
        featureContainer.appendChild(div);
    });

    const featureForm = app.querySelector('.add-feature-form') as HTMLFormElement;
    featureForm.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        const featureInput = featureForm.querySelector('#feature-input') as HTMLInputElement;
        const featureText = featureInput.value.trim();
        if (featureText) {
            const feature: Feature = { id: Date.now(), text: featureText, tasks: [] };
            features.push(feature);
            saveFeatures();
            renderHome();
        }
    });
}

// Task View: Show and Manage Tasks for a Feature
function renderTaskView(featureId: number): void {
    currentFeatureId = featureId;
    const feature = features.find(f => f.id === featureId);
    if (!feature) return renderHome();

    history.pushState(null, '', `/feature/${featureId}`);
    app.innerHTML = `
    <h1>${feature.text}</h1>
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
    feature.tasks.forEach(task => {
        const li = document.createElement('li');
        li.classList.add('task-item');
        if (task.completed) li.classList.add('completed');
        li.innerHTML = `
      <span>${task.text}</span>
      <div class="task-actions">
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <button class="edit-task" data-feature-id="${feature.id}" data-task-id="${task.id}">Edit</button>
        <button class="delete-task" data-feature-id="${feature.id}" data-task-id="${task.id}">Delete</button>
      </div>
    `;
        const checkbox = li.querySelector('input[type="checkbox"]') as HTMLInputElement;
        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            saveFeatures();
            renderTaskView(featureId);
        });
        taskList.appendChild(li);
    });

    const taskForm = app.querySelector('.task-form') as HTMLFormElement;
    taskForm.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        const taskInput = taskForm.querySelector('#task-input') as HTMLInputElement;
        const taskText = taskInput.value.trim();
        if (taskText) {
            const task: Task = { id: Date.now(), text: taskText, completed: false };
            feature.tasks.push(task);
            saveFeatures();
            renderTaskView(featureId);
        }
    });
}

// Delete Feature
function deleteFeature(featureId: number): void {
    features = features.filter(f => f.id !== featureId);
    saveFeatures();
    renderHome();
}

// Delete Task
function deleteTask(featureId: number, taskId: number): void {
    const feature = features.find(f => f.id === featureId);
    if (feature) {
        feature.tasks = feature.tasks.filter(t => t.id !== taskId);
        saveFeatures();
        renderTaskView(featureId);
    }
}

// Edit Task
function editTask(featureId: number, taskId: number): void {
    const feature = features.find(f => f.id === featureId);
    const task = feature?.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newText = prompt('Edit task:', task.text);
    if (newText !== null && newText.trim()) {
        task.text = newText.trim();
        saveFeatures();
        renderTaskView(featureId);
    }
}