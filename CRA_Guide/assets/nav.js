/* CRA Guide - shared navigation, header, links, theme. Works from file:// (no fetch). */
(function () {
  "use strict";

  // ---- Local roots used for "open file" links (only resolve on the author's PC) -------------
  var ROOTS = {
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
      { href: "how-to.html", n: "8", title: "How to comply (brownfield)", kw: "workflow steps process tara stride risk assessment ai help brownfield retrofit" },
      { href: "ra-method.html", n: "9", title: "Risk-assessment method & templates", kw: "iso 31000 guideline templates t1 t15 v1.2 5x5 criteria review definition of done annex ii part ii" }
    ]},
    { group: "Worked example: EX-100", items: [
      { href: "portfolio.html", n: "S1", title: "Typical instrument portfolio", kw: "industrial instruments portfolio flow meter flow computer products classification risk points roadmap" },
      { href: "example-overview.html", n: "S2", title: "EX-100: system & attack surface", kw: "example pic32mx context interfaces sbom bootloader usb sd modbus mbus jtag" },
      { href: "example-findings.html", n: "S3", title: "EX-100: findings F1–F12", kw: "findings code review master password fixed master PIN read_line overflow code protection unsigned update watchdog" },
      { href: "example-risk.html", n: "S4", title: "EX-100: risk assessment v0.2", kw: "assets risk register matrix likelihood impact 5x5 r01 r19 residual roadmap phase a tara v0.2" },
      { href: "example-plan.html", n: "S5", title: "EX-100: action plan & estimates", kw: "action plan hours estimate phase a phase b stride nitrokey secure boot user levels interface measures questions product manager review" },
      { href: "example-wp1.html", n: "S6", title: "EX-100: WP1 quick wins", kw: "wp1 quick wins import read_line jtag code protection cp bwp pwp release build guard effort 42 h test cases" },
      { href: "traceability.html", n: "S7", title: "Requirement → EX-100 trace", kw: "traceability annex i mapping requirement finding risk action evidence" }
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

  // Dark theme only (matches the other user guides)
  try { localStorage.removeItem("cra-theme"); } catch (e) {}

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

    // Page frame: header, quick navigation, page body as cards (same layout as the other user guides)
    var wrap = el("div", { class: "wrap" });
    var head = el("header", { class: "site-head" },
      '<span class="logo">CRA</span><div><p class="t"><a href="index.html">Cyber Resilience Act Guide</a></p>' +
      '<div class="s">A step-by-step guide to the EU Cyber Resilience Act, with a worked example (EX-100).</div></div>');

    var nav = el("nav", { class: "card quicknav", "aria-label": "Guide pages" });
    nav.appendChild(el("h2", null, "Quick navigation"));
    NAV.forEach(function (g) {
      var grp = el("div", { class: "grp" });
      grp.appendChild(el("span", null, g.group));
      g.items.forEach(function (i) {
        grp.appendChild(el("a", { href: i.href, class: "btn" + (i.href === here ? " on" : "") },
          (i.n ? "<small>" + i.n + "</small>" : "") + i.title));
      });
      nav.appendChild(grp);
    });

    // Group the page into cards: everything from one <h2> to the next becomes a section card
    var intro = [], sections = [], cur = null;
    Array.prototype.slice.call(main.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && n.tagName === "H2") {
        if (!n.id) n.id = slug(n.textContent);
        cur = el("section", { class: "card" });
        sections.push(cur);
      }
      if (cur) cur.appendChild(n); else intro.push(n);
    });
    while (main.firstChild) main.removeChild(main.firstChild);
    if (idx >= 0 && here !== "index.html") main.appendChild(el("div", { class: "crumbs" }, '<a href="index.html">Home</a> › ' + flat[idx].group + " › " + flat[idx].title));
    intro.forEach(function (n) { main.appendChild(n); });
    if (sections.length > 1) {
      var jump = el("div", { class: "note jump" }, "Jump to: ");
      sections.forEach(function (s) { var h = s.querySelector("h2"); jump.appendChild(el("a", { class: "btn", href: "#" + h.id }, h.textContent)); });
      main.appendChild(jump);
    }
    sections.forEach(function (s) { main.appendChild(s); });

    main.parentNode.insertBefore(wrap, main);
    wrap.appendChild(head);
    wrap.appendChild(nav);
    wrap.appendChild(main);

    // Pager + footer
    if (idx >= 0) {
      var pager = el("nav", { class: "pager" });
      if (idx > 0) pager.appendChild(el("a", { href: flat[idx - 1].href, class: "prev" }, "<small>← Previous</small>" + flat[idx - 1].title));
      if (idx < flat.length - 1) pager.appendChild(el("a", { href: flat[idx + 1].href, class: "next" }, "<small>Next →</small>" + flat[idx + 1].title));
      wrap.appendChild(pager);
    }
    wrap.appendChild(el("footer", { class: "foot" },
      "Engineering summary, not legal advice. CRA text taken from " +
      '<a href="https://www.cyberresilienceact.eu/regulation.html" target="_blank" rel="noopener">cyberresilienceact.eu</a> (unofficial reproduction). ' +
      'The binding text is <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R2847" target="_blank" rel="noopener">Regulation (EU) 2024/2847 on EUR-Lex</a>. ' +
      "EX-100 is a fictional, anonymised legacy industrial instrument used to illustrate the method; it does not describe any specific product."));

    // File links: <code>init.c</code>
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
