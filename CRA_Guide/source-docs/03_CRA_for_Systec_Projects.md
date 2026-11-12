# CRA: What It Means for Systec Projects

This is based on systec Controls' public website, <https://www.systec-controls.de/english/home.html>, and product pages, read alongside [01_CRA_Overview.md](01_CRA_Overview.md). It is an engineering assessment, not legal advice. Systec, as manufacturer, must make the final classification.

---

## 1. Systec's position under the CRA

systec Controls (Germany) **manufactures and sells measurement instruments under its own name** in the EU. For those products, **Systec is the CRA manufacturer** and carries all Art. 13/14 obligations. Tismo, as the firmware engineering partner, delivers much of the evidence.

Its customers operate in **water/wastewater, power plants, hydropower, district heating, gas, chemicals, food & pharma, cement and automotive test**. Many of them are **NIS2 essential or important entities**, so they will require cybersecurity evidence from Systec as a supplier, independently of the CRA.

---

## 2. Product-by-product applicability

Interfaces are taken from the public product pages where they were stated. Anything not confirmed there is marked "to verify".

| Product family | Example products | Known interfaces | CRA applies? | Likely class / route |
|---|---|---|---|---|
| **Ultrasonic flow (open channel / pipes)** | deltawave, deltawaveVER2LEAN, wetted transducers | **RS485, Modbus, M-Bus, USB** (PC parameterisation), **removable SD card for data logging, setup and updates**, analog/digital outputs, optional **GSM modem** for remote transmission | **Yes** | **Default → Module A** |
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

| Area | Typical current state in legacy instruments | CRA requirement | What to do |
|---|---|---|---|
| **Modbus RTU / M-Bus** | No authentication by protocol design; any bus master can write parameters | I.2d access control, I.2f integrity, I.2j attack surface | Separate read-only measurement registers from write-protected config. Use a write-enable/password or service mode for parameter writes. Document in the risk assessment that the bus is assumed to be inside a protected OT zone (IEC 62443 zone/conduit) |
| **SD card "setup and updates"** | The card can load configuration and firmware | I.2c secure updates, I.2f integrity | **Sign firmware images and verify them in the bootloader.** Authenticate config files. Add anti-rollback. *This is likely the single most important retrofit* |
| **USB parameterisation (SystecParamSoftware, flowcom)** | Local PC tool, often without authentication | I.2d, I.2b secure by default | Device-side service password / unique credentials. Log config changes |
| **GSM remote transmission** | Data sent over cellular, possibly unencrypted | I.2e confidentiality, I.2h availability | Use an encrypted transport (VPN/TLS-capable modem). Document the customer's responsibilities in Annex II instructions |
| **Calibration & measurement data** | Stored in flash/EEPROM | I.2f integrity | CRC/MAC on calibration tables; detect and report corruption (fits metrology needs too) |
| **Debug ports** | JTAG/SWD may be accessible | I.2j, I.2k | Enable read-out protection / debug lock in production |
| **Long product life (often 10–20 years in the field)** | Support often informal | Art. 13(8): support period reflects **expected use time**, minimum 5 years | Define and publish a support end date per product. Plan toolchain and build archiving for years of security fixes |
| **Third-party components** | Vendor HAL, RTOS, protocol stacks; versions may be undocumented | Annex I Part II.1 **SBOM**; Art. 13(5) due diligence | **Recover the SBOM from the existing firmware** and monitor CVEs |
| **Vulnerability reporting** | Probably no formal process | Art. 14 (**applies since 11 Sep 2026**), Part II.5–6 | Publish a security contact and CVD policy. Define a 24 h / 72 h / 14-day reporting runbook with an owner and ENISA platform access |

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

**Fit with the Brownfield AI-native SDLC:** steps 3–5 are exactly where the proposed *Firmware Understanding + Change Impact Analyzer* helps. It can map interfaces (attack surface), recover components (SBOM), and analyse the impact of security retrofits. That matters because a retrofit must not change measurement behaviour, Modbus register maps, or behaviour customers rely on. A Systec product would make a good pilot for that MVP.

---

## 6. Open questions to confirm with Systec
- Full interface list per product (HART? Profibus? Ethernet? Bluetooth/app?). Ethernet or wireless would raise the risk level and, for wireless, bring in RED.
- Does any product already support signed or authenticated firmware updates?
- Which models will still be sold after 11 Dec 2027?
- Is the GSM modem an integrated module or an external, separately CE-marked device?
- Are any products sold for **custody transfer (MID)** or into **Ex areas (ATEX)**?
- Does systec Automotive supply any sensor as part of a **type-approved vehicle**? That would be excluded from the CRA.

## Sources
- <https://www.systec-controls.de/english/home.html>
- deltawave: <https://www.systec-controls.de/english/industrial-products/flow/deltawave.html>
- flowcom: <https://www.systec-controls.de/english/flow-computer-flowcom.html>
- CRA: <https://www.cyberresilienceact.eu/regulation.html>, <https://www.cyberresilienceact.eu/annexes.html>
