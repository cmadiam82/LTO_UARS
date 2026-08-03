"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ROLES, type AccessRequest, type AuthUser, type Role, type WorkflowEvent } from "../lib/types";
import { roleLabels, transitions } from "../lib/workflow";

type Notice = { id: string; request_id: string; title: string; message: string; is_read: boolean; created_at: string };
type Attachment = { id:string;originalName:string;contentType:string;sizeBytes:number;createdAt:string };
type Detail = AccessRequest & { events: WorkflowEvent[]; attachments:Attachment[] };
type AdminUser = { id:string;username:string;full_name:string;employee_id:string;email:string;office:string;role:Role;is_active:boolean;must_change_password:boolean;created_at:string };
type Setting = { key:string;value:string;description:string;updated_at:string };
type AdminAudit = { id:string;actor_name:string;action:string;entity_type:string;entity_id:string;created_at:string };

const statusLabels: Record<string, string> = {
  PENDING_ENDORSEMENT: "Awaiting Head of Office",
  PENDING_RECOMMENDATION: "Awaiting Operations Chief",
  PENDING_REGIONAL_DIRECTOR: "Awaiting Regional Director",
  PENDING_MID_APPROVAL: "Awaiting MID Chief",
  PENDING_IMPLEMENTATION: "Approved · For implementation",
  CLOSED: "Closed · Implemented",
};

const actionLabels: Record<string, string> = {
  ENDORSE: "Endorse request",
  RECOMMEND_APPROVAL: "Recommend approval",
  APPROVE: "Approve application",
  IMPLEMENT: "Mark as implemented",
};

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [view, setView] = useState<"workspace" | "new" | "admin-users" | "admin-settings">("workspace");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showNotices, setShowNotices] = useState(false);
  const [toast, setToast] = useState("");

  const loadRequests = useCallback(async () => {
    const response = await fetch("/api/requests");
    if (response.ok) setRequests((await response.json()).requests);
  }, []);
  const loadNotices = useCallback(async () => {
    const response = await fetch("/api/notifications");
    if (response.ok) setNotices((await response.json()).notifications);
  }, []);
  const loadDetail = useCallback(async (id: string) => {
    const response = await fetch(`/api/requests/${id}`);
    if (!response.ok) return;
    const data = await response.json();
    const r = data.request;
    setSelected({
      id:r.id,referenceNo:r.reference_no,applicantName:r.applicant_name,employeeId:r.employee_id,email:r.email,contactNo:r.contact_no,
      office:r.office,position:r.position,systemName:r.system_name,accessLevel:r.access_level,accountType:r.account_type,
      requestedStartDate:r.requested_start_date,justification:r.justification,status:r.status,currentRole:r.assigned_role,
      implementationId:r.implementation_id,createdAt:r.created_at,updatedAt:r.updated_at,closedAt:r.closed_at,
      events:data.events.map((e: Record<string,string>) => ({id:e.id,action:e.action,fromStatus:e.from_status,toStatus:e.to_status,notes:e.notes,actorName:e.actor_name,actorRole:e.actor_role,createdAt:e.created_at})),
      attachments:(data.attachments||[]).map((a:Record<string,string>)=>({id:a.id,originalName:a.original_name,contentType:a.content_type,sizeBytes:Number(a.size_bytes),createdAt:a.created_at})),
    });
  }, []);

  useEffect(() => {
    fetch("/api/session").then(async (response) => {
      if (response.ok) { const nextUser=(await response.json()).user; setUser(nextUser); if(nextUser.role==="SYSTEM_ADMIN") setView("admin-users"); }
      setLoading(false);
    });
  }, []);
  // Data is refreshed whenever the authenticated identity changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (user) { loadRequests(); loadNotices(); } }, [user, loadRequests, loadNotices]);

  function flash(message: string) { setToast(message); window.setTimeout(() => setToast(""), 4000); }
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); setSelected(null); }

  if (loading) return <div className="screen-loader"><div className="brand-mark">U</div><p>Opening secure workspace…</p></div>;
  if (!user) return <Login onLogin={(nextUser)=>{setUser(nextUser);setView(nextUser.role==="SYSTEM_ADMIN"?"admin-users":"workspace");}} />;

  const unread = notices.filter((n) => !n.is_read).length;
  return (
    <main className="app-shell">
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
      {user.mustChangePassword && <ChangePassword onDone={() => setUser({ ...user, mustChangePassword: false })} />}
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">U</div><div><strong>UARS</strong><span>User Access Request System · v0.4.0</span></div></div>
        <nav aria-label="Main navigation">
          <button className={`nav-item ${view === "workspace" ? "active" : ""}`} onClick={() => { setView("workspace"); setSelected(null); }}><span>▦</span> Workspace</button>
          {user.role === "DO" && <button className={`nav-item ${view === "new" ? "active" : ""}`} onClick={() => setView("new")}><span>＋</span> New application</button>}
          {user.role === "SYSTEM_ADMIN" && <><button className={`nav-item ${view === "admin-users" ? "active" : ""}`} onClick={() => {setView("admin-users");setSelected(null);}}><span>♙</span> User management</button><button className={`nav-item ${view === "admin-settings" ? "active" : ""}`} onClick={() => {setView("admin-settings");setSelected(null);}}><span>⚙</span> System settings</button></>}
          <button className="nav-item" onClick={() => setShowNotices(true)}><span>◎</span> Notifications {unread > 0 && <em>{unread}</em>}</button>
          <button className="nav-item" onClick={() => { setView("workspace"); setSelected(null); }}><span>✓</span> Request history</button>
        </nav>
        <div className="secure-box"><span>◆</span><div><strong>Protected workspace</strong><p>Role checks and actions are enforced and audit logged.</p></div></div>
        <div className="sidebar-user"><div className="avatar">{initials(user.fullName)}</div><div><strong>{user.fullName}</strong><span>{roleLabels[user.role]}</span></div><button onClick={logout} aria-label="Sign out">↪</button></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><h1>{view === "new" ? "New access application" : view === "admin-users" ? "User management" : view === "admin-settings" ? "System settings" : selected ? selected.referenceNo : "Approval workspace"}</h1><p>{view === "new" ? "Submit a user access request for endorsement" : `Signed in as ${roleLabels[user.role]}`}</p></div>
          <div className="top-actions"><span className="role-badge">{roleLabels[user.role]}</span><button className="icon-btn" onClick={() => setShowNotices(true)} aria-label="Notifications">♢{unread > 0 && <i />}</button></div>
        </header>
        <div className="content">
          {view === "admin-users" ? <UserManagement currentUser={user} flash={flash}/> : view === "admin-settings" ? <SystemSettings flash={flash}/> : view === "new" ? <ApplicationForm user={user} onCreated={async (request) => { await loadRequests(); setView("workspace"); await loadDetail(request.id); flash(`${request.referenceNo} submitted for endorsement.`); }} /> :
            selected ? <><RequestDetail request={selected} user={user} onBack={() => setSelected(null)} onAction={async () => { await loadRequests(); await loadDetail(selected.id); await loadNotices(); flash("Action completed and the next office was notified."); }} /><AttachmentsPanel request={selected}/></> :
            <WorkspaceHome user={user} requests={requests} onSelect={loadDetail} onNew={() => setView("new")} />}
        </div>
      </section>
      {showNotices && <Notifications notices={notices} onClose={async () => { setShowNotices(false); await fetch("/api/notifications", { method: "POST" }); await loadNotices(); }} onOpen={(id) => { setShowNotices(false); setView("workspace"); loadDetail(id); }} />}
    </main>
  );
}

function UserManagement({currentUser,flash}:{currentUser:AuthUser;flash:(message:string)=>void}){
  const [users,setUsers]=useState<AdminUser[]>([]);const [error,setError]=useState("");const [secret,setSecret]=useState<{username:string;password:string}|null>(null);const [deleteTarget,setDeleteTarget]=useState<AdminUser|null>(null);
  const load=useCallback(async()=>{const r=await fetch("/api/admin/users");const x=await r.json();if(r.ok)setUsers(x.users);else setError(x.error);},[]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{load();},[load]);
  async function create(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");const form=e.currentTarget;const f=new FormData(form);const body=Object.fromEntries(f);const r=await fetch("/api/admin/users",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const x=await r.json();if(!r.ok)return setError(x.error);setSecret({username:x.user.username,password:x.temporaryPassword});form.reset();await load();flash("User account created.");}
  async function update(id:string,body:object){setError("");const r=await fetch(`/api/admin/users/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const x=await r.json();if(!r.ok)return setError(x.error);if(x.temporaryPassword){const u=users.find((item)=>item.id===id);setSecret({username:u?.username||"user",password:x.temporaryPassword});}await load();flash(x.temporaryPassword?"Temporary password generated.":"User access updated.");}
  async function remove(){if(!deleteTarget)return;setError("");const r=await fetch(`/api/admin/users/${deleteTarget.id}`,{method:"DELETE"});const x=await r.json();if(!r.ok){setDeleteTarget(null);return setError(x.error);}setDeleteTarget(null);await load();flash("User account permanently deleted.");}
  return <><section className="workspace-welcome"><div><p className="eyebrow">SYSTEM ADMINISTRATION</p><h2>Local UARS accounts</h2><p>Create accounts, assign roles, suspend access, and reset passwords.</p></div></section>{error&&<div className="form-error">{error}</div>}<form className="card admin-create" onSubmit={create}><div className="list-heading"><div><h3>Create user account</h3><p>A temporary password is generated and shown once.</p></div><button className="new-request">Create account</button></div><div className="form-grid"><Field name="username" label="Username"/><Field name="fullName" label="Full name"/><Field name="employeeId" label="Employee ID"/><Field name="email" label="Official email" type="email"/><Field name="office" label="Office / Division"/><label><span>System role</span><select name="role" required>{ROLES.map((r)=><option key={r} value={r}>{roleLabels[r]}</option>)}</select></label></div></form><section className="card request-list admin-list"><div className="list-heading"><div><h3>User directory</h3><p>Changes take effect immediately and are permanently logged.</p></div><span>{users.length} accounts</span></div><div className="table-wrap"><table><thead><tr><th>User</th><th>Office</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{users.map((u)=><tr key={u.id}><td><strong>{u.full_name}</strong><small>{u.username} · {u.employee_id}</small></td><td>{u.office}<small>{u.email}</small></td><td><select value={u.role} disabled={u.id===currentUser.id} onChange={(e)=>update(u.id,{role:e.target.value})}>{ROLES.map((r)=><option key={r} value={r}>{roleLabels[r]}</option>)}</select></td><td><span className={`status-pill ${u.is_active?"done":""}`}><i/>{u.is_active?u.must_change_password?"Password change due":"Active":"Suspended"}</span></td><td><div className="admin-actions"><button onClick={()=>update(u.id,{action:"RESET_PASSWORD"})}>Reset Password</button><button disabled={u.id===currentUser.id} onClick={()=>update(u.id,{isActive:!u.is_active})}>{u.is_active?"Suspend":"Activate"}</button><button className="danger" disabled={u.id===currentUser.id} onClick={()=>setDeleteTarget(u)}>Delete user</button></div></td></tr>)}</tbody></table></div></section>{secret&&<div className="modal-backdrop"><section className="modal-card credential-card"><div className="login-seal">◆</div><h2>Temporary credential</h2><p>Copy this now. The password will not be shown again.</p><div className="credential"><span>Username</span><strong>{secret.username}</strong><span>Temporary password</span><code>{secret.password}</code></div><button className="primary-action" onClick={()=>setSecret(null)}>I have saved it</button></section></div>}{deleteTarget&&<div className="modal-backdrop"><section className="modal-card credential-card"><div className="login-seal danger-seal">!</div><h2>Delete user account?</h2><p><strong>{deleteTarget.full_name}</strong> ({deleteTarget.username}) will permanently lose access. This cannot be undone.</p><div className="confirm-actions"><button onClick={()=>setDeleteTarget(null)}>Cancel</button><button className="danger-button" onClick={remove}>Delete user permanently</button></div></section></div>}</>;
}

function SystemSettings({flash}:{flash:(message:string)=>void}){
  const [settings,setSettings]=useState<Setting[]>([]);const [audit,setAudit]=useState<AdminAudit[]>([]);const [error,setError]=useState("");
  const load=useCallback(async()=>{const r=await fetch("/api/admin/settings");const x=await r.json();if(r.ok){setSettings(x.settings);setAudit(x.audit);}else setError(x.error);},[]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{load();},[load]);
  async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const values=Object.fromEntries(settings.map((s)=>[s.key,String(f.get(s.key)||"")]));const r=await fetch("/api/admin/settings",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({settings:values})});const x=await r.json();if(!r.ok)return setError(x.error);await load();flash("System settings saved and audit logged.");}
  return <><section className="workspace-welcome"><div><p className="eyebrow">SYSTEM ADMINISTRATION</p><h2>System-wide settings</h2><p>Configuration changes are restricted to system administrators.</p></div></section>{error&&<div className="form-error">{error}</div>}<form className="card settings-form" onSubmit={save}>{settings.map((s)=><label key={s.key}><span>{s.key.replaceAll("_"," ")}</span><input name={s.key} defaultValue={s.value}/><small>{s.description}</small></label>)}<button className="primary-action">Save all settings</button></form><section className="card request-list audit-list"><div className="list-heading"><div><h3>Administration audit trail</h3><p>Most recent user and configuration changes.</p></div><span>{audit.length} events</span></div><div className="table-wrap"><table><thead><tr><th>Action</th><th>Administrator</th><th>Target</th><th>Date</th></tr></thead><tbody>{audit.map((a)=><tr key={a.id}><td><strong>{a.action.replaceAll("_"," ")}</strong></td><td>{a.actor_name}</td><td>{a.entity_type} · {a.entity_id}</td><td>{formatDateTime(a.created_at)}</td></tr>)}</tbody></table></div></section></>;
}

function Login({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:data.get("username"),password:data.get("password")}) });
    const result = await response.json(); setBusy(false); if (!response.ok) return setError(result.error); onLogin(result.user);
  }
  return <main className="login-page"><section className="login-story"><div className="brand login-brand"><div className="brand-mark">U</div><div><strong>UARS</strong><span>USER ACCESS REQUEST SYSTEM</span></div></div><div><p className="eyebrow">SECURE ACCESS GOVERNANCE</p><h1>Every access decision.<br/>Clear, accountable, complete.</h1><p>One protected workflow from application and endorsement to approval, implementation, and automatic closure.</p></div><div className="login-steps"><span>01 Submit</span><span>02 Review</span><span>03 Approve</span><span>04 Implement</span></div></section><section className="login-panel"><form onSubmit={submit}><div className="login-seal">◆</div><h2>Welcome back</h2><p>Sign in with your assigned UARS account.</p>{error && <div className="form-error">{error}</div>}<label><span>Username</span><input name="username" autoComplete="username" required autoFocus placeholder="Enter your username"/></label><label><span>Password</span><input name="password" type="password" autoComplete="current-password" required placeholder="Enter your password"/></label><button className="primary-action" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}<span>→</span></button><small>Authorized personnel only · All activity is audit logged</small></form></section></main>;
}

function ChangePassword({ onDone }: { onDone: () => void }) {
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const d=new FormData(event.currentTarget);if(d.get("new")!==d.get("confirm")){setBusy(false);return setError("New passwords do not match.");}const r=await fetch("/api/auth/change-password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({currentPassword:d.get("current"),newPassword:d.get("new")})});const x=await r.json();setBusy(false);if(!r.ok)return setError(x.error);onDone();}
  return <div className="modal-backdrop"><form className="modal-card password-card" onSubmit={submit}><div className="login-seal">◆</div><h2>Secure your account</h2><p>Replace the temporary password before using UARS.</p>{error&&<div className="form-error">{error}</div>}<label><span>Temporary password</span><input name="current" type="password" required/></label><label><span>New password</span><input name="new" type="password" minLength={12} required/><small>At least 12 characters</small></label><label><span>Confirm new password</span><input name="confirm" type="password" minLength={12} required/></label><button className="primary-action" disabled={busy}>{busy?"Updating…":"Set new password"}</button></form></div>;
}

function WorkspaceHome({ user, requests, onSelect, onNew }: { user:AuthUser; requests:AccessRequest[]; onSelect:(id:string)=>void; onNew:()=>void }) {
  const actionable=requests.filter((r)=>r.currentRole===user.role).length; const closed=requests.filter((r)=>r.status==="CLOSED").length;
  return <><section className="workspace-welcome"><div><p className="eyebrow">OPERATIONS OVERVIEW</p><h2>{user.role==="DO"?"Your access requests":"Requests requiring attention"}</h2><p>Track every application through the complete approval chain.</p></div>{user.role==="DO"&&<button className="new-request" onClick={onNew}>＋ New application</button>}</section><div className="metric-grid"><div className="metric"><span>Open requests</span><strong>{requests.length-closed}</strong><small>Across your workspace</small></div><div className="metric accent"><span>Action required</span><strong>{actionable}</strong><small>Assigned to your role</small></div><div className="metric"><span>Implemented</span><strong>{closed}</strong><small>Automatically closed</small></div></div><section className="card request-list"><div className="list-heading"><div><h3>Request register</h3><p>Most recent applications and current ownership</p></div><span>{requests.length} records</span></div>{requests.length===0?<div className="empty-state"><strong>No requests yet</strong><p>{user.role==="DO"?"Create your first user access application.":"There are no requests available for this role."}</p></div>:<div className="table-wrap"><table><thead><tr><th>Reference</th><th>Applicant</th><th>System</th><th>Status</th><th>Submitted</th><th></th></tr></thead><tbody>{requests.map((r)=><tr key={r.id} className={r.currentRole===user.role?"needs-action":""}><td><strong>{r.referenceNo}</strong></td><td>{r.applicantName}<small>{r.office}</small></td><td>{r.systemName}<small>{r.accessLevel}</small></td><td><span className={`status-pill ${r.status==="CLOSED"?"done":"pending"}`}><i/>{statusLabels[r.status]||r.status}</span></td><td>{formatDate(r.createdAt)}</td><td><button className="view-link" onClick={()=>onSelect(r.id)}>Review →</button></td></tr>)}</tbody></table></div>}</section></>;
}

function ApplicationForm({ user,onCreated }:{user:AuthUser;onCreated:(r:AccessRequest)=>void}){
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const body=new FormData(e.currentTarget);const r=await fetch("/api/requests",{method:"POST",body});const x=await r.json();setBusy(false);if(!r.ok)return setError(x.error);onCreated(x.request);}
  return <form className="application-form" onSubmit={submit}><section className="form-intro"><span>NEW APPLICATION</span><h2>User access request</h2><p>Fields marked required become part of the permanent application record.</p></section>{error&&<div className="form-error">{error}</div>}<section className="card form-section"><h3>Applicant information</h3><div className="form-grid"><Field name="applicantName" label="Full name" defaultValue={user.fullName}/><Field name="employeeId" label="Employee ID" defaultValue={user.employeeId}/><Field name="email" label="Official email" type="email" defaultValue={user.email}/><Field name="contactNo" label="Contact number"/><Field name="office" label="Office / Division" defaultValue={user.office}/><Field name="position" label="Position / Designation"/></div></section><section className="card form-section"><h3>Access requirements</h3><div className="form-grid"><Field name="systemName" label="System / Application"/><Field name="accessLevel" label="Requested access level"/><label><span>Account type</span><select name="accountType" required><option value="">Select account type</option><option>Named user account</option><option>Shared service account</option><option>Privileged account</option></select></label><Field name="requestedStartDate" label="Requested start date" type="date"/></div><label className="full-field"><span>Business justification</span><textarea name="justification" required minLength={20} placeholder="Explain why this access is required for official duties…"/></label><label className="full-field attachment-field"><span>Supporting attachments <em>Optional</em></span><input name="attachments" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"/><small>Up to 5 files · PDF, PNG, JPG, DOCX, or XLSX · 10 MB each</small></label></section><div className="form-submit"><p>Submission routes this request to the Head of Office for endorsement.</p><button className="primary-action" disabled={busy}>{busy?"Uploading and submitting…":"Submit application"}<span>→</span></button></div></form>;
}

function RequestDetail({request,user,onBack,onAction}:{request:Detail;user:AuthUser;onBack:()=>void;onAction:()=>void}){
  const [notes,setNotes]=useState("");const [password,setPassword]=useState("");const [verify,setVerify]=useState(false);const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  const transition=transitions[request.status];const canAct=transition?.role===user.role;const steps=["PENDING_ENDORSEMENT","PENDING_RECOMMENDATION","PENDING_REGIONAL_DIRECTOR","PENDING_MID_APPROVAL","PENDING_IMPLEMENTATION","CLOSED"];const stage=steps.indexOf(request.status);
  async function act(){if(user.role==="REGIONAL_DIRECTOR"&&!verify){setVerify(true);return;}setBusy(true);setError("");const r=await fetch(`/api/requests/${request.id}/action`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:transition.action,notes,password})});const x=await r.json();setBusy(false);if(!r.ok)return setError(x.error);setVerify(false);setPassword("");setNotes("");onAction();}
  return <><button className="back-link" onClick={onBack}>← Back to workspace</button><section className={`request-hero ${request.status==="CLOSED"?"closed":""}`}><div className="hero-main"><div className="app-icon">UA</div><div><div className="eyebrow">ACCESS REQUEST <span>{request.referenceNo}</span></div><h2>{request.systemName}</h2><p>{request.applicantName} · {request.office}</p></div></div><div className="hero-status"><span className={`status-pill ${request.status==="CLOSED"?"done":"pending"}`}><i/>{statusLabels[request.status]}</span><small>Submitted {formatDateTime(request.createdAt)}</small></div></section><section className="progress-card"><div className="progress-heading"><div><strong>Approval progress</strong><span>{request.status==="CLOSED"?"All steps completed":`Step ${stage+1} of 6`}</span></div><b>{request.status==="CLOSED"?100:Math.round((stage/5)*100)}%</b></div><div className="progress-line"><i style={{width:`${request.status==="CLOSED"?100:(stage/5)*100}%`}}/></div><div className="stepper">{["Head of Office","Operations Chief","Regional Director","MID Chief","Technical Team","Closed"].map((name,i)=><div key={name} className={`step ${i<stage||request.status==="CLOSED"?"complete":i===stage?"current":""}`}><div className="step-dot">{i<stage||request.status==="CLOSED"?"✓":i+1}</div><strong>{name}</strong><span>{i<stage||request.status==="CLOSED"?"Completed":i===stage?"Current":"Pending"}</span></div>)}</div></section><div className="two-column"><section className="card detail-card"><div className="detail-body"><h3>Applicant information</h3><div className="info-grid"><Info label="Full name" value={request.applicantName}/><Info label="Employee ID" value={request.employeeId}/><Info label="Office / Division" value={request.office}/><Info label="Position" value={request.position}/><Info label="Official email" value={request.email}/><Info label="Contact number" value={request.contactNo}/></div><hr/><h3>Access requirements</h3><div className="info-grid"><Info label="System / Application" value={request.systemName}/><Info label="Access level" value={request.accessLevel}/><Info label="Account type" value={request.accountType}/><Info label="Requested start date" value={formatDate(request.requestedStartDate)}/></div><div className="justification"><span>Business justification</span><p>{request.justification}</p></div><hr/><h3>Activity trail</h3><div className="trail-body compact">{request.events.map((e)=><div className="trail-item" key={e.id}><div>✓</div><section><strong>{e.action.replaceAll("_"," ")}</strong><p>{e.actorName} · {roleLabels[e.actorRole]}</p>{e.notes&&<p>“{e.notes}”</p>}<span>{formatDateTime(e.createdAt)}</span></section></div>)}</div></div></section><aside className="action-column"><section className="card action-card"><div className="action-title"><span>{request.status==="CLOSED"?"✓":"◆"}</span><div><h3>{request.status==="CLOSED"?"Transaction closed":canAct?"Action required":"Read-only view"}</h3><p>{request.status==="CLOSED"?"Implementation is complete.":canAct?`Assigned to ${roleLabels[user.role]}.`:request.currentRole?`Pending ${roleLabels[request.currentRole]}.`:"No pending owner."}</p></div></div>{error&&<div className="form-error small">{error}</div>}{canAct&&<><label className="notes"><span>Review notes <em>Optional</em></span><textarea value={notes} maxLength={500} onChange={(e)=>setNotes(e.target.value)} placeholder="Add a note to the permanent audit trail…"/></label>{verify&&<div className="verify-box"><div><span>▣</span><strong>Director step-up verification</strong></div><p>Re-enter your password to authorize this approval.</p><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoFocus placeholder="Your UARS password"/></div>}<button className="primary-action" disabled={busy||(verify&&!password)} onClick={act}>{busy?"Processing…":verify?"Verify and approve":actionLabels[transition.action]}<span>→</span></button></>}{request.status==="CLOSED"&&<div className="closed-receipt"><div><span>Implementation ID</span><strong>{request.implementationId}</strong></div><div><span>Closed</span><strong>{request.closedAt&&formatDateTime(request.closedAt)}</strong></div></div>}</section></aside></div></>;
}

function Notifications({notices,onClose,onOpen}:{notices:Notice[];onClose:()=>void;onOpen:(id:string)=>void}){return <div className="modal-backdrop align-right"><section className="notification-drawer"><header><div><h2>Notifications</h2><p>Workflow updates assigned to you</p></div><button onClick={onClose}>×</button></header><div>{notices.length===0?<div className="empty-state"><strong>You’re all caught up</strong><p>No notifications yet.</p></div>:notices.map((n)=><button className={`notice-item ${!n.is_read?"unread":""}`} key={n.id} onClick={()=>onOpen(n.request_id)}><i/><div><strong>{n.title}</strong><p>{n.message}</p><span>{formatDateTime(n.created_at)}</span></div></button>)}</div></section></div>}
function AttachmentsPanel({request}:{request:Detail}){return <section className="card attachments-panel"><div className="list-heading"><div><h3>Supporting attachments</h3><p>Files submitted with this application</p></div><span>{request.attachments.length} files</span></div>{request.attachments.length===0?<div className="empty-state compact"><strong>No attachments</strong><p>No supporting files were submitted.</p></div>:<div className="attachment-list">{request.attachments.map((a)=><a key={a.id} href={`/api/requests/${request.id}/attachments/${a.id}`}><span className="file-type">{fileExtension(a.originalName)}</span><div><strong>{a.originalName}</strong><small>{formatFileSize(a.sizeBytes)} · Uploaded {formatDateTime(a.createdAt)}</small></div><b>Download ↓</b></a>)}</div>}</section>}
function Field({name,label,type="text",defaultValue}:{name:string;label:string;type?:string;defaultValue?:string}){return <label><span>{label}</span><input name={name} type={type} defaultValue={defaultValue} required/></label>}
function Info({label,value}:{label:string;value:string}){return <div className="info"><span>{label}</span><strong>{value}</strong></div>}
function initials(name:string){return name.split(" ").map((n)=>n[0]).slice(0,2).join("").toUpperCase()}
function formatDate(value:string){return new Intl.DateTimeFormat("en-PH",{dateStyle:"medium"}).format(new Date(value))}
function formatDateTime(value:string){return new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))}
function formatFileSize(bytes:number){return bytes<1024*1024?`${Math.max(1,Math.round(bytes/1024))} KB`:`${(bytes/1024/1024).toFixed(1)} MB`}
function fileExtension(name:string){return name.includes(".")?name.split(".").pop()!.slice(0,5).toUpperCase():"FILE"}
