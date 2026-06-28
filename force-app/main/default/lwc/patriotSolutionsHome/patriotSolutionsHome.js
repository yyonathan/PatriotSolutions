import { LightningElement, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getAllCandidates from "@salesforce/apex/PatriotSolutionsHomeController.getAllCandidates";
import getAllInterviews from "@salesforce/apex/PatriotSolutionsHomeController.getAllInterviews";
import getDashboardStats from "@salesforce/apex/PatriotSolutionsHomeController.getDashboardStats";
import getJobOpenings from "@salesforce/apex/PatriotSolutionsHomeController.getJobOpenings";
import getPipelineStages from "@salesforce/apex/PatriotSolutionsHomeController.getPipelineStages";
import getUpcomingInterviews from "@salesforce/apex/PatriotSolutionsHomeController.getUpcomingInterviews";
import getRecentActivity from "@salesforce/apex/PatriotSolutionsHomeController.getRecentActivity";
import getOnboardingSummary from "@salesforce/apex/PatriotSolutionsHomeController.getOnboardingSummary";

const PIPELINE_CARD_CLASSES = [
  "candidate-card border-outline",
  "candidate-card border-primary",
  "candidate-card border-yellow",
  "candidate-card border-green",
  "candidate-card border-deep-green"
];

const PIPELINE_BADGE_CLASSES = ["badge gray", "badge blue", "badge green"];

export default class PatriotSolutionsHome extends NavigationMixin(
  LightningElement
) {
  activeView = "dashboard";
  stats;
  statsError;
  pipelineStages = [];
  pipelineError;
  interviews = [];
  interviewsError;
  allInterviews = [];
  allInterviewsError;
  candidates = [];
  candidatesError;
  candidateSearchTerm = "";
  jobOpenings = [];
  jobOpeningsError;
  recentActivity = [];
  activityError;
  onboardingTasks = [];
  onboardingProgress = 0;
  onboardingError;

  navItems = [
    {
      label: "Dashboard",
      iconName: "utility:apps",
      viewId: "dashboard",
      className: "active"
    },
    {
      label: "Job Openings",
      iconName: "standard:job_position",
      viewId: "jobOpenings",
      className: ""
    },
    {
      label: "Candidates",
      iconName: "standard:people",
      viewId: "candidates",
      className: ""
    },
    {
      label: "Interviews",
      iconName: "standard:event",
      viewId: "interviews",
      className: ""
    },
    {
      label: "Hiring Pipeline",
      iconName: "standard:hierarchy",
      viewId: "hiringPipeline",
      className: ""
    },
    {
      label: "Onboarding",
      iconName: "standard:employee",
      viewId: "onboarding",
      className: ""
    },
    {
      label: "Reports",
      iconName: "standard:report",
      viewId: "reports",
      className: ""
    },
    {
      label: "Settings",
      iconName: "utility:settings",
      viewId: "settings",
      className: ""
    }
  ];

  quickActions = [
    {
      label: "Add Candidate",
      iconName: "standard:lead",
      objectApiName: "Lead"
    },
    {
      label: "Manage Contacts",
      iconName: "standard:contact",
      objectApiName: "Contact"
    },
    {
      label: "Schedule Interview",
      iconName: "standard:event",
      objectApiName: "Event"
    }
  ];

  @wire(getDashboardStats)
  wiredStats({ data, error }) {
    if (data) {
      this.stats = data;
      this.statsError = undefined;
    } else if (error) {
      this.statsError = error;
      this.stats = undefined;
    }
  }

  @wire(getPipelineStages)
  wiredPipeline({ data, error }) {
    if (data) {
      this.pipelineStages = data.map((stage, stageIndex) => ({
        ...this.decoratePipelineStage(stage, stageIndex)
      }));
      this.pipelineError = undefined;
    } else if (error) {
      this.pipelineError = error;
      this.pipelineStages = [];
    }
  }

  @wire(getAllCandidates)
  wiredCandidates({ data, error }) {
    if (data) {
      this.candidates = data.map((candidate) => ({
        ...candidate,
        key: candidate.recordId,
        listCardClass: "entity-card interactive-card candidate-list-card",
        dateLabel: this.formatDate(candidate.createdDate),
        statusClass: "status-badge scheduled"
      }));
      this.candidatesError = undefined;
    } else if (error) {
      this.candidatesError = error;
      this.candidates = [];
    }
  }

  @wire(getJobOpenings)
  wiredJobOpenings({ data, error }) {
    if (data) {
      this.jobOpenings = data.map((opening) => ({
        ...opening,
        key: opening.title,
        cardClass: "entity-card interactive-card job-opening-card",
        statusClass: "status-badge completed",
        candidateCountLabel: `${opening.candidateCount} candidate${
          opening.candidateCount === 1 ? "" : "s"
        }`
      }));
      this.jobOpeningsError = undefined;
    } else if (error) {
      this.jobOpeningsError = error;
      this.jobOpenings = [];
    }
  }

  @wire(getAllInterviews)
  wiredAllInterviews({ data, error }) {
    if (data) {
      this.allInterviews = this.decorateInterviews(data);
      this.allInterviewsError = undefined;
    } else if (error) {
      this.allInterviewsError = error;
      this.allInterviews = [];
    }
  }

  decoratePipelineStage(stage, stageIndex) {
    const stageColorIndex =
      stage.stageIndex === undefined || stage.stageIndex === null
        ? stageIndex
        : stage.stageIndex;
    const cardClass =
      PIPELINE_CARD_CLASSES[stageColorIndex % PIPELINE_CARD_CLASSES.length];
    const candidates = (stage.candidates || []).map(
      (candidate, candidateIndex) => ({
        ...candidate,
        key: candidate.recordId,
        cardClass,
        badgeClass:
          PIPELINE_BADGE_CLASSES[
            candidateIndex % PIPELINE_BADGE_CLASSES.length
          ],
        showStatus: candidateIndex === 0
      })
    );

    return {
      ...stage,
      key: stage.name || stage.label,
      stageClass: `kanban-column stage-${stageColorIndex % PIPELINE_CARD_CLASSES.length}`,
      hasCandidates: candidates.length > 0,
      candidates
    };
  }

  decorateInterviews(interviews) {
    return interviews.map((interview) => ({
      ...interview,
      key: interview.recordId,
      date: interview.dateLabel
    }));
  }

  @wire(getUpcomingInterviews)
  wiredInterviews({ data, error }) {
    if (data) {
      this.interviews = this.decorateInterviews(data);
      this.interviewsError = undefined;
    } else if (error) {
      this.interviewsError = error;
      this.interviews = [];
    }
  }

  @wire(getRecentActivity)
  wiredActivity({ data, error }) {
    if (data) {
      this.recentActivity = data.map((activity) => ({
        ...activity,
        key: activity.message,
        time: activity.timeLabel
      }));
      this.activityError = undefined;
    } else if (error) {
      this.activityError = error;
      this.recentActivity = [];
    }
  }

  @wire(getOnboardingSummary)
  wiredOnboarding({ data, error }) {
    if (data) {
      this.onboardingTasks = (data.tasks || []).map((task) => ({
        ...task,
        key: task.label
      }));
      this.onboardingProgress = data.progressPercent || 0;
      this.onboardingError = undefined;
    } else if (error) {
      this.onboardingError = error;
      this.onboardingTasks = [];
      this.onboardingProgress = 0;
    }
  }

  get isLoading() {
    return !this.stats && !this.statsError;
  }

  get hasLoadError() {
    return Boolean(this.statsError);
  }

  get kpis() {
    if (!this.stats) {
      return [];
    }

    return [
      {
        key: "open-positions",
        label: "Open Positions",
        value: String(this.stats.openPositions),
        iconName: "standard:job_position"
      },
      {
        key: "active-candidates",
        label: "Active Candidates",
        value: String(this.stats.activeCandidates),
        iconName: "standard:people"
      },
      {
        key: "interviews",
        label: "Interviews Scheduled",
        value: String(this.stats.upcomingInterviews),
        iconName: "standard:event"
      },
      {
        key: "onboarding",
        label: "Contacts in Pipeline",
        value: String(this.stats.contactsInPipeline),
        iconName: "standard:employee"
      }
    ];
  }

  get pageTitle() {
    const activeItem = this.navItems.find(
      (item) => item.viewId === this.activeView
    );
    return activeItem ? activeItem.label : "Dashboard";
  }

  get pageDescription() {
    const descriptions = {
      dashboard: "Manage hiring, interviews, and onboarding from one place.",
      jobOpenings: "Track open roles and the candidates attached to each role.",
      candidates:
        "Review active candidates and open candidate records quickly.",
      interviews: "See upcoming interviews across the recruitment team.",
      hiringPipeline:
        "Move through every candidate stage without horizontal scrolling.",
      onboarding: "Monitor onboarding progress and outstanding tasks.",
      reports: "Review recruiting metrics and jump into Salesforce reports.",
      settings: "Tune recruiting workspace preferences and admin links."
    };

    return descriptions[this.activeView] || descriptions.dashboard;
  }

  get isDashboardView() {
    return this.activeView === "dashboard";
  }

  get isJobOpeningsView() {
    return this.activeView === "jobOpenings";
  }

  get isCandidatesView() {
    return this.activeView === "candidates";
  }

  get isInterviewsView() {
    return this.activeView === "interviews";
  }

  get isHiringPipelineView() {
    return this.activeView === "hiringPipeline";
  }

  get isOnboardingView() {
    return this.activeView === "onboarding";
  }

  get isReportsView() {
    return this.activeView === "reports";
  }

  get isSettingsView() {
    return this.activeView === "settings";
  }

  get hasPipeline() {
    return this.pipelineStages.length > 0;
  }

  get dashboardPipelineStages() {
    return this.pipelineStages.slice(0, 3).map((stage) => {
      const candidates = stage.candidates.slice(0, 2);
      const hiddenCount = stage.candidates.length - candidates.length;

      return {
        ...stage,
        candidates,
        hasMoreCandidates: hiddenCount > 0,
        moreLabel: `+${hiddenCount} more`
      };
    });
  }

  get dashboardKanbanClass() {
    return "kanban-board kanban-board--compact";
  }

  get fullKanbanClass() {
    return "kanban-board kanban-board--full";
  }

  get hasInterviews() {
    return this.interviews.length > 0;
  }

  get hasAllInterviews() {
    return this.allInterviews.length > 0;
  }

  get hasCandidates() {
    return this.candidates.length > 0;
  }

  get filteredCandidates() {
    const term = this.candidateSearchTerm.trim().toLowerCase();

    if (!term) {
      return this.candidates;
    }

    return this.candidates.filter((candidate) => {
      const searchableText = [
        candidate.name,
        candidate.company,
        candidate.status,
        candidate.email
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(term);
    });
  }

  get hasFilteredCandidates() {
    return this.filteredCandidates.length > 0;
  }

  get hasJobOpenings() {
    return this.jobOpenings.length > 0;
  }

  get hasActivity() {
    return this.recentActivity.length > 0;
  }

  get progressFillStyle() {
    return `width: ${this.onboardingProgress}%`;
  }

  get progressLabel() {
    return `${this.onboardingProgress}%`;
  }

  handleNavClick(event) {
    const viewId = event.currentTarget.dataset.view;

    if (viewId) {
      this.setActiveView(viewId);
    }
  }

  setActiveView(viewId) {
    this.activeView = viewId;
    this.updateNavActiveState(viewId);
  }

  updateNavActiveState(viewId) {
    this.navItems = this.navItems.map((item) => ({
      ...item,
      className: item.viewId === viewId ? "active" : ""
    }));
  }

  handleNewCandidate() {
    this.navigateToNewRecord("Lead");
  }

  handleQuickAction(event) {
    const objectApiName = event.currentTarget.dataset.object;

    if (objectApiName) {
      this.navigateToNewRecord(objectApiName);
    }
  }

  handleViewAnalytics() {
    this.setActiveView("reports");
  }

  handleDownloadReport() {
    this.navigateToObjectHome("Report");
  }

  handleViewBoard() {
    this.setActiveView("hiringPipeline");
  }

  handleViewAllActivity() {
    this.setActiveView("candidates");
  }

  handleCandidateSearchChange(event) {
    this.candidateSearchTerm = event.target.value || "";
  }

  handleJobOpeningClick(event) {
    const title = event.currentTarget.dataset.title;

    if (title && title !== "General Recruiting") {
      this.candidateSearchTerm = title;
    }

    this.setActiveView("candidates");
  }

  handleOpenReportsHome() {
    this.navigateToObjectHome("Report");
  }

  handleOpenDashboardsHome() {
    this.navigateToObjectHome("Dashboard");
  }

  handleCandidateClick(event) {
    const recordId = event.currentTarget.dataset.id;

    if (recordId) {
      this.navigateToRecord("Lead", recordId);
    }
  }

  handleInterviewClick(event) {
    const recordId = event.currentTarget.dataset.id;

    if (recordId) {
      this.navigateToRecord("Event", recordId);
    }
  }

  navigateToObjectHome(objectApiName) {
    this[NavigationMixin.Navigate]({
      type: "standard__objectPage",
      attributes: {
        objectApiName,
        actionName: "home"
      }
    });
  }

  navigateToNewRecord(objectApiName) {
    this[NavigationMixin.Navigate]({
      type: "standard__objectPage",
      attributes: {
        objectApiName,
        actionName: "new"
      }
    });
  }

  navigateToRecord(objectApiName, recordId) {
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId,
        objectApiName,
        actionName: "view"
      }
    });
  }

  formatDate(value) {
    if (!value) {
      return "Recently";
    }

    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(new Date(value));
    } catch {
      return value;
    }
  }
}
