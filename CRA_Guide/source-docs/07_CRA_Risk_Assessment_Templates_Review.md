# Review: CRA Risk Assessment Templates (v1.1 → v1.2)

**Reviewed:** `CRA_Risk_Assessment_Templates.pptx` v1.1 (26 slides, T1–T15), checked against its companion `CRA_Risk_Assessment_Guideline.pptx` (28 slides), the CRA text (Regulation (EU) 2024/2847, Art. 13, 14, Annex I, II, VII) and our DWC2 work ([04](04_CRA_DWC2_Codebase_Analysis.md), [05](05_DWC2_CRA_Action_Plan.md)).
**Result:** the deck has been updated in place to **v1.2** (29 slides). The original v1.1 was kept as a backup outside the repo folder.
**Date:** 23 Nov 2026

---

## 1. Verdict

**Not perfect, but a solid base.** The template set follows the guideline's 8-step ISO 31000 process one-to-one, every template has a clear ID scheme and "feeds into" chain, and the formatting is consistent. The gaps were mainly **CRA-specific obligations that sit outside a pure ISO 31000 risk process**:
- Annex I **Part II** (vulnerability handling);
- **Art. 14** reporting;
- **Annex II** user information for residual risks;
- the **economic-operator role**, which matters when Tismo is the engineering partner and the customer is the manufacturer.

There were also a few traceability and consistency defects (ID clash, empty criteria, no completion gate).

| Area | v1.1 rating | Main reason |
|---|---|---|
| Coverage of the guideline process (steps 1–8) | Good | All steps have a template |
| Coverage of CRA obligations | **Partial** | Part II, Art. 14, Annex II, operator role missing |
| Traceability (asset → threat → risk → requirement → test → evidence) | Good, with one defect | Threat IDs `T-01` clashed with template IDs T1–T15; component not linked to threats |
| Usability | Fair | T4 empty although the guideline has example scales; legends missing; 10-row tables too small for real registers |
| Fitness as technical-file evidence (Annex VII) | Fair | Sales-style confidentiality text and marketing closing slide; no team record; no completion gate |

---

## 2. What is good (keep)
- Two-phase structure (understand the product first, then assess) and the note on slide 1 that T1–T3 must be approved before T4.
- Clear ID scheme: `A-` assets, `IF-` interfaces, `DF-`/`TB-` flows and boundaries, `C-` components, `R-` risks, `REQ-SEC-` requirements, `TC-` tests.
- T10 records **existing controls, assumptions and confidence**, as ISO 31000 and the guideline ask.
- T11 uses the guideline's four options (Avoid / Reduce / Share / Retain) and links each control to an Annex I reference.
- T12 lists every Annex I Part I §2 item, with a mandatory justification column for "not applicable".
- T15 trigger list matches the guideline's six triggers, and Document Control asks each revision to cite its T15 entry.

---

## 3. Findings and changes

Type: **Gap** = something missing · **Defect** = inconsistent or wrong · **Improve** = usability.
Status: **Done** = changed in v1.2 · **Open** = recommendation, needs a decision.

| # | Where | Type | Finding | v1.2 change | Status |
|---|---|---|---|---|---|
| 1 | T12 | **Gap** | Only Annex I **Part I §2(a)–(m)**. Part I **point 1** ("appropriate level of cybersecurity based on the risks") and the whole of **Part II** (vulnerability handling: SBOM, remediation, testing, disclosure, CVD policy, contact, secure update distribution, free updates) were missing. Part II always applies and is part of the technical documentation | Row **I.1** added. New slide **"T12 · Annex I Applicability Matrix – Part II"** with II.1–II.8, columns *How it is met / Owner / Evidence*, note "Part II always applies" | Done |
| 2 | T15 | **Gap** | No link to **Art. 14** reporting (actively exploited vulnerability / severe incident: 24 h early warning, 72 h notification, 14-day final report), which has applied since 11 Sep 2026 | Column **"Art. 14 reportable?"** (ENISA reference, report dates) | Done |
| 3 | T14 | **Gap** | Residual risks that the **user** must manage (e.g. network segmentation for Modbus TCP) had no route into the **user information (Annex II)** | Column **"User information (Annex II)"** | Done |
| 4 | T14 sign-off | **Gap** | Sign-off roles were Tismo-internal only. When the customer is the CRA manufacturer, the customer must accept the residual risk | Row **"Manufacturer representative"** | Done |
| 5 | T2 | **Gap** | No **economic-operator role** (manufacturer / importer / distributor / engineering partner; who signs the EU DoC). No **placing-on-market / substantial-modification** question, which is central for legacy products such as DWC2. No field for **other EU legislation** (RED, Machinery, MID, ATEX, LVD/EMC) | Three rows added | Done |
| 6 | T8, T10 | **Defect** | Threat IDs `T-01` clash with template numbers T1–T15 ("T8 lists T-08"?). The guideline's worked example also uses T1–T5 for threats | Threat IDs changed to **`TH-xx`** in T8, T10, T7, T11; explanation in notes. Guideline still uses T1–T5 (see #18) | Done (templates) |
| 7 | T8 | **Defect** | Threats were not linked to the **component (T3)**, although the component level decides the analysis and test depth | Column **"Component"** (`C-xx`) | Done |
| 8 | T4 | **Improve** | All scales and bands were empty, although the slide 1 note talks about grey example rows and the guideline gives example scales | Filled with the guideline's 5 × 5 scales, bands (Low 1–4, Medium 5–9, High 10–15, Critical 16–25), required actions and approval authority, **as grey examples**. Notes: impact must include harm to other devices/networks (I.2(i)) | Done |
| 9 | T3 | **Improve** | The level rule and the activities each level triggers (guideline slide "Then give each component a level") were not on the template | Legend added (rule + Low/Medium/High activities); note that third-party components keep the same `C-ID` in T9 | Done |
| 10 | T5 | **Improve** | "Au" and the C/I/A/Au → Annex I mapping were not explained; personal data and essential function not prompted | Legend added | Done |
| 11 | T1 | **Gap** | No **essential functions** field (needed for I.2(h) and as an asset in T5); no **personal data** field (I.2(g), (m), GDPR) | Two rows added | Done |
| 12 | T6 | **Gap** | "Enabled in production" did not capture the **default state** (secure by default, I.2(b), (j)) | Column **"Default state"** | Done |
| 13 | T7 | **Gap** | The guideline rule "every boundary-crossing flow gets a STRIDE review" (also in its definition of done) could not be checked on the template | Column **"STRIDE reviewed"** (with TH- references) | Done |
| 14 | T9 | **Gap** | No date of the last vulnerability check, so CVE monitoring cannot be shown | Column **"Last checked"** | Done |
| 15 | T11 | **Gap** | The guideline warns that controls can add new risks (e.g. a signing key to protect) and feed back to step 4; the template had no place for that | Column **"New risks introduced"** | Done |
| 16 | Missing slide | **Gap** | No **definition-of-done / gate checklist**, although the guideline ends with one | New slide **"T14 · Definition of Done (gate checklist)"**: the guideline's 8 criteria + "controls traced to verification" + "Annex II user information written" | Done |
| 17 | Missing slide | **Gap** | No record of **who took part** (guideline slide "Who takes part"; ISO 31000 "communicate and consult") | New slide **"Assessment Team"** after Document Control, incl. manufacturer representative | Done |
| 18 | Document Control | **Gap** | No hardware revision, support-period end or link to related records (SBOM, technical-file ID) | Three rows added (revision table extended to match) | Done |
| 19 | Slide 2 | **Defect** | Confidentiality text was sales boilerplate ("to evaluate Tismo") and forbade any disclosure, which conflicts with giving the technical documentation to **market surveillance authorities** on request | Reworded: confidential to Tismo and << Customer >>, part of Annex VII documentation, disclosure to authorities allowed | Done |
| 20 | Overview | **Improve** | Overview did not mention the new slides or the ID rule | T12/T14 rows renamed; note added (team slide, TH-IDs, registers may live in a spreadsheet) | Done |
| 21 | Slide 26 | **Defect** | Marketing closing slide ("Let's accelerate your roadmap", project counts) does not belong in an evidence document in the technical file | — | **Open:** recommend removing it from the template (brand decision) |
| 22 | Format | **Improve** | 10-row PowerPoint tables are too small for real registers: DWC2 already has 11 interfaces, 15 risks and 10+ components. Copy-pasted slides break traceability | Note on overview slide | **Open:** provide an Excel workbook with the same columns (one sheet per template) and keep the deck for summary and sign-off; or use the requirements/test tool as the guideline suggests |
| 23 | T10/T14 | **Improve** | No before/after **heat map** like the guideline's worked example | — | **Open:** add a 5 × 5 matrix slide after T10 and T14 (optional) |
| 24 | T9/T15 | **Improve** | No vulnerability severity score | — | **Open:** add CVSS (or vendor severity) to T9 "Known vulnerabilities" and T15 |
| 25 | All | **Improve** | Requirement text for `REQ-SEC-xx` lives only in T11 "Control / action" | — | **Open:** acceptable for small products; for larger ones use a requirements list |

---

## 4. Observations on the guideline deck (not changed)
The request was to update the templates only. These points in `CRA_Risk_Assessment_Guideline.pptx` should be aligned in its next revision:
1. The worked example uses threat IDs **T1–T5** (slides 18, 21, 23). Change them to **TH-1…TH-5** to match template v1.2.
2. "Definition of done" (slide 27) and "Record it as an evidence package" (slide 24) do not mention **Annex I Part II**, **Art. 14 reporting** or **Annex II user information**.
3. The references (slide 28) list **ETSI EN 303 645** (consumer IoT) but not **IEC 62443-4-1 / 4-2** (industrial components) or the CRA harmonised standards CEN/CENELEC are drafting (JTC 13, EN 40000 series). For Systec-type industrial products, IEC 62443 is the more relevant checklist.
4. The worked example is a consumer thermostat. An optional industrial example (e.g. a flow meter on Modbus/M-Bus) would help teams like DWC2.
5. The slide sizes differ (guideline 33.9 × 19.05 cm, templates 37.6 × 21.2 cm). This is cosmetic, but copying slides between the decks rescales them.

---

## 5. Consequences for the DWC2 assessment ([05](05_DWC2_CRA_Action_Plan.md))

| DWC2 item | Template v1.2 | Action |
|---|---|---|
| Risk method in 05 §4: **4 × 4** scale, bands 1–3 / 4–6 / 8–9 / 12–16 | T4 uses the guideline's **5 × 5** scale, bands 1–4 / 5–9 / 10–15 / 16–25 | **Re-rate R01–R15 on the 5 × 5 scale** once T4 is approved (open question Q-13). The risk order will not change much, but the band thresholds do |
| Assets AS1–AS10 (05 §3.2) | T5 (`A-xx`), now with Au column | Add authenticity rating; add essential function "flow/heat measurement and output" as an asset |
| Interfaces IF1–IF11 (05 §3.3) | T6, now with default state | Fill "Default state" (e.g. USB MSD active whenever USB is plugged in?) |
| SBOM draft (04 §3) | T3 + T9 with shared `C-ID`, last-checked date | Assign component levels; e.g. bootloader = High (future signature check), FAT/USB stacks = Medium |
| Risks R01–R15 | T10 with `TH-xx` threats in T8 | Write each risk's threat as `TH-xx` in T8 first (Phase B STRIDE) |
| Residual risk R01 (unsigned update until 2027) | T14 with Annex II column | Note the interim user guidance (physical access control, update procedure) |
| Customer is the CRA manufacturer (Systec) | T2 operator role, team + sign-off "Manufacturer representative" | Systec (Mr. Moser) signs residual-risk acceptance; Tismo prepares |
| Art. 14 runbook (risk R12) | T15 column + T12 Part II | Link the runbook from T12 II.5/II.6 |

---

## 6. Template set v1.2 at a glance

| Slide | Template | Fields / columns (v1.2 additions in **bold**) |
|---|---|---|
| 1 | Title | Customer / product, date |
| 2 | Confidentiality | **Reworded for technical-file use** |
| 3 | Document Control | Document ID, product/variant, firmware version, assessment version, status, prepared/reviewed/approved by, **hardware revision, support period end, related records**; revision history |
| 4 | **Assessment Team** (new) | **Role, name, responsibility, workshops attended** |
| 5 | Overview | T1–T15 map + **note** |
| 7 | T1 Scope & Deployment | Product & variants, description & core function, **essential functions**, intended purpose, foreseeable use & misuse, environment, deployment, fleet & markets, users, **personal data**, lifetime & support period, scope, assumptions |
| 8 | T2 Product Classification | Core function, in scope, **operator role**, **placed on market / substantial modification**, sector exclusion, Annex IV / III-II / III-I, category, route, **other EU legislation**, standards, approval |
| 9 | T3 Component Classification | ID, component, origin, shipped, security function, robustness claim, level, rationale, owner + **legend** |
| 11 | T4 Risk Criteria | **Example** likelihood / impact scales, bands, actions, authorities; freeze line |
| 13 | T5 Asset Register | ID, asset, type, location, C, I, A, Au, owner, notes + **legend** |
| 14 | T6 Interfaces | ID, interface, protocol, exposure, authentication, enabled in production, **default state**, assets, notes |
| 15 | T7 Data Flows | Diagram; flow ID, from → to, data, boundary, protection, **STRIDE reviewed** |
| 16 | T8 Threat Register | **TH-ID**, threat, STRIDE, flow/interface, asset, **component**, source |
| 17 | T9 Third-Party Components | ID, component, version, supplier, licence, support ends, advisory channel, known vulnerabilities, **last checked** |
| 19 | T10 Risk Analysis | Risk ID, **TH-ID**, existing controls, L, I, score, band, assumptions, decision, owner |
| 21 | T11 Treatment Plan | Risk ID, option, control, requirement ID, Annex I ref, owner, due, status, **new risks introduced** |
| 22 | T12 Annex I Part I | **I.1** + I.2(a)–(m) |
| 23 | **T12 Annex I Part II** (new) | **II.1–II.8, how met, owner, evidence** |
| 24 | T13 Traceability | Risk, requirement, design element, test, result, evidence |
| 25 | T14 Residual Risk | Risk ID, residual L/I, score, band, rationale, **user information (Annex II)**; sign-off incl. **manufacturer representative** |
| 26 | **T14 Definition of Done** (new) | **10 gate criteria, done, evidence, checked by** |
| 28 | T15 Review & Trigger Log | Date, trigger, description, affected, action, **Art. 14 reportable?**, new version |

Slides 6, 10, 12, 18, 20, 27 are section dividers; slide 29 is the closing slide (see finding #21).

*Engineering review, not legal advice. Annex wording in the deck is paraphrased; cite the official regulation text in evidence.*
