# CRA Analysis: DWC2 Firmware (Systec, 21BD / DWx)

**Codebase analysed:** `D:\Projects\GIT\Systec - DWx\GIT\DWx\IR_44\DWx_Software_Maintenance\Technical\Sources\Software\DWC2`
**Method:** static review of source, build configuration, linker script and the shipped bootloader hex (`out/SYS_Bootloader_V004.hex`). Nothing was executed on hardware. No source files were modified.
**Reference:** [01_CRA_Overview.md](01_CRA_Overview.md), [03_CRA_for_Systec_Projects.md](03_CRA_for_Systec_Projects.md)

> This is an engineering assessment to support Systec's CRA work, not a legal opinion or a full penetration test. Severity ratings are engineering judgement. File/line references are to the tree as reviewed on 12 Nov 2026.

---

## 1. Summary

| Item | Result |
|---|---|
| Product | DWC2 controller firmware (`SYSCTRL`) for systec ultrasonic flow / heat measurement (deltawave family); 1-channel and 2-channel variants, multiple language builds; VIEGA variant active in `SYSCTRL.h` |
| MCU | Microchip **PIC32MX575F512L** (512 KB flash, 64 KB RAM, **no crypto accelerator**); external MRAM for parameters |
| CRA in scope? | **Yes.** Firmware product with several physical/logical data connections (RS485/Modbus RTU, M-Bus, USB, SD card, optional Modbus TCP via converter) |
| Likely CRA class | **Default → Module A self-assessment.** Its core function (flow/heat measurement) is not listed in Annex III/IV |
| Other regimes to check | EMC/LVD (existing CE). **MID (MI-004 thermal energy meters)** if the heat function is sold for billing. ATEX if Ex variants exist. RED only if a radio module is integrated |
| Overall CRA readiness | **Low.** The largest gaps are an **unsigned firmware update from the SD card**, **flash code protection disabled**, a **hard-coded master password**, and a **stack buffer overflow in parameter-file import** |
| Positive points | Modbus write functions are compiled out (read-only Modbus). The RS232 service command interface is compiled out. SonarQube analysis is already in place |

**Top 5 actions:**
1. Signed firmware images, verified by the bootloader, with anti-rollback.
2. Enable flash code protection (`CP`) and boot/program write protection in production.
3. Remove the hard-coded master password `5555`; replace the reversible PIN encoding.
4. Fix the unbounded `read_line()` in parameter-file import.
5. Set up an SBOM, CVE monitoring and a vulnerability-handling process. Art. 14 reporting **already applies**.

---

## 2. Attack surface map (from code)

| # | Interface | Purpose | Direction | Authentication | Evidence |
|---|---|---|---|---|---|
| 1 | **SD card** | Data logging; parameter files (LAR/PAR) import/export; password file `protect.dwc`; logger activation key file; **firmware update** (`SYSCTRL.hex` read by bootloader) | Read + write | None | `SYSCTRL_PASSWORD.c`, `1CH_2CH_GUI_SCREEN/SYSCTRL_WIN_26_IMPORT_EXPORT.c`, bootloader strings |
| 2 | **USB device: Mass Storage Class** | Exposes the SD card to a PC as a drive | PC can read/write **all SD files**, including `SYSCTRL.hex` and `protect.dwc` | None | `SYSCTRL_SDUSB.c:311, 619`; `SYSCTRL.c:3267, 3640` |
| 3 | **Modbus RTU (RS485, UART1)** | Measurement data to SCADA/DCS | Read only. Write function codes disabled at compile time | None (protocol has none) | `Modbus/mbconfig.h:90–102` |
| 4 | **Modbus TCP via external TCP↔RTU converter** (`MODBUSTCP_ENABLE` active) | Ethernet access to the same RTU slave; converter configured by DWC2 over UART1 | Network-reachable (read-only Modbus). Converter configuration frames use a **fixed "secure code"** `0x12345678 / 0x87654321` | Fixed constant frame, not authentication | `SYSCTRL.h:77, 2958–2993`; `21BD_MODBUS_TCP_Details.docx` |
| 5 | **M-Bus slave** (solvimus stack) | Meter readout | Read + **address/secondary-address changes persisted to MRAM** | None (protocol has none) | `SYSCTRL_MBUS.c:136–154` (includes `// todo check values with struct tValue::iWritable set`) |
| 6 | **Local keypad + display (GUI)** | Full configuration, calibration, factory reset, import/export | Read + write | Optional 4-digit PIN (`ENABLE_PASSWORD`). Master PIN accepted | `SYSCTRL.h:160`; `SYSCTRL_WIN_0.c:481–511`; `SYSCTRL_WIN_23_PASSWORD.c:419` |
| 7 | **RS232 service command interface** (`%F…`, `%MR`, `%MW`) | SD file commands; **raw MRAM read/write**; set RTC | Read + write | None | `HAL/SYSCTRL_CMDS.c`; **compiled out**: `CMD_ENABLE` not defined in current `SYSCTRL.h` |
| 8 | **ICSP / debug pins** | Programming / debugging | Read-out of flash possible | Code protection **off** | `HAL/SYSCTRL_INIT.c:38–39`; DEVCFG0 = `0x7FFFFFFF` in `SYS_Bootloader_V004.hex` |
| 9 | **Bootloader BL 0.0.4** (separate image, 0x9D000000–0x9D00CFFF) | On reset, searches the SD card for `SYSCTRL.hex` and programs it | Write flash | Intel-HEX record checksum + address range only | Strings: `Checking for Updates File`, `SYSCTRL.hex`, `Application image has been programmed`, `Hex record checksum mismatch`; app reset vector `_RESET_ADDR = 0x9D00D000` in `SYS_BOOTFILE.ld` |

**Key attack chain:**
1. Someone with physical access, or a PC connected over USB, places a modified `SYSCTRL.hex` on the SD card.
2. On the next reset, the bootloader programs it with no authenticity check.
3. The device now runs arbitrary firmware, which can falsify measurement, totalizer or heat values reported to SCADA or billing.

---

## 3. Draft SBOM (recovered from source)

Versions were identified from source headers. Items marked "to confirm" need checking against vendor archives.

| Component | Supplier | Version found | Location | Notes |
|---|---|---|---|---|
| Application firmware `SYSCTRL` | Systec / IBMT / Tismo | IR 44 maintenance branch (release docs up to IR 45) | root, `HAL/`, `1CH_2CH_GUI_SCREEN/` | Product version string to be added to the SBOM |
| Bootloader `BL 0.0.4` | Systec (source **not in repo**) | 0.0.4 (`SYS_Bootloader_V004.hex`) | `out/` | Must be in the SBOM; source and build needed for any secure-boot work |
| FreeModbus (ASCII/RTU) | Christian Walter (BSD) | `mb.c v1.27 2007/02/18`, `mbrtu.c v1.18 2007/09/12` | `Modbus/` | Old but small; check CVE/issue history; RTU only |
| M-Bus slave stack | solvimus GmbH (commercial) | **1.11** (`MBUSSLVVERSION 0x0111`, 2008) | `MbusSlave/` | Commercial licence; ask vendor about security support |
| Memory Disk Drive File System (FAT) | Microchip | v1.2.x era (`FSIO_IBMT.h` rev table), IBMT-modified | `SDCARD/` | Legacy MLA; FAT parser handles untrusted media → relevant |
| USB device stack + MSD function | Microchip MLA, IBMT-modified | rev 2.7a / 2.8 era | `USB/` | Legacy MLA; USB descriptor/SCSI parsing of host input → relevant |
| PIC32 peripheral library (plib) | Microchip | legacy | via `plib.h` | Deprecated by Microchip |
| easyGUI generated GUI | IBIS Solutions (easyGUI) | **6.0.8.008** | `GUI/NEW_FLASH/*` | Generated code + fonts |
| C runtime / toolchain | Microchip | C32 **v2.02** (MPLAB 8 `.mcp`) and **XC32 v5.00** (MPLAB X project) | `SYSCTRL.mcp`, `SYSCTRL.X/nbproject` | Confirm which toolchain builds the released hex; archive it for the support period |
| Modbus TCP converter module (21BD option) | Third party (to confirm) | unknown | external | Separate product with its own firmware, credentials and network stack. Must be covered by the product risk assessment/SBOM if Systec sells it as part of DWC2 |

Recommended format: CycloneDX JSON generated per release, at least top-level dependencies (Annex I Part II.1).

---

## 4. Findings vs. CRA Annex I Part I

Severity: **H** = high, **M** = medium, **L** = low (engineering judgement, physical/OT context considered).

### F1. Firmware update is not authenticated (**H**) · Annex I.2(c), (f)
- **Evidence:** the bootloader reads `SYSCTRL.hex` from the SD card at reset and programs flash. Its only checks are the HEX record checksum and the address range (bootloader strings). The USB MSD interface lets a PC write that file.
- **Risk:** arbitrary or modified firmware, which means falsified measurement and totalizer values, a permanently compromised device, or a bricked unit.
- **Fix:** sign release images (e.g. ECDSA P-256 or Ed25519) and verify the signature in the bootloader before erase/program. Add a version counter in protected storage for **anti-rollback**. Keep a fail-safe so the bootloader never erases the running app before the new image is verified. The PIC32MX has no crypto engine, but software signature verification (e.g. micro-ecc, Monocypher) fits in a 52 KB bootloader and runs only at update time.
- **Dependency:** **the bootloader source is not in this repo.** It needs to be located (Systec) or reconstructed.

### F2. Flash code protection and write protection disabled (**H**) · Annex I.2(j), (k), (f)
- **Evidence:** `HAL/SYSCTRL_INIT.c:38–39` sets `#pragma config CP = OFF` and `BWP = OFF`. The bootloader hex's DEVCFG0 = `0x7FFFFFFF` decodes to CP off, BWP off, PWP off. The background debugger is disabled (DEBUG bits = 11), but ICSP read-out is still possible.
- **Risk:** firmware and the embedded secrets/algorithms can be extracted with a standard programmer. Boot flash and bootloader can be overwritten.
- **Fix:** production configuration with `CP = ON`, program-flash write protection (`PWP`) covering the bootloader region, and `BWP = ON`. Verify it in the production programming procedure. Separate debug and production configurations.

### F3. Hard-coded master password (**H**) · Annex I.2(b), (d)
- **Evidence:** `SYSCTRL.h:3020` has `#define DEFAULT_PASSWORD 5555`. `SYSCTRL_WIN_23_PASSWORD.c:419` accepts it to deactivate any user password. `SYSCTRL_PASSWORD.c:134, 144` set the effective password to `DEFAULT_PASSWORD` whenever `protect.dwc` is unreadable or does not match.
- **Risk:** the same unlock code on every device. Anyone who knows it gets full configuration access, including calibration and factory reset. This is the pattern CRA "secure by default" targets.
- **Fix:** remove the universal master PIN. Use a **device-unique** recovery mechanism instead, e.g. a challenge-response code derived from the serial number with a key held only by Systec service, or a reset that also erases protected settings.

### F4. Weak PIN scheme and reversible storage on removable media (**M/H**) · Annex I.2(d), (e)
- **Evidence:** the PIN is 4 numeric digits. `password_encode()` (`SYSCTRL_PASSWORD.c:20–60`) computes `key = SUBn − digit × LETTERn` with constants in the source. This is trivially reversible, so the PIN can be read from `protect.dwc` on the SD card or over USB. No failed-attempt counter or lockout was found in `SYSCTRL_WIN_23_PASSWORD.c`. Password protection is optional, so devices may ship with no PIN (`password == 0` disables all gates in `SYSCTRL_WIN_0.c:481–511`).
- **Fix:**
  - Store only a salted hash (e.g. SHA-256 with a device-unique salt) in MRAM. Do not keep a copy on the SD card.
  - Add attempt limiting with back-off.
  - Consider requiring a PIN at commissioning (secure by default), or document clearly in Annex II user information why the default is acceptable in the intended OT environment.

### F5. Stack buffer overflow in parameter-file import (**H**) · Annex I.2(a), (k)
- **Evidence:** `read_line()` (`SYSCTRL_WIN_26_IMPORT_EXPORT.c:364–410`) copies bytes from the file into `buffer` until it reads `\n`, with **no length limit**. `importLAR_File()` (`:2079–2092`) passes `char str[500]` on the stack. Any line longer than 499 characters in a parameter file on the SD card (writable via USB) overwrites the stack.
- **Risk:** crash or code execution from a crafted file, and a "known exploitable vulnerability" at release.
- **Fix:** pass the buffer size into `read_line()`, stop at `size − 1`, and discard the rest of an over-long line. Add a fuzz test for the import parser (AFL++/libFuzzer on host with a stubbed FS layer). Review other `FSfread`/`strcpy` call sites the same way.

### F6. Parameter/calibration integrity not protected (**M**) · Annex I.2(f)
- **Evidence:** calibration, MUS parameters, flow-error lookup tables and com settings are written to MRAM via `mram_wr_byte()` (e.g. `SYSCTRL_WIN_26_IMPORT_EXPORT.c:1863–2017`). No CRC/MAC over the stored parameter blocks was found (the "crc" hits outside the libraries are false positives). Import from SD writes calibration-relevant values (`AI_Calib`, `actmusparam`, `flowerror_lookupTable`) after only value-range checks.
- **Fix:** add a CRC (minimum) or MAC (better) per parameter block, verified at boot, reporting corruption via a diagnostic/error state (Annex I.2(f) also requires *reporting* corruption). Gate calibration import behind authenticated service access. Log calibration changes (see F9).

### F7. Unauthenticated persistent changes via M-Bus (**L/M**) · Annex I.2(d), (j)
- **Evidence:** `SYSCTRL_MBUS.c:136–154` persists primary/secondary address changes received from the master. The code carries an open TODO: "check values with struct tValue::iWritable set".
- **Context:** M-Bus has no authentication by design (EN 13757). Address changes are a normal M-Bus feature.
- **Fix:** resolve the TODO by rejecting writes to non-writable values. Document the M-Bus trust assumption (protected OT segment) in the risk assessment and user information. Consider a configuration option to disable address changes over the bus.

### F8. Modbus TCP converter (**M**, to verify) · Annex I.2(d), (h), (j)
- **Evidence:** `MODBUSTCP_ENABLE` is active (`SYSCTRL.h:77`). Default IP `192.168.100.10/24`, gateway `.1`, port 502 (`SYSCTRL.h:2960–2972`). The converter is configured over UART1 using frames delimited by fixed constants `0x12345678`/`0x87654321` (design doc 21BD_MODBUS_TCP_Details).
- **Open questions:**
  - Can the converter's configuration also be changed from the **network side** (web UI, vendor tool, default credentials)?
  - Does it have its own firmware update path?
  - Is it robust against TCP floods?
- **Positive:** the DWC2 Modbus map is read-only, so the network exposure is limited to reading data and denial of service.
- **Fix:** include the converter in the risk assessment and SBOM. Obtain the vendor's security information and update policy. Document network segmentation requirements in Annex II user information.

### F9. No security event log (**M**) · Annex I.2(l)
- **Evidence:** no logging of password changes, failed PIN entries, configuration/calibration import, factory reset or firmware update was found. The SD logger records measurement data only.
- **Fix:** add a small ring-buffer security log in MRAM (event, timestamp from RTC, source interface). Make it exportable via SD and the diagnostics screen.

### F10. Watchdog disabled (**L/M**) · Annex I.2(h)
- **Evidence:** `#pragma config FWDTEN = OFF` (`HAL/SYSCTRL_INIT.c:51`). `ENABLE_WATCHDOG` is commented out (`SYSCTRL.h:826`).
- **Fix:** enable the watchdog in production after a timing review of long-blocking paths (SD access, `modbusTCPInit()`/`modbusTCPRead()` blocking UART loops, USB MSD transfers), so essential measurement functions recover from hangs.

### F11. Dormant service backdoor code (**L**, currently compiled out) · Annex I.2(j)
- **Evidence:** `HAL/SYSCTRL_CMDS.c` provides unauthenticated RS232 commands: SD delete/copy/mkdir, and **arbitrary MRAM write** (`%MW`, `cmd_mram()` `:769–787`). It also uses unbounded `strcpy` (`:437`, `:745`). It is guarded by `CMD_ENABLE`, which is **not defined** in the current `SYSCTRL.h` (an older copy shows `#undef CMD_ENABLE`).
- **Fix:** keep it out of production builds, add a build-time check that fails if `CMD_ENABLE` is set in a release configuration, or remove the code. If service access is needed, re-implement it with authentication.

### F12. Weak randomness for activation key (**L**) · Annex I.2(d)
- **Evidence:** `Generate_Random_Password()` seeds `srand(rtc.seconds * rtc.minutes)` (`SYSCTRL_WIN_23_PASSWORD.c:464`). That gives at most 3,600 seeds, many of them 0. The encoded key is stored on the SD card in the same reversible format as F4.
- **Context:** this is feature licensing (logger activation), so it is more a business than a safety risk.
- **Fix:** use a device-unique, server-side-generated activation code instead.

### Positive findings (keep and document as evidence)
| Area | Evidence | CRA value |
|---|---|---|
| Modbus write functions disabled | `Modbus/mbconfig.h:90–102`: `MB_FUNC_WRITE_*_ENABLED = 0`, coils off | Strong attack-surface reduction (I.2(j)); document it in the risk assessment |
| Input-register bounds check | `SYSCTRL_MODBUS.c:552–553` | Robust request handling |
| Service command interface compiled out | `CMD_ENABLE` undefined | Attack-surface reduction |
| Debug serial output behind compile flags | `SYSCTRL.h:420–456` | No debug leakage in release builds (confirm per build) |
| Background debugger disabled | DEVCFG0 DEBUG bits = 11 | Partial protection (but see F2) |
| IP address parser validates octets | `SYSCTRL_WIN_26_IMPORT_EXPORT.c:777–795` | Input validation |
| Static analysis in use | SonarQube project `DWC2` (`sonar-project.properties`, `.scannerwork`) | Supports Annex I Part II.3 (security testing). Add security rules and keep reports as technical-file evidence |

---

## 5. Gaps vs. CRA Annex I Part II and manufacturer obligations

| Requirement | Status for DWC2 | Action |
|---|---|---|
| II.1 SBOM | Not present | Generate CycloneDX per release from section 3, including bootloader and converter |
| II.2 Fix without delay; separate security updates | No signed update mechanism; releases are bundled IR versions | Enable security-only patch releases on the maintenance branch |
| II.3 Security testing | SonarQube only | Add fuzzing of SD-file parsers (LAR/PAR, `protect.dwc`, FAT), Modbus/M-Bus frame fuzzing, and update-path negative tests |
| II.4–6 Disclosure, CVD policy, contact | Not in repo; Systec-level process | Systec security contact + CVD policy (process track) |
| II.7–8 Secure, free security updates | Update via SD is possible, but not secure | F1 + documented update procedure in user information |
| Art. 13(8) Support period | Not defined | Define per product (expected use ~10–20 years in the field). Archive toolchain (C32 2.02 / XC32 5.00), MPLAB projects and bootloader build |
| Art. 14 reporting (applies now) | No runbook | 24 h / 72 h / 14 d runbook. Map installed versions (IR 25 … IR 45) to SBOMs for fast triage |
| Annex VII technical documentation | Release notes, test reports and design docs exist per IR (`documentation/Release documents/`) | Good base. Add architecture/attack-surface (section 2), risk assessment, SBOM, security test reports |
| Annex II user information | Not reviewed | Add: support end date, secure installation (OT segmentation for Modbus TCP/M-Bus), how to verify firmware authenticity, how to set the PIN, secure decommissioning (erase MRAM/SD) |

---

## 6. Remediation roadmap (brownfield-safe)

Every change must preserve measurement behaviour, the Modbus/M-Bus register maps, calibration data compatibility and the SD file formats customers use. Each item goes through the Brownfield AI-SDLC flow: impact analysis → change plan → G1 approval → regression against the behaviour baseline.

| Priority | Item | Findings | Effort (rough) | Brownfield risk to watch |
|---|---|---|---|---|
| **P0 (now)** | Vulnerability-handling process, SBOM, CVE monitoring of FreeModbus / MLA / solvimus / converter | Part II, Art. 14 | S | None (process) |
| **P0** | Fix `read_line()` bounds; review other SD/strcpy paths; add fuzz harness | F5 | S | Existing over-long lines in customer files must still import, or fail cleanly |
| **P1** | Production config bits: `CP`, `PWP` (bootloader region), `BWP` | F2 | S | Field-update flow and production programming must be re-validated. **CP blocks read-back during service.** Agree the procedure with Systec |
| **P1** | Signed firmware + anti-rollback in bootloader | F1 | M–L | Needs bootloader source. Key management (who signs, where keys live). Migration path for units with BL 0.0.4 (one-time bootloader update) |
| **P1** | Remove master PIN `5555`; hashed PIN in MRAM; attempt limiting; no PIN copy on SD | F3, F4 | M | Service/recovery workflow for customers who forget their PIN. Compatibility with existing `protect.dwc` files |
| **P2** | Parameter-block CRC/MAC + corruption reporting | F6 | M | MRAM layout change → migration on first boot after update |
| **P2** | Security event log | F9 | S–M | MRAM space; flash size (see existing flash-optimisation work) |
| **P2** | Watchdog enable after timing review | F10 | S–M | Long blocking SD/USB/UART loops must kick the watchdog |
| **P3** | M-Bus writable-value check; option to disable bus address changes | F7 | S | Customers relying on M-Bus addressing |
| **P3** | Converter assessment; Annex II network guidance | F8 | S | — |
| **P3** | Remove/guard `CMD_ENABLE` code; replace weak activation-key RNG | F11, F12 | S | Service tooling that may rely on `%` commands |

**Flash budget note:** the repo already contains flash-optimisation work (`MANAGER_SUMMARY_Flash_Optimization.md`, `code_size_reduction_review.md`), so program memory is tight. Signature verification belongs in the **bootloader** (52 KB region), not the application. PIN hashing and CRC add only a few KB.

---

## 7. Open questions for Systec

1. Where is the **bootloader BL 0.0.4 source**, and who owns it? Can the bootloader be updated in the field, or only at production?
2. Which toolchain builds the released hex: C32 v2.02 (MPLAB 8) or XC32 v5.00 (MPLAB X)?
3. Which DWC2 variants and IR versions will still be **placed on the EU market after 11 Dec 2027**?
4. Is the heat-metering function (VIEGA variant) used for **billing**, which would bring in MID MI-004? MID-certified software has its own legal-metrology constraints on updates.
5. Who supplies the **Modbus TCP converter**? Does it have a web UI, default credentials or its own firmware updates?
6. Is code protection deliberately off for service reasons (e.g. reading back units in the field)?
7. Is `ENABLE_PASSWORD` active in all shipped variants, and is the master PIN `5555` documented to customers or service only?
8. Are there other connected tools (SystecParamSoftware, flowcom software) that talk to DWC2? They are in CRA scope as software products too.

---

## 8. Limits of this analysis
- Static review only. No hardware tests, no fuzzing and no binary diff of shipped images were run.
- Bootloader behaviour was inferred from strings and configuration words in `SYS_Bootloader_V004.hex`, not from source.
- I did not check third-party library versions against CVE databases (no automated scan run). That is the first P0 item.
- Variant-specific `#ifdef` combinations (1CH/2CH, language builds, VIEGA) were checked only for the flags named above. Each release configuration should be verified.
- MRAM handling (`mram_rd_byte`/`mram_wr_byte`) and the USB MSD SCSI command handling were not reviewed in depth. They are recommended for the next pass.
