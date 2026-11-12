/* CRA Guide - shared navigation, header, links, theme. Works from file:// (no fetch). */
(function () {
  "use strict";

  // ---- Local roots used for "open file" links -------------------------------------------
  var ROOTS = {
    dwc2: "D:/Projects/GIT/Systec - DWx/GIT/DWx/IR_44/DWx_Software_Maintenance/Technical/Sources/Software/DWC2/",
    inv:  "D:/Projects/GIT/Investigations/Autromation to SDLC documents/",
    cra:  "D:/Projects/GIT/Investigations/Autromation to SDLC documents/Cyber Resilience Act/"
  };
  window.CRA_ROOTS = ROOTS;

  // ---- Site map -------------------------------------------------------------------------
  var NAV = [
    { group: "Start", items: [
      { href: "index.html", title: "Home", kw: "overview start key points cra guide" }
    ]},
    { group: "CRA guidelines", items: [
      { href: "cra-basics.html", n: "1", title: "What the CRA is", kw: "regulation 2024/2847 product law roles manufacturer importer distributor free paid standards eur-lex" },
      { href: "scope.html", n: "2", title: "Scope & exclusions", kw: "in scope out of scope medical vehicle open source spare parts checker remote data processing" },
      { href: "classes.html", n: "3", title: "Product classes & routes", kw: "default important class i class ii critical annex iii annex iv module a b+c h notified body" },
      { href: "requirements.html", n: "4", title: "Essential requirements", kw: "annex i part i part ii secure by default updates sbom cvd access control integrity logging" },
      { href: "obligations.html", n: "5", title: "Obligations & reporting", kw: "art 13 14 support period 5 years reporting 24h 72h enisa penalties fines annex ii annex vii technical documentation doc ce" },
      { href: "timeline.html", n: "6", title: "Key dates", kw: "timeline 2024 2026 2027 2028 deadlines today legacy substantial modification" },
      { href: "landscape.html", n: "7", title: "Related laws & standards", kw: "red nis2 machinery ai act pld data act gpsr iec 62443 en 18031 etsi 303 645 mdr" },
      { href: "how-to.html", n: "8", title: "How to comply (brownfield)", kw: "workflow steps process tara stride risk assessment ai help brownfield retrofit" }
    ]},
    { group: "Baseline example: Systec", items: [
      { href: "systec.html", n: "S1", title: "Systec products & CRA", kw: "systec deltawave flowcom products classification risk points roadmap" },
      { href: "dwc2-overview.html", n: "S2", title: "DWC2: system & attack surface", kw: "dwc2 pic32mx575 context interfaces sbom bootloader usb sd modbus mbus jtag" },
      { href: "dwc2-findings.html", n: "S3", title: "DWC2: findings F1–F12", kw: "findings code review master password 5555 read_line overflow code protection unsigned update watchdog" },
      { href: "dwc2-risk.html", n: "S4", title: "DWC2: assets & risk matrix", kw: "assets risk register matrix likelihood impact r01 phase a tara" },
      { href: "dwc2-plan.html", n: "S5", title: "DWC2: action plan & estimates", kw: "action plan hours estimate phase a phase b stride nitrokey secure boot user levels interface measures questions moser february review" },
      { href: "traceability.html", n: "S6", title: "Requirement → DWC2 trace", kw: "traceability annex i mapping requirement finding risk action evidence" }
    ]},
    { group: "Resources", items: [
      { href: "files.html", n: "R1", title: "File navigator", kw: "files documents source code markdown pptx paths open" },
      { href: "glossary.html", n: "R2", title: "Glossary & sources", kw: "glossary terms sbom cvd csirt enisa tara stride doc sources links" }
    ]}
  ];

  var flat = [];
  NAV.forEach(function (g) { g.items.forEach(function (i) { i.group = g.group; flat.push(i); }); });
  var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (!here || here.indexOf(".html") < 0) here = "index.html";
  var idx = flat.findIndex(function (i) { return i.href === here; });

  // ---- Theme ------------------------------------------------------------------------------
  function getTheme() { try { return localStorage.getItem("cra-theme"); } catch (e) { return null; } }
  function setTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
    try { if (t) localStorage.setItem("cra-theme", t); else localStorage.removeItem("cra-theme"); } catch (e) {}
  }
  setTheme(getTheme());

  // ---- Helpers ------------------------------------------------------------------------------
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }
  function fileUrl(p) { return "file:///" + encodeURI(p.replace(/\\/g, "/")).replace(/#/g, "%23"); }

  document.addEventListener("DOMContentLoaded", function () {
    var main = document.querySelector("main");
    if (!main) return;

    // Header
    var header = el("header", { class: "topbar" });
    header.innerHTML =
      '<button class="iconbtn" id="menuBtn" aria-label="Open menu">☰</button>' +
      '<a class="brand" href="index.html"><span class="logo">CRA</span><span>Cyber Resilience Act Guide <small>· Systec DWC2 baseline</small></span></a>' +
      '<span class="spacer"></span>' +
      '<input type="search" id="navSearch" placeholder="Filter pages… ( / )" aria-label="Filter pages">' +
      '<button class="iconbtn" id="themeBtn" title="Toggle light/dark">◐</button>';

    // Sidebar
    var side = el("aside", { class: "sidebar", id: "sidebar" });
    NAV.forEach(function (g) {
      var box = el("div", { class: "group" });
      box.appendChild(el("h4", null, g.group));
      g.items.forEach(function (i) {
        var a = el("a", { href: i.href, "data-kw": (i.title + " " + (i.kw || "")).toLowerCase() },
          (i.n ? '<span class="num">' + i.n + "</span>" : '<span class="num">⌂</span>') + "<span>" + i.title + "</span>");
        if (i.href === here) a.className = "active";
        box.appendChild(a);
        if (i.href === here) {
          var toc = el("div", { class: "toc" });
          main.querySelectorAll("h2").forEach(function (h) {
            if (!h.id) h.id = slug(h.textContent);
            toc.appendChild(el("a", { href: "#" + h.id }, h.textContent));
          });
          if (toc.children.length) box.appendChild(toc);
        }
      });
      side.appendChild(box);
    });

    var layout = el("div", { class: "layout" });
    document.body.insertBefore(header, document.body.firstChild);
    main.parentNode.insertBefore(layout, main);
    layout.appendChild(side);
    layout.appendChild(main);

    // Breadcrumb
    if (idx >= 0 && here !== "index.html") {
      var c = el("div", { class: "crumbs" }, '<a href="index.html">Home</a> › ' + flat[idx].group + " › " + flat[idx].title);
      main.insertBefore(c, main.firstChild);
    }

    // Pager + footer
    if (idx >= 0) {
      var pager = el("nav", { class: "pager" });
      if (idx > 0) pager.appendChild(el("a", { href: flat[idx - 1].href, class: "prev" }, "<small>← Previous</small>" + flat[idx - 1].title));
      if (idx < flat.length - 1) pager.appendChild(el("a", { href: flat[idx + 1].href, class: "next" }, "<small>Next →</small>" + flat[idx + 1].title));
      main.appendChild(pager);
    }
    main.appendChild(el("div", { class: "foot" },
      "Engineering summary prepared by the Tismo Brownfield team, not legal advice. CRA text taken from " +
      '<a href="https://www.cyberresilienceact.eu/regulation.html" target="_blank" rel="noopener">cyberresilienceact.eu</a> (unofficial reproduction). ' +
      'The binding text is <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R2847" target="_blank" rel="noopener">Regulation (EU) 2024/2847 on EUR-Lex</a>. ' +
      "DWC2 findings reflect the IR 44 maintenance tree as reviewed on 12 Nov 2026."));

    // Theme toggle
    document.getElementById("themeBtn").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var sysDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var isDark = cur ? cur === "dark" : sysDark;
      setTheme(isDark ? "light" : "dark");
    });

    // Mobile menu
    document.getElementById("menuBtn").addEventListener("click", function () { document.body.classList.toggle("nav-open"); });
    side.addEventListener("click", function (e) { if (e.target.closest("a")) document.body.classList.remove("nav-open"); });

    // Nav filter
    var s = document.getElementById("navSearch");
    s.addEventListener("input", function () {
      var q = s.value.trim().toLowerCase();
      side.querySelectorAll(".group").forEach(function (g) {
        var any = false;
        g.querySelectorAll(":scope > a").forEach(function (a) {
          var ok = !q || a.getAttribute("data-kw").indexOf(q) >= 0;
          a.classList.toggle("hidden", !ok); if (ok) any = true;
        });
        var toc = g.querySelector(".toc"); if (toc) toc.classList.toggle("hidden", !!q);
        g.classList.toggle("hidden", !any);
      });
    });
    s.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { var first = side.querySelector(".group:not(.hidden) > a:not(.hidden)"); if (first) location.href = first.getAttribute("href"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== s && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); s.focus(); }
    });

    // File links: <a class="filelink" data-root="dwc2" data-path="HAL/SYSCTRL_INIT.c" data-line="38-39"></a>
    main.querySelectorAll("a.filelink").forEach(function (a) {
      var root = ROOTS[a.getAttribute("data-root")] || "";
      var p = a.getAttribute("data-path") || "";
      var full = root + p;
      a.href = fileUrl(full);
      a.target = "_blank";
      a.title = "Open " + full.replace(/\//g, "\\");
      if (!a.textContent.trim()) a.textContent = p.split("/").pop() + (a.getAttribute("data-line") ? ":" + a.getAttribute("data-line") : "");
      var b = el("button", { class: "copybtn", type: "button", title: "Copy local path" }, "copy");
      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        var txt = full.replace(/\//g, "\\");
        var done = function () { b.textContent = "copied"; setTimeout(function () { b.textContent = "copy"; }, 1200); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { window.prompt && window.prompt("Path", txt); });
        else { window.prompt && window.prompt("Path", txt); }
      });
      a.insertAdjacentElement("afterend", b);
    });

    // Tabs: <div class="tabs" data-tabs="x"><button data-t="a">..</button></div> + <section data-tab-group="x" data-tab="a">
    document.querySelectorAll(".tabs[data-tabs]").forEach(function (t) {
      var grp = t.getAttribute("data-tabs");
      var btns = t.querySelectorAll("button");
      function show(k) {
        btns.forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-t") === k); });
        document.querySelectorAll('[data-tab-group="' + grp + '"]').forEach(function (p) { p.hidden = p.getAttribute("data-tab") !== k; });
      }
      btns.forEach(function (b) { b.addEventListener("click", function () { show(b.getAttribute("data-t")); }); });
      if (btns[0]) show(btns[0].getAttribute("data-t"));
    });

    // Open a <details> if the URL hash points into it
    function openHash() {
      if (!location.hash) return;
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t && t.tagName === "DETAILS") t.open = true;
      if (t) { t.scrollIntoView(); }
    }
    window.addEventListener("hashchange", openHash);
    openHash();
  });
})();
