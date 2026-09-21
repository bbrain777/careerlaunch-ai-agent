import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = "Saved" | "Preparing" | "Applied" | "Interview" | "Offer";
type Application = {
  id: number;
  company: string;
  role: string;
  location: string;
  status: Status;
  logo: string;
  tone: string;
  updated: string;
};

type Task = {
  id: number;
  title: string;
  meta: string;
  priority: "High" | "Medium" | "Low";
  done: boolean;
};
type SourceMessage = {
  id: number;
  provider: string;
  externalId: string;
  sender: string;
  subject: string;
  body: string;
  receivedAt: string;
  messageType: string;
  confidence: number;
  status: "Pending" | "Approved" | "Ignored";
};
type Integration = { provider: string; accountEmail?: string; status: string; lastSyncedAt?: string };

const navItems = [
  ["⌂", "Overview"],
  ["▣", "Applications"],
  ["◎", "Opportunities"],
  ["◌", "Contacts"],
  ["✓", "Tasks"],
];

type User = { id: number; name: string; email: string };
type ApiResponse = { token: string; user: User };

async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Something went wrong");
  return payload as T;
}

function App() {
  const [token, setToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get("auth_token");
    if (googleToken) {
      window.localStorage.setItem("careerlaunch-token", googleToken);
      window.history.replaceState({}, "", window.location.pathname);
      return googleToken;
    }
    return window.localStorage.getItem("careerlaunch-token");
  });
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(token));
  const [authError, setAuthError] = useState("");
  const [activeNav, setActiveNav] = useState("Overview");
  const [activeFilter, setActiveFilter] = useState<"All" | Status>("All");
  const [applications, setApplications] = useState<Application[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sourceMessages, setSourceMessages] = useState<SourceMessage[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [newMessage, setNewMessage] = useState({ sender: "", subject: "", body: "" });
  const [newTask, setNewTask] = useState("");
  const [newApplication, setNewApplication] = useState({ role: "", company: "", location: "", status: "Saved" as Status });

  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return;
    }
    apiRequest<{ user: User }>("/api/me", {}, token)
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => {
        window.localStorage.removeItem("careerlaunch-token");
        setToken(null);
      })
      .finally(() => setAuthLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    setDataLoading(true);
    Promise.all([
      apiRequest<Application[]>("/api/applications", {}, token),
      apiRequest<Task[]>("/api/tasks", {}, token),
      apiRequest<SourceMessage[]>("/api/source-messages", {}, token),
      apiRequest<Integration[]>("/api/integrations", {}, token),
    ])
      .then(([loadedApplications, loadedTasks, loadedMessages, loadedIntegrations]) => {
        setApplications(loadedApplications);
        setTasks(loadedTasks.map((task) => ({ ...task, done: Boolean(task.done) })));
        setSourceMessages(loadedMessages);
        setIntegrations(loadedIntegrations);
        setDataError("");
      })
      .catch((error: Error) => setDataError(error.message))
      .finally(() => setDataLoading(false));
  }, [token, user]);

  const filteredApplications = useMemo(
    () => activeFilter === "All" ? applications : applications.filter((item) => item.status === activeFilter),
    [activeFilter, applications],
  );

  if (authLoading) return <div className="auth-screen"><div className="auth-card"><div className="brand"><span className="brand-mark">✦</span><span>CareerLaunch</span><span className="brand-ai">AI</span></div><p className="loading-message">Loading your workspace...</p></div></div>;
  if (!token || !user) return <AuthScreen authError={authError} onGoogleSignIn={signInWithGoogle} onAuthenticated={(session) => { window.localStorage.setItem("careerlaunch-token", session.token); setToken(session.token); setUser(session.user); }} />;

  const toggleTask = (id: number) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || !token) return;
    const done = !task.done;
    setTasks((current) => current.map((item) => item.id === id ? { ...item, done } : item));
    apiRequest(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ done }) }, token).catch(() => setDataError("Could not update that task."));
  };

  const addTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!newTask.trim() || !token) return;
    try {
      const task = await apiRequest<Task>("/api/tasks", { method: "POST", body: JSON.stringify({ title: newTask.trim() }) }, token);
      setTasks((current) => [{ ...task, done: Boolean(task.done) }, ...current]);
    } catch (error) {
      setDataError((error as Error).message);
      return;
    }
    setNewTask("");
    setShowTaskForm(false);
  };

  const addApplication = async (event: FormEvent) => {
    event.preventDefault();
    if (!newApplication.role.trim() || !newApplication.company.trim() || !token) return;
    const toneByCompany = ["purple", "blue", "orange", "pink", "ink"];
    try {
      const application = await apiRequest<Application>("/api/applications", { method: "POST", body: JSON.stringify({ ...newApplication, tone: toneByCompany[applications.length % toneByCompany.length] }) }, token);
      setApplications((current) => [application, ...current]);
    } catch (error) {
      setDataError((error as Error).message);
      return;
    }
    setNewApplication({ role: "", company: "", location: "", status: "Saved" });
    setShowApplicationForm(false);
  };

  const updateApplicationStatus = (id: number, status: Status) => {
    setApplications((current) => current.map((application) => application.id === id ? { ...application, status, updated: "Updated just now" } : application));
    if (token) apiRequest(`/api/applications/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, token).catch(() => setDataError("Could not update that application."));
  };

  const importMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !newMessage.sender.trim() || !newMessage.subject.trim() || !newMessage.body.trim()) return;
    try {
      const message = await apiRequest<SourceMessage>("/api/source-messages/ingest", {
        method: "POST",
        body: JSON.stringify({ ...newMessage, externalId: `manual-${Date.now()}` }),
      }, token);
      setSourceMessages((current) => [message, ...current]);
      setNewMessage({ sender: "", subject: "", body: "" });
      setShowImportForm(false);
    } catch (error) {
      setDataError((error as Error).message);
    }
  };

  const reviewMessage = (id: number, status: SourceMessage["status"]) => {
    setSourceMessages((current) => current.map((message) => message.id === id ? { ...message, status } : message));
    if (token) apiRequest(`/api/source-messages/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, token).catch(() => setDataError("Could not update that review."));
  };

  const connectGmail = async () => {
    if (!token) return;
    try {
      const { url } = await apiRequest<{ url: string }>("/api/integrations/gmail/connect", {}, token);
      window.location.href = url;
    } catch (error) {
      setDataError((error as Error).message);
    }
  };

  async function signInWithGoogle() {
    try {
      const { url } = await apiRequest<{ url: string }>("/api/auth/google/start");
      window.location.href = url;
    } catch (error) {
      setAuthError((error as Error).message);
    }
  }

  const syncGmail = async () => {
    if (!token) return;
    try {
      const result = await apiRequest<{ imported: number; skipped: number }>("/api/integrations/gmail/sync", { method: "POST" }, token);
      const messages = await apiRequest<SourceMessage[]>("/api/source-messages", {}, token);
      setSourceMessages(messages);
      setDataError(`Gmail synced: ${result.imported} new, ${result.skipped} already imported.`);
    } catch (error) {
      setDataError((error as Error).message);
    }
  };

  const signOut = () => {
    window.localStorage.removeItem("careerlaunch-token");
    setToken(null);
    setUser(null);
    setApplications([]);
    setTasks([]);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><span>CareerLaunch</span><span className="brand-ai">AI</span></div>
        <div className="workspace-switcher"><div className="avatar avatar-green">{user.name.slice(0, 2).toUpperCase()}</div><div><strong>{user.name}&apos;s workspace</strong><small>Personal workspace</small></div><span className="chevron">⌄</span></div>
        <nav className="main-nav" aria-label="Main navigation">
          <span className="nav-label">Workspace</span>
          {navItems.map(([icon, label]) => <button className={`nav-item ${activeNav === label ? "active" : ""}`} key={label} onClick={() => setActiveNav(label)}><span className="nav-icon">{icon}</span>{label}{label === "Tasks" && <span className="nav-count">{tasks.filter((task) => !task.done).length}</span>}</button>)}
          <span className="nav-label nav-label-spaced">Manage</span>
          <button className="nav-item"><span className="nav-icon">▤</span>Documents</button>
          <button className="nav-item"><span className="nav-icon">◒</span>Reports</button>
          <button className="nav-item"><span className="nav-icon">⚙</span>Settings</button>
        </nav>
        <div className="sidebar-bottom"><div className="sync-card"><div className="sync-icon">↻</div><div><strong>{integrations.some((item) => item.provider === "gmail") ? "Gmail connected" : "Connect your sources"}</strong><small>{integrations.find((item) => item.provider === "gmail")?.accountEmail ?? "Import emails automatically"}</small></div>{integrations.some((item) => item.provider === "gmail") ? <button className="connect-button" onClick={syncGmail} aria-label="Sync Gmail">↻</button> : <button className="connect-button" onClick={connectGmail} aria-label="Connect Gmail">＋</button>}</div><div className="profile"><div className="avatar avatar-blue">{user.name.slice(0, 2).toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.email}</small></div><button className="sign-out" onClick={signOut}>↪</button></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{activeNav}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button notification" aria-label="Notifications">♧<i /></button><button className="import-link" onClick={() => setShowImportForm(true)}>Import email</button><div className="avatar avatar-blue">{user.name.slice(0, 2).toUpperCase()}</div></div></header>
        <div className="content-wrap">
          {dataLoading && <div className="sync-banner">Loading your saved applications and tasks...</div>}
          {dataError && <div className="error-banner" role="alert">{dataError}<button onClick={() => setDataError("")}>×</button></div>}
          <section className="welcome-row"><div><p className="eyebrow">Monday, September 21, 2026</p><h1>Good morning, {user.name.split(" ")[0]} <span>✦</span></h1><p className="subtitle">Here&apos;s what&apos;s happening with your career journey.</p></div><button className="primary-button" onClick={() => setShowTaskForm(true)}><span>＋</span> Add task</button></section>

          <section className="metrics-grid" aria-label="Career overview">
            <Metric icon="▣" label="Active applications" value={String(applications.length)} change="+3" context="vs. last month" tone="purple" />
            <Metric icon="◉" label="Interviews" value={String(applications.filter((item) => item.status === "Interview").length)} change="+1" context="this month" tone="blue" />
            <Metric icon="✦" label="Offers" value={String(applications.filter((item) => item.status === "Offer").length)} change="+1" context="this month" tone="orange" />
            <Metric icon="↗" label="Response rate" value="42%" change="+8%" context="vs. last month" tone="green" />
          </section>

          <section className="dashboard-grid">
            <div className="panel pipeline-panel">
              <div className="panel-heading"><div><h2>Application pipeline</h2><p>Keep an eye on every opportunity.</p></div><button className="text-button" onClick={() => setShowApplicationForm(true)}>Add application <span>＋</span></button></div>
              <div className="pipeline-tabs">{(["All", "Saved", "Preparing", "Applied", "Interview", "Offer"] as const).map((filter) => <button key={filter} className={activeFilter === filter ? "selected" : ""} onClick={() => setActiveFilter(filter)}>{filter}{filter === "All" && <span className="tab-count">{applications.length}</span>}</button>)}</div>
              <div className="application-list">{filteredApplications.slice(0, 4).map((application) => <ApplicationRow key={application.id} application={application} onStatusChange={updateApplicationStatus} />)}</div>
              {filteredApplications.length === 0 && <div className="empty-state">No applications in this stage yet.</div>}
            </div>

            <div className="panel priority-panel">
              <div className="panel-heading"><div><h2>Needs your attention</h2><p>Recommended next actions.</p></div><span className="sparkle">✦</span></div>
              <div className="priority-list"><PriorityCard icon="◷" title="Interview tomorrow" description="Linear · Product Designer" action="Prepare now" tone="purple" /><PriorityCard icon="✦" title="Draft ready for review" description="Vercel · Cover letter" action="Review draft" tone="orange" /><PriorityCard icon="↗" title="Follow-up due" description="Notion · 3 days since applying" action="Write message" tone="blue" /></div>
              <button className="outline-button">View all recommendations <span>→</span></button>
            </div>
          </section>

          <section className="lower-grid">
            <div className="panel tasks-panel"><div className="panel-heading"><div><h2>Your tasks</h2><p>Stay on top of what&apos;s next.</p></div><button className="text-button" onClick={() => setShowTaskForm(true)}>Add task <span>＋</span></button></div><div className="task-list">{tasks.slice(0, 4).map((task) => <TaskRow task={task} key={task.id} onToggle={() => toggleTask(task.id)} />)}</div></div>
            <div className="panel activity-panel"><div className="panel-heading"><div><h2>Source review queue</h2><p>Imported messages awaiting your review.</p></div><button className="text-button" onClick={() => setShowImportForm(true)}>Import email <span>＋</span></button></div><div className="activity-list">{sourceMessages.filter((message) => message.status === "Pending").slice(0, 3).map((message) => <SourceReview key={message.id} message={message} onReview={reviewMessage} />)}{sourceMessages.filter((message) => message.status === "Pending").length === 0 && <div className="empty-state">No messages need review.</div>}</div></div>
          </section>
          <footer><span>✦ CareerLaunch AI</span><span>Built to help you move forward.</span><span className="footer-links">Help&nbsp;&nbsp; Privacy&nbsp;&nbsp; Feedback</span></footer>
        </div>
      </main>
      {showTaskForm && <div className="modal-backdrop" onClick={() => setShowTaskForm(false)}><form className="task-modal" onSubmit={addTask} onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">New reminder</p><h2>Add a task</h2></div><button type="button" className="close-button" onClick={() => setShowTaskForm(false)}>×</button></div><label htmlFor="task-title">What needs to be done?</label><input id="task-title" autoFocus value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="e.g. Follow up with recruiter" /><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setShowTaskForm(false)}>Cancel</button><button className="primary-button" type="submit">Create task</button></div></form></div>}
      {showApplicationForm && <div className="modal-backdrop" onClick={() => setShowApplicationForm(false)}><form className="task-modal" onSubmit={addApplication} onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">New opportunity</p><h2>Add application</h2></div><button type="button" className="close-button" onClick={() => setShowApplicationForm(false)}>×</button></div><div className="form-grid"><label htmlFor="application-role">Role<input id="application-role" autoFocus value={newApplication.role} onChange={(event) => setNewApplication({ ...newApplication, role: event.target.value })} placeholder="e.g. Product Designer" /></label><label htmlFor="application-company">Company<input id="application-company" value={newApplication.company} onChange={(event) => setNewApplication({ ...newApplication, company: event.target.value })} placeholder="e.g. Acme" /></label><label htmlFor="application-location">Location<input id="application-location" value={newApplication.location} onChange={(event) => setNewApplication({ ...newApplication, location: event.target.value })} placeholder="e.g. Remote · Europe" /></label><label htmlFor="application-status">Stage<select id="application-status" value={newApplication.status} onChange={(event) => setNewApplication({ ...newApplication, status: event.target.value as Status })}>{(["Saved", "Preparing", "Applied", "Interview", "Offer"] as Status[]).map((status) => <option key={status}>{status}</option>)}</select></label></div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setShowApplicationForm(false)}>Cancel</button><button className="primary-button" type="submit">Add application</button></div></form></div>}
      {showImportForm && <div className="modal-backdrop" onClick={() => setShowImportForm(false)}><form className="task-modal import-modal" onSubmit={importMessage} onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">Source ingestion</p><h2>Import an email</h2></div><button type="button" className="close-button" onClick={() => setShowImportForm(false)}>×</button></div><p className="modal-help">Paste a job alert, recruiter message, or application update. CareerLaunch will classify it and place it in your review queue.</p><label htmlFor="message-sender">Sender<input id="message-sender" required value={newMessage.sender} onChange={(event) => setNewMessage({ ...newMessage, sender: event.target.value })} placeholder="recruiter@company.com" /></label><label htmlFor="message-subject">Subject<input id="message-subject" required value={newMessage.subject} onChange={(event) => setNewMessage({ ...newMessage, subject: event.target.value })} placeholder="Interview invitation: Product Designer" /></label><label htmlFor="message-body">Message body<textarea id="message-body" required value={newMessage.body} onChange={(event) => setNewMessage({ ...newMessage, body: event.target.value })} placeholder="Paste the email content here..." rows={5} /></label><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setShowImportForm(false)}>Cancel</button><button className="primary-button" type="submit">Classify message</button></div></form></div>}
    </div>
  );
}

function AuthScreen({ authError, onAuthenticated, onGoogleSignIn }: { authError: string; onAuthenticated: (session: ApiResponse) => void; onGoogleSignIn: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const session = await apiRequest<ApiResponse>(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(form) });
      onAuthenticated(session);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="auth-screen"><div className="auth-card"><div className="auth-brand"><div className="brand"><span className="brand-mark">✦</span><span>CareerLaunch</span><span className="brand-ai">AI</span></div><p>Turn a fragmented job search into one organized workspace.</p></div><button className="google-button" onClick={onGoogleSignIn}><span className="google-g">G</span> Continue with Google</button>{authError && <div className="auth-error" role="alert">{authError}</div>}<div className="auth-divider"><span>or use email</span></div><div className="auth-toggle"><button className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>Sign in</button><button className={mode === "register" ? "selected" : ""} onClick={() => setMode("register")}>Create account</button></div><form onSubmit={submit} className="auth-form">{mode === "register" && <label htmlFor="auth-name">Your name<input id="auth-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Olakunle Obademi" /></label>}<label htmlFor="auth-email">Email address<input id="auth-email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label><label htmlFor="auth-password">Password<input id="auth-password" required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label>{error && <div className="auth-error" role="alert">{error}</div>}<button className="primary-button auth-submit" disabled={submitting}>{submitting ? "Connecting..." : mode === "login" ? "Sign in to workspace" : "Create my workspace"}</button></form><small className="auth-note">Google sign-in uses your existing Google session. CareerLaunch never receives your Google password.</small></div></div>;
}

function Metric({ icon, label, value, change, context, tone }: { icon: string; label: string; value: string; change: string; context: string; tone: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-copy"><span>{label}</span><div><strong>{value}</strong><em className={tone}>{change}</em></div><small>{context}</small></div><span className="metric-arrow">↗</span></div>;
}

function ApplicationRow({ application, onStatusChange }: { application: Application; onStatusChange: (id: number, status: Status) => void }) {
  return <div className="application-row"><div className={`company-logo ${application.tone}`}>{application.logo}</div><div className="application-copy"><strong>{application.role}</strong><span>{application.company} <b>·</b> {application.location}</span></div><select className={`status-pill status-select ${application.status.toLowerCase()}`} value={application.status} aria-label={`Update ${application.company} status`} onChange={(event) => onStatusChange(application.id, event.target.value as Status)}>{(["Saved", "Preparing", "Applied", "Interview", "Offer"] as Status[]).map((status) => <option key={status}>{status}</option>)}</select><span className="row-more">•••</span></div>;
}

function PriorityCard({ icon, title, description, action, tone }: { icon: string; title: string; description: string; action: string; tone: string }) {
  return <div className={`priority-card ${tone}`}><div className="priority-icon">{icon}</div><div className="priority-copy"><strong>{title}</strong><span>{description}</span><button>{action} <b>→</b></button></div></div>;
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return <div className={`task-row ${task.done ? "completed" : ""}`}><button className="checkbox" onClick={onToggle} aria-label={`Mark ${task.title} complete`}>{task.done && "✓"}</button><div className="task-copy"><strong>{task.title}</strong><span>{task.meta}</span></div><span className={`priority-dot ${task.priority.toLowerCase()}`} title={`${task.priority} priority`} /></div>;
}

function Activity({ icon, text, time, tone }: { icon: string; text: React.ReactNode; time: string; tone: string }) {
  return <div className="activity-row"><div className={`activity-icon ${tone}`}>{icon}</div><div className="activity-copy">{text}</div><time>{time}</time></div>;
}

function SourceReview({ message, onReview }: { message: SourceMessage; onReview: (id: number, status: SourceMessage["status"]) => void }) {
  return <div className="source-review"><div className="activity-icon purple">✉</div><div className="source-review-copy"><strong>{message.subject}</strong><span>{message.messageType} · {Math.round(message.confidence * 100)}% confidence</span><small>{message.sender}</small><div><button onClick={() => onReview(message.id, "Approved")}>Approve</button><button onClick={() => onReview(message.id, "Ignored")}>Ignore</button></div></div></div>;
}

export default App;
