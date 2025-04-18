// Imports
import { LightningElement, api, wire, track } from 'lwc';
import getContractorChanges from '@salesforce/apex/OpportunityContractorController.getContractorChanges';
import getOpportunityAmount from '@salesforce/apex/OpportunityContractorController.getOpportunityAmount';
import updateContractorChange from '@salesforce/apex/OpportunityContractorController.updateContractorChange';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

// Main Class
export default class ContractorChanges extends LightningElement {
    @api recordId; // The Opportunity record ID
    @track draftValues = []; // Track draft values for inline editing
    contractorChanges; // Holds the list of Contractor Changes
    opportunityAmount; // Holds the Opportunity Amount
    error;
    wiredContractorChangesResult; // For refreshApex

    // Columns for the datatable
    columns = [
        { label: 'Name', fieldName: 'name', type: 'text' },
        { label: 'Cost', fieldName: 'cost', type: 'currency', editable: true },
        { label: 'Budget Percentage', fieldName: 'budgetPercentage', type: 'percent' },
        { label: 'Change Type', fieldName: 'changeType', type: 'text' }
    ];

    // Fetch Contractor Changes
    @wire(getContractorChanges, { opportunityId: '$recordId' })
    wiredContractorChanges(result) {
        this.wiredContractorChangesResult = result;
        if (result.data) {
            this.contractorChanges = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.contractorChanges = undefined;
        }
    }

    // Fetch Opportunity Amount
    @wire(getOpportunityAmount, { opportunityId: '$recordId' })
    wiredOpportunityAmount({ error, data }) {
        if (data) {
            this.opportunityAmount = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.opportunityAmount = undefined;
        }
    }

    // Handle save event
    handleSave(event) {
        const draftValues = event.detail.draftValues;
        
        // Process each changed record
        const promises = draftValues.map(draft => {
            return updateContractorChange({ 
                contractorChangeId: draft.id,
                newCost: draft.cost,
                opportunityAmount: this.opportunityAmount
            });
        });

        // Execute all updates
        Promise.all(promises)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Changes saved successfully',
                        variant: 'success'
                    })
                );
                this.draftValues = []; // Clear all draft values
                return refreshApex(this.wiredContractorChangesResult); // Refresh the data
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }

    // Helper to check if there are Contractor Changes
    get hasContractorChanges() {
        return this.contractorChanges && this.contractorChanges.length > 0;
    }

    // Helper to format the Opportunity Amount
    get formattedOpportunityAmount() {
        return this.opportunityAmount ? `$${this.opportunityAmount.toFixed(2)}` : '';
    }
}