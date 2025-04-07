import {Database} from '../../db';
import Mustache from 'mustache';
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
        const features = await this.db.getAllFeatures();
        const view = {
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
    }
}