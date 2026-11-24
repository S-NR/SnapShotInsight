# Cyber Resilience Act: Findings

## Documents

### CRA in general
| File | Contents |
|---|---|
| [01_CRA_Overview.md](01_CRA_Overview.md) | The whole system: scope, exclusions, product classes, essential requirements, obligations, reporting, dates, penalties, and how the CRA relates to RED, NIS2, the Machinery Regulation, the AI Act, the Product Liability Directive, the Data Act, MDR and automotive law |
| [02_CRA_for_Tismo_Projects.md](02_CRA_for_Tismo_Projects.md) | Tismo's role (engineering partner vs. manufacturer), applicability per business line, engineering deliverables, recommended actions |

### Systec projects
| File | Contents |
|---|---|
| [03_CRA_for_Systec_Projects.md](03_CRA_for_Systec_Projects.md) | Systec products mapped to the CRA, legacy-instrument risk points (Modbus, SD-card updates, USB tools), timeline, retrofit roadmap. **Updated 23 Nov 2026:** DWC2 results per risk point, roadmap progress, and a DWC2 project section (results, decisions, next steps) |
| [04_CRA_DWC2_Codebase_Analysis.md](04_CRA_DWC2_Codebase_Analysis.md) | DWC2 firmware (PIC32MX575) code review against the CRA: attack surface, draft SBOM, 12 findings with file/line evidence (F5 updated 23 Nov: import-parser overflows), Part II gaps, remediation roadmap, open questions |
| [05_DWC2_CRA_Action_Plan.md](05_DWC2_CRA_Action_Plan.md) | Action plan per client request: Phase A tasks + hour estimates, draft assets/attack surface, first risk matrix, Nitrokey secure-boot feasibility, UI user-level and interface-security proposals, STRIDE prep, questions for Mr. Moser |
| [06_DWC2_CRA_WP1_Quick_Wins.md](06_DWC2_CRA_WP1_Quick_Wins.md) | Work package 1 (quick wins Q1): CRA task list, existing design/code, existing test baseline (IR 45 report), changes (bounded SD import parsing, JTAG off, code/write protection, release build guard), effort ≈ 42 h, new test cases |
| [DWC2_CRA_Risk_Assessment.pptx](DWC2_CRA_Risk_Assessment.pptx) | **DWC2 risk assessment, draft 0.1** (23 Nov 2026): templates v1.2 filled from 04–06: 10 components, 10 assets, 11 interfaces, 10 data flows, 15 threats, 15 risks re-rated on 5×5 (pending Q-13), treatment plan, Annex I Part I/II, WP1 traceability. "to confirm" marks systec inputs |

### Risk-assessment method (used for DWC2 and later Systec products)
| File | Contents |
|---|---|
| [CRA_Risk_Assessment_Guideline.pptx](CRA_Risk_Assessment_Guideline.pptx) | Team guideline: 8-step ISO 31000 process with STRIDE, worked example (connected thermostat) |
| [CRA_Risk_Assessment_Templates.pptx](CRA_Risk_Assessment_Templates.pptx) | Fillable templates T1–T15, **v1.2** (23 Nov 2026): adds Annex I Part II, Art. 14, Annex II, team and definition-of-done slides |
| [07_CRA_Risk_Assessment_Templates_Review.md](07_CRA_Risk_Assessment_Templates_Review.md) | Review of the templates vs. guideline and CRA: verdict, 25 findings, changes made in v1.2, open recommendations, impact on the DWC2 assessment |

---

## Systec project status (as of 23 Nov 2026)

**Role split:** Systec is the CRA manufacturer for its instruments and carries the Art. 13/14 obligations. Tismo is the firmware engineering partner and delivers the evidence. **Pilot product:** DWC2 (`SYSCTRL`, PIC32MX575F512L), branch `Phase_2-IR_46_DWC2`. **First assessment review:** February 2027.

### Where DWC2 stands
| Item (ref. 05 §2) | Status | Document |
|---|---|---|
| Code review against the CRA | Done: 12 findings, draft SBOM, Part II gaps | 04 |
| Action plan + estimates (Phase A ≈ 38 h) | Delivered Wk 46; questions with Mr. Moser | 05 |
| A1–A3 context, assets, attack surface | Draft, needs hardware/variant verification | 05 §3 |
| A4 SBOM (CycloneDX) | Draft component list only; bootloader BL 0.0.4 source not in repo | 04 §3 |
| A5 first risk matrix (R01–R15) | Draft re-rated on the 5×5 scale of templates v1.2: 3 High (R-01, R-04, R-12), no Critical; **pending approval of the criteria** (Q-13) | DWC2 deck T10, 05 §4 |
| Risk assessment record | Templates T1–T15 pre-filled as draft 0.1 | DWC2 deck |
| Q1 quick wins (WP1) | Designed, effort ≈ 42 h incl. tests; **awaiting Systec decision**. No source changed yet | 06 |
| S1 secure boot (Nitrokey) | Feasibility pre-check done; PoC Dec 2026 / Jan 2027; implementation 2027 | 05 §5 |
| S2 user levels / S3 interface security | Proposals ready for alignment | 05 §6–7 |
| B1 STRIDE (Phase B) | Planned Jan 2027, using templates T7–T8 | 05 §9 |
| Risk-assessment templates | Updated to v1.2 to match guideline and CRA | pptx, 07 |

### Decisions and inputs needed from Systec
| ID | Needed | Blocks |
|---|---|---|
| Q1 | Go / no-go for WP1 quick wins (≈ 42 h) | Implementation in Jan 2027 |
| Q-01 | Does BL 0.0.4 program config words from the hex? Is its source available? | WP1 C3, SBOM, S1 |
| Q-06 | Is flash read-back needed in service/production (reason for `CP = OFF`)? | WP1 C3 |
| Q-11 | Release toolchain (C32 v2.02 or XC32)? Can the AUTOBUILDER select an MPLAB X configuration? | WP1 C4, SBOM |
| Q-13 | Approve the 5×5 risk criteria (templates T4) for re-rating R01–R15 | A5 risk matrix |
| — | Systec owner for residual-risk acceptance (T14) and the Art. 14 reporting contact | Sign-off, reporting |
| — | Support period and models still sold after 11 Dec 2027 | Annex II, scope |

### Next steps
1. Wk 47–49: finish Phase A (A1–A6), SBOM v1; verify the DWC2 draft deck (T1–T10) with Mr. Moser.
2. Wk 50–51: Phase A report v1.0; Systec decision on WP1; start S1 Nitrokey PoC.
3. Jan 2027: WP1 implementation and tests (if approved); Phase B STRIDE.
4. Feb 2027: first CRA assessment review (checklist in 05 §11).
5. After DWC2: reuse the method and templates for the other Systec products (03 §5, step 4).

---

## Five things to remember
1. **It is a product law.** Anything with firmware and a data connection sold in the EU is in scope, wherever it was engineered.
2. **Most of our products are "default" class**, so self-assessment under Module A is available. Network/security devices are "important", and smart meter gateways are "critical".
3. **Reporting already applies (since 11 Sep 2026).** Actively exploited vulnerabilities must be reported within 24 h / 72 h / 14 days, for products already in the field too.
4. **Full compliance from 11 Dec 2027** for every unit placed on the market. In practice this needs secure boot/signed updates, no default passwords, access control on configuration, an SBOM, a CVD policy, and a support period of at least 5 years.
5. **Medical devices and type-approved vehicles are excluded**; their own sector laws apply.

*Engineering summary, not legal advice. Prepared 27 Oct 2026; Systec/DWC2 status updated 23 Nov 2026.*
