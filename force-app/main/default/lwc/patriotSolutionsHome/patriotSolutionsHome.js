import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class PatriotSolutionsHome extends NavigationMixin(
    LightningElement
) {
    navItems = [
        {
            label: 'Dashboard',
            iconName: 'utility:apps',
            href: '#',
            className: 'active'
        },
        {
            label: 'Job Openings',
            iconName: 'standard:job_position',
            href: '#',
            className: ''
        },
        {
            label: 'Candidates',
            iconName: 'standard:people',
            href: '#',
            className: ''
        },
        {
            label: 'Interviews',
            iconName: 'standard:event',
            href: '#',
            className: ''
        },
        {
            label: 'Hiring Pipeline',
            iconName: 'utility:hierarchy',
            href: '#',
            className: ''
        },
        {
            label: 'Onboarding',
            iconName: 'standard:employee',
            href: '#',
            className: ''
        },
        {
            label: 'Reports',
            iconName: 'standard:dashboard',
            href: '#',
            className: ''
        },
        {
            label: 'Settings',
            iconName: 'utility:settings',
            href: '#',
            className: ''
        }
    ];

    kpis = [
        {
            label: 'Open Positions',
            value: '12',
            iconName: 'standard:job_position'
        },
        {
            label: 'Active Candidates',
            value: '148',
            trend: '+15%',
            iconName: 'standard:people'
        },
        {
            label: 'Interviews Scheduled',
            value: '24',
            iconName: 'standard:event'
        },
        {
            label: 'Employees Onboarding',
            value: '8',
            iconName: 'standard:employee'
        }
    ];

    pipelineStages = [
        {
            name: 'Applied',
            label: 'Applied (24)',
            candidates: [
                {
                    name: 'Alex Rivers',
                    role: 'Senior Product Designer',
                    status: 'New',
                    badgeClass: 'badge gray',
                    cardClass: 'candidate-card border-outline'
                },
                {
                    name: 'Sam Taylor',
                    role: 'Frontend Developer',
                    cardClass: 'candidate-card border-outline'
                }
            ]
        },
        {
            name: 'Screening',
            label: 'Screening (18)',
            candidates: [
                {
                    name: 'Morgan Lee',
                    role: 'Data Analyst',
                    status: 'Review',
                    badgeClass: 'badge blue',
                    cardClass: 'candidate-card border-primary'
                }
            ]
        },
        {
            name: 'Interview',
            label: 'Interview (32)',
            candidates: [
                {
                    name: 'Jordan Smith',
                    role: 'Hiring Manager Interview',
                    cardClass: 'candidate-card border-yellow'
                }
            ]
        },
        {
            name: 'Offer',
            label: 'Offer (5)',
            candidates: [
                {
                    name: 'Casey Chen',
                    role: 'Sent 2 days ago',
                    cardClass: 'candidate-card border-green'
                }
            ]
        },
        {
            name: 'Hired',
            label: 'Hired (69)',
            candidates: [
                {
                    name: 'Riley Jones',
                    role: 'Fullstack Engineer',
                    cardClass: 'candidate-card border-deep-green'
                }
            ]
        }
    ];

    interviews = [
        {
            id: '1',
            candidate: 'Sarah Jenkins',
            position: 'HR Manager',
            date: 'Oct 24, 10:30 AM',
            interviewer: 'David Wright',
            status: 'Scheduled',
            statusClass: 'status-badge scheduled'
        },
        {
            id: '2',
            candidate: 'Robert Miller',
            position: 'Cloud Architect',
            date: 'Oct 24, 2:00 PM',
            interviewer: 'James Wilson',
            status: 'Pending',
            statusClass: 'status-badge pending'
        },
        {
            id: '3',
            candidate: 'Elena Rossi',
            position: 'Marketing Lead',
            date: 'Oct 23, 11:00 AM',
            interviewer: 'Sarah Jenkins',
            status: 'Completed',
            statusClass: 'status-badge completed'
        }
    ];

    quickActions = [
        {
            label: 'New Job Opening',
            iconName: 'standard:job_position',
            objectApiName: 'Position__c'
        },
        {
            label: 'Add Candidate',
            iconName: 'standard:employee',
            objectApiName: 'Contact'
        },
        {
            label: 'Schedule Interview',
            iconName: 'standard:event',
            objectApiName: 'Event'
        }
    ];

    onboardingTasks = [
        {
            label: 'Send Offer Letter',
            iconName: 'utility:success',
            className: 'done'
        },
        {
            label: 'Background Check',
            iconName: 'utility:record',
            className: 'todo'
        },
        {
            label: 'Assign Equipment',
            iconName: 'utility:record',
            className: 'todo'
        },
        {
            label: 'Welcome Email',
            iconName: 'utility:success',
            className: 'done'
        }
    ];

    recentActivity = [
        {
            message: 'New candidate applied for Senior Dev',
            time: '15 minutes ago',
            className: 'activity-item',
            dotClass: 'activity-dot blue'
        },
        {
            message: 'Offer accepted by Jamie Doe',
            time: '2 hours ago',
            className: 'activity-item indented',
            dotClass: 'activity-dot green'
        },
        {
            message: 'Interview rescheduled: Alex Rivers',
            time: 'Yesterday',
            className: 'activity-item indented',
            dotClass: 'activity-dot orange'
        }
    ];

    handleNewJobOpening() {
        this.navigateToNewRecord('Position__c');
    }

    handleQuickAction(event) {
        const { objectApiName } = event.currentTarget.dataset;

        if (objectApiName) {
            this.navigateToNewRecord(objectApiName);
        }
    }

    navigateToNewRecord(objectApiName) {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName,
                actionName: 'new'
            }
        });
    }
}
