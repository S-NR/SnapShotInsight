# EU Cyber Resilience Act (CRA): Overview

**Regulation (EU) 2024/2847** sets horizontal cybersecurity requirements for products with digital elements.
Primary source read: <https://www.cyberresilienceact.eu/regulation.html> and <https://www.cyberresilienceact.eu/annexes.html>. The authoritative text is on EUR-Lex.

> This is an engineering summary, not legal advice. Before committing a compliance strategy for a product, confirm the classification with the product's manufacturer and their legal or compliance advisers.

---

## 1. What the CRA is, in one paragraph

The CRA is a **product law**, not an operator law. It works like the CE-marking regimes we already know (LVD, EMC, RED), but for **cybersecurity**. To place a product with digital elements on the EU market, the manufacturer has to:

- design it to a set of essential cybersecurity requirements;
- run a vulnerability-handling process for the whole support period;
- report actively exploited vulnerabilities and severe incidents;
- keep technical documentation, sign a declaration of conformity, and affix the CE mark.

The rules apply no matter where the manufacturer is based (EU, India, USA). What triggers them is **making the product available on the EU market**.

---

## 2. Key dates

| Date | What happens | Source |
|---|---|---|
| **10 Dec 2024** | Entry into force | Art. 71 / site key dates |
| 11 Dec 2025 | Commission implementing acts due (technical descriptions of Annex III/IV categories, reporting details) | Art. 7(4), 14(9) |
| **11 Jun 2026** | Chapter IV applies (conformity assessment / notified bodies) | Art. 71 |
| **11 Sep 2026** | **Reporting obligations (Art. 14) apply.** This includes products already on the market before 2027. | Art. 71, Art. 69 |
| 11 Dec 2026 | Member States should have enough notified bodies | Art. 35 |
| **11 Dec 2027** | **Full application**: all essential requirements, conformity assessment and CE marking | Art. 71 |
| 11 Jun 2028 | Older EU type-examination certificates stop being valid | Art. 69 |

> **As of today (27 Oct 2026), the Art. 14 reporting obligations already apply.** Every manufacturer with products on the EU market must be able to report actively exploited vulnerabilities and severe incidents within 24 hours.

**Legacy products (Art. 69):**
- Products placed on the market **before 11 Dec 2027** fall under the CRA only if they later undergo a **substantial modification**.
- The exception is Art. 14 reporting, which applies to them anyway.
- Under the usual EU "placing on the market" logic, this test applies **per unit**. A model launched in 2022 but still being sold after 11 Dec 2027 must comply for each new unit sold. (This comes from general EU product-law practice; confirm it per product.)

---

## 3. Scope: where it applies (Art. 2–3)

**In scope:** any *product with digital elements* (hardware or software, including its *remote data processing* solutions and separately sold components) where the intended or reasonably foreseeable use involves a **direct or indirect, logical or physical data connection** to a device or network.

In practice, almost any product with firmware and an interface is in scope:

| Typical product | In scope? | Why |
|---|---|---|
| Industrial sensor/transmitter with Modbus RS485, USB, Ethernet | **Yes** | Physical/logical data connection |
| Device whose only "interface" is an SD card or a service port | **Yes, very likely** | An indirect/physical data connection still counts |
| IoT device + cloud backend + mobile app | **Yes, all three** | The cloud part counts as *remote data processing* when the device needs it to perform a function |
| PC configuration tool or desktop software sold with/for a product | **Yes** | Software product with digital elements |
| Pure SaaS with no product attached | **No** (generally) | Not a product. NIS2 or other law may apply instead |
| Free/open-source software developed non-commercially | **No** | Monetised or commercially supported FOSS is in scope; *open-source stewards* have a light regime |
| Identical spare parts | **No** | Art. 2(6) |

**Excluded (Art. 2(2)–(7))**, because sector law already covers cybersecurity:

| Sector | Governing law |
|---|---|
| Medical devices / IVD | Reg. (EU) 2017/745 (MDR), 2017/746 (IVDR) |
| Motor vehicles & trailers (type-approved) | Reg. (EU) 2019/2144 (in practice UNECE R155/R156) |
| Civil aviation (certified) | Reg. (EU) 2018/1139 |
| Marine equipment | Directive 2014/90/EU |
| National security / defence / classified data | Excluded outright |
| Other sector rules with equal or higher protection | Possible exclusion, but only via a Commission delegated act (Art. 2(5)) |

---

## 4. Product classes: which conformity route applies (Art. 7, 8, 32; Annex III, IV)

```
                      ┌──────────────────────────────────────────────┐
Product with digital  │ Annex IV?  → CRITICAL  → EU certificate      │
elements, in scope ──►│ Annex III Class II? → IMPORTANT II → 3rd party│
                      │ Annex III Class I?  → IMPORTANT I  → std or 3P│
                      │ none of the above   → DEFAULT → self-assess  │
                      └──────────────────────────────────────────────┘
```

Products are classified by their **core functionality**. An ordinary product that merely *contains* an OS or a microcontroller is **not** automatically "important". The Commission published technical descriptions of the categories in Implementing Regulation (EU) 2025/2392.

| Class | Categories (abridged) | Conformity assessment (Art. 32) |
|---|---|---|
| **Default** (~90% of products) | Everything not listed below. This includes most industrial sensors, instruments, controllers and consumer IoT. | **Module A**: internal control (self-assessment) |
| **Important, Class I** (Annex III, 19 categories) | Identity/access mgmt & access-control readers; browsers; password managers; anti-malware; VPN products; network management systems; SIEM; **boot managers**; PKI software; **physical & virtual network interfaces**; **operating systems**; **routers, modems, switches**; **microprocessors / microcontrollers / ASICs / FPGAs with security functions**; smart-home assistants; smart-home security products (locks, cameras, alarms); connected toys; health/children's wearables | Module A **only if** harmonised standards or an EU certification scheme are applied in full. Otherwise **B+C** or **H** (notified body) |
| **Important, Class II** (4 categories) | Hypervisors & container runtimes; firewalls & IDS/IPS; tamper-resistant microprocessors; tamper-resistant microcontrollers | **B+C**, **H**, or EU certification scheme ≥ "substantial" (notified body mandatory) |
| **Critical** (Annex IV, 3 categories) | Hardware devices with security boxes; **smart meter gateways** and devices for advanced security incl. secure cryptoprocessing; smartcards / secure elements | European cybersecurity certificate (EUCC), where required by delegated act; otherwise the Class II routes |

Modules: **A** = internal control · **B+C** = EU-type examination + conformity to type · **H** = full quality assurance.

---

## 5. What the product must do: essential requirements (Annex I)

### Part I: security properties of the product
| # | Requirement | Embedded-firmware reading |
|---|---|---|
| 1 | Security appropriate to the risk | Documented **cybersecurity risk assessment** (threat model) drives the design |
| 2a | No known exploitable vulnerabilities at release | Scan the SBOM against CVE databases before every release |
| 2b | Secure by default, with reset to the original state | No default/shared passwords; unused services off; factory reset |
| 2c | Vulnerabilities fixable by security updates (automatic where applicable, opt-out, postpone) | **Field-update mechanism** is mandatory in practice |
| 2d | Protection from unauthorised access; report possible unauthorised access | Authentication on config/service interfaces; access logging |
| 2e | Confidentiality of data at rest/in transit (e.g. encryption) | TLS for IP links; protect secrets and keys in flash |
| 2f | Integrity of data, commands, programs, config; report corruption | **Signed firmware, secure boot**, config CRC/MAC, protected parameters |
| 2g | Data minimisation | Collect and store only what is needed |
| 2h | Availability of essential functions, incl. DoS resilience | Measurement/control keeps working under comms flooding |
| 2i | Do not harm other devices or networks | Rate limiting; well-behaved bus/network participation |
| 2j | Limit attack surface, including external interfaces | Disable debug (JTAG/SWD) in production; close unused ports |
| 2k | Exploit-mitigation techniques | MPU, stack canaries, non-exec regions, input validation |
| 2l | Record and monitor security-relevant activity (user opt-out) | Security event log: logins, config changes, updates |
| 2m | Secure, permanent deletion of data and settings; secure data transfer | Decommissioning/erase function |

### Part II: vulnerability handling (manufacturer's process)
1. Identify and document components and vulnerabilities, including a **machine-readable SBOM** (at least top-level dependencies).
2. Remediate without delay. Where feasible, ship security updates **separately from feature updates**.
3. Run regular, effective security tests and reviews.
4. Publicly disclose fixed vulnerabilities once a fix is available.
5. Have and enforce a **coordinated vulnerability disclosure (CVD) policy**.
6. Provide a contact address for vulnerability reports.
7. Distribute updates securely (automatic where applicable).
8. Distribute security updates without delay, **free of charge**, with advisories.

---

## 6. Manufacturer obligations (Art. 13–14, 28–31)

| Obligation | Detail |
|---|---|
| Risk assessment | Documented and kept up to date during the support period; part of the technical file (Art. 13(2)–(4)) |
| Component due diligence | Including open-source and third-party libraries. Report component vulnerabilities upstream (Art. 13(5)–(6)) |
| **Support period** | **At least 5 years.** It must reflect the time the product is expected to be in use, and the end date (month/year) is shown at purchase (Art. 13(8), (19)) |
| Security update availability | Each security update stays available for **10 years** after release, or the rest of the support period if longer (Art. 13(9)) |
| Record retention | Technical documentation and DoC kept **10 years** or the support period, whichever is longer (Art. 13(13)) |
| User information | Annex II: contact point, support end date, secure setup, update and decommissioning instructions, SBOM location if shared |
| Single point of contact | For vulnerability reports. It must not be only an automated tool (Art. 13(17)) |
| Corrective action | Fix, withdraw or recall non-conforming products (Art. 13(21)) |
| **Reporting (Art. 14)** | Via ENISA single reporting platform to the coordinator CSIRT: |
| | • Actively exploited vulnerability: **early warning 24 h → notification 72 h → final report ≤14 days after a fix is available** |
| | • Severe incident affecting product security: **24 h → 72 h → final report within 1 month** |
| | • Inform affected users (Art. 14(8)) |
| Technical documentation | Annex VII: description, architecture, vulnerability-handling specs incl. SBOM and CVD policy, risk assessment, support-period rationale, standards applied, test reports, DoC |
| EU DoC + CE marking | Art. 28, 30. For software, the CE mark may sit on the DoC or a website |

**Importers and distributors** (Art. 19–20) must check that the manufacturer has done the above. They become the "manufacturer" if they rebrand the product or substantially modify it (Art. 21–22).

---

## 7. Penalties (Art. 64)

| Breach | Maximum fine (whichever is higher) |
|---|---|
| Annex I essential requirements, Art. 13 or Art. 14 | **€15 M or 2.5 %** of worldwide annual turnover |
| Other obligations (importers/distributors, DoC, CE, technical file, conformity assessment, notified bodies…) | **€10 M or 2 %** |
| Incorrect, incomplete or misleading information to authorities | **€5 M or 1 %** |

Micro and small enterprises are not fined for missing the **24-hour** early-warning deadline. Open-source stewards are exempt from fines.

---

## 8. The wider landscape: which law applies to which kind of system

The CRA is one piece of the EU digital rulebook. Here is what applies where. Rows marked † come from general knowledge of EU law, not from the CRA page; verify the dates before relying on them.

| Law | Applies to | Relationship to CRA | Status |
|---|---|---|---|
| **CRA** (EU) 2024/2847 | **Products** with digital elements: hardware, firmware, software, and their remote data processing | Horizontal baseline for product cybersecurity | Reporting since 11 Sep 2026; full from 11 Dec 2027 |
| **RED** 2014/53/EU + Delegated Reg. (EU) 2022/30 † | **Radio equipment** (Wi-Fi, BLE, cellular, LoRa…) that connects to the internet, processes personal data, or handles money | Overlapping cybersecurity requirements (harmonised standards EN 18031-1/-2/-3). Expected to be superseded by the CRA for cybersecurity | Applies since 1 Aug 2025 † |
| **NIS2** (EU) 2022/2555 | **Entities/operators** (energy, water, wastewater, manufacturing, health, digital infrastructure…), not products | Operators must manage supply-chain risk, so they push CRA-type requirements onto their suppliers | In force; national transposition |
| **Machinery Regulation** (EU) 2023/1230 † | **Machinery**, including safety components and control systems | Requires protection against corruption (malicious third-party action) where it affects safety. CRA conformity can support this | Applies from 20 Jan 2027 † |
| **AI Act** (EU) 2024/1689 | AI systems, especially high-risk ones | Meeting CRA Annex I can count as meeting the AI Act's cybersecurity requirements (Art. 15) for high-risk AI (CRA Art. 12) | Phased 2025–2027 |
| **Product Liability Directive** (EU) 2024/2853 † | All products, **explicitly including software** | Failing to provide security updates can make a product "defective", which means civil liability on top of CRA fines | Member-State transposition by 9 Dec 2026 † |
| **Data Act** (EU) 2023/2854 † | **Connected products** and related services | Data-access-by-design obligations; complementary to CRA | Applies from 12 Sep 2025; design obligations for products placed from 12 Sep 2026 † |
| **GPSR** (EU) 2023/988 | Consumer products | Covers safety risks the CRA does not address (CRA Art. 11) | Applies |
| **Cybersecurity Act** (EU) 2019/881 | Voluntary EU certification schemes (e.g. EUCC) | Provides the certification route for critical / Class II products | Applies |
| **MDR / IVDR** | Medical & in-vitro diagnostic devices | **Excludes** the CRA; cybersecurity is handled inside MDR (MDCG 2019-16 guidance †) | Applies |
| **Vehicle type approval** 2019/2144 (UNECE R155/R156) | Type-approved vehicles & their systems | **Excludes** the CRA | Applies |
| ATEX, MID, EMC, LVD, PED | Explosion protection, legal metrology, EMC, electrical & pressure safety | **Not replaced**. Cybersecurity is added on top, so the same product may carry several CE regimes | Applies |

**Relevant standards (†):**
- IEC 62443-4-1 (secure development lifecycle) and IEC 62443-4-2 (component security requirements) are the de-facto reference for industrial products.
- EN 18031-x covers RED radio products.
- ETSI EN 303 645 covers consumer IoT.
- The CRA harmonised standards are being drafted by CEN/CENELEC/ETSI. Until they are cited in the OJ, Module A relies on demonstrating Annex I directly.

---

## 9. Sources
- Regulation text and commentary: <https://www.cyberresilienceact.eu/regulation.html>
- Annexes I–VIII: <https://www.cyberresilienceact.eu/annexes.html>
- Annex III/IV classification background: [cvdportal.com](https://cvdportal.com/glossary/annex-iii-classification), [insidecra.com](https://insidecra.com/annex/iii), [compliantbook.com](https://compliantbook.com/eu-cyber-resilience-act/important-and-critical-products/), [getstandardos.com](https://getstandardos.com/articles/is-your-product-important-or-critical-under-the-cyber-resilience-act), [Snellman, technical descriptions](https://digitalcompliance.snellman.com/technical-descriptions-for-important-and-critical-products-are-published/)
- Note: some websites still show the **2022 proposal's** Annex lists, where operating systems were Class II and PKI/HSMs had other placements. Use the 2024 final text only.
