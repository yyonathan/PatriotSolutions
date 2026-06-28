@IsTest
private class PatriotSolutionsHomeControllerTest {
  private static String getOpenLeadStatus() {
    return [
      SELECT MasterLabel
      FROM LeadStatus
      WHERE IsConverted = FALSE
      LIMIT 1
    ]
    .MasterLabel;
  }

  private static String getConvertedLeadStatus() {
    return [SELECT MasterLabel FROM LeadStatus WHERE IsConverted = TRUE LIMIT 1]
    .MasterLabel;
  }

  private static Id convertLead(Id leadId) {
    Database.LeadConvert leadConvert = new Database.LeadConvert();
    leadConvert.setLeadId(leadId);
    leadConvert.setConvertedStatus(getConvertedLeadStatus());
    leadConvert.setDoNotCreateOpportunity(true);

    Database.LeadConvertResult result = Database.convertLead(leadConvert);
    System.assert(result.isSuccess(), 'Lead conversion should succeed');
    return result.getContactId();
  }

  @IsTest
  static void returnsDashboardStatsWithKnownTestData() {
    String openStatus = getOpenLeadStatus();

    insert new List<Lead>{
      new Lead(
        LastName = 'Active Candidate One',
        Company = 'Patriot Solutions',
        Status = openStatus
      ),
      new Lead(
        LastName = 'Active Candidate Two',
        Company = 'Patriot Solutions',
        Status = openStatus
      )
    };

    insert new Contact(
      LastName = 'Pipeline Contact',
      Email = 'pipeline@example.com'
    );

    Lead convertedLead = new Lead(
      LastName = 'Converted Candidate',
      Company = 'Patriot Solutions',
      Status = openStatus
    );
    insert convertedLead;
    Id convertedContactId = convertLead(convertedLead.Id);
    System.assertNotEquals(
      null,
      convertedContactId,
      'Converted lead should create a contact'
    );

    Test.startTest();
    PatriotSolutionsHomeController.DashboardStats stats = PatriotSolutionsHomeController.getDashboardStats();
    Test.stopTest();

    System.assertEquals(
      2,
      stats.activeCandidates,
      'Only unconverted leads should count as active'
    );
    System.assertEquals(
      2,
      stats.contactsInPipeline,
      'Manual and converted contacts should be counted'
    );
    System.assertEquals(
      1,
      stats.convertedThisMonth,
      'Converted lead should count this month'
    );
    System.assertEquals(
      12,
      stats.openPositions,
      'Open positions should match the dashboard constant'
    );
    System.assertEquals(
      0,
      stats.upcomingInterviews,
      'No future events should be scheduled in test data'
    );
  }

  @IsTest
  static void returnsPipelineStagesGroupedByLeadStatus() {
    String openStatus = getOpenLeadStatus();

    insert new List<Lead>{
      new Lead(
        LastName = 'Pipeline Candidate One',
        Company = 'Patriot Solutions',
        Status = openStatus
      ),
      new Lead(
        LastName = 'Pipeline Candidate Two',
        Company = 'Patriot Solutions',
        Status = openStatus
      )
    };

    Test.startTest();
    List<PatriotSolutionsHomeController.PipelineStage> stages = PatriotSolutionsHomeController.getPipelineStages();
    Test.stopTest();

    PatriotSolutionsHomeController.PipelineStage matchingStage;
    for (PatriotSolutionsHomeController.PipelineStage stage : stages) {
      if (stage.name == openStatus) {
        matchingStage = stage;
        break;
      }
    }

    System.assertNotEquals(
      null,
      matchingStage,
      'Open lead status should be returned as a stage'
    );
    System.assertEquals(
      2,
      matchingStage.candidates.size(),
      'Stage should include both active leads'
    );
    System.assert(
      matchingStage.label.endsWith('(2)'),
      'Stage label should include the candidate count'
    );
    System.assertNotEquals(
      null,
      matchingStage.stageIndex,
      'Stage index should be exposed to the UI'
    );
  }

  @IsTest
  static void returnsNewestRecentCandidatesWithFields() {
    String openStatus = getOpenLeadStatus();
    List<Lead> leads = new List<Lead>();

    for (Integer i = 0; i < 6; i++) {
      leads.add(
        new Lead(
          LastName = 'Candidate ' + i,
          Company = 'Patriot Solutions',
          Status = openStatus,
          Email = 'candidate' + i + '@example.com'
        )
      );
    }
    insert leads;

    Datetime baseCreatedDate = Datetime.now().addDays(-7);
    for (Integer i = 0; i < leads.size(); i++) {
      Test.setCreatedDate(leads[i].Id, baseCreatedDate.addHours(i));
    }

    Test.startTest();
    List<PatriotSolutionsHomeController.CandidateSummary> candidates = PatriotSolutionsHomeController.getRecentCandidates();
    List<PatriotSolutionsHomeController.CandidateSummary> allCandidates = PatriotSolutionsHomeController.getAllCandidates();
    Test.stopTest();

    System.assertEquals(
      5,
      candidates.size(),
      'Recent candidates should be limited to five leads'
    );
    System.assertEquals(
      leads[5].Id,
      candidates[0].recordId,
      'Newest lead should appear first'
    );
    System.assertEquals(
      'Candidate 5',
      candidates[0].name,
      'Candidate name should be mapped'
    );
    System.assertEquals(
      'Patriot Solutions',
      candidates[0].company,
      'Candidate company should be mapped'
    );
    System.assertEquals(
      openStatus,
      candidates[0].status,
      'Candidate status should be mapped'
    );
    System.assertEquals(
      'candidate5@example.com',
      candidates[0].email,
      'Candidate email should be mapped'
    );
    System.assertEquals(
      leads[1].Id,
      candidates[4].recordId,
      'Oldest lead should be excluded by the limit'
    );
    System.assertEquals(
      6,
      allCandidates.size(),
      'All candidates view should return the full active set'
    );
  }

  @IsTest
  static void excludesConvertedLeadsFromRecentCandidates() {
    String openStatus = getOpenLeadStatus();

    Lead activeLead = new Lead(
      LastName = 'Active Candidate',
      Company = 'Patriot Solutions',
      Status = openStatus
    );
    Lead convertedLead = new Lead(
      LastName = 'Converted Candidate',
      Company = 'Patriot Solutions',
      Status = openStatus
    );
    insert new List<Lead>{ activeLead, convertedLead };
    convertLead(convertedLead.Id);

    Test.startTest();
    List<PatriotSolutionsHomeController.CandidateSummary> candidates = PatriotSolutionsHomeController.getRecentCandidates();
    Test.stopTest();

    System.assertEquals(
      1,
      candidates.size(),
      'Only the active lead should be returned'
    );
    System.assertEquals(
      activeLead.Id,
      candidates[0].recordId,
      'Converted leads should be excluded'
    );
  }

  @IsTest
  static void returnsJobOpeningsGroupedByCompany() {
    String openStatus = getOpenLeadStatus();

    insert new List<Lead>{
      new Lead(
        LastName = 'Designer Candidate One',
        Company = 'Senior Product Designer',
        Status = openStatus
      ),
      new Lead(
        LastName = 'Designer Candidate Two',
        Company = 'Senior Product Designer',
        Status = openStatus
      ),
      new Lead(
        LastName = 'Developer Candidate',
        Company = 'Frontend Developer',
        Status = openStatus
      )
    };

    Test.startTest();
    List<PatriotSolutionsHomeController.JobOpeningSummary> openings = PatriotSolutionsHomeController.getJobOpenings();
    Test.stopTest();

    Map<String, PatriotSolutionsHomeController.JobOpeningSummary> openingsByTitle = new Map<String, PatriotSolutionsHomeController.JobOpeningSummary>();
    for (PatriotSolutionsHomeController.JobOpeningSummary opening : openings) {
      openingsByTitle.put(opening.title, opening);
    }

    System.assertEquals(
      2,
      openingsByTitle.get('Senior Product Designer').candidateCount,
      'Candidates should be grouped by the job title source'
    );
    System.assertEquals(
      'Active',
      openingsByTitle.get('Frontend Developer').status,
      'Openings should expose a display status'
    );
  }

  @IsTest
  static void returnsUpcomingAndAllInterviews() {
    String openStatus = getOpenLeadStatus();
    Lead candidate = new Lead(
      LastName = 'Interview Candidate',
      Company = 'Patriot Solutions',
      Status = openStatus
    );
    insert candidate;

    List<Event> events = new List<Event>();
    Datetime baseTime = Datetime.now().addDays(1);
    for (Integer i = 0; i < 6; i++) {
      events.add(
        new Event(
          Subject = 'Interview Round ' + i,
          WhoId = candidate.Id,
          StartDateTime = baseTime.addHours(i),
          EndDateTime = baseTime.addHours(i + 1)
        )
      );
    }
    insert events;

    Test.startTest();
    List<PatriotSolutionsHomeController.InterviewSummary> dashboardInterviews = PatriotSolutionsHomeController.getUpcomingInterviews();
    List<PatriotSolutionsHomeController.InterviewSummary> allInterviews = PatriotSolutionsHomeController.getAllInterviews();
    Test.stopTest();

    System.assertEquals(
      5,
      dashboardInterviews.size(),
      'Dashboard interviews should be limited'
    );
    System.assertEquals(
      6,
      allInterviews.size(),
      'Interviews page should return a larger result set'
    );
    System.assertEquals(
      'Interview Candidate',
      allInterviews[0].candidate,
      'Interview candidate name should be mapped from Who'
    );
    System.assertEquals(
      'status-badge scheduled',
      allInterviews[0].statusClass,
      'Interview status class should match the UI badge'
    );
  }

  @IsTest
  static void returnsRecentActivityAndDefaultOnboardingTasks() {
    String openStatus = getOpenLeadStatus();
    Lead activityLead = new Lead(
      LastName = 'Activity Candidate',
      Company = 'Patriot Solutions',
      Status = openStatus
    );
    insert activityLead;
    Test.setCreatedDate(activityLead.Id, Datetime.now().addMinutes(-30));

    Test.startTest();
    List<PatriotSolutionsHomeController.ActivityItem> activityItems = PatriotSolutionsHomeController.getRecentActivity();
    PatriotSolutionsHomeController.OnboardingSummary summary = PatriotSolutionsHomeController.getOnboardingSummary();
    Test.stopTest();

    System.assertEquals(
      1,
      activityItems.size(),
      'Recent activity should include the active lead'
    );
    System.assert(
      activityItems[0].message.contains('Activity Candidate'),
      'Activity message should include the candidate name'
    );
    System.assertEquals(
      'activity-dot blue',
      activityItems[0].dotClass,
      'First activity item should use the primary dot'
    );
    System.assertEquals(
      0,
      summary.progressPercent,
      'Default onboarding progress should start at zero'
    );
    System.assertEquals(
      4,
      summary.tasks.size(),
      'Default onboarding should provide starter tasks'
    );
    System.assertEquals(
      'done',
      summary.tasks[0].className,
      'Default completed tasks should use the done class'
    );
  }

  @IsTest
  static void returnsOnboardingProgressFromTasks() {
    insert new List<Task>{
      new Task(
        Subject = 'Complete background check',
        Status = 'Not Started',
        ActivityDate = Date.today()
      ),
      new Task(
        Subject = 'Send welcome email',
        Status = 'Completed',
        ActivityDate = Date.today()
      )
    };

    Test.startTest();
    PatriotSolutionsHomeController.OnboardingSummary summary = PatriotSolutionsHomeController.getOnboardingSummary();
    Test.stopTest();

    System.assertEquals(
      50,
      summary.progressPercent,
      'One closed task out of two should be 50%'
    );
    System.assertEquals(
      1,
      summary.tasks.size(),
      'Only open tasks should be returned in the checklist'
    );
    System.assertEquals(
      'Complete background check',
      summary.tasks[0].label,
      'Open task subject should be shown in the onboarding checklist'
    );
    System.assertEquals(
      'todo',
      summary.tasks[0].className,
      'Open tasks should use the todo class'
    );
  }
}
