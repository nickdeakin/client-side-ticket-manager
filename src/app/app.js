import '../styles.scss';

// Features array from LocalStorage
let features = JSON.parse(localStorage.getItem('features')) || [];
let currentFeatureId = null;

const app = document.getElementById('app');

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
app.addEventListener('click', (e) => {
  const target = e.target;

  // Back to Features
  if (target.classList.contains('back-button')) {
    renderHome();
    return;
  }

  // Delete Feature
  if (target.classList.contains('delete-feature')) {
    const featureId = parseInt(target.dataset.featureId, 10);
    deleteFeature(featureId);
    return;
  }

  // Navigate to Task View
  if (target.closest('.feature-item') && !target.classList.contains('delete-feature')) {
    const featureId = parseInt(target.closest('.feature-item').dataset.featureId, 10);
    renderTaskView(featureId);
    return;
  }

  // Edit Task
  if (target.classList.contains('edit-task')) {
    const featureId = parseInt(target.dataset.featureId, 10);
    const taskId = parseInt(target.dataset.taskId, 10);
    editTask(featureId, taskId);
    return;
  }

  // Delete Task
  if (target.classList.contains('delete-task')) {
    const featureId = parseInt(target.dataset.featureId, 10);
    const taskId = parseInt(target.dataset.taskId, 10);
    deleteTask(featureId, taskId);
    return;
  }
});

// Get feature ID from URL
function getFeatureIdFromUrl() {
  const path = window.location.pathname;
  const match = path.match(/\/feature\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Save features to LocalStorage
function saveFeatures() {
  localStorage.setItem('features', JSON.stringify(features));
}

// Home View: List Features
function renderHome() {
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

  const featureContainer = document.getElementById('feature-container');
  features.forEach(feature => {
    const div = document.createElement('div');
    div.classList.add('feature-item');
    div.dataset.featureId = feature.id; // Store feature ID in data attribute
    div.innerHTML = `
      <h2>${feature.text}</h2>
      <button class="delete-feature" data-feature-id="${feature.id}">Delete</button>
    `;
    featureContainer.appendChild(div);
  });

  const featureForm = app.querySelector('.add-feature-form');
  featureForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const featureText = featureForm.querySelector('#feature-input').value.trim();
    if (featureText) {
      const feature = { id: Date.now(), text: featureText, tasks: [] };
      features.push(feature);
      saveFeatures();
      renderHome();
    }
  });
}

// Task View: Show and Manage Tasks for a Feature
function renderTaskView(featureId) {
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

  const taskList = document.getElementById('task-list');
  feature.tasks.forEach(task => {
    const li = document.createElement('li');
    li.classList.add('task-item');
    if (task.completed) li.classList.add('completed');
    li.innerHTML = `
      <span>${task.text}</span>
      <div class="task-actions">
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <button class="edit edit-task" data-feature-id="${feature.id}" data-task-id="${task.id}">Edit</button>
        <button class="delete delete-task" data-feature-id="${feature.id}" data-task-id="${task.id}">Delete</button>
      </div>
    `;
    li.querySelector('input[type="checkbox"]').addEventListener('change', () => {
      task.completed = !task.completed;
      saveFeatures();
      renderTaskView(featureId);
    });
    taskList.appendChild(li);
  });

  const taskForm = app.querySelector('.task-form');
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskForm.querySelector('#task-input').value.trim();
    if (taskText) {
      feature.tasks.push({ id: Date.now(), text: taskText, completed: false });
      saveFeatures();
      renderTaskView(featureId);
    }
  });
}

// Delete Feature
function deleteFeature(featureId) {
  features = features.filter(f => f.id !== featureId);
  saveFeatures();
  renderHome();
}

// Delete Task
function deleteTask(featureId, taskId) {
  const feature = features.find(f => f.id === featureId);
  if (feature) {
    feature.tasks = feature.tasks.filter(t => t.id !== taskId);
    saveFeatures();
    renderTaskView(featureId);
  }
}

// Edit Task
function editTask(featureId, taskId) {
  const feature = features.find(f => f.id === featureId);
  const task = feature.tasks.find(t => t.id === taskId);
  if (!task) return;

  const newText = prompt('Edit task:', task.text);
  if (newText !== null && newText.trim()) {
    task.text = newText.trim();
    saveFeatures();
    renderTaskView(featureId);
  }
}
