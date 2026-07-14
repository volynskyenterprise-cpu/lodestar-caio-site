/* ==============================================================
   Lodestar CAIO console — pure logic shared by the app and tests.
   Loaded as a plain (non-module) <script> by console-7c3f9a2b.html,
   so top-level function declarations become globals there. The
   UMD-style footer additionally exposes them via module.exports
   for Node's test runner. No build step either way.
   ============================================================== */

function esc(s){return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

function today(){return new Date().toISOString().slice(0,10);}

function uid(){return Math.random().toString(36).slice(2,9);}

function daysUntil(d){
  const t=new Date(d+"T00:00:00").getTime();
  if(Number.isNaN(t))return 9999;
  return Math.ceil((t-Date.now())/86400000);
}

/* Same recovery rules as the old inline load(): missing/malformed
   state or a state with no identity falls back to defaults; any
   array field that isn't an array gets reset to one. */
function normalizeState(raw, defaults){
  if(!raw || !raw.identity) return structuredClone(defaults);
  ["clients","snapshots","policies","vendors","risks","engagements","proposals"].forEach(k=>{
    if(!Array.isArray(raw[k])) raw[k]=[];
  });
  return raw;
}

/* Splits a question list + answer map into reds/yellows for
   proposal generation. qs is a SNAP[segment] array; answers is
   keyed by question index. */
function snapExposures(qs, answers){
  const reds=[],yellows=[];
  (qs||[]).forEach((o,i)=>{
    const v=answers&&answers[i];
    if(v==='red')reds.push(o);
    else if(v==='yellow')yellows.push(o);
  });
  return {reds,yellows};
}

/* Turns a question list + answer map into the Snapshot readout:
   bucketed exposures plus a 0-100 risk score and a red/yellow/green
   level. Risk weights a red answer twice a yellow one, over twice
   the number of scored (non-blank) questions. */
function scoreSnapshot(qs, answers){
  answers=answers||{};
  const answered=Object.keys(answers).length;
  const reds=[],yellows=[],greens=[];
  (qs||[]).forEach((o,i)=>{
    const v=answers[i];
    if(v==='red')reds.push(o);
    else if(v==='yellow')yellows.push(o);
    else if(v==='green')greens.push(o);
  });
  const scored=reds.length+yellows.length+greens.length;
  const risk=scored?Math.round(((reds.length*2+yellows.length)/(scored*2))*100):0;
  const level=risk>=50?'red':risk>=20?'yellow':'green';
  const levelTxt=level==='red'?'HIGH exposure':level==='yellow'?'MODERATE exposure':'LOW exposure';
  return {reds,yellows,greens,answered,scored,risk,level,levelTxt};
}

function policyBrokerage(d){return `AI USE POLICY — ${d.firm||"[Firm Name]"}
Real Estate Brokerage (brokers & salespersons)

Effective date: ${d.date||today()}   Responsible broker: ${d.broker||"[name, DRE #]"}   Questions to: ${d.contact||d.email||"[contact]"}

WHY THIS POLICY EXISTS
AI tools are useful and already in use at this firm. This policy says which tools are approved, what client information must never go into them, and the one review step every piece of AI-assisted marketing must pass before it publishes. The responsible broker is accountable for what agents publish under the firm's name; this is how we meet that responsibility.

THE THREE RULES THAT MATTER MOST
1. People decide and sign. AI drafts; a licensed person reviews, verifies, and owns every output that leaves the firm.
2. No client data in unapproved tools. Never paste client/buyer financials, IDs, pre-approvals, or contracts into a consumer AI tool. Approved tools only.
3. Fair-housing review before publish. Every AI-assisted listing, ad, caption, email, or image passes the fair-housing check below before it goes out.

FAIR-HOUSING REVIEW (mandatory, before publish)
- Describe the property, not the people. No reference to or preference for any protected class — directly or by code word.
- No "code words" (e.g., "great for families", "safe/exclusive neighborhood", "walk to [house of worship]").
- No steering: don't characterize neighborhoods by who lives there.
- Facts verified: sqft, beds/baths, permits, schools, HOA, price — AI invents these.
- AI-altered images disclosed; never misrepresent condition.

CLIENT OUTREACH (texts/calls/email)
AI-drafted or AI-placed texts/calls follow TCPA: prior consent, DNC compliance, working opt-out. A licensed person reviews AI-drafted client messages before sending.

RECORDING & CONSENT
No AI note-taker records a client call/meeting without all-party consent (California).

VALUATION GUARDRAIL
Do not present AI "valuations" as appraisals or supported value. Keep CMAs/BPOs in scope with disclaimers.

CONFIDENTIALITY & DATA
Treat client information as confidential. Approved tools must not train on our data.

IF SOMETHING GOES WRONG
Tell the responsible broker immediately if an AI-assisted fair-housing problem went out, client data went into an unapproved tool, or a wrong AI output reached a client.

ACKNOWLEDGEMENT
Name: __________________  DRE #: __________  Signature: __________________  Date: ________

Maintained with ${d.practice||"Lodestar CAIO"}. Review at least annually and when tools or rules change. Not legal advice.`;}

function policyEscrowTitle(d){return `AI USE POLICY — ${d.firm||"[Company Name]"}
Escrow & Title (AI addendum to your Information Security Program)

Effective date: ${d.date||today()}   Qualified individual / ISP owner: ${d.broker||"[name]"}   Questions to: ${d.contact||d.email||"[contact]"}

WHY THIS POLICY EXISTS
This company is a financial institution under Gramm-Leach-Bliley and holds the most sensitive data and the money in the transaction. This policy governs AI so it doesn't create a breach, a Safeguards violation, or a fraud loss. It sits alongside your WISP and (title) ALTA Best Practices program.

THE THREE RULES THAT MATTER MOST
1. NPI never goes into an unapproved AI tool. No customer financials, SSNs, account numbers, IDs, or closing figures into a consumer/free AI tool. Approved, WISP-covered, no-training tools only.
2. AI never verifies a wire or payoff. Funds and payoff instructions are verified out-of-band by a person using independently obtained numbers — assuming any inbound email or voice may be AI-generated/deepfaked.
3. A qualified person owns every determination. AI may assist with summaries and document handling; a licensed/qualified human owns every title determination and disbursement decision.

APPROVED TOOLS & VENDOR AI
Use only tools on the approved-tool list; NPI-capable tools must be inside the WISP, access-controlled, encrypted, and contractually prohibited from training on our data. Vendor AI features are reviewed before use (where does data go, is NPI exposed, training disabled, breach terms). For title, this is ALTA Pillar 3 third-party oversight.

WIRE FRAUD & DEEPFAKES (AI-aware verification)
Verify all wire/payoff instructions by independent callback to a number you obtained yourself — never one from the inbound email/call. Treat unexpected changes as fraud until verified. A convincing voice or perfect email is not verification.

NPI HANDLING (Safeguards / ALTA Pillar 3)
Outputs that summarize NPI are themselves NPI. Customer-facing AI must not collect NPI in the clear. Limit access to staff who need it.

DOCUMENT & DETERMINATION HANDLING
AI may assist; the responsible person verifies every material item (exceptions, liens, vesting, legal description, figures) before relying on it.

INCIDENTS (THE 30-DAY CLOCK)
Report immediately if NPI may have been exposed to an AI tool, or any suspected AI-driven fraud. A security event involving the unencrypted NPI of 500+ consumers must be reported to the FTC as soon as possible and within 30 days of discovery.

ACKNOWLEDGEMENT
Name: __________________  Role: __________  Signature: __________________  Date: ________

Maintained with ${d.practice||"Lodestar CAIO"}. Integrate with your WISP and (title) ALTA program. Review at least annually. Not legal advice.`;}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    esc, today, uid, daysUntil, normalizeState,
    snapExposures, scoreSnapshot,
    policyBrokerage, policyEscrowTitle
  };
}
