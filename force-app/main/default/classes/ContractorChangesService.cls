public without sharing class ContractorChangesService {
    
    /**
     * Main method to handle contractor changes creation
     * @param opportunities List of opportunities to process
     */
    public static void createContractorChanges(List<Opportunity> opportunities) {
        // Check CRUD permissions
        if (!hasRequiredPermissions()) {
            throw new ContractorChangesException('Insufficient permissions to perform the operation');
        }

        try {
            Map<Id, Id> oppToProjectMap = getOpportunityToProjectMap(opportunities);
            
            if (oppToProjectMap.isEmpty()) {
                return;
            }

            Map<Id, List<Contractor__c>> projectToContractorsMap = getContractorsByProject(oppToProjectMap.values());
            
            if (projectToContractorsMap.isEmpty()) {
                return;
            }

            List<Contractor_Change__c> contractorChanges = buildContractorChanges(
                opportunities, 
                oppToProjectMap, 
                projectToContractorsMap
            );

            if (!contractorChanges.isEmpty()) {
                insert contractorChanges;
            }
        } catch (Exception e) {
            throw new ContractorChangesException('Failed to create Contractor Changes: ' + e.getMessage());
        }
    }

    /**
     * Checks if the current user has the required CRUD permissions
     * @return Boolean indicating if user has required permissions
     */
    private static Boolean hasRequiredPermissions() {
        return (
            Contractor__c.SObjectType.getDescribe().isAccessible() &&
            Contractor_Change__c.SObjectType.getDescribe().isCreateable() &&
            Schema.SObjectType.Contractor_Change__c.fields.Name.isCreateable() &&
            Schema.SObjectType.Contractor_Change__c.fields.Budget_Percentage__c.isCreateable() &&
            Schema.SObjectType.Contractor_Change__c.fields.Contact__c.isCreateable() &&
            Schema.SObjectType.Contractor_Change__c.fields.Cost__c.isCreateable() &&
            Schema.SObjectType.Contractor_Change__c.fields.Project__c.isCreateable() &&
            Schema.SObjectType.Contractor_Change__c.fields.Contractor__c.isCreateable() &&
            Schema.SObjectType.Contractor_Change__c.fields.Opportunity__c.isCreateable()
        );
    }

    /**
     * Creates a map of Opportunity Id to Project Id
     * @param opportunities List of opportunities to process
     * @return Map<Id, Id> Map of Opportunity Id to Project Id
     */
    private static Map<Id, Id> getOpportunityToProjectMap(List<Opportunity> opportunities) {
        Map<Id, Id> oppToProjectMap = new Map<Id, Id>();
        
        for (Opportunity opp : opportunities) {
            if (opp.Project__c != null) {
                oppToProjectMap.put(opp.Id, opp.Project__c);
            }
        }
        
        return oppToProjectMap;
    }

    /**
     * Retrieves contractors grouped by project
     * @param projectIds Set of project Ids
     * @return Map<Id, List<Contractor__c>> Map of Project Id to List of Contractors
     */
    private static Map<Id, List<Contractor__c>> getContractorsByProject(Set<Id> projectIds) {
        Map<Id, List<Contractor__c>> projectToContractorsMap = new Map<Id, List<Contractor__c>>();
        
        for (Contractor__c contractor : [
            SELECT Id, Name, Budget_Percentage__c, Contact__c, Cost__c, Project__c
            FROM Contractor__c
            WHERE Project__c IN :projectIds
            WITH SECURITY_ENFORCED
        ]) {
            if (!projectToContractorsMap.containsKey(contractor.Project__c)) {
                projectToContractorsMap.put(contractor.Project__c, new List<Contractor__c>());
            }
            projectToContractorsMap.get(contractor.Project__c).add(contractor);
        }
        
        return projectToContractorsMap;
    }

    /**
     * Builds Contractor Change records based on existing Contractors
     * @param opportunities List of opportunities to process
     * @param oppToProjectMap Map of Opportunity Id to Project Id
     * @param projectToContractorsMap Map of Project Id to List of Contractors
     * @return List<Contractor_Change__c> List of Contractor Change records to create
     */
    private static List<Contractor_Change__c> buildContractorChanges(
        List<Opportunity> opportunities,
        Map<Id, Id> oppToProjectMap,
        Map<Id, List<Contractor__c>> projectToContractorsMap
    ) {
        List<Contractor_Change__c> contractorChangesToInsert = new List<Contractor_Change__c>();
        
        for (Opportunity opp : opportunities) {
            Id projectId = oppToProjectMap.get(opp.Id);
            if (projectId != null && projectToContractorsMap.containsKey(projectId)) {
                for (Contractor__c contractor : projectToContractorsMap.get(projectId)) {
                    contractorChangesToInsert.add(createContractorChange(contractor, opp.Id));
                }
            }
        }
        
        return contractorChangesToInsert;
    }

    /**
     * Creates a single Contractor Change record
     * @param contractor Source contractor record
     * @param opportunityId Related opportunity Id
     * @return Contractor_Change__c New Contractor Change record
     */
    private static Contractor_Change__c createContractorChange(Contractor__c contractor, Id opportunityId) {
        return new Contractor_Change__c(
            Name = contractor.Name,
            Budget_Percentage__c = contractor.Budget_Percentage__c,
            Contact__c = contractor.Contact__c,
            Cost__c = contractor.Cost__c,
            Project__c = contractor.Project__c,
            Contractor__c = contractor.Id,
            Opportunity__c = opportunityId
        );
    }
    
    public class ContractorChangesException extends Exception {}
}