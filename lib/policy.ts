export const POLICY_VERSION = "LTOCM-2026-08-04";
export const POLICY_HASH = "1e06a8829b6d40beed48f4ef5cd0d6e92fdf1954e29ae1c3329e34aa55890c00";
export const POLICY_TITLE = "LTO Credentials Management Policy Agreement";

export const POLICY_SECTIONS = [
  { title: "A. Data Privacy Notice", paragraphs: [
    "The Land Transportation Office, through the Management Information Division (MID), is committed to protecting your personal data in accordance with Republic Act No. 10173, the Data Privacy Act of 2012, its Implementing Rules and Regulations, and applicable issuances of the National Privacy Commission.",
    "By submitting a User Access Request, you acknowledge that LTO will collect, process, store, use, and retain the personal and official employment information you provide for identity and employment verification; evaluation and administration of system access; information-security enforcement; audit, monitoring and incident investigation; and compliance with applicable laws and lawful orders.",
    "Information may include your identity, employee number, office assignment, employment status, designation, contact details, official email address, requested access, approving authorities, system activity logs, and audit trails. It is accessible only to authorized personnel and may be disclosed when legally required.",
    "LTO will apply reasonable organizational, physical, and technical safeguards, retain data only as necessary for lawful purposes, and dispose of it under applicable records-retention rules. Subject to law, you may exercise your data-subject rights through the LTO Data Protection Officer."
  ]},
  { title: "B. End-User Policy Agreement", paragraphs: [
    "I certify that the information I provide is true, accurate, complete, and submitted in good faith. I will use granted access solely for official duties and authorized government business, and comply with applicable laws, Civil Service rules, LTO policies, and information-security, privacy, and cybersecurity requirements.",
    "I will keep credentials confidential; never disclose, lend, share, or transfer them; remain accountable for all activity under my account; and immediately report suspected compromise, misuse, vulnerabilities, or security incidents to MID.",
    "I will not access, view, retrieve, modify, copy, download, disclose, print, transmit, delete, or process information beyond my authority. I understand that activity may be logged, monitored, reviewed, and audited, and that LTO may restrict, suspend, modify, deactivate, or revoke access.",
    "Unauthorized, fraudulent, or irregular use may result in immediate access revocation and referral for administrative, civil, or criminal action. I will surrender or discontinue access upon separation, transfer, reassignment, expiry, or official direction."
  ]},
  { title: "C. Acceptable Use Policy", paragraphs: [
    "I will use LTO systems only for legitimate government functions; access only information needed for assigned duties; protect official information; follow approved handling, storage, transmission, and disposal procedures; and promptly report errors, suspicious activity, and security concerns.",
    "Prohibited conduct includes personal, commercial, political, fraudulent, or unlawful use; unauthorized access attempts; bypassing controls; installing unauthorized software or malware; sharing accounts; using another person’s account; exceeding granted privileges; altering logs; or compromising system confidentiality, integrity, availability, or security."
  ]},
  { title: "D. Information Security Responsibilities", paragraphs: [
    "I will use strong passwords, protect credentials, avoid insecure storage or transmission, report suspected compromise, safeguard government information on a need-to-know basis, verify recipients, and securely handle or dispose of downloads, printouts, and exports.",
    "I will immediately report unauthorized access, lost devices, unintended disclosure, malware or phishing, account misuse, and security weaknesses. I acknowledge that activity records may be used as evidence and will cooperate with authorized audits or investigations.",
    "Upon separation, transfer, reassignment, or loss of authorization, I will discontinue access, return government assets or credentials, and ensure I retain no unauthorized access or information."
  ]}
] as const;

export const POLICY_CONFIRMATION = "By selecting “I Agree” electronically, I acknowledge that I have read, understood, and voluntarily agree to be bound by this LTO Credentials Management Policy Agreement. My electronic confirmation has the same force and effect as my handwritten signature for this User Access Request.";
