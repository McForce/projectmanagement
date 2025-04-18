// Step 1: Add these imports at the top of the file
import { LightningElement, api, wire } from 'lwc';
import getContractorChanges from '@salesforce/apex/OpportunityContractorController.getContractorChanges';
import getOpportunityAmount from '@salesforce/apex/OpportunityContractorController.getOpportunityAmount';
import updateContractorChange from '@salesforce/apex/OpportunityContractorController.updateContractorChange';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Step 2: Ensure the main class looks like this
export default class ContractorChanges extends LightningElement {
    @api recordId; // The Opportunity record ID
    contractorChanges; // Holds the list of Contractor Changes
    opportunityAmount; // Holds the Opportunity Amount
    error;

    // Step 3: Fetch Contractor Changes using the Apex method
    @wire(getContractorChanges, { opportunityId: '$recordId' })
    wiredContractorChanges({ error, data }) {
        if (data) {
            this.contractorChanges = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.contractorChanges = undefined;
        }
    }

    // Step 4: Fetch Opportunity Amount using another Apex method
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

    // Step 5: Handle inline editing for the Cost field
    handleEdit(event) {
        const { fieldName, recordId, value } = event.detail; // Get the edited field details
        if (fieldName === 'Cost') {
            const newCost = parseFloat(value); // Parse the new cost value
            updateContractorChange({ contractorChangeId: recordId, newCost, opportunityAmount: this.opportunityAmount })
                .then(() => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Cost updated successfully',
                            variant: 'success',
                        })
                    );
                    // Refresh the Contractor Changes list
                    return refreshApex(this.wiredContractorChanges);
                })
                .catch((error) => {
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

    // Step 6: Helper to check if there are Contractor Changes
    get hasContractorChanges() {
        return this.contractorChanges && this.contractorChanges.length > 0;
    }

    // Step 7: Helper to format the Opportunity Amount
    get formattedOpportunityAmount() {
        return this.opportunityAmount ? `$${this.opportunityAmount.toFixed(2)}` : '';
    }
}