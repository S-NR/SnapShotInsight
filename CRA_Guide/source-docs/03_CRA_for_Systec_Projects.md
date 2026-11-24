# CRA: What It Means for Systec Projects

This is based on systec Controls' public website, <https://www.systec-controls.de/english/home.html>, and product pages, read alongside [01_CRA_Overview.md](01_CRA_Overview.md). It is an engineering assessment, not legal advice. Systec, as manufacturer, must make the final classification.

> **Update 23 Nov 2026:** the first Systec product, the **DWC2 firmware** (deltawave family), is now under CRA assessment. The code review confirmed most of the generic risk points in section 3. Status, results and next steps are in [section 7](#7-current-project-dwc2-cra-assessment); details are in documents 04–07.

---

## 1. Systec's position under the CRA

systec Controls (Germany) **manufactures and sells measurement instruments under its own name** in the EU. For those products, **Systec is the CRA manufacturer** and carries all Art. 13/14 obligations. Tismo, as the firmware engineering partner, delivers much of the evidence.

Its customers operate in **water/wastewater, power plants, hydropower, district heating, gas, chemicals, food & pharma, cement and automotive test**. Many of them are **NIS2 essential or important entities**, so they will require cybersecurity evidence from Systec as a supplier, independently of the CRA.

---

## 2. Product-by-product applicability

Interfaces are taken from the public product pages where they were stated. Anything not confirmed there is marked "to verify".

| Product family | Example products | Known interfaces | CRA applies? | Likely class / route |
|---|---|---|---|---|
| **Ultrasonic flow (open channel / pipes)** | deltawave, deltawaveVER2LEAN, wetted transducers | **RS485, Modbus, M-Bus, USB** (PC parameterisation), **removable SD card for data logging, setup and updates**, analog/digital outputs, optional **GSM modem** for remote transmission. **DWC2 code review adds:** Modbus TCP via an external TCP↔RTU converter (Ethernet), local keypad/display, JTAG/ICSP | **Yes** (DWC2 confirmed in scope, see [04](04_CRA_DWC2_Codebase_Analysis.md)) | **Default → Module A** |
| **Ultrasonic clamp-on** | deltawaveC-fix, portable clamp-on, clamp-on for gas | To verify (likely similar to deltawave) | **Yes** | Default |
| **Ultrasonic gas meter** | deltawave SUF | To verify | **Yes** | Default. Check MID/legal-metrology overlap if used for billing |
| **Differential-pressure flow** | deltaflow, deltaflowC, ring flow, deltaflow-pitot | To verify (4–20 mA, possibly HART/Modbus) | **Yes**, if it has firmware **and** any data interface. A purely mechanical primary element is **not** | Default |
| **Multivariable transmitter** | SYS-MMF | To verify | **Yes** | Default |
| **Flow computer** | flowcom | **Modbus, USB**, data logging, Windows software | **Yes** | Default |
| **Coriolis** | Coriolis flow meter | To verify | **Yes** if it has firmware + interface | Default |
| **Regulator / accessories** | deltafit, air-flushing system, wall thickness gauge | To verify | Only if they have firmware + a data connection | Default |
| **PC software** | **SystecParamSoftware**, **flowcom software**, **deltacalc** | Windows; USB connection to device | **Yes**. These are software products with digital elements, also when supplied free with the device | Default |
| **systec Automotive** | Pitot probes, gas mass flow sensors, exhaust-gas flow meters, OEM sensors | To verify | **Yes** for test-bench and industrial equipment. The vehicle exclusion covers only **type-approved vehicle components** | Default; check for OEM in-vehicle use |

**Why "default" class:** none of these products has a *core function* listed in Annex III or IV. They are not routers, firewalls, network interfaces, OS or smart meter gateways. So **Module A self-assessment** is available, and no notified body is needed. Self-assessment is still a legal declaration, and market surveillance can audit it.

**Other CE regimes stay in place alongside the CRA:**
- EMC and LVD;
- **ATEX** for any Ex-rated variants;
- **PED** for high-pressure parts;
- **MID** where used for custody transfer;
- **RED** if a radio module (e.g. the GSM option) is integrated rather than an external, separately CE-marked modem.

---

## 3. Systec-specific risk points (typical for legacy industrial instruments)

The last column shows what the DWC2 code review ([04](04_CRA_DWC2_Codebase_Analysis.md), Nov 2026) found for each point.

| Area | Typical current state in legacy instruments | CRA requirement | What to do | DWC2 result |
|---|---|---|---|---|
| **Modbus RTU / M-Bus** | No authentication by protocol design; any bus master can write parameters | I.2d access control, I.2f integrity, I.2j attack surface | Separate read-only measurement registers from write-protected config. Use a write-enable/password or service mode for parameter writes. Document in the risk assessment that the bus is assumed to be inside a protected OT zone (IEC 62443 zone/conduit) | Modbus is read-only; M-Bus allows unauthenticated persistent changes (F7). Modbus TCP converter uses a fixed "secure code" (F8) |
| **SD card "setup and updates"** | The card can load configuration and firmware | I.2c secure updates, I.2f integrity | **Sign firmware images and verify them in the bootloader.** Authenticate config files. Add anti-rollback. *This is likely the single most important retrofit* | **Confirmed:** unsigned firmware update (F1); stack overflow in parameter-file import (F5, fix designed in WP1) |
| **USB parameterisation (SystecParamSoftware, flowcom)** | Local PC tool, often without authentication | I.2d, I.2b secure by default | Device-side service password / unique credentials. Log config changes | USB MSD exposes the SD card incl. the reversibly encoded PIN file (F4) |
| **Device password** | Optional PIN, master/service codes | I.2b, I.2d | Unique or user-set credentials, no master code, attempt limiting | **Hard-coded master PIN** (F3); 4-digit PIN optional, no lockout (F4) |
| **GSM remote transmission** | Data sent over cellular, possibly unencrypted | I.2e confidentiality, I.2h availability | Use an encrypted transport (VPN/TLS-capable modem). Document the customer's responsibilities in Annex II instructions | Not found in DWC2 firmware (to confirm) |
| **Calibration & measurement data** | Stored in flash/EEPROM | I.2f integrity | CRC/MAC on calibration tables; detect and report corruption (fits metrology needs too) | No integrity protection on parameters/calibration (F6) |
| **Debug ports** | JTAG/SWD may be accessible | I.2j, I.2k | Enable read-out protection / debug lock in production | **Confirmed:** JTAG enabled, code and boot-flash protection off (F2); fix designed in WP1 |
| **Long product life (often 10–20 years in the field)** | Support often informal | Art. 13(8): support period reflects **expected use time**, minimum 5 years | Define and publish a support end date per product. Plan toolchain and build archiving for years of security fixes | Support period not defined; old toolchain (C32 v2.02) to archive |
| **Third-party components** | Vendor HAL, RTOS, protocol stacks; versions may be undocumented | Annex I Part II.1 **SBOM**; Art. 13(5) due diligence | **Recover the SBOM from the existing firmware** and monitor CVEs | Draft SBOM recovered; bootloader BL 0.0.4 source not in the repo |
| **Vulnerability reporting** | Probably no formal process | Art. 14 (**applies since 11 Sep 2026**), Part II.5–6 | Publish a security contact and CVD policy. Define a 24 h / 72 h / 14-day reporting runbook with an owner and ENISA platform access | No process yet; Systec owner and contact still to be named |
| **Security logging** | None | I.2l | Log config, PIN, import, reset and update events | No security event log (F9) |

---

## 4. Timeline implications for Systec

| Date | Implication |
|---|---|
| **Now (since 11 Sep 2026)** | Report any **actively exploited vulnerability** or severe incident in **any** Systec product on the EU market, including units sold years ago, within 24 h. A process and contact are needed today. |
| **11 Dec 2027** | Every unit **placed on the market from this date** must meet Annex I, carry a CRA-covering DoC/CE, and have a technical file. That includes long-running models. |
| Before 11 Dec 2027 | Units already sold are out of scope for the design requirements unless **substantially modified**, for example by a firmware release that changes security-relevant behaviour. Their reporting obligations still apply. |

---

## 5. Recommended roadmap (Systec + Tismo brownfield team)

1. **Product inventory & classification (now).** List every product and software tool, and record its interfaces, firmware version, MCU, components, EU sales status and expected sales after Dec 2027. Confirm "default" class for each.
2. **Vulnerability-handling process (now, legally required).** Security contact, CVD policy, Art. 14 reporting runbook, ENISA platform account, and an internal owner.
3. **SBOM recovery & CVE baseline** for each firmware and PC tool.
4. **Per-product risk assessment** (Annex I.1), using IEC 62443-4-2 component requirements as the checklist, since NIS2 customers in water and energy will ask for them.
5. **Security retrofit of the brownfield firmware.** Priority order:
   1. signed firmware and secure update via SD card/USB;
   2. write-protection of configuration over Modbus/USB;
   3. debug lock;
   4. integrity of calibration and config data;
   5. security event logging;
   6. secure factory reset / data erase.
6. **Technical file + DoC** per product (Annex VII) and updated user documentation (Annex II: support end date, secure installation, update instructions).
7. **Decide support periods** and the end-of-sale vs. CRA-retrofit strategy for older models.

**Fit with the Brownfield AI-native SDLC:** steps 3–5 are exactly where the proposed *Firmware Understanding + Change Impact Analyzer* helps. It can map interfaces (attack surface), recover components (SBOM), and analyse the impact of security retrofits. That matters because a retrofit must not change measurement behaviour, Modbus register maps, or behaviour customers rely on. A Systec product would make a good pilot for that MVP. **DWC2 is now that pilot** (section 7).

**Roadmap progress (23 Nov 2026):**

| Step | Status |
|---|---|
| 1. Inventory & classification | DWC2 done (default class); other products not started |
| 2. Vulnerability-handling process | Not started; needs a Systec owner (open) |
| 3. SBOM & CVE baseline | DWC2 draft; formal CycloneDX SBOM in Phase A |
| 4. Per-product risk assessment | DWC2 Phase A in progress; method and templates v1.2 ready for reuse |
| 5. Security retrofit | DWC2 quick wins (WP1) designed, awaiting decision; secure boot planned for 2027 |
| 6. Technical file + DoC | Not started |
| 7. Support periods | Open question to Systec |

---

## 6. Open questions to confirm with Systec
- Full interface list per product (HART? Profibus? Ethernet? Bluetooth/app?). Ethernet or wireless would raise the risk level and, for wireless, bring in RED. *DWC2: Ethernet exists via the Modbus TCP converter; who supplies it and whether it is sold as part of DWC2 is still open.*
- Does any product already support signed or authenticated firmware updates? *DWC2: no (F1).*
- Which models will still be sold after 11 Dec 2027?
- Is the GSM modem an integrated module or an external, separately CE-marked device?
- Are any products sold for **custody transfer (MID)** or into **Ex areas (ATEX)**?
- Does systec Automotive supply any sensor as part of a **type-approved vehicle**? That would be excluded from the CRA.

DWC2-specific questions are tracked separately with Mr. Moser ([05](05_DWC2_CRA_Action_Plan.md) §8, [06](06_DWC2_CRA_WP1_Quick_Wins.md) §7).

---

## 7. Current project: DWC2 CRA assessment

**Product:** DWC2 controller firmware (`SYSCTRL`, PIC32MX575F512L), 1- and 2-channel variants, branch `Phase_2-IR_46_DWC2`. **Scope agreed with the client:** current release only, basic risk assessment + SBOM first, step-by-step TARA; secure bootloader postponed to 2027. **First assessment review:** February 2027.

### 7.1 Results so far
| Document | Result |
|---|---|
| [04 Codebase analysis](04_CRA_DWC2_Codebase_Analysis.md) | CRA readiness **low**. 12 findings, 5 rated high: unsigned SD firmware update (F1), code/boot-flash protection and JTAG open (F2), hard-coded master PIN (F3), weak reversible PIN storage (F4), stack overflow in SD parameter import (F5). Draft SBOM and Part II gaps |
| [05 Action plan](05_DWC2_CRA_Action_Plan.md) | Phase A ≈ 38 h; draft context, assets, attack surface and first risk matrix (R01–R15); Nitrokey secure-boot pre-check (feasible); proposals for UI user levels (S2) and interface security (S3) |
| [06 WP1 quick wins](06_DWC2_CRA_WP1_Quick_Wins.md) | Bounded SD import parsing, JTAG off, code/write protection, release-build guard. ≈ 42 h incl. tests; 22 new test cases. No source changed yet |
| [Templates v1.2](CRA_Risk_Assessment_Templates.pptx) + [07 review](07_CRA_Risk_Assessment_Templates_Review.md) | Templates aligned with the guideline and the CRA (Part II, Art. 14, Annex II, manufacturer role) |
| [DWC2 risk assessment, draft 0.1](DWC2_CRA_Risk_Assessment.pptx) | T1–T15 filled from 04–06. Risks re-rated on 5×5 (draft, pending Q-13): **3 High** (R-01 unsigned SD update, R-04 master PIN / config change, R-12 Art. 14 process), no Critical; the rest Medium/Low |

### 7.2 Decisions needed from Systec
- Go / no-go for WP1 quick wins (≈ 42 h, implementation Jan 2027).
- Bootloader BL 0.0.4: does it program the config words, and is its source available? (Q-01)
- Reason for `CP = OFF` (flash read-back in service or production?) (Q-06) and the release toolchain (Q-11).
- Approval of the 5×5 risk criteria for re-rating R01–R15 (Q-13).
- Systec owner for residual-risk acceptance and the Art. 14 reporting contact.
- Support period for DWC2 and whether it is sold after 11 Dec 2027.

### 7.3 Next steps
| When | What |
|---|---|
| Wk 47–49 | Finish Phase A (A1–A6), SBOM v1; verify the DWC2 draft deck (T1–T10) with Mr. Moser |
| Wk 50–51 | Phase A report v1.0; Systec decision on WP1; S1 Nitrokey PoC starts |
| Jan 2027 | WP1 implementation and tests (if approved); Phase B STRIDE (T7–T8) |
| Feb 2027 | First CRA assessment review |
| After DWC2 | Reuse the method, templates and lessons for the other Systec products (roadmap step 4) |

## Sources
- <https://www.systec-controls.de/english/home.html>
- deltawave: <https://www.systec-controls.de/english/industrial-products/flow/deltawave.html>
- flowcom: <https://www.systec-controls.de/english/flow-computer-flowcom.html>
- CRA: <https://www.cyberresilienceact.eu/regulation.html>, <https://www.cyberresilienceact.eu/annexes.html>
