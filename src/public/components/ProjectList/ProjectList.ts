import Database from '../../db';
import Mustache from 'mustache';
import template from './ProjectList.html';
import './ProjectList.scss';

export class ProjectList {
  private db: Database;
  private container: HTMLElement;

  constructor(container: HTMLElement, db: Database) {
    this.container = container;
    this.db = db;
    this.render();
  }

  async render(): Promise<void> {
    const projects = await this.db.getAllProjects();
    const view = {
      projects: projects.map(project => ({
        id: project.id,
        title: project.title,
      })),
      hasProjects: projects.length > 0,
    };

    this.container.innerHTML = Mustache.render(template, view);

    const projectForm = this.container.querySelector('.add-project-form') as HTMLFormElement;
    projectForm.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      const projectInput = projectForm.querySelector('#project-input') as HTMLInputElement;
      const projectTitle = projectInput.value.trim();
      if (projectTitle) {
        await this.db.addProject({
          title: projectTitle,
          description: '',
          created: new Date(),
          lastModified: new Date(),
        });
        projectInput.value = '';
        await this.render();
      }
    });

    const deleteButtons = this.container.querySelectorAll('.delete-project');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const projectId = parseInt(button.getAttribute('data-project-id') || '0', 10);
        await this.db.deleteProject(projectId);
        await this.render();
      });
    });
  }
}