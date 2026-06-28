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

const A11Y_STORAGE_KEY = "patriot_a11y_v1";

const DEFAULT_A11Y_PREFERENCES = {
  fontScale: 100,
  lineHeight: "default",
  letterSpacing: "default",
  fontFamily: "default",
  boldText: false,
  highContrast: false,
  theme: "light",
  colorVision: "none",
  reduceTransparency: false,
  reduceMotion: false,
  disableCardLift: false,
  syncOsMotion: true,
  enhancedFocus: false,
  alwaysShowFocus: false,
  focusRingColor: "primary",
  skipLink: true,
  announceViewChanges: true,
  verboseAnnouncements: false,
  announceLoading: true,
  hideDecorativeIcons: false,
  tableSummaries: false,
  largeTouchTargets: false,
  alwaysShowHints: false,
  extendedClickAreas: false,
  underlineLinks: false,
  simplifiedLayout: false,
  tableDensity: "comfortable",
  pipelineListView: false,
  stickySidebarLabels: false,
  reduceClutter: false,
  syncOsPreferences: true
};

const NAV_VIEW_IDS = [
  "dashboard",
  "jobOpenings",
  "candidates",
  "interviews",
  "hiringPipeline",
  "onboarding",
  "reports",
  "settings"
];

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
  accessibilityPreferences = { ...DEFAULT_A11Y_PREFERENCES };
  liveRegionMessage = "";
  showShortcutsPanel = false;
  _keyboardHandler;
  _motionMediaQuery;
  _contrastMediaQuery;
  _colorSchemeMediaQuery;

  navItems = [
    {
      label: "Dashboard",
      iconName: "utility:apps",
      viewId: "dashboard",
      className: "active",
      ariaCurrent: "page"
    },
    {
      label: "Job Openings",
      iconName: "standard:job_position",
      viewId: "jobOpenings",
      className: "",
      ariaCurrent: null
    },
    {
      label: "Candidates",
      iconName: "standard:people",
      viewId: "candidates",
      className: "",
      ariaCurrent: null
    },
    {
      label: "Interviews",
      iconName: "standard:event",
      viewId: "interviews",
      className: "",
      ariaCurrent: null
    },
    {
      label: "Hiring Pipeline",
      iconName: "standard:hierarchy",
      viewId: "hiringPipeline",
      className: "",
      ariaCurrent: null
    },
    {
      label: "Onboarding",
      iconName: "standard:employee",
      viewId: "onboarding",
      className: "",
      ariaCurrent: null
    },
    {
      label: "Reports",
      iconName: "standard:report",
      viewId: "reports",
      className: "",
      ariaCurrent: null
    },
    {
      label: "Settings",
      iconName: "utility:settings",
      viewId: "settings",
      className: "",
      ariaCurrent: null
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
      if (this.accessibilityPreferences.announceLoading) {
        this.announceLiveMessage("Dashboard metrics loaded.");
      }
    } else if (error) {
      this.statsError = error;
      this.stats = undefined;
      if (this.accessibilityPreferences.announceLoading) {
        this.announceLiveMessage("Unable to load dashboard metrics.");
      }
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
    return this.isDashboardView && !this.stats && !this.statsError;
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

  connectedCallback() {
    this.loadAccessibilityPreferences();
    this.applyAccessibilityPreferences();
    this.setupOsPreferenceListeners();
    this._keyboardHandler = this.handleKeyboardShortcuts.bind(this);
    window.addEventListener("keydown", this._keyboardHandler);
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this._keyboardHandler);
    this.teardownOsPreferenceListeners();
  }

  renderedCallback() {
    if (!this._a11yApplied) {
      this.applyAccessibilityPreferences();
      this._a11yApplied = true;
    }
  }

  loadAccessibilityPreferences() {
    try {
      window.localStorage.removeItem(A11Y_STORAGE_KEY);
    } catch {
      /* localStorage may be unavailable */
    }

    this.accessibilityPreferences = { ...DEFAULT_A11Y_PREFERENCES };
  }

  saveAccessibilityPreferences() {
    try {
      window.localStorage.setItem(
        A11Y_STORAGE_KEY,
        JSON.stringify(this.accessibilityPreferences)
      );
    } catch {
      /* localStorage may be unavailable */
    }
  }

  applyOsPreferences() {
    if (!window.matchMedia) {
      return;
    }

    const prefs = { ...this.accessibilityPreferences };

    if (
      prefs.syncOsMotion &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      prefs.reduceMotion = true;
    }

    if (window.matchMedia("(prefers-contrast: more)").matches) {
      prefs.highContrast = true;
    }

    if (
      prefs.theme === "system" ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        prefs.theme = prefs.theme === "light" ? "system" : prefs.theme;
      }
    }

    this.accessibilityPreferences = prefs;
  }

  setupOsPreferenceListeners() {
    if (!window.matchMedia) {
      return;
    }

    this._motionMediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    this._contrastMediaQuery = window.matchMedia("(prefers-contrast: more)");
    this._colorSchemeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    this._handleOsPreferenceChange = () => {
      if (this.accessibilityPreferences.syncOsPreferences) {
        this.applyOsPreferences();
        this.applyAccessibilityPreferences();
        this.saveAccessibilityPreferences();
      }
    };

    this._motionMediaQuery.addEventListener(
      "change",
      this._handleOsPreferenceChange
    );
    this._contrastMediaQuery.addEventListener(
      "change",
      this._handleOsPreferenceChange
    );
    this._colorSchemeMediaQuery.addEventListener(
      "change",
      this._handleOsPreferenceChange
    );
  }

  teardownOsPreferenceListeners() {
    if (!this._handleOsPreferenceChange) {
      return;
    }

    this._motionMediaQuery?.removeEventListener(
      "change",
      this._handleOsPreferenceChange
    );
    this._contrastMediaQuery?.removeEventListener(
      "change",
      this._handleOsPreferenceChange
    );
    this._colorSchemeMediaQuery?.removeEventListener(
      "change",
      this._handleOsPreferenceChange
    );
  }

  applyAccessibilityPreferences() {
    const host = this.template?.host;
    if (!host) {
      return;
    }

    const prefs = this.accessibilityPreferences;
    const resolvedTheme = prefs.highContrast
      ? "high-contrast"
      : prefs.theme === "system"
        ? "system"
        : prefs.theme;

    host.setAttribute("data-theme", resolvedTheme);
    host.style.setProperty("--font-scale", String(prefs.fontScale / 100));
    host.setAttribute("data-font-scale", String(prefs.fontScale));
    host.setAttribute("data-reduce-motion", String(prefs.reduceMotion));
    host.setAttribute("data-disable-card-lift", String(prefs.disableCardLift));
    host.setAttribute("data-enhanced-focus", String(prefs.enhancedFocus));
    host.setAttribute("data-always-show-focus", String(prefs.alwaysShowFocus));
    host.setAttribute("data-focus-ring-color", prefs.focusRingColor);
    host.setAttribute("data-bold-text", String(prefs.boldText));
    host.setAttribute("data-high-contrast", String(prefs.highContrast));
    host.setAttribute("data-color-vision", prefs.colorVision);
    host.setAttribute(
      "data-reduce-transparency",
      String(prefs.reduceTransparency)
    );
    host.setAttribute(
      "data-large-touch-targets",
      String(prefs.largeTouchTargets)
    );
    host.setAttribute("data-always-show-hints", String(prefs.alwaysShowHints));
    host.setAttribute(
      "data-extended-click-areas",
      String(prefs.extendedClickAreas)
    );
    host.setAttribute("data-underline-links", String(prefs.underlineLinks));
    host.setAttribute("data-simplified-layout", String(prefs.simplifiedLayout));
    host.setAttribute("data-table-density", prefs.tableDensity);
    host.setAttribute(
      "data-pipeline-list-view",
      String(prefs.pipelineListView)
    );
    host.setAttribute(
      "data-sticky-sidebar-labels",
      String(prefs.stickySidebarLabels)
    );
    host.setAttribute("data-reduce-clutter", String(prefs.reduceClutter));
    host.setAttribute(
      "data-hide-decorative-icons",
      String(prefs.hideDecorativeIcons)
    );
    host.setAttribute("data-line-height", prefs.lineHeight);
    host.setAttribute("data-letter-spacing", prefs.letterSpacing);
    host.setAttribute("data-font-family", prefs.fontFamily);
  }

  handlePreferenceChange(event) {
    const prefKey = event.currentTarget.dataset.pref;
    if (!prefKey) {
      return;
    }

    let value;
    if (event.detail && event.detail.checked !== undefined) {
      value = event.detail.checked;
    } else if (event.detail && event.detail.value !== undefined) {
      value = event.detail.value;
    } else if (event.target.type === "checkbox") {
      value = event.target.checked;
    } else {
      value = event.target.value;
    }

    if (prefKey === "fontScale") {
      value = Number(value);
    }

    this.accessibilityPreferences = {
      ...this.accessibilityPreferences,
      [prefKey]: value
    };

    this.applyAccessibilityPreferences();
    this.saveAccessibilityPreferences();
    this.announceLiveMessage("Accessibility preference updated.");
  }

  handleFontScalePreset(event) {
    const scale = Number(event.currentTarget.dataset.scale);
    this.accessibilityPreferences = {
      ...this.accessibilityPreferences,
      fontScale: scale
    };
    this.applyAccessibilityPreferences();
    this.saveAccessibilityPreferences();
  }

  handleResetAccessibility() {
    this.accessibilityPreferences = { ...DEFAULT_A11Y_PREFERENCES };
    try {
      window.localStorage.removeItem(A11Y_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    this.applyAccessibilityPreferences();
    this.announceLiveMessage("Accessibility settings reset to defaults.");
  }

  handleOpenShortcutsPanel() {
    this.showShortcutsPanel = true;
  }

  handleCloseShortcutsPanel() {
    this.showShortcutsPanel = false;
  }

  handleSkipToMain(event) {
    event.preventDefault();
    const main = this.template.querySelector(".main-content");
    main?.focus();
  }

  handleKeyboardShortcuts(event) {
    const target = event.target;
    const tagName = target.tagName?.toLowerCase();
    const isEditable =
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select" ||
      target.isContentEditable;

    if (event.key === "Escape" && this.showShortcutsPanel) {
      this.showShortcutsPanel = false;
      return;
    }

    if (event.key === "?" && !isEditable && !event.shiftKey) {
      event.preventDefault();
      this.showShortcutsPanel = true;
      return;
    }

    if (isEditable) {
      return;
    }

    if (event.key === "/" && this.activeView === "candidates") {
      event.preventDefault();
      const search = this.template.querySelector(
        'lightning-input[data-id="candidate-search"]'
      );
      search?.focus();
      return;
    }

    const digit = Number(event.key);
    if (digit >= 1 && digit <= 8 && !event.ctrlKey && !event.metaKey) {
      const viewId = NAV_VIEW_IDS[digit - 1];
      if (viewId) {
        event.preventDefault();
        this.setActiveView(viewId);
      }
    }
  }

  announceLiveMessage(message) {
    this.liveRegionMessage = "";
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    requestAnimationFrame(() => {
      this.liveRegionMessage = message;
    });
  }

  announceViewChange(viewId) {
    if (!this.accessibilityPreferences.announceViewChanges) {
      return;
    }

    const activeItem = this.navItems.find((item) => item.viewId === viewId);
    const label = activeItem?.label || viewId;
    let message = `Now viewing: ${label}.`;

    if (this.accessibilityPreferences.verboseAnnouncements) {
      const counts = {
        candidates: this.candidates.length,
        interviews: this.allInterviews.length,
        jobOpenings: this.jobOpenings.length
      };
      const count = counts[viewId];
      if (count !== undefined) {
        message = `${label}, ${count} records loaded.`;
      }
    }

    this.announceLiveMessage(message);
  }

  get showSkipLink() {
    return this.accessibilityPreferences.skipLink;
  }

  get decorativeIconClass() {
    return this.accessibilityPreferences.hideDecorativeIcons
      ? "dashboard-icon decorative-icon"
      : "dashboard-icon";
  }

  get accessibilityPreviewBadge() {
    const prefs = this.accessibilityPreferences;
    const badges = [];

    if (prefs.highContrast) {
      badges.push("High Contrast");
    }
    if (prefs.theme === "dark" || prefs.theme === "system") {
      badges.push(prefs.theme === "dark" ? "Dark" : "System Theme");
    }
    if (prefs.fontScale !== 100) {
      badges.push(`${prefs.fontScale}% Text`);
    }
    if (prefs.reduceMotion) {
      badges.push("Reduced Motion");
    }
    if (prefs.largeTouchTargets) {
      badges.push("Large Targets");
    }
    if (prefs.pipelineListView) {
      badges.push("List View");
    }

    return badges.length ? badges.join(" · ") : "Default profile";
  }

  get usePipelineListView() {
    return this.accessibilityPreferences.pipelineListView;
  }

  get pipelineListStages() {
    return this.pipelineStages.map((stage) => ({
      ...stage,
      listCandidates: stage.candidates.map((candidate) => ({
        ...candidate,
        listLabel: `${candidate.name} — ${candidate.role} (${stage.label})`
      }))
    }));
  }

  get interviewsTableDescribedBy() {
    if (!this.accessibilityPreferences.tableSummaries) {
      return undefined;
    }

    return this.activeView === "interviews"
      ? "all-interviews-summary"
      : "dashboard-interviews-summary";
  }

  get lineHeightOptions() {
    return [
      { label: "Default", value: "default" },
      { label: "Relaxed", value: "relaxed" },
      { label: "Spacious", value: "spacious" }
    ];
  }

  get letterSpacingOptions() {
    return [
      { label: "Default", value: "default" },
      { label: "Wide", value: "wide" },
      { label: "Extra wide", value: "extra-wide" }
    ];
  }

  get fontFamilyOptions() {
    return [
      { label: "Default (IBM Plex Sans)", value: "default" },
      { label: "System UI", value: "system" },
      { label: "Dyslexia-friendly", value: "dyslexia" }
    ];
  }

  get themeOptions() {
    return [
      { label: "Light", value: "light" },
      { label: "Dark", value: "dark" },
      { label: "Match system", value: "system" }
    ];
  }

  get colorVisionOptions() {
    return [
      { label: "None", value: "none" },
      { label: "Protanopia", value: "protanopia" },
      { label: "Deuteranopia", value: "deuteranopia" },
      { label: "Tritanopia", value: "tritanopia" }
    ];
  }

  get focusRingColorOptions() {
    return [
      { label: "Primary", value: "primary" },
      { label: "Yellow", value: "yellow" },
      { label: "White", value: "white" }
    ];
  }

  get tableDensityOptions() {
    return [
      { label: "Comfortable", value: "comfortable" },
      { label: "Compact", value: "compact" }
    ];
  }

  get a11y() {
    return this.accessibilityPreferences;
  }

  handleInterviewKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleInterviewClick(event);
    }
  }

  handleNavClick(event) {
    const viewId = event.currentTarget.dataset.view;

    if (viewId) {
      this.setActiveView(viewId);
    }
  }

  setActiveView(viewId) {
    const viewChanged = this.activeView !== viewId;
    this.activeView = viewId;
    this.updateNavActiveState(viewId);
    this.announceViewChange(viewId);

    if (viewChanged) {
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      requestAnimationFrame(() => this.scrollMainContentToTop());
    }
  }

  scrollMainContentToTop() {
    const main = this.template.querySelector(".main-content");
    if (main) {
      main.scrollTop = 0;
    }
  }

  updateNavActiveState(viewId) {
    this.navItems = this.navItems.map((item) => ({
      ...item,
      className: item.viewId === viewId ? "active" : "",
      ariaCurrent: item.viewId === viewId ? "page" : null
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
    this.setActiveView("reports");
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
