import { Database } from '../../db';
import template from './TaskView.html';
import './TaskView.scss';

export class TaskView {
    private db: Database;
    private container: HTMLElement;
    private featureId: number;

    constructor(container: HTMLElement, db: Database, featureId: number) {
        this.container = container;
        this.db = db;
        this.featureId = featureId;
        this.render();
    }

    async render(): Promise<void> {
        const feature = await this.db.getFeature(this.featureId);
        if (!feature) return;

        const tasks = await this.db.getTasksByFeature(this.featureId);

        this.container.innerHTML = template.replace('{{featureTitle}}', feature.title);

        const taskList = this.container.querySelector('#task-list') as HTMLUListElement;
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.classList.add('task-item');
            if (task.status === 'completed') li.classList.add('completed');
            li.innerHTML = `
        <span>${task.title}</span>
        <div class="task-actions">
          <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''}>
          <button class="edit-task" data-feature-id="${feature.id}" data-task-id="${task.id}">Edit</button>
          <button class="delete-task" data-feature-id="${feature.id}" data-task-id="${task.id}">Delete</button>
        </div>
      `;
            const checkbox = li.querySelector('input[type="checkbox"]') as HTMLInputElement;
            checkbox.addEventListener('change', async () => {
                task.status = checkbox.checked ? 'completed' : 'open';
                task.lastModified = new Date();
                await this.db.updateTask(task);
                await this.render();
            });
            taskList.appendChild(li);
        });

        const taskForm = this.container.querySelector('.task-form') as HTMLFormElement;
        taskForm.addEventListener('submit', async (e: Event) => {
            e.preventDefault();
            const taskInput = taskForm.querySelector('#task-input') as HTMLInputElement;
            const taskTitle = taskInput.value.trim();
            if (taskTitle) {
                await this.db.addTask({
                    featureId: this.featureId,
                    title: taskTitle,
                    description: '',
                    status: 'open',
                    created: new Date(),
                    lastModified: new Date(),
                });
                await this.render();
            }
        });
    }
}