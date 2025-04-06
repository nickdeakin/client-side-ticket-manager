import { Database } from '../../db';
import template from './FeatureList.html';
import './FeatureList.scss';

export class FeatureList {
    private db: Database;
    private container: HTMLElement;

    constructor(container: HTMLElement, db: Database) {
        this.container = container;
        this.db = db;
        this.render();
    }

    async render(): Promise<void> {
        this.container.innerHTML = template;
        const featureContainer = this.container.querySelector('#feature-container') as HTMLElement;
        const features = await this.db.getAllFeatures();

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

        const featureForm = this.container.querySelector('.add-feature-form') as HTMLFormElement;
        featureForm.addEventListener('submit', async (e: Event) => {
            e.preventDefault();
            const featureInput = featureForm.querySelector('#feature-input') as HTMLInputElement;
            const featureTitle = featureInput.value.trim();
            if (featureTitle) {
                await this.db.addFeature({
                    title: featureTitle,
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