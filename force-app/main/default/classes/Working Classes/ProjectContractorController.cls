public with sharing class ProjectContractorController {
    @AuraEnabled(cacheable=true)
    public static List<ContractorWrapper> getProjectContractors(Id projectId) {
        List<ContractorWrapper> wrappers = new List<ContractorWrapper>();
        
        // Get all contractors for the project
        List<Contractor__c> contractors = [
            SELECT Id, Contact__r.Name
            FROM Contractor__c
            WHERE Project__c = :projectId
            ORDER BY Contact__r.Name
        ];
        
        // Create a map of Contractor Id to its wrapper
        Map<Id, ContractorWrapper> contractorMap = new Map<Id, ContractorWrapper>();
        for(Contractor__c contractor : contractors) {
            ContractorWrapper wrapper = new ContractorWrapper();
            wrapper.contractorName = contractor.Contact__r.Name;
            wrapper.lastBilledDate = null;
            contractorMap.put(contractor.Id, wrapper);
            wrappers.add(wrapper);
        }
        
        // Query Contractor Billing records separately
        List<Contractor_Billing__c> billings = [
            SELECT Contractor__c, Last_Billed_Up_To__c 
            FROM Contractor_Billing__c 
            WHERE Contractor__c IN :contractorMap.keySet()
            ORDER BY Last_Billed_Up_To__c DESC
        ];
        
        // Update the wrappers with billing information
        Map<Id, Date> contractorLastBillingDates = new Map<Id, Date>();
        for(Contractor_Billing__c billing : billings) {
            if(!contractorLastBillingDates.containsKey(billing.Contractor__c)) {
                contractorLastBillingDates.put(billing.Contractor__c, billing.Last_Billed_Up_To__c);
            }
        }
        
        // Update wrappers with billing dates
        for(ContractorWrapper wrapper : wrappers) {
            if(contractorLastBillingDates.containsKey(wrapper.contractorId)) {
                wrapper.lastBilledDate = contractorLastBillingDates.get(wrapper.contractorId);
            }
        }
        
        return wrappers;
    }
    
    // Wrapper class to hold the data for the UI
    public class ContractorWrapper {
        @AuraEnabled public Id contractorId {get; set;}
        @AuraEnabled public String contractorName {get; set;}
        @AuraEnabled public Date lastBilledDate {get; set;}
    }
}