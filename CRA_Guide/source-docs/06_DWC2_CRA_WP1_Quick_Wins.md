# DWC2 CRA Work Package 1: Quick Wins (design, changes, effort, tests)

**Project:** systec DWC2 firmware (`SYSCTRL`, PIC32MX575F512L), branch `Phase_2-IR_46_DWC2`
**Prepared:** 23 Nov 2026 · Tismo Brownfield team
**Based on:** findings in [04_CRA_DWC2_Codebase_Analysis.md](04_CRA_DWC2_Codebase_Analysis.md), action plan item **Q1** in [05_DWC2_CRA_Action_Plan.md](05_DWC2_CRA_Action_Plan.md) §7.2
**Status:** proposal for decision. No source file has been changed. Code references are to the working tree on 23 Nov 2026.

---

## 1. CRA tasks for DWC2 and what this package covers

| ID | CRA task (from 04/05) | CRA reference | Risk | In WP1? |
|---|---|---|---|---|
| T1 | Bounded parsing of SD parameter files (LAR/PAR import) | Annex I.2(a), (k) | R06 (High) | **Yes** |
| T2 | Disable JTAG in release builds | Annex I.2(j), (k) | R02, R03 | **Yes** |
| T3 | Production configuration bits: code protection `CP`, boot/program write protection `BWP`/`PWP` | Annex I.2(f), (j), (k) | R02, R03 | **Yes** (firmware side + procedure) |
| T4 | Build-time guard: no service command interface / debug output in release builds | Annex I.2(j) | R13 | **Yes** |
| — | Signed firmware update + anti-rollback (secure bootloader) | I.2(c), (f) | R01 | No: 2027, needs bootloader source (S1) |
| — | Remove master PIN 5555, hashed PIN, user levels | I.2(b), (d) | R04, R05 | No: S2 (≈ 94–122 h) |
| — | Parameter CRC, security log, watchdog, M-Bus write check, converter | I.2(f), (h), (l) | R07–R10 | No: S3 |
| — | SBOM, CVE monitoring, vulnerability handling (Art. 14) | Part II, Art. 14 | R11, R12 | No: Phase A (A4) / process |

**Why this selection:** these four tasks remove the only confirmed memory-safety defect reachable from customer-handled media (SD/USB), and close the debug/read-out paths. They need no bootloader source, no MRAM layout change and no change to file formats, register maps or menus. That makes them the lowest-risk CRA changes for a brownfield release.

---

## 2. Existing design and code

### T1: SD parameter-file import (`1CH_2CH_GUI_SCREEN/SYSCTRL_WIN_26_IMPORT_EXPORT.c`)

Flow: `importLAR_File()` → `read_line()` per row → `systemInfoDetails()` (splits on `;`) → `parse_token()` → row handlers → `import_row_*()` → MRAM.

| # | Location | Existing code | Defect |
|---|---|---|---|
| 1a | `read_line()` `:364–410` | Copies 1 byte at a time into `buffer` until `\n` or EOF. A `\r` is stored as `\n` | **No length limit.** The caller's buffer size is not passed in |
| 1b | `importLAR_File()` `:2079–2092` | `char str[500]` on the stack, passed to `read_line()` | A line of ≥ 500 bytes overwrites the stack (return address) |
| 1c | `systemInfoDetails()` `:1076–1103` | `char str1[50]; sprintf(str1, "%s", token);` | A `;`-separated field of ≥ 50 bytes overwrites the stack |
| 1d | `update_custom_settings()` `:538, 542`; `update_custom_fluid_settings()` `:610` | `strcpy(...name[0], &str[1])` into `unsigned char name[8]` | A custom pipe/liner/fluid name of ≥ 8 bytes overwrites adjacent static data (`soundsp`, `poissonN`, ...) |

The row and column indexes are already range-checked (`handle_custom_settings()` `:567–581`), and many values are range-checked after parsing (e.g. `import_row_9_10()`). Only the string lengths are not checked.

**Legitimate maximum line length:** the device's own export writes rows with `snprintf` into `buf[512]` / `tmp_buffer[500]`. The longest row (flow-correction table rows 20/21/23/24: ten `%f` values) is ≤ 493 bytes even with ±FLT_MAX, and typically about 130 bytes. So a 500-byte limit accepts every file the device can produce.

**Pending change on this branch:** the uncommitted VIEGA change adds `adc_offset` to rows 8/9 (`:150`, `:900`, `:1553`, `:2901–2911`). Rows 8/9 stay well below the limit. T1 must be merged on top of that change.

### T2: JTAG (`SYSCTRL.c:164`)
```c
DDPCON = 0x0008;   // Trace Output disabled
```
On PIC32MX, `DDPCON` bit 3 is `JTAGEN`. The value `0x0008` turns trace off but **leaves JTAG on**, so the comment is misleading. JTAG pins are RA0/RA1/RA4/RA5. The firmware uses only RA9 (`ADDR17`) and RA10 (`XLCD_CS`) on port A (`SYSCTRL.h:1120–1127`), so turning JTAG off has no GPIO side effect. ICSP (PGEC/PGED) programming is not affected by `JTAGEN`.

### T3: Configuration bits (`HAL/SYSCTRL_INIT.c:38–39`)
```c
#pragma config CP  = OFF   // Code protection off
#pragma config BWP = OFF   // Boot flash write protect off
```
`PWP` is not set, so it defaults to off. Config words are linked at `0xBFC02FF0–0xBFC02FFF` (`SYS_BOOTFILE.ld:53–56`). The shipped bootloader image `SYS_Bootloader_V004.hex` carries DEVCFG0 = `0x7FFFFFFF` (all protection off). **Open point:** without bootloader source we do not know whether BL 0.0.4 writes the config words from an SD `SYSCTRL.hex`. Most Microchip bootloaders skip them. If BL 0.0.4 does, the protection must be set in the **production programming image** (bootloader + application merged), not only in the application.

The MPLAB X project has a single build configuration, `default` (`SYSCTRL.X/nbproject/configurations.xml:227`). There is no separation between debug and production builds.

### T4: Service command interface and debug output
- `HAL/SYSCTRL_CMDS.c` (whole file under `#if defined(CMD_ENABLE)`): unauthenticated RS232 commands, including raw MRAM write `%MW`.
- `SYSCTRL.h:249–251` undefines `CMD_ENABLE` only when `MODBUS_ENABLE` or `M_BUS_ENABLE` is set. In a `NOBUS_ENABLE` or `MODBUSTCP_ENABLE` build nothing prevents a developer from enabling it.
- Debug output is controlled by `DEBUG_SERIAL_PORT` and related flags (`SYSCTRL.h:420–456`). It is off today, but nothing at build time enforces that.
- Variant selection is done by editing `SYSCTRL.h`, partly by the AUTOBUILDER (`//_AUTOBUILDER_` markers).

---

## 3. Existing test cases that validate this design

Source: `documentation/Release documents/IR 45/Systec_21BD_DWC2 Test Report Document.xls` (v5.0, test infrastructure MPLAB C32 v2.02 on DWC2 hardware).

| Existing test | Sheet | What it proves | Relevance for WP1 |
|---|---|---|---|
| IMPORT_TC_01 … IMPORT_TC_20 | IR 42 Release Testing | Each LAR row (system info, settings, bus, DO/AO/AI, transducer, pipe/liner, gauge, expert) imports correctly, and read-only rows are not written | **Regression baseline for T1.** Must pass unchanged |
| EXPORT_TC_01 … EXPORT_TC_28 | IR 42 Release Testing | Export values match UI settings, 1CH/2CH, TCP/Modbus | Regression baseline for T1 (round trip export → import) |
| REFACTOR_06 / REFACTOR_17 | IR 36 Release Testing | Save/Load parameter file without crash | Regression baseline for T1 |
| MEM_OPT_*_1 (EN_DE_FR, EN_ES_FR, EN_RU_CH, EN_DE_PO) | Code Optimization testing | Program memory < 98 % of `0x73000` per language build | **Flash budget gate** for all WP1 changes |
| MEM_OPT_*_2 | Code Optimization testing | Image built with bootloader, renamed `SYSCTRL.hex`, loaded from SD, device works | Update path still works after T2/T3 |
| EN_RU_TC_01 / _03 | IR 45 Release Testing | EN_RU and EN_CH builds and memory | Flash budget gate for the newer language builds |

**Gaps (no existing test):**
- no negative or robustness test for import files (over-long line, over-long field, over-long name, binary garbage, missing `\n`);
- no check of JTAG state or config words on a programmed device;
- no build-configuration check (release flags);
- no static-analysis gate. SonarQube runs, but its result is not a release criterion.

---

## 4. Changes to be made

All changes are guarded so that behaviour for valid inputs is unchanged. They follow the Brownfield flow: impact analysis (this section) → G1 approval → implementation → regression against section 3 → new tests in section 6.

### C1 (T1): Bounded import parsing
1. Add `#define IMPORT_LINE_MAX 500u`, and use it for `str[]` in `importLAR_File()`.
2. Change the signature to `read_line(volatile FSFILE *fin, unsigned char *buffer, unsigned short size)`:
   - store at most `size − 1` bytes and always terminate with `'\0'`;
   - keep the existing `\r` → `\n` and EOF/`end_flag` behaviour exactly as today;
   - if the line is longer, discard bytes up to the next `\n`/EOF and return a new code `2` ("line too long").
3. In `importLAR_File()`: on return code `2`, **skip that row** (do not pass a truncated row to the parser, because a cut number would be applied as a wrong value), count it, and continue. After the import, show the existing import-error indication if any row was skipped (reuse the current GUI message; no new language strings).
4. `systemInfoDetails()`: replace `sprintf(str1, "%s", token)` with `snprintf(str1, sizeof(str1), "%s", token)`.
5. Name copies (`:538`, `:542`, `:610`): replace `strcpy` with a bounded copy that keeps `name[7] = '\0'`, e.g. `strncpy(dst, src, sizeof(name) − 1); dst[sizeof(name) − 1] = '\0';`.
6. Apply the same review to `SYSCTRL_PASSWORD.c` (`protect.dwc` read) and other `FSfread` call sites. Fix only if a defect is confirmed, and log the result.

### C2 (T2): JTAG off in release builds
```c
#ifdef RELEASE_BUILD
    DDPCON = 0x0000;   // JTAG off, trace off
#else
    DDPCON = 0x0008;   // JTAG on for development
#endif
```
Correct the comment.

### C3 (T3): Production configuration bits
```c
#ifdef RELEASE_BUILD
#pragma config CP = ON, BWP = ON, PWP = <pages covering 0x9D000000–0x9D00CFFF>
#else
#pragma config CP = OFF, BWP = OFF
#endif
```
- Set the same values in the **production programming image** and verify them with MPLAB IPE after programming.
- Check with Systec, before release, whether service needs flash read-back (Q-06) and whether BL 0.0.4 writes config words (Q-01). If BL 0.0.4 writes them, a field update must not clear the protection.

### C4 (T4): Release build guard
- Introduce `RELEASE_BUILD` as a compiler define in a **new MPLAB X configuration `production`** (`-DRELEASE_BUILD`). Keep `default` for development.
- In `SYSCTRL.h`, after the variant section:
```c
#ifdef RELEASE_BUILD
  #if defined(CMD_ENABLE) || defined(DEBUG_SERIAL_PORT) /* + other debug flags */
    #error "Service/debug interface must not be enabled in a release build"
  #endif
#endif
```
- Update the AUTOBUILDER/release procedure so that released hex files are built from the `production` configuration only.

### Expected flash impact
About 100–300 bytes (bounded copies, one return code, one counter). This must be confirmed with the MEM_OPT_*_1 gate for every language build; EN_DE_FR is the tightest.

---

## 5. Effort estimation

One engineer familiar with the code. ±25 %. Excludes Systec review time and the bootloader investigation if the source cannot be found.

| Task | Design / impact | Code | New tests (section 6) | Regression (section 3) | Docs, review | **Total (h)** |
|---|---|---|---|---|---|---|
| C1 bounded import parsing | 2 | 4 | 6 (host harness) + 4 (target) | 6 | 2 | **24** |
| C2 JTAG off | 0.5 | 0.5 | 1 | — | 0.5 | **2.5** |
| C3 config bits + programming procedure | 1 | 1 | 2 | 1 | 2 | **7** |
| C4 release build guard + `production` configuration | 0.5 | 1.5 | 1 | — | 0.5 | **3.5** |
| Release build of all variants, MEM_OPT gate, test report, release note | — | — | — | 3 | 2 | **5** |
| **WP1 total** | | | | | | **≈ 42 h** (range 32–52 h) |

**Note on the 05 estimate:** action plan Q1 gave 16–24 h for implementation only. This figure adds the host test harness, the negative tests and the full regression needed as CRA evidence (Annex I Part II.3).

---

## 6. Test cases to validate the changes

**Environment:** DWC2 hardware 1CH and 2CH, VIEGA variant and one standard variant; SD card; PC with USB; MPLAB IPE + ICD/PICkit; MPLAB C32 v2.02 (release toolchain). Host tests: gcc on a PC with `FSfread`/`FSfopen` stubbed over an in-memory buffer.

### 6.1 C1: Import robustness (new)
| ID | Test | Input | Expected result |
|---|---|---|---|
| CRA_IMP_TC_01 | Line exactly at the limit | Valid LAR file; one row padded to 499 bytes | Imported; values identical to the unpadded file |
| CRA_IMP_TC_02 | Over-long line | Row 3 with 600 bytes | No crash or reset; row 3 skipped; all other rows imported; import-error indication shown |
| CRA_IMP_TC_03 | Very long line, no `\n` | 64 KB file with no newline | No crash; import ends; no setting changed |
| CRA_IMP_TC_04 | Over-long field | Row 12 with a 200-byte field between `;` | No crash; field rejected or clamped by the existing range check; other rows imported |
| CRA_IMP_TC_05 | Over-long custom name | Row 26 (pipe name) of 40 characters | Name stored as the first 7 characters, terminated; `soundsp`/`poissonN` of the same entry unchanged (check by export) |
| CRA_IMP_TC_06 | Binary garbage | 4 KB of random bytes named as LAR file | No crash; no setting outside its valid range; device usable |
| CRA_IMP_TC_07 | CRLF vs LF files | Same content saved with CRLF and with LF | Identical import result (existing behaviour kept) |
| CRA_IMP_TC_08 | Last line without newline | Valid file, final row has no `\n` | Final row imported (behaviour of the 24-Sep-21 change kept) |
| CRA_IMP_TC_09 | Round trip | Export from device → import on the same device → export again | Both export files byte-identical, 1CH and 2CH, VIEGA (incl. `adc_offset`) |
| CRA_IMP_TC_10 | Host unit tests | `read_line()` with size 1, 2, 500; empty file; only `\r`; `\r\n`; EOF in the middle of a line | Never writes beyond `size`; always terminated; return codes 0/1/2 as specified |
| CRA_IMP_TC_11 | Host fuzzing (optional, recommended) | `read_line()` + `systemInfoDetails()` under AFL++/libFuzzer with AddressSanitizer, ≥ 1 h | No ASan finding; corpus stored as evidence |

### 6.2 C2/C3: Debug lock and protection (new)
| ID | Test | Steps | Expected result |
|---|---|---|---|
| CRA_HW_TC_01 | JTAG off in release | Program `production` build; try to connect over JTAG (boundary scan / debugger on RA0/1/4/5) | No JTAG connection |
| CRA_HW_TC_02 | JTAG on in development | Program `default` build | JTAG and debugging work as before |
| CRA_HW_TC_03 | Code protection | Program production image; read flash with MPLAB IPE | Read-back is blocked or returns protected data; config words show `CP` on, `BWP` on, `PWP` as specified |
| CRA_HW_TC_04 | Bootloader protected | From the application, try to erase or write a page in the bootloader range (test build only) | Write fails; bootloader still runs after reset |
| CRA_HW_TC_05 | SD update still works | Put a new `production` `SYSCTRL.hex` on SD; reset | Bootloader updates the application; device runs; config words still protected (answers Q-01 in practice) |
| CRA_HW_TC_06 | ICSP reprogramming | Full chip erase and reprogram with IPE | Works; the protection is removed only by full erase |
| CRA_HW_TC_07 | Port A outputs | Production build: LCD (`XLCD_CS` RA10) and address line (`ADDR17` RA9) | Display and memory access work as before |

### 6.3 C4: Build guard (new)
| ID | Test | Steps | Expected result |
|---|---|---|---|
| CRA_BLD_TC_01 | Guard blocks service interface | `production` configuration with `#define CMD_ENABLE` | Build fails with the `#error` text |
| CRA_BLD_TC_02 | Guard blocks debug output | `production` configuration with `DEBUG_SERIAL_PORT` | Build fails |
| CRA_BLD_TC_03 | Clean release build | `production` configuration, all variants (1CH/2CH, each language package, VIEGA, bus options) | All build; map file contains no `cmd_mram` / `SYSCTRL_CMDS` symbols |
| CRA_BLD_TC_04 | Development unaffected | `default` configuration with `CMD_ENABLE` | Builds as before |

### 6.4 Regression (existing, re-run)
| Scope | Test IDs | Pass criterion |
|---|---|---|
| Import/export | IMPORT_TC_01–20, EXPORT_TC_01–28, REFACTOR_06/17 | Same results as in the IR 45 report |
| Flash budget | MEM_OPT_*_1 for EN_DE_FR, EN_ES_FR, EN_RU_CH, EN_DE_PO; EN_RU_TC_01/03 | Program memory < 98 % of `0x73000` in every build |
| Bootloader load | MEM_OPT_*_2 | Device works when loaded from SD with the bootloader |
| Measurement smoke test | IR 45 ADC_TC_01–04; totalizer IMP_TOT_BF_01/02 | Unchanged values |
| Static analysis | SonarQube project `DWC2` | No new bugs or vulnerabilities in changed files; report stored in the technical file |

### 6.5 Exit criteria for WP1
- All tests in 6.1–6.3 pass; 6.4 shows no regression.
- R06 and R13 are closed, and R02/R03 move to low once production programming applies C3 (to be confirmed with Systec).
- Test report sheet "CRA WP1 Testing" is added to `Systec_21BD_DWC2 Test Report Document.xls`. The release note states the CRA changes and the residual risk (R01 stays until the 2027 secure bootloader).

---

## 7. Open points before implementation
| ID | Question | Blocks |
|---|---|---|
| Q-01 | Does BL 0.0.4 program config words from `SYSCTRL.hex`? Is its source available? | C3 |
| Q-06 | Is flash read-back needed in service or production (reason for `CP = OFF`)? | C3 |
| Q-11 | Is C32 v2.02 the release toolchain? Is the AUTOBUILDER able to select an MPLAB X configuration? | C4 |
| New | Which GUI message should signal "import row skipped"? Reusing an existing string avoids work in all language packages | C1 |
