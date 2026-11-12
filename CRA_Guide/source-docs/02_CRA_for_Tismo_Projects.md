# CRA: What It Means for Tismo Projects

This is based on Tismo's public profile at <https://www.tismotech.com/>, read alongside the regulation summary in [01_CRA_Overview.md](01_CRA_Overview.md). It is an engineering assessment, not legal advice.

---

## 1. Tismo's position under the CRA

Tismo is an **engineering services company**. It designs electronics, firmware, software, mobile/web/cloud and AI for client products in:

- IoT and smart lighting;
- test & measurement;
- medical and laboratory instruments;
- water/wastewater chemical feed;
- gas analysis;
- energy metering;
- optical networking;
- industrial equipment.

It works from Bangalore, Kolkata, San Jose and Frankfurt, and serves EU markets including Germany, France, Italy, the Netherlands, Belgium, Sweden and Portugal.

| Question | Answer |
|---|---|
| Is Tismo the CRA "manufacturer"? | **Usually no.** The manufacturer is whoever places the product on the market **under its own name or trademark** (Art. 3(13)). For design-services projects, that is the client. |
| When *would* Tismo be the manufacturer? | If Tismo sells a product, SDK, software library, app or platform **under the Tismo name** to EU customers, even free of charge in a commercial context. |
| Then why does the CRA matter to Tismo? | The client's legal obligations become **Tismo's engineering deliverables**: secure design, SBOM, risk assessment, update mechanism, technical-file content and test evidence. EU clients will start writing CRA clauses into contracts and RFQs. |
| Does being in India or the USA change anything? | No. The CRA follows the **product on the EU market**, not the location of the engineering team. |
| Is it urgent? | Yes. **Art. 14 reporting has applied since 11 Sep 2026**, and products shipped from **11 Dec 2027** must fully comply. Products in development today will ship into that window. |

---

## 2. Applicability by Tismo business line

| Tismo domain | Typical product | CRA applies? | Likely class | Other laws to check |
|---|---|---|---|---|
| **Embedded / IoT / smart connected devices** | Sensors, controllers, smart lighting, wireless nodes (Zigbee, LoRa, NB-IoT, Z-Wave, BLE, MQTT) | **Yes** | Default, unless the core function is security, networking or smart-home security | **RED Delegated Act 2022/30** (EN 18031) for anything with a radio |
| **Gateways, routers, network interfaces** | Protocol gateways, cellular modems, Ethernet/fieldbus interface modules | **Yes** | **Important Class I** (routers/modems/switches; *network interfaces*) if that is the core function | RED, NIS2 customer requirements |
| **Smart-home security** | Door locks, cameras, alarms | **Yes** | **Important Class I** | RED, GPSR |
| **Energy metering** | Electricity/heat/gas meters | **Yes** | Default for the meter. A **smart meter gateway is Annex IV CRITICAL** | MID, national metering security rules, Data Act |
| **Industrial products & automation** | Instruments, controllers with OPC UA, Modbus, Profibus, EtherCAT | **Yes** | Default in most cases | **Machinery Regulation 2023/1230** if part of machinery (applies from 20 Jan 2027); IEC 62443-4-1/-4-2 expected by customers |
| **Water/wastewater chemical feed, gas analysis** | Dosing controllers, analysers | **Yes** | Default | NIS2: customers in water and energy are essential entities |
| **Mobile apps & cloud platforms** | Companion apps, device clouds, dashboards | **Yes, as part of the product.** The cloud counts as *remote data processing* when the device needs it to perform a function | Same class as the device | GDPR, Data Act |
| **Desktop / config software** (.NET, Qt, WPF) | Service tools, parameterisation tools | **Yes** (software product) | Default | — |
| **AI engineering** | AI features in instruments and machines | **Yes** (CRA) + AI Act if high-risk | — | **AI Act.** CRA Annex I compliance can cover AI Act Art. 15 cybersecurity |
| **Medical devices / IVD** (Tismo is ISO 13485) | Diagnostics, analytical medical instruments | **No.** Excluded (Art. 2(2)) | — | **MDR/IVDR** cybersecurity requirements apply instead. Lab instruments that are *not* medical devices **are** in CRA scope |
| **Automotive** | Vehicle ECUs under type approval | **No.** Excluded | — | UNECE R155/R156. Test/measurement equipment for automotive labs **is** in CRA scope |

**Rule of thumb for Tismo engineers:** if the product has firmware and any interface (bus, USB, radio, Ethernet, SD card, debug port used in the field), assume **CRA applies, default class, Module A self-assessment**. Then check whether the core function puts it in Annex III/IV.

---

## 3. What CRA compliance demands from Tismo's engineering work

| CRA requirement | What Tismo should deliver to the client |
|---|---|
| Risk assessment (Art. 13(2), Annex I.1) | Threat model per product (assets, interfaces, attackers, mitigations) kept with the design documents |
| No known exploitable vulnerabilities (I.2a) | SBOM + CVE scan in CI for every release (FreeRTOS, ThreadX, lwIP, mbedTLS, LVGL/emWin/TouchGFX, vendor HALs, npm/pip dependencies for apps/cloud) |
| Secure by default (I.2b) | No hard-coded or shared default passwords; unique credentials or forced first-use setup; debug/service features off by default |
| Security updates (I.2c, II.7–8) | Secure bootloader + **signed firmware update** (Renesas, Microchip and STM32 all support this). Updates via app, cloud or local port. Rollback protection |
| Access control (I.2d) | Authentication on configuration interfaces, apps and cloud APIs. Role separation (user / service / factory) |
| Confidentiality & integrity (I.2e–f) | TLS for MQTT/HTTP/OPC UA; secure key storage (secure element or TrustZone where justified); integrity checks on config and calibration |
| Attack surface & mitigation (I.2j–k) | JTAG/SWD locked in production; read-out protection; MPU; compiler hardening; input validation on Modbus, BLE and MQTT parsers |
| Logging (I.2l) | Security event log (config change, failed login, update) |
| Vulnerability handling (Part II) | Help clients set up a CVD policy and a security contact; separate security-fix releases from feature releases |
| Technical documentation (Annex VII) | Architecture, SBOM, risk assessment, test reports. These come straight out of a well-run SDLC |
| Support period ≥ 5 years (Art. 13(8)) | Design for maintainability: update path, toolchain archiving, reproducible builds |

---

## 4. Recommended actions for Tismo

**Near-term (next 3–6 months)**
1. **CRA question in project intake.** For each new or ongoing project, record: EU market? Product class? Radio (RED)? Machinery? Medical (excluded)? Who is the manufacturer? Who handles vulnerability reporting?
2. **Contract clarity.** Agree with clients who owns the SBOM, risk assessment, update infrastructure, vulnerability monitoring after handover, and the Art. 14 24-hour reporting.
3. **Secure-by-design baseline.** Make one reusable Tismo firmware security baseline (secure boot, signed updates, debug lock, credential handling, logging) for the MCU families we use most (STM32, Renesas, Microchip).
4. **SBOM + vulnerability scanning in CI** for firmware, apps and cloud (e.g. CycloneDX/SPDX output). Add SonarQube and OWASP checks, which we already list, as release gates.

**Medium-term**
5. **Align the SDLC with IEC 62443-4-1.** Our ISO 9001 and ISO 13485 processes already give us document control and design reviews, so adding a security development lifecycle is an incremental step.
6. **CRA technical-file template** (Annex VII) so each project produces the evidence as it goes, not at the end.
7. **Offer CRA-readiness as a service.** This covers gap assessment of existing client products, security retrofit of brownfield firmware, SBOM recovery, and update-mechanism retrofit. Tismo's Frankfurt presence and EU client base make this a natural offering.

**Link to the Brownfield AI-native SDLC proposal:** the *Firmware Understanding + Change Impact Analyzer* MVP also produces the CRA artefacts that brownfield products usually lack: component inventory/SBOM recovery, interface/attack-surface map, and impact analysis for security fixes. See [../AI-Native_SDLC_Brownfield_Firmware.pptx](../AI-Native_SDLC_Brownfield_Firmware.pptx).

---

## 5. Open questions to confirm
- Does Tismo market any product, software library or platform **under its own name** in the EU? If so, Tismo carries the manufacturer obligations for it.
- Which current client projects will ship units **after 11 Dec 2027**?
- Which client products contain radios and are therefore already under the **RED Delegated Act since 1 Aug 2025**?
