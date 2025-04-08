import Database from '../../db';
import Mustache from 'mustache';
import template from './TaskView.html';
import './TaskView.scss';

export class TaskView {
    private db: Database;
    private container: HTMLElement;
    private projectId: number;
    private featureId: number;

    constructor(container: HTMLElement, db: Database, projectId: number, featureId: number) {
        this.container = container;
        this.db = db;
        this.projectId = projectId;
        this.featureId = featureId;
        this.render();
    }

    async render(): Promise<void> {
        const feature = await this.db.getFeature(this.featureId);
        if (!feature || feature.projectId !== this.projectId) {
            this.container.innerHTML = '<p>Feature not found</p>';
            return;
        }

        const tasks = await this.db.getTasksByFeature(this.featureId);
        const view = {
            featureTitle: feature.title,
            tasks: tasks.map(task => ({
                id: task.id,
                featureId: this.featureId,
                title: task.title,
                isCompleted: task.status === 'completed',
                checked: task.status === 'completed' ? 'checked' : '',
            })),
        };

        this.container.innerHTML = Mustache.render(template, view);

        const taskList = this.container.querySelector('#task-list') as HTMLUListElement;

        const checkboxes = taskList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', async () => {
                tasks[index].status = (checkbox as HTMLInputElement).checked ? 'completed' : 'open';
                tasks[index].lastModified = new Date();
                await this.db.updateTask(tasks[index]);
                await this.render();
            });
        });

        const editButtons = taskList.querySelectorAll('.edit-task');
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const taskItem = button.closest('.task-item') as HTMLElement;
                const taskTitle = taskItem.querySelector('.task-title') as HTMLElement;
                const editForm = taskItem.querySelector('.edit-task-form') as HTMLFormElement;

                taskTitle.style.display = 'none';
                editForm.style.display = 'flex';

                editForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const newTitle = (editForm.querySelector('.edit-task-input') as HTMLInputElement).value.trim();
                    if (newTitle) {
                        const taskId = parseInt(taskItem.dataset.taskId || '0', 10);
                        const task = tasks.find(t => t.id === taskId);
                        if (task) {
                            task.title = newTitle;
                            task.lastModified = new Date();
                            await this.db.updateTask(task);
                            await this.render();
                        }
                    }
                }, { once: true });

                const cancelButton = editForm.querySelector('.cancel-edit') as HTMLButtonElement;
                cancelButton.addEventListener('click', () => {
                    taskTitle.style.display = 'block';
                    editForm.style.display = 'none';
                }, { once: true });
            });
        });

        const deleteButtons = taskList.querySelectorAll('.delete-task');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const taskId = parseInt(button.getAttribute('data-task-id') || '0', 10);
                await this.db.deleteTask(taskId);
                await this.render();
            });
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
                taskInput.value = '';
                await this.render();
            }
        });

        const backButton = this.container.querySelector('.back-button') as HTMLButtonElement;
        backButton.addEventListener('click', () => {
            history.pushState(null, '', `/project/${this.projectId}`);
            this.container.dispatchEvent(new Event('navigate'));
        });
    }
}