public with sharing class PatriotSolutionsHomeController {
  private static final Integer RECENT_CANDIDATE_LIMIT = 5;
  private static final Integer ALL_CANDIDATE_LIMIT = 50;
  private static final Integer DASHBOARD_INTERVIEW_LIMIT = 5;
  private static final Integer ALL_INTERVIEW_LIMIT = 25;
  private static final Integer JOB_OPENING_DISPLAY_LIMIT = 12;
  private static final List<String> APPLICATION_STAGE_ORDER = new List<String>{
    'Applied',
    'Resume Review',
    'Recruiter Screen',
    'HM Interview',
    'Interview Loop',
    'Background Check',
    'Offer Extended',
    'Hired',
    'Rejected'
  };

  @AuraEnabled(cacheable=true)
  public static DashboardStats getDashboardStats() {
    Integer activeCandidates = [
      SELECT COUNT()
      FROM Job_Application__c
    ];
    Integer onboardingCount = [
      SELECT COUNT()
      FROM Onboarding_Task__c
      WHERE Status__c != 'Complete'
    ];
    Integer hiredCount = [
      SELECT COUNT()
      FROM Job_Application__c
      WHERE Stage__c = 'Hired'
    ];
    Integer openPositions = [
      SELECT COUNT()
      FROM Position__c
      WHERE Status__c = 'Open'
    ];
    Integer upcomingInterviews = [
      SELECT COUNT()
      FROM Event
      WHERE StartDateTime >= :Datetime.now()
    ];

    return new DashboardStats(
      activeCandidates,
      onboardingCount,
      hiredCount,
      openPositions,
      upcomingInterviews
    );
  }

  @AuraEnabled(cacheable=true)
  public static List<CandidateSummary> getRecentCandidates() {
    return getCandidateSummaries(RECENT_CANDIDATE_LIMIT);
  }

  @AuraEnabled(cacheable=true)
  public static List<CandidateSummary> getAllCandidates() {
    return getCandidateSummaries(ALL_CANDIDATE_LIMIT);
  }

  private static List<CandidateSummary> getCandidateSummaries(
    Integer rowLimit
  ) {
    List<CandidateSummary> candidates = new List<CandidateSummary>();

    for (Job_Application__c application : [
      SELECT
        Id,
        Stage__c,
        CreatedDate,
        Candidate__r.Name,
        Candidate__r.Email,
        Position__r.Name
      FROM Job_Application__c
      ORDER BY CreatedDate DESC
      LIMIT :rowLimit
    ]) {
      candidates.add(buildCandidateSummary(application));
    }

    return candidates;
  }

  @AuraEnabled(cacheable=true)
  public static List<PipelineStage> getPipelineStages() {
    Map<String, List<PipelineCandidate>> candidatesByStatus = new Map<String, List<PipelineCandidate>>();

    for (Job_Application__c application : [
      SELECT Id, Stage__c, Candidate__r.Name, Position__r.Name
      FROM Job_Application__c
      ORDER BY CreatedDate DESC
      LIMIT 50
    ]) {
      String statusLabel = String.isBlank(application.Stage__c)
        ? 'Applied'
        : application.Stage__c;

      if (!candidatesByStatus.containsKey(statusLabel)) {
        candidatesByStatus.put(statusLabel, new List<PipelineCandidate>());
      }

      candidatesByStatus.get(statusLabel)
        .add(
          new PipelineCandidate(
            application.Id,
            application.Candidate__r != null
              ? application.Candidate__r.Name
              : 'Candidate',
            application.Position__r != null
              ? application.Position__r.Name
              : 'Open Role',
            statusLabel
          )
        );
    }

    List<String> orderedStatuses = getOrderedPipelineStatuses(
      candidatesByStatus.keySet()
    );
    List<PipelineStage> stages = new List<PipelineStage>();
    Integer stageIndex = 0;

    for (String statusLabel : orderedStatuses) {
      List<PipelineCandidate> stageCandidates = candidatesByStatus.containsKey(
          statusLabel
        )
        ? candidatesByStatus.get(statusLabel)
        : new List<PipelineCandidate>();

      stages.add(
        new PipelineStage(
          statusLabel,
          statusLabel + ' (' + stageCandidates.size() + ')',
          stageCandidates,
          stageIndex
        )
      );
      stageIndex++;
    }

    return stages;
  }

  @AuraEnabled(cacheable=true)
  public static List<InterviewSummary> getUpcomingInterviews() {
    return getInterviewSummaries(DASHBOARD_INTERVIEW_LIMIT);
  }

  @AuraEnabled(cacheable=true)
  public static List<InterviewSummary> getAllInterviews() {
    return getInterviewSummaries(ALL_INTERVIEW_LIMIT);
  }

  private static List<InterviewSummary> getInterviewSummaries(
    Integer rowLimit
  ) {
    List<InterviewSummary> interviews = new List<InterviewSummary>();

    for (Event eventRecord : [
      SELECT Id, Subject, StartDateTime, Who.Name, Owner.Name
      FROM Event
      WHERE StartDateTime >= :Datetime.now()
      ORDER BY StartDateTime ASC
      LIMIT :rowLimit
    ]) {
      interviews.add(
        new InterviewSummary(
          eventRecord.Id,
          eventRecord.Who != null ? eventRecord.Who.Name : 'Candidate',
          eventRecord.Subject,
          eventRecord.StartDateTime.format('MMM d, h:mm a'),
          eventRecord.Owner != null ? eventRecord.Owner.Name : 'Unassigned',
          'Scheduled'
        )
      );
    }

    return interviews;
  }

  @AuraEnabled(cacheable=true)
  public static List<JobOpeningSummary> getJobOpenings() {
    Map<Id, Integer> candidateCountsByPosition = new Map<Id, Integer>();

    for (AggregateResult result : [
      SELECT Position__c positionId, COUNT(Id) candidateCount
      FROM Job_Application__c
      WHERE Position__c != NULL
      GROUP BY Position__c
    ]) {
      candidateCountsByPosition.put(
        (Id) result.get('positionId'),
        (Integer) result.get('candidateCount')
      );
    }

    List<JobOpeningSummary> openings = new List<JobOpeningSummary>();
    for (Position__c position : [
      SELECT Id, Name, Status__c
      FROM Position__c
      ORDER BY CreatedDate DESC
      LIMIT :JOB_OPENING_DISPLAY_LIMIT
    ]) {
      openings.add(
        new JobOpeningSummary(
          position.Id,
          position.Name,
          candidateCountsByPosition.containsKey(position.Id)
            ? candidateCountsByPosition.get(position.Id)
            : 0,
          String.isBlank(position.Status__c) ? 'Open' : position.Status__c
        )
      );
    }

    return openings;
  }

  @AuraEnabled(cacheable=true)
  public static List<ActivityItem> getRecentActivity() {
    List<ActivityItem> activityItems = new List<ActivityItem>();
    List<String> dotClasses = new List<String>{
      'activity-dot blue',
      'activity-dot green',
      'activity-dot orange'
    };
    Integer dotIndex = 0;

    for (Job_Application__c application : [
      SELECT Candidate__r.Name, Position__r.Name, CreatedDate
      FROM Job_Application__c
      ORDER BY CreatedDate DESC
      LIMIT 5
    ]) {
      String candidateName = application.Candidate__r != null
        ? application.Candidate__r.Name
        : 'Candidate';
      String positionName = application.Position__r != null
        ? application.Position__r.Name
        : 'open role';

      activityItems.add(
        new ActivityItem(
          'New candidate: ' +
            candidateName +
            ' for ' +
            positionName,
          formatRelativeTime(application.CreatedDate),
          dotIndex == 0 ? 'activity-item' : 'activity-item indented',
          dotClasses[Math.mod(dotIndex, dotClasses.size())]
        )
      );
      dotIndex++;
    }

    return activityItems;
  }

  @AuraEnabled(cacheable=true)
  public static OnboardingSummary getOnboardingSummary() {
    List<Onboarding_Task__c> tasks = [
      SELECT Id, Name, Status__c
      FROM Onboarding_Task__c
      ORDER BY CreatedDate DESC
      LIMIT 6
    ];

    if (tasks.isEmpty()) {
      return new OnboardingSummary(
        0,
        new List<OnboardingTaskItem>{
          new OnboardingTaskItem('Send Offer Letter', true),
          new OnboardingTaskItem('Background Check', false),
          new OnboardingTaskItem('Assign Equipment', false),
          new OnboardingTaskItem('Welcome Email', true)
        }
      );
    }

    Integer completedTasks = [
      SELECT COUNT()
      FROM Onboarding_Task__c
      WHERE Status__c = 'Complete'
    ];
    Integer totalTasks = completedTasks + tasks.size();
    Integer progressPercent = totalTasks == 0
      ? 0
      : (completedTasks * 100) / totalTasks;

    List<OnboardingTaskItem> taskItems = new List<OnboardingTaskItem>();
    for (Onboarding_Task__c taskRecord : tasks) {
      taskItems.add(
        new OnboardingTaskItem(
          taskRecord.Name,
          taskRecord.Status__c == 'Complete'
        )
      );
    }

    return new OnboardingSummary(progressPercent, taskItems);
  }

  @AuraEnabled
  public static Id uploadCandidateResume(
    Id contactId,
    String fileName,
    String base64Data
  ) {
    if (contactId == null) {
      throw new AuraHandledException('A contact is required for resume upload.');
    }

    if (String.isBlank(fileName) || String.isBlank(base64Data)) {
      throw new AuraHandledException('A PDF resume file is required.');
    }

    String title = fileName.toLowerCase().endsWith('.pdf')
      ? fileName.substring(0, fileName.length() - 4)
      : fileName;

    ContentVersion resume = new ContentVersion(
      Title = title,
      PathOnClient = fileName,
      VersionData = EncodingUtil.base64Decode(base64Data),
      FirstPublishLocationId = contactId
    );
    insert resume;

    return resume.Id;
  }

  private static CandidateSummary buildCandidateSummary(
    Job_Application__c application
  ) {
    return new CandidateSummary(
      application.Id,
      application.Candidate__r != null ? application.Candidate__r.Name : '',
      application.Position__r != null ? application.Position__r.Name : '',
      application.Stage__c,
      application.Candidate__r != null ? application.Candidate__r.Email : '',
      application.CreatedDate
    );
  }

  private static List<String> getOrderedPipelineStatuses(
    Set<String> observedStatuses
  ) {
    List<String> orderedStatuses = new List<String>();
    Set<String> addedStatuses = new Set<String>();

    for (String stageName : APPLICATION_STAGE_ORDER) {
      orderedStatuses.add(stageName);
      addedStatuses.add(stageName);
    }

    List<String> additionalStatuses = new List<String>();
    for (String statusLabel : observedStatuses) {
      if (!addedStatuses.contains(statusLabel)) {
        additionalStatuses.add(statusLabel);
      }
    }
    additionalStatuses.sort();
    orderedStatuses.addAll(additionalStatuses);

    return orderedStatuses;
  }

  private static String formatRelativeTime(Datetime value) {
    Long minutesAgo =
      (Datetime.now().getTime() - value.getTime()) / (1000 * 60);

    if (minutesAgo < 60) {
      return minutesAgo <= 1 ? 'Just now' : minutesAgo + ' minutes ago';
    }

    Long hoursAgo = minutesAgo / 60;
    if (hoursAgo < 24) {
      return hoursAgo == 1 ? '1 hour ago' : hoursAgo + ' hours ago';
    }

    Long daysAgo = hoursAgo / 24;
    return daysAgo == 1 ? 'Yesterday' : daysAgo + ' days ago';
  }

  public class DashboardStats {
    @AuraEnabled
    public Integer activeCandidates { get; private set; }
    @AuraEnabled
    public Integer contactsInPipeline { get; private set; }
    @AuraEnabled
    public Integer convertedThisMonth { get; private set; }
    @AuraEnabled
    public Integer openPositions { get; private set; }
    @AuraEnabled
    public Integer upcomingInterviews { get; private set; }

    public DashboardStats(
      Integer activeCandidates,
      Integer contactsInPipeline,
      Integer convertedThisMonth,
      Integer openPositions,
      Integer upcomingInterviews
    ) {
      this.activeCandidates = activeCandidates;
      this.contactsInPipeline = contactsInPipeline;
      this.convertedThisMonth = convertedThisMonth;
      this.openPositions = openPositions;
      this.upcomingInterviews = upcomingInterviews;
    }
  }

  public class CandidateSummary {
    @AuraEnabled
    public Id recordId { get; private set; }
    @AuraEnabled
    public String name { get; private set; }
    @AuraEnabled
    public String company { get; private set; }
    @AuraEnabled
    public String status { get; private set; }
    @AuraEnabled
    public String email { get; private set; }
    @AuraEnabled
    public Datetime createdDate { get; private set; }

    public CandidateSummary(
      Id recordId,
      String name,
      String company,
      String status,
      String email,
      Datetime createdDate
    ) {
      this.recordId = recordId;
      this.name = name;
      this.company = company;
      this.status = status;
      this.email = email;
      this.createdDate = createdDate;
    }
  }

  public class PipelineStage {
    @AuraEnabled
    public String name { get; private set; }
    @AuraEnabled
    public String label { get; private set; }
    @AuraEnabled
    public List<PipelineCandidate> candidates { get; private set; }
    @AuraEnabled
    public Integer stageIndex { get; private set; }

    public PipelineStage(
      String name,
      String label,
      List<PipelineCandidate> candidates,
      Integer stageIndex
    ) {
      this.name = name;
      this.label = label;
      this.candidates = candidates;
      this.stageIndex = stageIndex;
    }
  }

  public class JobOpeningSummary {
    @AuraEnabled
    public Id recordId { get; private set; }
    @AuraEnabled
    public String title { get; private set; }
    @AuraEnabled
    public Integer candidateCount { get; private set; }
    @AuraEnabled
    public String status { get; private set; }

    public JobOpeningSummary(
      Id recordId,
      String title,
      Integer candidateCount,
      String status
    ) {
      this.recordId = recordId;
      this.title = title;
      this.candidateCount = candidateCount;
      this.status = status;
    }
  }

  public class PipelineCandidate {
    @AuraEnabled
    public Id recordId { get; private set; }
    @AuraEnabled
    public String name { get; private set; }
    @AuraEnabled
    public String role { get; private set; }
    @AuraEnabled
    public String status { get; private set; }

    public PipelineCandidate(
      Id recordId,
      String name,
      String company,
      String status
    ) {
      this.recordId = recordId;
      this.name = name;
      this.role = String.isBlank(company) ? 'Candidate' : company;
      this.status = status;
    }
  }

  public class InterviewSummary {
    @AuraEnabled
    public Id recordId { get; private set; }
    @AuraEnabled
    public String candidate { get; private set; }
    @AuraEnabled
    public String position { get; private set; }
    @AuraEnabled
    public String dateLabel { get; private set; }
    @AuraEnabled
    public String interviewer { get; private set; }
    @AuraEnabled
    public String status { get; private set; }
    @AuraEnabled
    public String statusClass { get; private set; }

    public InterviewSummary(
      Id recordId,
      String candidate,
      String position,
      String dateLabel,
      String interviewer,
      String status
    ) {
      this.recordId = recordId;
      this.candidate = candidate;
      this.position = position;
      this.dateLabel = dateLabel;
      this.interviewer = interviewer;
      this.status = status;
      this.statusClass = 'status-badge scheduled';
    }
  }

  public class ActivityItem {
    @AuraEnabled
    public String message { get; private set; }
    @AuraEnabled
    public String timeLabel { get; private set; }
    @AuraEnabled
    public String className { get; private set; }
    @AuraEnabled
    public String dotClass { get; private set; }

    public ActivityItem(
      String message,
      String timeLabel,
      String className,
      String dotClass
    ) {
      this.message = message;
      this.timeLabel = timeLabel;
      this.className = className;
      this.dotClass = dotClass;
    }
  }

  public class OnboardingTaskItem {
    @AuraEnabled
    public String label { get; private set; }
    @AuraEnabled
    public String iconName { get; private set; }
    @AuraEnabled
    public String className { get; private set; }

    public OnboardingTaskItem(String label, Boolean isComplete) {
      this.label = label;
      this.iconName = isComplete ? 'utility:success' : 'utility:record';
      this.className = isComplete ? 'done' : 'todo';
    }
  }

  public class OnboardingSummary {
    @AuraEnabled
    public Integer progressPercent { get; private set; }
    @AuraEnabled
    public List<OnboardingTaskItem> tasks { get; private set; }

    public OnboardingSummary(
      Integer progressPercent,
      List<OnboardingTaskItem> tasks
    ) {
      this.progressPercent = progressPercent;
      this.tasks = tasks;
    }
  }
}
