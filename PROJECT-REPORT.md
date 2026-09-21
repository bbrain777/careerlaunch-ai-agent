# CareerLaunch AI Agent

## Project status

**Status:** Independent project initialization  
**Owner:** Olakunle Obademi  
**Project type:** Personal extension of the CareerLaunch concept  
**Created:** 2026-09-21

## Executive summary

CareerLaunch AI Agent combines the original CareerLaunch job-application,
career-readiness, contact-management, and dashboard proposal with an AI-powered
personal job-search agent.

The agent will connect approved information sources such as email, LinkedIn,
Indeed, other supported job services, calendars, and permitted messaging
channels. It will automatically collect relevant jobs, recruiter messages,
application confirmations, interview invitations, deadlines, rejections, and
offers. It will then normalize, deduplicate, prioritize, and place the
information into one CareerLaunch workspace.

The user will also be able to add jobs, contacts, reminders, expenses, notes,
and other tasks manually. Manual records and automatically imported records
will use the same pipeline and activity history.

The long-term goal is for the dashboard to tell the user what matters and what
needs attention without requiring separate daily checks of email, LinkedIn,
Indeed, and other job-search services.

## Problem statement

Job seekers often manage opportunities and communication across disconnected
systems. A single opportunity may generate a job-board listing, an email alert,
a recruiter message, an assessment, an interview invitation, calendar events,
and follow-up tasks. Important deadlines and responses can be missed because
the user has to check each source separately and manually maintain a tracker.

CareerLaunch AI Agent addresses this fragmentation by providing one
user-controlled workspace that:

- Collects information from connected sources.
- Accepts manually entered information and tasks.
- Understands and links related messages, jobs, contacts, and applications.
- Prioritizes the most important opportunities and actions.
- Prepares tailored documents and responses.
- Tracks progress from discovery through offer.
- Reports only the notifications and decisions that require the user's
  attention.

## Product vision

CareerLaunch AI Agent will be a personal job-search operations assistant. It
will collect relevant job and recruiter information from connected sources,
organize it in one workspace, prioritize opportunities, prepare application
materials, apply through approved workflows, track progress, and keep the user
informed from discovery through offer.

The agent should reduce the need to check email, job boards, messages, and
calendars separately while keeping the user in control of identity, privacy,
application quality, and important external actions.

## Unified workflow

```text
Automatic sources + manual entry
  -> Collect
  -> Normalize and deduplicate
  -> Link jobs, messages, contacts, and applications
  -> Sort and prioritize
  -> Prepare CV, cover letter, answers, and interview material
  -> Apply using the configured automation/approval mode
  -> Track confirmations and responses
  -> Prepare for interviews
  -> Track offers and decisions
```

## Original CareerLaunch requirements retained

The independent project preserves the major requirements from the original
CareerLaunch proposal:

### Secure access

- Registration, login, logout, profile management, and authorization.
- Secure password handling and protected user-owned data.
- Integration connections controlled by the user.

### Application tracker

- Create, view, update, and delete job applications.
- Move records through `Saved`, `Preparing`, `Applied`, `Interview`, `Offer`,
  `Closed`, and additional outcome states such as `Rejected` or `Withdrawn`.
- Store deadlines, source links, notes, status history, and next actions.

### Employers, recruiters, and professional contacts

- Maintain employer and recruiter records.
- Store professional contacts and networking relationships.
- Link contacts to employers, opportunities, applications, and interviews.
- Record referrals, networking notes, last-contacted dates, and follow-ups.

### Search and follow-up

- Search, filter, sort, and prioritize opportunities and applications.
- Track application deadlines, recruiter follow-ups, informational interviews,
  thank-you messages, career-development tasks, and interview preparation.
- Combine automatically created tasks with manually created tasks.

### Dashboard

- Show active applications, interviews, offers, response rates, deadlines,
  upcoming tasks, source activity, and status summaries.
- Explain what needs attention now rather than requiring the user to inspect
  every connected service.

### Career readiness

- Organize resumes and cover letters.
- Store company research, interview notes, practice questions, preparation
  resources, informational interviews, advice, referrals, and recommended
  actions.
- Generate tailored drafts while keeping the original documents unchanged.

### Expenses and reporting

- Record job-search expenses such as travel, printing, training, and
  professional services.
- Summarize activity, applications, response rates, source performance, and
  job-search expenses.

## New AI-agent capabilities

The new proposal adds the following capabilities:

1. Automatic source synchronization.
2. Job discovery across connected and supported sources.
3. Message and notification classification.
4. Opportunity extraction and duplicate detection.
5. Explainable priority scoring.
6. AI-tailored CVs, cover letters, application answers, and recruiter
   messages.
7. Automatic application preparation and configurable application submission.
8. Progress tracking and exception-based notifications.
9. A single activity timeline combining imported and manual work.
10. A natural-language assistant for questions such as “What should I do
    today?” and “Which applications need a follow-up?”

## Information sources and integrations

The system will use provider-specific connectors behind a common integration
interface. Each connector must support connection, synchronization, status,
error reporting, disconnect, and token revocation.

### Email

The first integration target is Gmail or Outlook through OAuth. The agent may
identify:

- Job alerts and saved-search notifications.
- Recruiter messages.
- Application confirmations.
- Assessments and requests for more information.
- Interview invitations and scheduling changes.
- Rejections, offers, and onboarding messages.
- Follow-up requests and deadlines.

The system should store the source message identifier, provider, timestamp,
subject, source link where available, extracted fields, and processing status.
It should not permanently store unrelated mailbox contents.

### LinkedIn, Indeed, and job portals

The system should support official APIs, approved partner integrations,
provider email alerts, exports, share actions, or browser-assisted capture
where direct APIs are unavailable. The user should never provide job-board
passwords to CareerLaunch.

The connector should collect, where permitted:

- Job title, company, location, salary, and work arrangement.
- Description and required skills.
- Job URL and source provider.
- Posting date and closing date.
- Saved-job and application status.
- Recruiter or employer information.

Direct scraping or browser automation must be evaluated against each provider's
terms, rate limits, authentication requirements, and technical restrictions.
The system must clearly report when a source cannot be synchronized.

### Calendar

Google Calendar or Outlook Calendar can synchronize interview dates, recruiter
calls, assessments, deadlines, preparation sessions, and follow-up reminders.

### Phone text messages and other channels

SMS and messaging support will be opt-in and provider-dependent. Possible
approaches include a supported SMS provider, a dedicated forwarding number,
mobile notification integration, or manual forwarding. CareerLaunch must not
assume that it can read all personal phone messages, particularly on platforms
that restrict SMS access.

### Manual capture

The user can manually add:

- Jobs and applications.
- Employers and contacts.
- Tasks and reminders.
- Interview notes and questions.
- Expenses.
- Source URLs and copied messages.
- Documents and application outcomes.

Manual records will be placed into the same pipeline, priority system, task
list, and activity timeline as automatically imported records.

## Automatic job search and application modes

The agent should support configurable automation modes:

### Assisted mode

- The agent searches approved sources.
- It recommends and ranks jobs.
- It prepares application material.
- The user reviews and submits each application.

### Approval mode

- The agent searches and prepares applications automatically.
- The user receives an approval queue.
- The application is submitted only after explicit approval.

### Rules-based auto-apply mode

- The user defines strict rules for role, location, salary, work
  authorization, experience, employers, and required questions.
- The agent may submit only applications that satisfy those rules.
- The agent records the exact job, documents, answers, timestamp, and result.
- Any ambiguous question, missing information, sensitive demographic question,
  salary commitment, legal declaration, or unusual request pauses the workflow
  for the user.

Automatic application submission must use an approved provider integration or a
permitted assisted workflow. It must not bypass platform security controls,
CAPTCHAs, terms of service, or user verification. The default mode should be
Approval mode, with Rules-based auto-apply enabled only deliberately by the
user.

## Notifications and progress updates

The dashboard should use exception-based updates so the user does not receive
unnecessary notifications. Examples include:

- “Three new high-priority jobs were found.”
- “Your application was moved to Interview based on an email invitation.”
- “An application needs your answer before tomorrow.”
- “A recruiter has not received a follow-up.”
- “The agent paused an application because a question needs your input.”
- “No action is currently required for five applications.”

The user should be able to choose dashboard-only, email, push, SMS, or
calendar notifications and configure quiet hours, priority thresholds, and
digest frequency.

## Initial product boundary

The first release will focus on:

1. Connecting one email provider through OAuth.
2. Manual job, application, contact, and task entry.
3. Detecting job alerts, recruiter messages, interview invitations, and
   application updates.
4. Extracting structured opportunity and communication data.
5. Deduplicating and prioritizing opportunities.
6. Showing a unified application pipeline.
7. Creating reminders and recommended next actions.
8. Drafting tailored CV content, cover letters, recruiter messages, and
   interview preparation.
9. Providing an approval queue before external sends or applications.

Direct SMS synchronization, broad job-board synchronization, and unrestricted
auto-apply will be delivered only after their provider, privacy, and reliability
requirements are validated.

## Current baseline

This project starts independently from the group CareerLaunch repository. The
group project currently provides useful domain ideas and an application
pipeline, but this project will have its own codebase, database, credentials,
architecture, and deployment lifecycle.

The new project must not modify or depend on the group repository at runtime.
Ideas and lessons may be reused, but implementation and history remain separate.

## Proposed architecture

### Client

- React and TypeScript dashboard.
- Pipeline view for opportunities and applications.
- Unified inbox and source activity timeline.
- Job discovery and priority queue.
- Manual task and record creation.
- Approval queue for AI-generated actions.
- Integration and privacy settings.
- Resume and document workspace.
- Interview and offer workspace.
- Notifications and digest settings.

### API

- Node.js and TypeScript service.
- Authentication and user profile management.
- Opportunity, employer, contact, application, message, task, expense,
  interview, offer, and document APIs.
- OAuth callback and integration management.
- AI orchestration endpoints.
- Application workflow and approval endpoints.
- Notification and source synchronization endpoints.

### Persistence

- PostgreSQL database.
- Encrypted integration credentials or refresh tokens.
- User-owned records with strict authorization.
- Event history for imported and agent-generated actions.

### Background processing

- Durable queue for email, job-source, calendar, and permitted message
  synchronization.
- AI extraction, classification, deduplication, scoring, and draft generation
  workers.
- Scheduled jobs for follow-ups, application status checks, and periodic source
  synchronization.
- Retry and idempotency handling so imports do not create duplicates.
- Dead-letter and visible failure handling for jobs that cannot be processed.

### AI layer

The AI layer will return validated structured outputs rather than writing
unbounded text directly into the database. Every generated draft or proposed
action will retain its source, status, and approval state.

## Domain model

The schema is expected to include:

- `User`
- `UserProfile`
- `IntegrationConnection`
- `SourceMessage`
- `SourceEvent`
- `JobOpportunity`
- `Application`
- `ApplicationEvent`
- `Employer`
- `Contact`
- `Interview`
- `Offer`
- `Resume`
- `CoverLetter`
- `GeneratedDraft`
- `AgentTask`
- `Notification`
- `Expense`
- `AuditEvent`
- `ApprovalRequest`

All user-owned entities must be scoped to the authenticated user. Imported
records should preserve the source provider and source URL or message
identifier where available.

## Safety and privacy requirements

- Use OAuth; never ask users for email or job-board passwords.
- Request the minimum integration scopes needed.
- Allow users to disconnect and revoke integrations.
- Encrypt tokens and sensitive document data at rest.
- Record an audit trail for imports, generated drafts, approvals, and sends.
- Make AI-generated content visibly identifiable as a draft.
- Require explicit approval before external messages or applications are sent.
- Provide deletion and export controls for user data.
- Report integration failures instead of silently treating sync as successful.
- Keep provider-specific credentials and tokens separate from ordinary
  application data.
- Support data export, deletion, and integration disconnect.
- Pause automation when required information is uncertain or an external
  provider requests additional verification.

## Functional requirements

### FR1: Account and profile

Users can register, authenticate, manage their profile, define job preferences,
set notification rules, and disconnect integrations.

### FR2: Source connections

Users can connect, synchronize, inspect, pause, and revoke supported email,
calendar, job-source, and messaging integrations.

### FR3: Unified collection

The system automatically imports relevant source events and allows users to
manually add jobs, applications, contacts, notes, expenses, and tasks.

### FR4: Normalization and linking

The system extracts common fields, detects duplicates, and links related jobs,
messages, employers, contacts, interviews, and applications.

### FR5: Prioritization

The system ranks opportunities and tasks using user preferences, deadlines,
fit, source confidence, response likelihood, and relationship context. Scores
must include an explanation.

### FR6: Pipeline management

Users can move opportunities through collection, saved, preparing, applied,
interview, offer, closed, rejected, and withdrawn states.

### FR7: Preparation

The system can generate tailored CVs, cover letters, application answers,
recruiter messages, company research, questions, and interview preparation.
Generated content must remain reviewable and versioned.

### FR8: Application execution

The system can create an approval request and, when the configured rules and
provider permissions allow it, submit an application. It must pause for
ambiguous or sensitive inputs.

### FR9: Task management

Users can create manual tasks. The agent can create imported or recommended
tasks. Both types appear together with source, priority, due date, and status.

### FR10: Progress and notifications

The system tracks application events and notifies the user about exceptions,
required decisions, deadlines, interviews, offers, and failures.

### FR11: Reporting

The dashboard provides application totals, interviews, offers, response rate,
source performance, upcoming work, expenses, and activity summaries.

## Non-functional requirements

- All protected records require authenticated ownership checks.
- OAuth secrets and refresh tokens are encrypted.
- External actions are auditable and idempotent.
- Background jobs are retryable and have visible failure states.
- The interface is responsive and accessible.
- AI outputs are schema-validated and traceable to their sources.
- The system limits data collection to authorized and necessary information.
- Automated applications cannot silently answer uncertain or sensitive
  questions.
- Tests cover authorization, integration sync, extraction, deduplication,
  scoring, retry behavior, approval enforcement, and submission records.

## Development milestones

### Milestone 0: Combined foundation

- Create the standalone repository and preserve this report as the product
  baseline.
- Choose the initial stack and local development workflow.
- Add configuration and secret-management conventions.
- Define the combined CareerLaunch and AI-agent database schema.
- Add authentication and user-owned data boundaries.
- Add the responsive dashboard shell, application pipeline, search, filters,
  contacts, tasks, and basic reporting.

### Milestone 1: Unified collection

- Connect Gmail or Outlook through OAuth.
- Import only authorized messages.
- Extract opportunities and application events.
- Deduplicate records.
- Add jobs to the pipeline.
- Create tasks for interviews and follow-ups.
- Support manual tasks and records alongside imported information.

### Milestone 2: Prioritization and preparation

- Add user preferences and job-search profile.
- Implement explainable opportunity scoring.
- Add resume/document storage.
- Generate tailored application drafts.
- Add review and approval screens.
- Add employer, recruiter, contact, informational-interview, and networking
  workflows.

### Milestone 3: Tracking, notifications, and career readiness

- Add calendar integration.
- Add interview preparation workflows.
- Add notification preferences.
- Add weekly job-search summaries.
- Track application outcomes and response timelines.
- Add expenses and dashboard analytics.

### Milestone 4: Job discovery and controlled application

- Add supported LinkedIn, Indeed, and other source integrations where permitted.
- Add browser-assisted capture for jobs the user is viewing.
- Implement provider-compliant assisted application submission.
- Add rules-based auto-apply with mandatory pause conditions and complete audit
  history.
- Evaluate SMS support through an explicit opt-in provider or mobile workflow.

### Milestone 5: Hardening and release

- Complete security, privacy, accessibility, and responsive reviews.
- Add integration failure recovery and data export/deletion controls.
- Test workflow retries, duplicate imports, approval enforcement, and external
  action records.
- Deploy the client, API, database, worker, storage, and monitoring services.
- Prepare a demonstration and professional interview presentation.

## Definition of done for the first release

- A user can connect an email account using OAuth.
- Relevant messages can be imported and traced to their source.
- A user can manually add tasks, opportunities, applications, contacts, and
  notes.
- Jobs and application events are extracted into validated records.
- Duplicate opportunities are merged or safely ignored.
- Priorities and recommended actions are explainable.
- The user can review generated drafts before use.
- No external message or application is sent without approval.
- Integration tokens can be revoked.
- Applications and tasks can be tracked through the unified pipeline.
- Employer, contact, interview, resume, and follow-up information can be
  associated with an opportunity.
- Tests cover authorization, extraction, deduplication, workflow retries,
  approval enforcement, manual tasks, and notification rules.

## Immediate next steps

1. Initialize the new project repository.
2. Convert the combined requirements into database entities and API contracts.
3. Decide whether the first implementation uses a monorepo or a single API and
   web workspace.
4. Create the initial application, contact, task, integration, and database
   schemas.
5. Implement authentication, user profiles, preferences, and authorization.
6. Build the email integration boundary using a provider-neutral interface.
7. Add a test fixture for job-alert, recruiter, interview, rejection, and offer
   messages.
8. Implement extraction into a review queue before enabling pipeline writes.
9. Build the manual task workflow and merge it with automatically created tasks.
10. Define the approval and auto-apply rules before implementing external
    application submission.

## Professional interview and demonstration narrative

The project can be presented as an evolution of CareerLaunch:

1. The original system solves fragmented manual job-application tracking.
2. The independent version connects the sources where job-search information
   actually arrives.
3. An ingestion layer turns unstructured messages and listings into structured
   records.
4. An AI layer prioritizes opportunities and prepares personalized material.
5. A workflow engine tracks tasks, deadlines, interviews, and offers.
6. A controlled automation layer can apply on the user's behalf when the user
   has configured rules and the provider permits it.
7. A dashboard provides one reliable view of progress and only asks the user
   to intervene when necessary.

The key product promise is:

> CareerLaunch AI Agent turns a fragmented job search into one organized,
> explainable, and user-controlled workflow from discovery to offer.
