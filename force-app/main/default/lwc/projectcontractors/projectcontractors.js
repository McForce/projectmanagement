import { LightningElement, api, wire } from 'lwc';
import getProjectContractors from '@salesforce/apex/ProjectContractorController.getProjectContractors';

export default class ProjectContractors extends LightningElement {
    @api recordId; // This will automatically receive the Project record Id
    contractors;
    error;

    @wire(getProjectContractors, { projectId: '$recordId' })
    wiredContractors({ error, data }) {
        if (data) {
            this.contractors = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.contractors = undefined;
        }
    }

    get hasContractors() {
        return this.contractors && this.contractors.length > 0;
    }
}