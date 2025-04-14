trigger OpportunityContractorChangesTrigger on Schema.Opportunity (after insert, after update) {
    // Only process Opportunities of Type 'Contractor Changes'
    List<Opportunity> contractorChangesOpps = new List<Opportunity>();
    
    for (Opportunity opp : Trigger.new) {
        if (opp.Type == 'Contractor Changes') {
            contractorChangesOpps.add(opp);
        }
    }
    
    if (!contractorChangesOpps.isEmpty()) {
        ContractorChangesService.createContractorChanges(contractorChangesOpps);
    }
}