public with sharing class PatriotSolutionsHomeController {
  private static final Integer RECENT_CANDIDATE_LIMIT = 5;
  private static final Integer ALL_CANDIDATE_LIMIT = 50;
  private static final Integer DASHBOARD_INTERVIEW_LIMIT = 5;
  private static final Integer ALL_INTERVIEW_LIMIT = 25;
  private static final Integer JOB_OPENING_SOURCE_LIMIT = 50;
  private static final Integer JOB_OPENING_DISPLAY_LIMIT = 12;
  private static final String GENERAL_RECRUITING_TITLE = 'General Recruiting';

  @AuraEnabled(cacheable=true)
  public static DashboardStats getDashboardStats() {
    Integer activeCandidates = [
      SELECT COUNT()
      FROM Lead
      WHERE IsConverted = FALSE
    ];
    Integer contactsInPipeline = [SELECT COUNT() FROM Contact];
    Integer convertedThisMonth = [
      SELECT COUNT()
      FROM Lead
      WHERE
        IsConverted = TRUE
        AND CALENDAR_MONTH(ConvertedDate) = :Date.today().month()
    ];
    Integer upcomingInterviews = [
      SELECT COUNT()
      FROM Event
      WHERE StartDateTime >= :Datetime.now()
    ];

    return new DashboardStats(
      activeCandidates,
      contactsInPipeline,
      convertedThisMonth,
      12,
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

    for (Lead leadRecord : [
      SELECT Id, Name, Company, Status, Email, CreatedDate
      FROM Lead
      WHERE IsConverted = FALSE
      ORDER BY CreatedDate DESC
      LIMIT :rowLimit
    ]) {
      candidates.add(buildCandidateSummary(leadRecord));
    }

    return candidates;
  }

  @AuraEnabled(cacheable=true)
  public static List<PipelineStage> getPipelineStages() {
    Map<String, List<PipelineCandidate>> candidatesByStatus = new Map<String, List<PipelineCandidate>>();

    for (Lead leadRecord : [
      SELECT Id, Name, Company, Status
      FROM Lead
      WHERE IsConverted = FALSE
      ORDER BY CreatedDate DESC
      LIMIT 50
    ]) {
      String statusLabel = String.isBlank(leadRecord.Status)
        ? 'Unassigned'
        : leadRecord.Status;

      if (!candidatesByStatus.containsKey(statusLabel)) {
        candidatesByStatus.put(statusLabel, new List<PipelineCandidate>());
      }

      candidatesByStatus.get(statusLabel)
        .add(
          new PipelineCandidate(
            leadRecord.Id,
            leadRecord.Name,
            leadRecord.Company,
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
    Map<String, Integer> candidateCountsByTitle = new Map<String, Integer>();

    for (Lead leadRecord : [
      SELECT Company
      FROM Lead
      WHERE IsConverted = FALSE
      ORDER BY CreatedDate DESC
      LIMIT :JOB_OPENING_SOURCE_LIMIT
    ]) {
      String title = String.isBlank(leadRecord.Company)
        ? GENERAL_RECRUITING_TITLE
        : leadRecord.Company;

      Integer currentCount = candidateCountsByTitle.containsKey(title)
        ? candidateCountsByTitle.get(title)
        : 0;
      candidateCountsByTitle.put(title, currentCount + 1);
    }

    List<String> titles = new List<String>();
    titles.addAll(candidateCountsByTitle.keySet());
    titles.sort();

    List<JobOpeningSummary> openings = new List<JobOpeningSummary>();
    for (String title : titles) {
      if (openings.size() >= JOB_OPENING_DISPLAY_LIMIT) {
        break;
      }

      openings.add(
        new JobOpeningSummary(
          title,
          candidateCountsByTitle.get(title),
          'Active'
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

    for (Lead leadRecord : [
      SELECT Name, Company, CreatedDate
      FROM Lead
      WHERE IsConverted = FALSE
      ORDER BY CreatedDate DESC
      LIMIT 5
    ]) {
      activityItems.add(
        new ActivityItem(
          'New candidate: ' +
            leadRecord.Name +
            (String.isBlank(leadRecord.Company)
              ? ''
              : ' at ' + leadRecord.Company),
          formatRelativeTime(leadRecord.CreatedDate),
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
    List<Task> tasks = [
      SELECT Id, Subject, Status, IsClosed
      FROM Task
      WHERE IsClosed = FALSE
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
      FROM Task
      WHERE IsClosed = TRUE
    ];
    Integer totalTasks = completedTasks + tasks.size();
    Integer progressPercent = totalTasks == 0
      ? 0
      : (completedTasks * 100) / totalTasks;

    List<OnboardingTaskItem> taskItems = new List<OnboardingTaskItem>();
    for (Task taskRecord : tasks) {
      taskItems.add(
        new OnboardingTaskItem(
          taskRecord.Subject,
          taskRecord.IsClosed || taskRecord.Status == 'Completed'
        )
      );
    }

    return new OnboardingSummary(progressPercent, taskItems);
  }

  private static CandidateSummary buildCandidateSummary(Lead leadRecord) {
    return new CandidateSummary(
      leadRecord.Id,
      leadRecord.Name,
      leadRecord.Company,
      leadRecord.Status,
      leadRecord.Email,
      leadRecord.CreatedDate
    );
  }

  private static List<String> getOrderedPipelineStatuses(
    Set<String> observedStatuses
  ) {
    List<String> orderedStatuses = new List<String>();
    Set<String> addedStatuses = new Set<String>();

    for (LeadStatus statusRecord : [
      SELECT MasterLabel
      FROM LeadStatus
      WHERE IsConverted = FALSE
      ORDER BY SortOrder
    ]) {
      orderedStatuses.add(statusRecord.MasterLabel);
      addedStatuses.add(statusRecord.MasterLabel);
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
    public String title { get; private set; }
    @AuraEnabled
    public Integer candidateCount { get; private set; }
    @AuraEnabled
    public String status { get; private set; }

    public JobOpeningSummary(
      String title,
      Integer candidateCount,
      String status
    ) {
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
