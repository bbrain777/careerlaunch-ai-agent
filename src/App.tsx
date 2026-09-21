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

const seedApplications: Application[] = [
  { id: 1, company: "Linear", role: "Product Designer", location: "Remote · Worldwide", status: "Interview", logo: "L", tone: "purple", updated: "Updated today" },
  { id: 2, company: "Notion", role: "Senior UX Designer", location: "San Francisco · Hybrid", status: "Applied", logo: "N", tone: "ink", updated: "Applied 2 days ago" },
  { id: 3, company: "Vercel", role: "Product Designer", location: "Remote · US", status: "Preparing", logo: "▲", tone: "dark", updated: "Draft ready" },
  { id: 4, company: "Figma", role: "Design Systems Lead", location: "New York · Hybrid", status: "Saved", logo: "F", tone: "orange", updated: "Saved yesterday" },
  { id: 5, company: "Stripe", role: "Senior Product Designer", location: "Dublin · Hybrid", status: "Offer", logo: "S", tone: "blue", updated: "Offer received" },
  { id: 6, company: "Airbnb", role: "Experience Designer", location: "Remote · Europe", status: "Saved", logo: "A", tone: "pink", updated: "Saved 3 days ago" },
];

const initialTasks: Task[] = [
  { id: 1, title: "Prepare for Linear interview", meta: "Today · 2:00 PM", priority: "High", done: false },
  { id: 2, title: "Send thank-you note to Maya", meta: "Today · Follow-up", priority: "Medium", done: false },
  { id: 3, title: "Review Vercel application draft", meta: "Tomorrow · AI draft ready", priority: "High", done: false },
  { id: 4, title: "Research Figma design team", meta: "Friday · Career readiness", priority: "Low", done: false },
];

const navItems = [
  ["⌂", "Overview"],
  ["▣", "Applications"],
  ["◎", "Opportunities"],
  ["◌", "Contacts"],
  ["✓", "Tasks"],
];

function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = window.localStorage.getItem(key);
    if (!stored) return initialValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function App() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [activeFilter, setActiveFilter] = useState<"All" | Status>("All");
  const [applications, setApplications] = useStoredState("careerlaunch-applications", seedApplications);
  const [tasks, setTasks] = useStoredState("careerlaunch-tasks", initialTasks);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newApplication, setNewApplication] = useState({ role: "", company: "", location: "", status: "Saved" as Status });

  const filteredApplications = useMemo(
    () => activeFilter === "All" ? applications : applications.filter((item) => item.status === activeFilter),
    [activeFilter],
  );

  const toggleTask = (id: number) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  };

  const addTask = (event: FormEvent) => {
    event.preventDefault();
    if (!newTask.trim()) return;
    setTasks((current) => [{ id: Date.now(), title: newTask.trim(), meta: "Today · Added manually", priority: "Medium", done: false }, ...current]);
    setNewTask("");
    setShowTaskForm(false);
  };

  const addApplication = (event: FormEvent) => {
    event.preventDefault();
    if (!newApplication.role.trim() || !newApplication.company.trim()) return;
    const toneByCompany = ["purple", "blue", "orange", "pink", "ink"];
    const application: Application = {
      id: Date.now(),
      ...newApplication,
      role: newApplication.role.trim(),
      company: newApplication.company.trim(),
      location: newApplication.location.trim() || "Location not added",
      logo: newApplication.company.trim().slice(0, 1).toUpperCase(),
      tone: toneByCompany[applications.length % toneByCompany.length],
      updated: "Added just now",
    };
    setApplications((current) => [application, ...current]);
    setNewApplication({ role: "", company: "", location: "", status: "Saved" });
    setShowApplicationForm(false);
  };

  const updateApplicationStatus = (id: number, status: Status) => {
    setApplications((current) => current.map((application) => application.id === id ? { ...application, status, updated: "Updated just now" } : application));
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><span>CareerLaunch</span><span className="brand-ai">AI</span></div>
        <div className="workspace-switcher"><div className="avatar avatar-green">OA</div><div><strong>Olakunle&apos;s workspace</strong><small>Personal workspace</small></div><span className="chevron">⌄</span></div>
        <nav className="main-nav" aria-label="Main navigation">
          <span className="nav-label">Workspace</span>
          {navItems.map(([icon, label]) => <button className={`nav-item ${activeNav === label ? "active" : ""}`} key={label} onClick={() => setActiveNav(label)}><span className="nav-icon">{icon}</span>{label}{label === "Tasks" && <span className="nav-count">{tasks.filter((task) => !task.done).length}</span>}</button>)}
          <span className="nav-label nav-label-spaced">Manage</span>
          <button className="nav-item"><span className="nav-icon">▤</span>Documents</button>
          <button className="nav-item"><span className="nav-icon">◒</span>Reports</button>
          <button className="nav-item"><span className="nav-icon">⚙</span>Settings</button>
        </nav>
        <div className="sidebar-bottom"><div className="sync-card"><div className="sync-icon">↻</div><div><strong>All sources synced</strong><small>Last synced 8 min ago</small></div><span className="status-dot" /></div><div className="profile"><div className="avatar avatar-blue">OA</div><div><strong>Olakunle Obademi</strong><small>View profile</small></div><span className="more">•••</span></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{activeNav}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button notification" aria-label="Notifications">♧<i /></button><div className="avatar avatar-blue">OA</div></div></header>
        <div className="content-wrap">
          <section className="welcome-row"><div><p className="eyebrow">Monday, September 21, 2026</p><h1>Good morning, Olakunle <span>✦</span></h1><p className="subtitle">Here&apos;s what&apos;s happening with your career journey.</p></div><button className="primary-button" onClick={() => setShowTaskForm(true)}><span>＋</span> Add task</button></section>

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
            <div className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Your latest career progress.</p></div><button className="text-button">See history <span>→</span></button></div><div className="activity-list"><Activity icon="✦" text={<><strong>AI draft generated</strong><span>Vercel cover letter is ready for review</span></>} time="10 min ago" tone="purple" /><Activity icon="↗" text={<><strong>Application updated</strong><span>Notion moved to Applied</span></>} time="2 hours ago" tone="blue" /><Activity icon="◷" text={<><strong>Interview added</strong><span>Linear · Tomorrow at 2:00 PM</span></>} time="Yesterday" tone="orange" /></div></div>
          </section>
          <footer><span>✦ CareerLaunch AI</span><span>Built to help you move forward.</span><span className="footer-links">Help&nbsp;&nbsp; Privacy&nbsp;&nbsp; Feedback</span></footer>
        </div>
      </main>
      {showTaskForm && <div className="modal-backdrop" onClick={() => setShowTaskForm(false)}><form className="task-modal" onSubmit={addTask} onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">New reminder</p><h2>Add a task</h2></div><button type="button" className="close-button" onClick={() => setShowTaskForm(false)}>×</button></div><label htmlFor="task-title">What needs to be done?</label><input id="task-title" autoFocus value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="e.g. Follow up with recruiter" /><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setShowTaskForm(false)}>Cancel</button><button className="primary-button" type="submit">Create task</button></div></form></div>}
      {showApplicationForm && <div className="modal-backdrop" onClick={() => setShowApplicationForm(false)}><form className="task-modal" onSubmit={addApplication} onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">New opportunity</p><h2>Add application</h2></div><button type="button" className="close-button" onClick={() => setShowApplicationForm(false)}>×</button></div><div className="form-grid"><label htmlFor="application-role">Role<input id="application-role" autoFocus value={newApplication.role} onChange={(event) => setNewApplication({ ...newApplication, role: event.target.value })} placeholder="e.g. Product Designer" /></label><label htmlFor="application-company">Company<input id="application-company" value={newApplication.company} onChange={(event) => setNewApplication({ ...newApplication, company: event.target.value })} placeholder="e.g. Acme" /></label><label htmlFor="application-location">Location<input id="application-location" value={newApplication.location} onChange={(event) => setNewApplication({ ...newApplication, location: event.target.value })} placeholder="e.g. Remote · Europe" /></label><label htmlFor="application-status">Stage<select id="application-status" value={newApplication.status} onChange={(event) => setNewApplication({ ...newApplication, status: event.target.value as Status })}>{(["Saved", "Preparing", "Applied", "Interview", "Offer"] as Status[]).map((status) => <option key={status}>{status}</option>)}</select></label></div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setShowApplicationForm(false)}>Cancel</button><button className="primary-button" type="submit">Add application</button></div></form></div>}
    </div>
  );
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

export default App;
