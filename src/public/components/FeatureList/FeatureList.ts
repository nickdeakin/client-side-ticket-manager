import Database from '../../db';
import Mustache from 'mustache';
import template from './FeatureList.html';
import './FeatureList.scss';

export class FeatureList {
    private db: Database;
    private container: HTMLElement;
    private projectId: number;

    constructor(container: HTMLElement, db: Database, projectId: number) {
        this.container = container;
        this.db = db;
        this.projectId = projectId;
        this.render();
    }

    async render(): Promise<void> {
        const project = await this.db.getProject(this.projectId);
        if (!project) {
            this.container.innerHTML = '<p>Project not found</p>';
            return;
        }

        const features = await this.db.getFeaturesByProject(this.projectId);
        const view = {
            projectTitle: project.title,
            features: features.map(feature => ({
                id: feature.id,
                title: feature.title,
            })),
            hasFeatures: features.length > 0,
        };

        this.container.innerHTML = Mustache.render(template, view);

        const featureForm = this.container.querySelector('.add-feature-form') as HTMLFormElement;
        featureForm.addEventListener('submit', async (e: Event) => {
            e.preventDefault();
            const featureInput = featureForm.querySelector('#feature-input') as HTMLInputElement;
            const featureTitle = featureInput.value.trim();
            if (featureTitle) {
                await this.db.addFeature({
                    projectId: this.projectId,
                    title: featureTitle,
                    description: '',
                    status: 'open',
                    created: new Date(),
                    lastModified: new Date(),
                });
                featureInput.value = '';
                await this.render();
            }
        });

        const deleteButtons = this.container.querySelectorAll('.delete-feature');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const featureId = parseInt(button.getAttribute('data-feature-id') || '0', 10);
                await this.db.deleteFeature(featureId);
                await this.render();
            });
        });

        const backButton = this.container.querySelector('.back-button') as HTMLButtonElement;
        backButton.addEventListener('click', () => {
            history.pushState(null, '', '/');
            this.container.dispatchEvent(new Event('navigate'));
        });
    }
}