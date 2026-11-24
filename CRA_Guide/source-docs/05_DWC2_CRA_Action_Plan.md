# DWC2 CRA Assessment: Action Plan

**Project:** systec DWC2 firmware (`SYSCTRL`, PIC32MX575F512L)
**Prepared:** 12 Nov 2026 · Tismo Brownfield team
**Based on:** client requirements (CRA assessment, Phase A/B) + code findings in [04_CRA_DWC2_Codebase_Analysis.md](04_CRA_DWC2_Codebase_Analysis.md)
**Contact for open questions while the client is absent:** Mr. Moser (DWC product manager). Questions are collected in section 8.
**First review of the CRA assessment:** February 2027

> Status of all hour figures: **estimates for planning**, ±25%, assuming one engineer familiar with the codebase and timely answers to the open questions. They exclude client-side review time.

---

## 1. Ground rules (agreed scope)

| Rule | Consequence for the work |
|---|---|
| **Current state / future only. No reconstruction of history** | Assess the current release branch and its build configuration only. No SBOMs or risk analyses for older IR releases |
| **Start with the basic CRA risk assessment + SBOM** | Phase A delivers both. The SBOM is required in any case (CRA Annex I Part II.1) |
| **Basic TARA, step by step** | Phase A (context, assets, attack surface, first risk matrix) → treat first issues → Phase B (STRIDE threat modelling) |
| **Missing information is collected, not guessed** | Every assumption is marked "to confirm" and goes into the question list (section 8) |
| **Secure bootloader postponed to 2027** | 2026: feasibility check only (Nitrokey + PIC32), plus low-cost interim measures |

---

## 2. Action overview

| ID | Action | Output | Estimate (h) | Owner | Target | Status |
|---|---|---|---|---|---|---|
| **A1** | System context & data-flow diagram, trust boundaries | Context diagram + DFD (section 3.1) | 6 | Tismo | Phase A | Draft started |
| **A2** | Asset identification & classification | Asset register (section 3.2) | 4 | Tismo | Phase A | Draft below |
| **A3** | Attack-surface verification (UART, SPI, I2C, JTAG/ICSP, USB, SD, M-Bus, Modbus RTU/TCP, UI) including PCB access check | Interface register (section 3.3) | 8 | Tismo + Moser (HW info) | Phase A | Draft below |
| **A4** | SBOM for the current release (CycloneDX JSON + readable table), incl. bootloader, converter, toolchain, licences | `DWC2_SBOM.cdx.json` + table | 8 | Tismo | Phase A | Draft list in 04 §3 |
| **A5** | Risk analysis method + **first risk matrix** + team review | Risk register + matrix (section 4) | 8 | Tismo | Phase A | Draft below |
| **A6** | Collect missing information, align with Mr. Moser, consolidate Phase A report | Phase A report v1.0 | 4 | Tismo + Moser | Phase A | Questions in §8 |
| | **Phase A total** | | **≈ 38 h** (range 32–44 h) | | | |
| **S1** | Secure-boot feasibility: Nitrokey signing + PIC32 verification, alternatives | Feasibility note + PoC on dev board | 12–16 | Tismo | Dec 2026 / Jan 2027 | Pre-check in §5 |
| **S2** | UI user levels / access control: proposal | Concept + menu-to-role mapping + estimate | 12 (proposal) | Tismo + Moser | With Phase A | Proposal in §6 |
| **S3** | Security measures for communication interfaces: proposal | Measure catalogue + estimate | 8 (proposal) | Tismo | With Phase A | Proposal in §7 |
| **Q1** | Quick wins (decision needed, see §7.2) | Code changes in maintenance branch | 16–24 (code only); **≈ 42 incl. tests**, see [06](06_DWC2_CRA_WP1_Quick_Wins.md) | Tismo | After decision | Detailed in 06 (23 Nov 2026) |
| **B1** | Phase B: STRIDE threat modelling | Threat catalogue + updated risk register | 24–40 | Tismo | Jan 2027 | After first issues treated |
| **R1** | Review package for February | CRA assessment v1 (Phase A + B, SBOM, measures plan) | 8 | Tismo | Before Feb review | — |

**Answer to the time-estimate request (Phase A incl. first risk matrix): about 38 hours.** Draft content for A2, A3 and A5 is already pre-filled in this document from the code review. The remaining effort is mainly verification (hardware, build variants), the formal SBOM, and alignment with Mr. Moser.

---

## 3. Phase A: System context and asset identification

### 3.1 System context (A1, draft)

```
                     ┌───────────────────────── DWC2 device ─────────────────────────┐
  Operator ──keypad──►  GUI (easyGUI)          PIC32MX575F512L                         │
           ◄─display─┤  (PMP parallel bus)     ┌──────────────────────────────┐        │
                     │                         │ Bootloader BL 0.0.4 (52 KB)  │        │
  SD card ◄──SPI────►│  FAT FS (Microchip MDD) │ Application SYSCTRL          │        │
  PC ◄──USB (MSD)───►│  exposes SD card        │ FreeModbus · M-Bus slave     │        │
                     │                         └──────────────────────────────┘        │
  SCADA ◄─RS485 Modbus RTU (read-only)─ UART1   SPI1: LTC2402 ADC   SPI2: MRAM (params, │
  SCADA ◄─Ethernet─[TCP↔RTU converter]─ UART1   calibration)        I2C1/2: MCP9801 temp│
  M-Bus master ◄─M-Bus─►                        JTAG/trace pins RA0–RA7 (not disabled)  │
                     └─────────────────────────────────────────────────────────────────┘
  Trust boundaries: (1) device housing / PCB access  (2) removable media & USB  (3) field buses  (4) Ethernet via converter
```

### 3.2 Assets (A2, draft)

Ratings: C = confidentiality, I = integrity, A = availability (H/M/L).

| ID | Asset | Where | C | I | A | Notes |
|---|---|---|---|---|---|---|
| AS1 | **Application firmware** (incl. measurement algorithms = Systec IP) | Internal flash | **H** (IP) | **H** | H | Readable via JTAG/ICSP (CP off). Replaceable via SD bootloader |
| AS2 | **Bootloader** | Internal flash, 0x9D000000–0x9D00CFFF | M | **H** | H | Root of trust for updates. Source not in repo |
| AS3 | **Calibration & parameter data** (MUS params, AI calib, flow-error tables, transducer data) | External MRAM (SPI2) | M | **H** | H | No integrity check today |
| AS4 | **Measurement results & totalizers** (flow, heat, mass) | RAM, MRAM, SD log, Modbus/M-Bus | L | **H** | **H** | Possibly billing-relevant (heat) → to confirm |
| AS5 | **User PIN / access codes** | MRAM + `protect.dwc` on SD | **H** | H | M | Reversible encoding; master PIN 5555 |
| AS6 | **Logger activation key** | MRAM + SD | M | M | L | Feature licensing |
| AS7 | **Communication configuration** (Modbus/M-Bus addresses, baud, converter IP) | MRAM, converter | L | M | **H** | Changes can break SCADA readout |
| AS8 | **Cryptographic keys** | — | — | — | — | **None present today.** Future: signing private key (offline, Nitrokey) + public key in bootloader (integrity-critical, not secret) |
| AS9 | **Log data on SD** | SD card | L/M | M | M | Personal data: **assumed none**, to confirm (user names, site/customer names in PAR files?) |
| AS10 | **Device identity** (serial number, M-Bus secondary address) | MRAM | L | M | M | Needed later for device-unique codes |

### 3.3 Attack surface (A3, draft)

| ID | Interface | Exposure | Current protection | Verification needed |
|---|---|---|---|---|
| IF1 | **JTAG + trace** (RA0/1/4/5, RA6/7) | Physical (PCB) | **None.** JTAG not disabled in code; on PIC32MX it is enabled after reset | Are JTAG pads/header populated? Housing sealed? |
| IF2 | **ICSP** (PGEC/PGED) | Physical (PCB) | **None.** Code protection `CP = OFF` | Production programming procedure |
| IF3 | **SD card** (SPI) | Physical, removable, customer-handled | None (file contents trusted) | Which files does the customer use? |
| IF4 | **USB device (Mass Storage)** | Physical, PC connection | None (full read/write of SD) | When is MSD active? Always when USB plugged? |
| IF5 | **UART1: Modbus RTU / RS485** | Field bus | Write functions compiled out (read-only) | Confirm for all variants |
| IF6 | **UART1 via TCP↔RTU converter (Modbus TCP)** | **Network** | Read-only Modbus. Converter config uses fixed code | Converter type, web UI, credentials, update path |
| IF7 | **M-Bus** | Field bus | None (protocol) | Which values are writable via SND_UD? |
| IF8 | **UART service / debug output** | Physical | `CMD_ENABLE` and debug flags not defined | Release build configs |
| IF9 | **SPI1/SPI2 on-board** (LTC2402 ADC, MRAM) | Physical (PCB probing) | None | Low priority. Physical access already gives JTAG |
| IF10 | **I2C1/I2C2 on-board** (MCP9801 temperature sensor) | Physical | None | Low priority |
| IF11 | **Keypad / display UI** | Local | Optional 4-digit PIN, master PIN | See S2 |

---

## 4. First risk assessment (A5, draft matrix)

**Method:**
- **Likelihood:** 1 = rare, 2 = possible, 3 = likely, 4 = almost certain. This considers attacker access, effort and knowledge.
- **Impact:** 1 = minor, 2 = moderate, 3 = major, 4 = severe. This considers measurement integrity, safety/plant operation, customer billing, Systec IP and reputation.
- **Risk** = Likelihood × Impact: 1–3 low · 4–6 medium · 8–9 high · 12–16 critical.

The method is aligned with ISO/IEC 27005 / IEC 62443-3-2 style risk analysis. The final method is to be confirmed with the client.

| ID | Risk (threat → asset) | Interface | L | I | Score | Level | Planned treatment |
|---|---|---|---|---|---|---|---|
| R01 | Tampered or foreign firmware installed via `SYSCTRL.hex` on SD/USB → AS1, AS4 | IF3, IF4 | 3 | 4 | **12** | **Critical** | Interim: §5.4. Final: signed boot (S1, 2027) |
| R02 | Firmware/IP read-out via JTAG/ICSP → AS1 | IF1, IF2 | 2 | 3 | 6 | Medium | Disable JTAG, `CP = ON` (Q1) |
| R03 | Bootloader/firmware overwritten via JTAG/ICSP → AS1, AS2 | IF1, IF2 | 2 | 4 | **8** | High | Disable JTAG, `CP`, `PWP`/`BWP` (Q1) |
| R04 | Unauthorized configuration/calibration change via UI (master PIN 5555, PIN optional) → AS3, AS4 | IF11 | 3 | 3 | **9** | High | User levels (S2) |
| R05 | PIN disclosure from `protect.dwc` via SD/USB → AS5 | IF3, IF4 | 3 | 3 | **9** | High | Hashed PIN in MRAM, no SD copy (S2) |
| R06 | Crafted parameter file → stack overflow in `read_line()` → crash/code execution → AS1, AS4 | IF3, IF4 | 2 | 4 | **8** | High | Bounds fix + fuzz test (Q1, S3) |
| R07 | Undetected corruption/manipulation of calibration in MRAM → AS3, AS4 | IF3, IF9 | 2 | 3 | 6 | Medium | Parameter CRC + corruption reporting (S3) |
| R08 | Network attack via Modbus TCP converter (DoS, converter reconfiguration) → AS7, AS4 availability | IF6 | 2 | 3 | 6 | Medium | Converter assessment, segmentation guidance (S3) |
| R09 | Unauthenticated M-Bus address change → readout lost → AS7 | IF7 | 2 | 2 | 4 | Medium | Writable-value check, lock option (S3) |
| R10 | Device hang without recovery (watchdog off) after malformed input/load → AS4 availability | IF3–IF7 | 2 | 3 | 6 | Medium | Watchdog after timing review (S3) |
| R11 | Exploitable vulnerability in old third-party components unnoticed (FreeModbus 2007, MLA FS/USB, M-Bus 1.11) | IF3–IF7 | 3 | 3 | **9** | High | SBOM + CVE monitoring (A4) |
| R12 | Unable to triage and report an exploited vulnerability within 24 h (Art. 14, applies now) | — (process) | 3 | 3 | **9** | High | Vulnerability-handling process + runbook (client/Archana) |
| R13 | Service backdoor (`CMD_ENABLE`: raw MRAM write) accidentally enabled in a release | IF8 | 1 | 4 | 4 | Medium | Build-time `#error` guard (Q1) |
| R14 | Logger activation key bypass (weak RNG, reversible storage) → AS6 | IF3, IF11 | 3 | 1 | 3 | Low | Device-unique activation code (later) |
| R15 | Personal data exposure from SD logs/PAR files → AS9 | IF3, IF4 | 1 | 2 | 2 | Low | Confirm no personal data (Moser) |

**Matrix (risk IDs):**

| Likelihood ↓ / Impact → | 1 minor | 2 moderate | 3 major | 4 severe |
|---|---|---|---|---|
| **4 almost certain** | | | | |
| **3 likely** | R14 | | R04 R05 R11 R12 | **R01** |
| **2 possible** | | R09 | R02 R07 R08 R10 | R03 R06 |
| **1 rare** | | R15 | | R13 |

Draft until Phase A verification. Likelihood values assume field devices are accessible to customer staff and service partners, and that the Modbus TCP option is installed in plant networks.

---

## 5. S1: Secure bootloader with Nitrokey (feasibility pre-check)

### 5.1 Result: feasible, with the right split of roles
The PIC32MX575 has **no hardware secure boot and no crypto engine**. "Secure boot" on this MCU means:
1. **Immutable bootloader:** the bootloader region is write-protected (`PWP`/`BWP`) and `CP = ON`.
2. The **public key** is compiled into the bootloader.
3. The bootloader **verifies an ECDSA P-256 signature** over the new application image (software crypto, e.g. micro-ecc (BSD licence) or wolfCrypt) **before erasing/programming**.
4. A **version counter** in protected storage provides anti-rollback.

**The Nitrokey's role:** it holds the **private signing key** on the build/release side. It never touches the device. MPLAB X does not sign natively, but it can run a post-build step ("Execute this line after build"). That step runs a script which:
1. converts the hex to a binary image;
2. computes SHA-256;
3. signs the hash on the Nitrokey via PKCS#11/OpenSC;
4. produces a signed update file (header + image + signature).

| Nitrokey model | Fit | Notes |
|---|---|---|
| **Nitrokey HSM 2** (recommended) | Good | Mature PKCS#11 (OpenSC / sc-hsm), ECC P-256 on-device key generation, key backup (DKEK, n-of-m). **Hash on the host and sign with `CKM_ECDSA`.** Using `CKM_ECDSA_SHA256` on the whole image fails above about 1 KB of input (reported in OpenSC issue #2469 and on the Nitrokey forum) |
| Nitrokey 3 (PIV / PKCS#11) | Possible | P-256 signing via PKCS#11 works according to user reports. PIV maturity in stable firmware should be checked first |

Sources: [Nitrokey HSM 2 code signing](https://support.nitrokey.com/t/nitrokey-hsm-2-code-signing/3389), [OpenSC issue #2469](https://github.com/OpenSC/OpenSC/issues/2469), [HSM 2 1222-byte limit](https://support.nitrokey.com/t/nitrokey-hsm-2-with-updated-firmware-can-only-sign-up-to-1222-bytes-at-a-time/6152), [python-pkcs11 with SmartCard-HSM](https://python-pkcs11.readthedocs.io/en/latest/opensc.html), [Nitrokey 3 PKCS#11/OpenSC](https://support.nitrokey.com/t/nitrokey-3-and-opensc-pkcs-11-linux/4981), [NK3 P-256 example](https://support.nitrokey.com/t/cant-import-secp256k1-key-to-nitrokey-3a-nfc/6463)

**Points to confirm in the PoC (S1, 12–16 h):**
- ECDSA P-256 verify time and code size on the PIC32MX at 72 MHz. This happens only at update time, but must fit the 52 KB bootloader.
- Whether the bootloader can be field-updated once from BL 0.0.4.
- Key-ceremony and backup process.
- Build-PC/OS support for OpenSC.

### 5.2 Alternatives if Nitrokey is not suitable
| Option | Pros | Cons |
|---|---|---|
| YubiHSM 2 or another PKCS#11 HSM token | Same workflow, mature | Cost, vendor change |
| Cloud KMS signing (AWS KMS / Azure Key Vault, ECDSA P-256) | Audit log, access control, no hardware to lose | Needs cloud account and internet at release time |
| Offline signing PC, key in encrypted file | Cheapest | Weakest key protection; only as a temporary measure |
| **Hardware:** Microchip **ATECC608** secure element on I2C (next PCB revision) | Hardware-protected keys; also enables device identity later | PCB change; does not by itself make the bootloader immutable |
| **Next hardware generation:** MCU with hardware secure boot and crypto (e.g. PIC32MZ / PIC32CZ / SAM family with secure boot) | Proper root of trust | Port effort; product-roadmap decision |

### 5.3 Estimate for full implementation (2027)
**About 120–200 h.** This covers:
- bootloader rework and signature verification;
- update file format;
- anti-rollback;
- production programming with config bits;
- key ceremony and documentation;
- migration path for installed BL 0.0.4 units;
- tests (positive, negative, power-fail during update).

It depends on the bootloader source being available (open question Q-01).

### 5.4 Interim measures until secure boot (proposal, about 16–24 h, part of Q1)
- **Production config bits:** `CP = ON`; `PWP` covering the bootloader pages; `BWP = ON`; JTAG disabled at startup in release builds. This reduces R02/R03 and protects the bootloader from in-field overwrite.
- **Update only on explicit service action:** the bootloader/app only accepts an update after a confirmation at service level in the UI. This needs a small bootloader/app handshake and the bootloader source.
- **Image integrity check** (SHA-256 or CRC32 in the update file). This catches corrupted files but **not** deliberate tampering, so it must be documented as such.
- **Documentation:** update procedure and residual risk in the user/service information.

---

## 6. S2: UI user levels / access control (proposal)

### 6.1 Proposed role model
| Level | Who | Access | Authentication |
|---|---|---|---|
| **L0 Viewer** | Anyone at the device | Measurement screens, diagnostics (read-only), language | None |
| **L1 Operator / customer service** | Customer's trained staff | Commissioning: pipe, fluid, transducer selection, outputs, logger, interfaces, units, damping | **Customer PIN** (set at commissioning; secure by default) |
| **L2 Expert / Systec service** | Systec and authorised partners | Calibration, zero setup, optimisation, calibration-relevant parameter import, factory reset, firmware update trigger, security-log export | **Device-unique code:** challenge-response from serial number + Systec-held key (generated with a small Systec PC tool). **Replaces master PIN 5555** |

### 6.2 Security mechanisms
- PIN stored as **salted SHA-256 in MRAM**. **No copy on the SD card.** `protect.dwc` is migrated once on first boot, then ignored or deleted.
- **Attempt limiting:** after 5 failures, a 5-minute lockout that doubles each time. Every failure is logged.
- **Auto-logout** after inactivity (e.g. 10 minutes) and on power cycle.
- **Recovery** of a forgotten customer PIN via the L2 challenge-response, not a universal code.
- **Security event log** entries: login success/failure, PIN change, parameter import, calibration change, factory reset, update.
- Menu-to-level mapping covers all windows `SYSCTRL_WIN_02 … WIN_26`. Mr. Moser should confirm the mapping from a product point of view.

### 6.3 Estimate
| Work package | Hours |
|---|---|
| Concept, menu-to-role mapping, alignment with Mr. Moser | 12 |
| Implementation: role check, PIN hashing, lockout, auto-logout, migration of `protect.dwc` | 24–32 |
| Challenge-response (device side) + simple Systec PC generator tool | 16–24 |
| GUI screens and **texts for all language builds** (EN_DE_FR, EN_ES_FR, EN_DE_PO, EN_RU_CH, EN_CH, EN_RU), 1CH + 2CH | 12–16 |
| Tests: 1CH/2CH × variants, regression of menu behaviour | 24–32 |
| Documentation (user/service information, Annex II) | 6 |
| **Total** | **≈ 94–122 h** |

Risk to watch: **flash space is tight** (see existing flash-optimisation work). SHA-256 + challenge-response need about 4–8 KB, to be confirmed.

---

## 7. S3: Security measures for communication interfaces (proposal)

### 7.1 Measure catalogue
| Interface | Measure | Reduces | Estimate (h) |
|---|---|---|---|
| **JTAG / trace / ICSP** | Disable JTAG at startup in release builds; production config `CP`/`PWP`/`BWP`; check PCB access with HW team | R02, R03 | 6–10 |
| **USB (MSD)** | Default **read-only MSD** (block SCSI write commands) for log export. Write access only after L1/L2 login with timeout | R01, R05, R06 | 16–24 |
| **SD card** | Bounded `read_line()` and review of all file parsers; size limits; import of calibration-relevant data only at L2; **fuzz harness** (host build of parsers, AFL++/libFuzzer) | R06, R07 | 28–40 |
| **MRAM (SPI2)** | CRC per parameter block, verified at boot, corruption reported in diagnostics; migration of existing layout | R07 | 24–32 |
| **Modbus RTU** | Keep writes disabled (documented design decision + build-time check); frame robustness test | R10, R11 | 8–12 |
| **Modbus TCP converter** | Identify converter; vendor security info; change default credentials; network segmentation guidance (IEC 62443 zones/conduits) in user information. Fixed "secure code" is not authentication; document it | R08 | 6–8 (+ vendor) |
| **M-Bus** | Implement writable-value check (open TODO); option to lock address changes | R09 | 8–12 |
| **UART service/debug** | `#error` if `CMD_ENABLE` or debug-to-RS232 flags are set in a release config | R13 | 2–4 |
| **SPI1 / I2C sensors** | Plausibility/range checks on ADC and temperature values (review existing handling) | R07 (partly) | 4–6 |
| **All** | Enable watchdog after blocking-path review; security event log | R10, repudiation | 24–36 |
| | **Total (all measures)** | | **≈ 126–184 h** |

### 7.2 Quick wins proposed for an early decision (Q1, about 16–24 h)
These are low effort, high value, and do not need the 2027 bootloader work:
1. Fix `read_line()` bounds (R06).
2. Disable JTAG in release builds (R02/R03).
3. Production config bits `CP`/`PWP`/`BWP` (R02/R03). This needs agreement on service/read-back procedures.
4. `#error` guard for `CMD_ENABLE`/debug flags (R13).

Design, code changes, effort and test cases for these four items: [06_DWC2_CRA_WP1_Quick_Wins.md](06_DWC2_CRA_WP1_Quick_Wins.md).

---

## 8. Open questions (collected for Mr. Moser and the client)

| ID | Question | For | Needed by |
|---|---|---|---|
| Q-01 | Where is the **bootloader BL 0.0.4 source**? Can it be updated in the field? | Client / Moser | S1 |
| Q-02 | Which variants and build configurations are **currently sold and planned after Dec 2027**? (1CH/2CH, VIEGA, languages, Modbus TCP option) | Moser | A1, A4 |
| Q-03 | Is the heat measurement used for **billing** (MID MI-004)? | Moser | A2, R-impact |
| Q-04 | Which **TCP↔RTU converter** is used (vendor, model, firmware, web UI, default credentials)? | Moser | A3, R08 |
| Q-05 | Are **JTAG/ICSP pads** reachable without opening a sealed housing? Is the housing sealed? | Moser / HW | A3, R02/R03 |
| Q-06 | Is code protection off **on purpose** (service read-back, production)? | Client | Q1 |
| Q-07 | Who uses the **USB drive function** and for what (log download, parameter files, updates)? | Moser | S3 |
| Q-08 | Do SD logs or parameter files contain **personal data** (names, user IDs, customer/site names)? | Moser | A2, R15 |
| Q-09 | How is the **master PIN 5555** used today (service only, or communicated to customers)? | Moser | S2 |
| Q-10 | Which menu functions must customers be able to use **without** Systec service? | Moser | S2 |
| Q-11 | Which **toolchain** builds the released hex (C32 v2.02 vs. XC32 v5.00)? | Client | A4 |
| Q-12 | Are PC tools (SystecParamSoftware, flowcom software) used with DWC2? They are in CRA scope as software too | Moser | A1, A4 |
| Q-13 | Preferred **risk method** (this L×I matrix, or a Systec corporate method)? Proposal: adopt the 5 × 5 criteria of template T4 v1.2 and re-rate R01–R15 (see [07](07_CRA_Risk_Assessment_Templates_Review.md) §5) | Client | A5 |
| Q-14 | Is Nitrokey **HSM 2** or **Nitrokey 3** used in the other project? Same key-management process wanted? | Client | S1 |

---

## 9. Phase B: Threat analysis (STRIDE), preparation

Phase B starts after the first issues are treated (estimate **24–40 h**). The client's examples are mapped to DWC2's actual architecture so the analysis covers what exists:

| STRIDE | Client example | DWC2 equivalent to analyse |
|---|---|---|
| **Spoofing** | Fake update server | DWC2 has **no update server**. Updates come from the SD card or a PC over USB, so the threat is a **fake update file**. Also spoofed Modbus/M-Bus masters and spoofed converter configuration frames |
| **Tampering** | Modified firmware image in external SPI flash | Firmware is in **internal flash** (tampering via SD bootloader or JTAG/ICSP). External SPI device is the **MRAM** holding calibration/parameters |
| **Repudiation** | — | No security log: config/calibration changes cannot be attributed |
| **Information disclosure** | Reading flash via unprotected JTAG | **Applies:** JTAG not disabled, `CP = OFF`. Also PIN from `protect.dwc`, firmware IP |
| **Denial of service** | Malformed packets to the network interface (buffer overflow) | Network only via the converter (Modbus TCP → RTU). Also malformed Modbus/M-Bus frames and **malformed SD files (confirmed stack overflow in `read_line()`)** |
| **Elevation of privilege** | — | Master PIN, optional PIN, no role model (S2) |

Output: threat catalogue linked to assets (A2), interfaces (A3) and risks (A5), plus an updated risk register and residual-risk statement.

---

## 10. Proposed timeline (to be confirmed)

| Period | Activities |
|---|---|
| **Wk 46 (now)** | This plan + estimates delivered; questions sent to Mr. Moser |
| Wk 47–49 | Phase A: A1–A6; SBOM v1; risk matrix verified; S2/S3 proposals finalised |
| Wk 50–51 | Phase A report v1.0; decision on quick wins Q1; S1 Nitrokey PoC starts |
| Jan 2027 | Q1 implementation (if approved); S1 PoC result; **Phase B STRIDE** |
| **Feb 2027** | **First CRA assessment review:** Phase A + B, SBOM, risk register, measures plan with estimates (S1 2027 implementation, S2, S3) |

---

## 11. Deliverables checklist for the February review
- [ ] System context & data-flow diagram (A1)
- [ ] Asset register (A2)
- [ ] Interface / attack-surface register (A3)
- [ ] SBOM v1, CycloneDX + table (A4)
- [ ] Risk method + risk register + matrix (A5)
- [ ] STRIDE threat catalogue (B1)
- [ ] Measures plan with estimates: S1 (secure boot 2027), S2 (user levels), S3 (interfaces), Q1 (quick wins)
- [ ] Open-points list with Mr. Moser's answers
