"use client";

import { useMemo, useState } from "react";

type Role = "DO" | "Head of Office" | "Regional Operations Chief" | "Regional Director" | "MID Chief" | "Technical Team";

const roles: Role[] = ["DO", "Head of Office", "Regional Operations Chief", "Regional Director", "MID Chief", "Technical Team"];
const stages = [
  { role: "DO", title: "Application submitted", person: "Dianne O. Reyes" },
  { role: "Head of Office", title: "Office endorsement", person: "Atty. Luis M. Santos" },
  { role: "Regional Operations Chief", title: "Recommendation", person: "Supt. Carlo D. Flores" },
  { role: "Regional Director", title: "Regional approval", person: "Dir. Elena V. Cruz" },
  { role: "MID Chief", title: "MID approval", person: "Chief Marco L. Tan" },
  { role: "Technical Team", title: "Implementation", person: "IT Service Desk" },
];

const actionLabels = ["Submit application", "Endorse request", "Recommend approval", "Verify & approve", "Approve application", "Mark as implemented"];

export default function Home() {
  const [role, setRole] = useState<Role>("Regional Director");
  const [currentStage, setCurrentStage] = useState(3);
  const [activeTab, setActiveTab] = useState<"details" | "trail">("details");
  const [toast, setToast] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const isClosed = currentStage >= 6;
  const roleIndex = roles.indexOf(role);
  const canAct = roleIndex === currentStage;
  const progress = Math.min((currentStage / 6) * 100, 100);

  const status = useMemo(() => {
    if (isClosed) return "Closed · Implemented";
    return `Awaiting ${stages[currentStage].role}`;
  }, [currentStage, isClosed]);

  function act() {
    if (!canAct) return;
    if (currentStage === 3 && !showVerify) {
      setShowVerify(true);
      return;
    }
    if (currentStage === 3 && code !== "482913") return;
    const label = actionLabels[currentStage];
    setCurrentStage((value) => value + 1);
    setShowVerify(false);
    setCode("");
    setNotes("");
    setToast(currentStage === 5 ? "Implementation confirmed. Transaction closed automatically." : `${label} completed. The next office has been notified.`);
    window.setTimeout(() => setToast(""), 4000);
  }

  function resetDemo() {
    setCurrentStage(0);
    setRole("DO");
    setToast("Demo reset. Complete each step by switching roles.");
    window.setTimeout(() => setToast(""), 3500);
  }

  return (
    <main className="app-shell">
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">U</div><div><strong>UARS</strong><span>User Access Request System</span></div></div>
        <nav aria-label="Main navigation">
          <a className="nav-item active" href="#"><span>▦</span> Workspace</a>
          <a className="nav-item" href="#"><span>⌁</span> My requests <em>2</em></a>
          <a className="nav-item" href="#"><span>◎</span> Approvals <em>{isClosed ? 0 : 1}</em></a>
          <a className="nav-item" href="#"><span>✓</span> Completed</a>
          <p className="nav-label">MANAGEMENT</p>
          <a className="nav-item" href="#"><span>♙</span> User directory</a>
          <a className="nav-item" href="#"><span>◫</span> Audit reports</a>
        </nav>
        <div className="secure-box"><span>◆</span><div><strong>Protected workspace</strong><p>Actions are encrypted and audit logged.</p></div></div>
        <div className="sidebar-user"><div className="avatar">EV</div><div><strong>Elena Cruz</strong><span>{role}</span></div><button aria-label="Account menu">•••</button></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><h1>Approval workspace</h1><p>Review and process user access requests</p></div>
          <div className="top-actions"><label className="role-picker"><span>Viewing as</span><select value={role} onChange={(e) => setRole(e.target.value as Role)}>{roles.map((r) => <option key={r}>{r}</option>)}</select></label><button className="icon-btn" aria-label="Notifications">♢<i /></button><button className="icon-btn" aria-label="Help">?</button></div>
        </header>

        <div className="content">
          <div className="breadcrumb"><span>Approvals</span><b>/</b><strong>UAR-2026-07142</strong></div>
          <section className={`request-hero ${isClosed ? "closed" : ""}`}>
            <div className="hero-main"><div className="app-icon">AP</div><div><div className="eyebrow">ACCESS REQUEST <span>UAR-2026-07142</span></div><h2>Payroll System Access</h2><p>Application for new user access · Finance Division</p></div></div>
            <div className="hero-status"><span className={`status-pill ${isClosed ? "done" : "pending"}`}><i />{status}</span><small>Submitted Jul 18, 2026 · 09:42 AM</small></div>
          </section>

          <section className="progress-card">
            <div className="progress-heading"><div><strong>Approval progress</strong><span>{isClosed ? "All steps completed" : `Step ${currentStage + 1} of 6`}</span></div><b>{Math.round(progress)}%</b></div>
            <div className="progress-line"><i style={{ width: `${progress}%` }} /></div>
            <div className="stepper">
              {stages.map((step, index) => <div className={`step ${index < currentStage ? "complete" : index === currentStage && !isClosed ? "current" : ""}`} key={step.role}><div className="step-dot">{index < currentStage || isClosed ? "✓" : index + 1}</div><strong>{step.role === "Regional Operations Chief" ? "Operations Chief" : step.role}</strong><span>{index < currentStage || isClosed ? "Completed" : index === currentStage ? "In review" : "Pending"}</span></div>)}
            </div>
          </section>

          <div className="two-column">
            <section className="card detail-card">
              <div className="tabs"><button className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}>Request details</button><button className={activeTab === "trail" ? "active" : ""} onClick={() => setActiveTab("trail")}>Activity trail <span>{currentStage}</span></button></div>
              {activeTab === "details" ? <div className="detail-body">
                <h3>Applicant information</h3><div className="info-grid"><Info label="Full name" value="Maria Angela P. Villanueva"/><Info label="Employee ID" value="DOF-R06-1842"/><Info label="Office / Division" value="Finance Division"/><Info label="Position" value="Administrative Officer III"/><Info label="Official email" value="mavillanueva@agency.gov.ph"/><Info label="Contact number" value="+63 917 632 1842"/></div>
                <hr/><h3>Access requirements</h3><div className="info-grid"><Info label="System / Application" value="Payroll Management System"/><Info label="Access level" value="Encoder · Region VI"/><Info label="Account type" value="Named user account"/><Info label="Requested start date" value="July 25, 2026"/></div>
                <div className="justification"><span>Business justification</span><p>Required to encode, validate, and submit monthly payroll adjustments for regional personnel as part of assigned Finance Division duties.</p></div>
                <div className="attachment"><div className="file-icon">PDF</div><div><strong>Office_Order_2026-114.pdf</strong><span>Supporting document · 842 KB</span></div><button>View</button></div>
              </div> : <div className="trail-body">{stages.slice(0, currentStage).reverse().map((step, i) => <div className="trail-item" key={step.role}><div>✓</div><section><strong>{step.title}</strong><p>{step.person} completed this action.</p><span>{i === 0 ? "Today, 10:24 AM" : `Jul ${20 - i}, 2026 · 0${9 - i}:18 AM`}</span></section></div>)}{currentStage === 0 && <div className="empty">No activity yet. Submit the application to begin.</div>}</div>}
            </section>

            <aside className="action-column">
              <section className="card action-card">
                <div className="action-title"><span>{isClosed ? "✓" : "◆"}</span><div><h3>{isClosed ? "Request completed" : canAct ? "Action required" : "Read-only view"}</h3><p>{isClosed ? "This transaction is now closed." : canAct ? `You are acting as ${role}.` : `Pending action by ${stages[currentStage].role}.`}</p></div></div>
                {!isClosed && <>
                  <label className="notes"><span>Review notes <em>Optional</em></span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a note to the audit trail…" disabled={!canAct}/><small>{notes.length}/500</small></label>
                  {showVerify && <div className="verify-box"><div><span>▣</span><strong>Secure verification</strong></div><p>Enter the 6-digit code sent to your registered device.</p><input autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" inputMode="numeric" aria-label="Six digit verification code"/><small>Demo code: <b>482913</b></small></div>}
                  <button className="primary-action" disabled={!canAct || (showVerify && code !== "482913")} onClick={act}>{showVerify ? "Confirm secure approval" : canAct ? actionLabels[currentStage] : `Waiting for ${stages[currentStage].role}`} <span>→</span></button>
                  {canAct && currentStage > 0 && <button className="return-btn">Return for revision</button>}
                  {currentStage === 5 && canAct && <div className="notice">The technical team was notified automatically after full approval.</div>}
                </>}
                {isClosed && <div className="closed-receipt"><div><span>Implementation ID</span><strong>IMP-260722-084</strong></div><div><span>Completed</span><strong>Jul 22, 2026 · 11:36 AM</strong></div></div>}
              </section>
              <section className="card owner-card"><p>CURRENT OWNER</p><div className="owner"><div className="avatar green">{isClosed ? "IT" : stages[currentStage].person.split(" ").map((n) => n[0]).slice(0,2).join("")}</div><div><strong>{isClosed ? "IT Service Desk" : stages[currentStage].person}</strong><span>{isClosed ? "Technical Team" : stages[currentStage].role}</span></div></div><div className="sla"><span>Target completion</span><strong>{isClosed ? "Completed on time" : "Jul 23, 2026 · 5:00 PM"}</strong></div></section>
              <button className="demo-reset" onClick={resetDemo}>↻ Reset workflow demo</button>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="info"><span>{label}</span><strong>{value}</strong></div>; }
