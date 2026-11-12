# Cyber Resilience Act: Findings

| File | Contents |
|---|---|
| [01_CRA_Overview.md](01_CRA_Overview.md) | The whole system: scope, exclusions, product classes, essential requirements, obligations, reporting, dates, penalties, and how the CRA relates to RED, NIS2, the Machinery Regulation, the AI Act, the Product Liability Directive, the Data Act, MDR and automotive law |
| [02_CRA_for_Tismo_Projects.md](02_CRA_for_Tismo_Projects.md) | Tismo's role (engineering partner vs. manufacturer), applicability per business line, engineering deliverables, recommended actions |
| [03_CRA_for_Systec_Projects.md](03_CRA_for_Systec_Projects.md) | Systec products mapped to the CRA, legacy-instrument risk points (Modbus, SD-card updates, USB tools), timeline, retrofit roadmap |
| [05_DWC2_CRA_Action_Plan.md](05_DWC2_CRA_Action_Plan.md) | Action plan per client request: Phase A tasks + hour estimates, draft assets/attack surface, first risk matrix, Nitrokey secure-boot feasibility, UI user-level and interface-security proposals, STRIDE prep, questions for Mr. Moser |
| [04_CRA_DWC2_Codebase_Analysis.md](04_CRA_DWC2_Codebase_Analysis.md) | DWC2 firmware (PIC32MX575) code review against the CRA: attack surface, draft SBOM, 12 findings with file/line evidence, Part II gaps, remediation roadmap, open questions |

## Five things to remember
1. **It is a product law.** Anything with firmware and a data connection sold in the EU is in scope, wherever it was engineered.
2. **Most of our products are "default" class**, so self-assessment under Module A is available. Network/security devices are "important", and smart meter gateways are "critical".
3. **Reporting already applies (since 11 Sep 2026).** Actively exploited vulnerabilities must be reported within 24 h / 72 h / 14 days, for products already in the field too.
4. **Full compliance from 11 Dec 2027** for every unit placed on the market. In practice this needs secure boot/signed updates, no default passwords, access control on configuration, an SBOM, a CVD policy, and a support period of at least 5 years.
5. **Medical devices and type-approved vehicles are excluded**; their own sector laws apply.

*Engineering summary, not legal advice. Prepared 27 Oct 2026.*
