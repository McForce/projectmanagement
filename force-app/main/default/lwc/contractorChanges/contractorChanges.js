// Imports
import { LightningElement, api, wire } from 'lwc';
import getContractorChanges from '@salesforce/apex/OpportunityContractorController.getContractorChanges';
import getOpportunityAmount from '@salesforce/apex/OpportunityContractorController.getOpportunityAmount';
import updateContractorChange from '@salesforce/apex/OpportunityContractorController.updateContractorChange';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

// Main Class
export default class ContractorChanges extends LightningElement {
    @api recordId; // The Opportunity record ID
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
        this.wiredContractorChangesResult = result; // Store the result for refreshApex
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

    // Handle inline editing for the Cost field
    handleEdit(event) {
        const { fieldName, recordId, value } = event.detail; // Get the edited field details
        if (fieldName === 'cost') { // Only handle the "Cost" field
            const newCost = parseFloat(value); // Parse the new cost value
            updateContractorChange({ contractorChangeId: recordId, newCost, opportunityAmount: this.opportunityAmount })
                .then(() => {
                    // Show success message
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Cost updated successfully',
                            variant: 'success',
                        })
                    );
                    // Refresh the Contractor Changes list
                    return refreshApex(this.wiredContractorChangesResult);
                })
                .catch((error) => {
                    // Show error message
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error updating cost',
                            message: error.body.message,
                            variant: 'error',
                        })
                    );
                });
        }
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