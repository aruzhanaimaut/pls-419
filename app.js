(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const RED = "#d62839", BLUE = "#2350d1", AMBER = "#e8a33d";
  const onceVisible = (el, fn, threshold = 0.3) => {
    if (!el) return;
    if (reduce || !("IntersectionObserver" in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(); io.disconnect(); } }), { threshold });
    io.observe(el);
  };
  const reveal = (sel, threshold) => $$(sel).forEach((el) => onceVisible(el, () => el.classList.add("is-in"), threshold));

  /* ---------- hero: the call-out log appears line by line ---------- */
  const lines = $$(".log-line");
  if (reduce) lines.forEach((l) => l.classList.add("is-on"));
  else {
    const last = lines[lines.length - 1], span = $("span", last), full = span.textContent;
    span.textContent = "";
    lines.forEach((l, i) => setTimeout(() => l.classList.add("is-on"), 500 + i * 1100));
    setTimeout(() => {
      let k = 0; const caret = document.createElement("i"); caret.className = "caret"; span.after(caret);
      const t = setInterval(() => { span.textContent = full.slice(0, ++k); if (k >= full.length) { clearInterval(t); setTimeout(() => caret.remove(), 2400); } }, 34);
    }, 500 + (lines.length - 1) * 1100 + 200);
  }

  /* ---------- scroll reveals ---------- */
  reveal("mark.hl", 0.9);
  reveal(".door-panel", 0.4);
  reveal(".timeline", 0.5);

  /* ---------- stats count up ---------- */
  $$(".stat-n").forEach((el) => {
    const target = +el.dataset.count, suf = el.dataset.suffix || "";
    if (reduce) return;
    el.textContent = "0" + suf;
    onceVisible(el, () => {
      const t0 = performance.now(), dur = 1300;
      const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(target * e) + suf; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, 0.6);
  });

  /* ---------- rail ---------- */
  const rail = $(".rail"), fill = $("#railFill");
  const secIds = ["problem", "data", "research", "solution", "bill", "verdict"];
  const links = secIds.map((id) => $(`.rail a[data-sec="${id}"]`));
  const darkIds = ["solution", "verdict"];
  const onScroll = () => {
    const y = window.scrollY, hero = $(".hero").offsetHeight, mid = window.innerHeight / 2;
    rail.classList.toggle("is-shown", y > hero * 0.6);
    let active = 0;
    secIds.forEach((id, i) => { if (document.getElementById(id).getBoundingClientRect().top < window.innerHeight * 0.4) active = i; });
    links.forEach((a, i) => { a.classList.toggle("is-active", i === active); a.classList.toggle("is-done", i < active); });
    const dark = darkIds.some((id) => { const r = document.getElementById(id).getBoundingClientRect(); return r.top < mid && r.bottom > mid; });
    rail.classList.toggle("on-dark", dark);
    const doc = document.documentElement;
    fill.style.height = (Math.min(1, Math.max(0, (y - hero) / (doc.scrollHeight - window.innerHeight - hero))) * 100) + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const placeTip = (tip, host, x, y) => {
    const pr = host.getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(pr.width - 270, x)) + "px";
    tip.style.top = y + "px";
    tip.classList.add("is-on");
  };

  /* ---------- Figure 1: waffle of 100 women ---------- */
  const waffle = $("#waffle");
  let idx = 0;
  [["none", 51, RED], ["other", 41, AMBER], ["police", 8, BLUE]].forEach(([g, n, c]) => {
    for (let i = 0; i < n; i++) { const d = document.createElement("span"); d.className = "cell"; d.dataset.g = g; d.style.setProperty("--c", c); d.style.setProperty("--i", idx++); waffle.appendChild(d); }
  });
  onceVisible(waffle, () => waffle.classList.add("is-in"), 0.4);
  $$("#fig1 .seg button").forEach((b) => b.addEventListener("click", () => {
    $$("#fig1 .seg button").forEach((x) => x.setAttribute("aria-checked", x === b ? "true" : "false"));
    waffle.dataset.focus = b.dataset.w;
  }));

  /* ---------- Figure 2: criminal cases, stacked columns ---------- */
  const cases = [
    { y: "2020", total: 1073, bat: 0 }, { y: "2021", total: 1047, bat: 0 }, { y: "2022", total: 942, bat: 0 },
    { y: "2023", total: 923, bat: 0 }, { y: "2024", total: 3382, bat: 2553 }
  ].map((d) => ({ ...d, oth: d.total - d.bat }));
  const chart2 = $("#chart2"), tip2 = $("#tip2");
  (function draw2() {
    const W = 640, H = 300, m = { t: 26, r: 12, b: 32, l: 48 }, iw = W - m.l - m.r, ih = H - m.t - m.b, max = 3500;
    const yS = (v) => m.t + ih - (v / max) * ih, band = iw / cases.length, bw = Math.min(58, band * 0.5);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Columns: criminal cases of family violence, 1,073 in 2020 falling to 923 in 2023, then 3,382 in 2024, of which 2,553 battery and minor harm.">`;
    [0, 1000, 2000, 3000].forEach((t) => { s += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${yS(t)}" y2="${yS(t)}"/><text x="${m.l - 8}" y="${yS(t) + 4}" text-anchor="end">${t ? fmt(t) : 0}</text>`; });
    cases.forEach((d, i) => {
      const cx = m.l + band * i + band / 2, x = cx - bw / 2, r = 4, yOth = yS(d.oth), yTop = yS(d.total), base = yS(0);
      s += `<g class="col" data-i="${i}">`;
      if (d.bat) {
        s += `<rect class="grow" fill="${BLUE}" x="${x}" y="${yOth}" width="${bw}" height="${base - yOth}"/>`;
        s += `<path class="grow" style="transition-delay:.35s" fill="${RED}" d="M${x},${yOth - 2} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + bw - r} Q${x + bw},${yTop} ${x + bw},${yTop + r} V${yOth - 2} Z"/>`;
      } else {
        s += `<path class="grow" fill="${BLUE}" d="M${x},${base} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + bw - r} Q${x + bw},${yTop} ${x + bw},${yTop + r} V${base} Z"/>`;
      }
      s += `<text class="lbl-strong" x="${cx}" y="${yTop - 8}" text-anchor="middle">${fmt(d.total)}</text><text x="${cx}" y="${H - 10}" text-anchor="middle">${d.y}</text>`;
      s += `<rect class="hit" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}"/></g>`;
    });
    chart2.innerHTML = s + `</svg>`;
    onceVisible(chart2, () => chart2.classList.add("is-in"), 0.4);
    $$(".col", chart2).forEach((g) => {
      const d = cases[+g.dataset.i];
      const show = () => {
        $$(".col", chart2).forEach((o) => o.classList.toggle("is-dim", o !== g));
        tip2.innerHTML = `<b>${d.y}</b>: ${fmt(d.total)} cases` + (d.bat ? `<br><span class="tk" style="background:${RED}"></span>Battery and minor harm: ${fmt(d.bat)}<br><span class="tk" style="background:${BLUE}"></span>Other: ${fmt(d.oth)}` : "");
        const pr = chart2.parentElement.getBoundingClientRect(), gr = g.getBoundingClientRect();
        placeTip(tip2, chart2.parentElement, gr.left - pr.left + gr.width / 2 + 24, gr.top - pr.top + 30);
      };
      const hide = () => { tip2.classList.remove("is-on"); $$(".col", chart2).forEach((o) => o.classList.remove("is-dim")); };
      g.addEventListener("mouseenter", show); g.addEventListener("mouseleave", hide); g.addEventListener("click", show);
    });
  })();
  $("#table2").innerHTML = `<table><thead><tr><th>Year</th><th>All cases</th><th>Battery and minor harm</th><th>Other</th></tr></thead><tbody>` +
    cases.map((d) => `<tr><td>${d.y}</td><td>${fmt(d.total)}</td><td>${d.bat ? fmt(d.bat) : "not crimes"}</td><td>${fmt(d.oth)}</td></tr>`).join("") + `</tbody></table>`;

  /* ---------- Figure 3: terminated administrative cases, lines ---------- */
  const years3 = ["2018", "2019", "2020", "2021", "2022"];
  const series3 = [
    { k: "Art. 73-2, beatings", short: "73-2", c: RED, v: [74.5, 73.2, 69.1, 65.2, 61.8] },
    { k: "Art. 73-1, minor bodily harm", short: "73-1", c: AMBER, v: [66.7, 60.35, 61.2, 57.6, 53.7] },
    { k: "Art. 73, family and household relations", short: "73", c: BLUE, v: [59.2, 58.2, 52.0, 46.68, 45.6] }
  ];
  const chart3 = $("#chart3"), tip3 = $("#tip3");
  (function draw3() {
    const W = 640, H = 290, m = { t: 18, r: 96, b: 32, l: 44 }, iw = W - m.l - m.r, ih = H - m.t - m.b, lo = 40, hi = 80;
    const xS = (i) => m.l + (i / (years3.length - 1)) * iw, yS = (v) => m.t + ih - ((v - lo) / (hi - lo)) * ih;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Lines: share of domestic administrative cases terminated fell from 2018 to 2022: beatings 74.5% to 61.8%, minor bodily harm 66.7% to 53.7%, family relations 59.2% to 45.6%.">`;
    [40, 50, 60, 70, 80].forEach((t) => { s += `<line class="grid" x1="${m.l}" x2="${m.l + iw}" y1="${yS(t)}" y2="${yS(t)}"/><text x="${m.l - 8}" y="${yS(t) + 4}" text-anchor="end">${t}%</text>`; });
    years3.forEach((y, i) => { s += `<text x="${xS(i)}" y="${H - 10}" text-anchor="middle">${y}</text>`; });
    s += `<line id="cross3" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" stroke="#15121f" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>`;
    series3.forEach((se, j) => {
      const pts = se.v.map((v, i) => [xS(i), yS(v)]);
      let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      s += `<g class="ser" data-j="${j}"><path class="draw" style="--len:${Math.ceil(len)};transition-delay:${j * .2}s" d="M${pts.map((p) => p.join(",")).join(" L")}" fill="none" stroke="${se.c}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      pts.forEach((p) => { s += `<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="4.5" fill="${se.c}" stroke="#fff" stroke-width="2"/>`; });
      const last = pts[pts.length - 1];
      s += `<text class="lbl-strong val dot" x="${last[0] + 10}" y="${last[1] + 4}">${se.short}: ${se.v[se.v.length - 1]}%</text></g>`;
    });
    years3.forEach((y, i) => { s += `<rect class="hit" data-i="${i}" x="${xS(i) - iw / 8}" y="${m.t}" width="${iw / 4}" height="${ih}"/>`; });
    chart3.innerHTML = s + `</svg>`;
    onceVisible(chart3, () => chart3.classList.add("is-in"), 0.4);
    const cross = $("#cross3", chart3);
    $$(".hit", chart3).forEach((h) => {
      const i = +h.dataset.i;
      const show = () => {
        cross.setAttribute("x1", xS(i)); cross.setAttribute("x2", xS(i)); cross.setAttribute("opacity", ".5");
        tip3.innerHTML = `<b>${years3[i]}</b>, cases terminated<br>` + series3.map((se) => `<span class="tk" style="background:${se.c}"></span>${se.k}: ${se.v[i]}%`).join("<br>");
        const svg = $("svg", chart3), sr = svg.getBoundingClientRect(), pr = chart3.parentElement.getBoundingClientRect();
        placeTip(tip3, chart3.parentElement, (xS(i) / W) * sr.width + (sr.left - pr.left) + 16, sr.top - pr.top + 20);
      };
      h.addEventListener("mouseenter", show); h.addEventListener("click", show);
      h.addEventListener("mouseleave", () => { tip3.classList.remove("is-on"); cross.setAttribute("opacity", "0"); });
    });
  })();
  $("#table3").innerHTML = `<table><thead><tr><th>Year</th>${series3.map((se) => `<th>${se.short}</th>`).join("")}</tr></thead><tbody>` +
    years3.map((y, i) => `<tr><td>${y}</td>${series3.map((se) => `<td>${se.v[i]}%</td>`).join("")}</tr>`).join("") + `</tbody></table>`;

  /* ---------- Figure 4: MICS regions ---------- */
  const regions = [["Abay", 6.2], ["Akmola", 4.2], ["Aktobe", 0.2], ["Almaty region", 2.0], ["Atyrau", 0.5], ["West Kazakhstan", 1.8], ["Zhambyl", 5.8], ["Zhetysu", 7.7], ["Karaganda", 3.7], ["Kostanay", 8.5], ["Kyzylorda", 2.6], ["Mangystau", 0.1], ["Pavlodar", 4.7], ["North Kazakhstan", 6.6], ["Turkistan", 9.8], ["Ulytau", 2.3], ["East Kazakhstan", 3.0], ["Astana city", 1.3], ["Almaty city", 0.9], ["Shymkent city", 2.0]];
  const NAT = 3.5, chart4 = $("#chart4"), tip4 = $("#tip4");
  let sort4 = "value";
  function draw4() {
    const data = [...regions].sort(sort4 === "value" ? (a, b) => b[1] - a[1] : (a, b) => a[0].localeCompare(b[0]));
    const W = 640, row = 24, top = 22, H = top + data.length * row + 8, l = 132, r = 46, max = 10;
    const xS = (v) => l + (v / max) * (W - l - r);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Horizontal bars by region. Highest Turkistan 9.8%, Kostanay 8.5%, Zhetysu 7.7%; lowest Mangystau 0.1% and Aktobe 0.2%. National 3.5%.">`;
    [0, 2, 4, 6, 8, 10].forEach((t) => { s += `<line class="grid" x1="${xS(t)}" x2="${xS(t)}" y1="${top - 4}" y2="${H}"/><text x="${xS(t)}" y="${top - 9}" text-anchor="middle">${t}%</text>`; });
    s += `<line x1="${xS(NAT)}" x2="${xS(NAT)}" y1="${top - 4}" y2="${H}" stroke="${RED}" stroke-width="2" stroke-dasharray="5 4"/>`;
    data.forEach(([name, v], i) => {
      const y = top + i * row + 3, bh = row - 8, x1 = Math.max(xS(v), l + 2), rr = Math.min(4, (x1 - l) / 2);
      s += `<g class="bar" data-i="${regions.findIndex((d) => d[0] === name)}">`;
      s += `<text x="${l - 10}" y="${y + bh - 4}" text-anchor="end" class="lbl-strong" style="font-size:12px">${name}</text>`;
      s += `<path class="grow-x" fill="${BLUE}" style="transition-delay:${i * 25}ms" d="M${l},${y} H${x1 - rr} Q${x1},${y} ${x1},${y + rr} V${y + bh - rr} Q${x1},${y + bh} ${x1 - rr},${y + bh} H${l} Z"/>`;
      s += `<text class="val" x="${x1 + 6}" y="${y + bh - 4}">${v.toFixed(1)}%</text>`;
      s += `<rect class="hit" x="0" y="${y - 4}" width="${W}" height="${row}"/></g>`;
    });
    s += `<text x="${xS(NAT) + 6}" y="${H + 12}" class="lbl-strong" style="font-size:11px;fill:${RED}">National 3.5%</text>`;
    chart4.innerHTML = s + `</svg>`;
    if (chart4.dataset.seen) chart4.classList.add("is-in");
    $$(".bar", chart4).forEach((g) => {
      const [name, v] = regions[+g.dataset.i];
      const show = () => {
        $$(".bar", chart4).forEach((o) => o.classList.toggle("is-dim", o !== g));
        const diff = v - NAT;
        tip4.innerHTML = `<b>${name}</b>: ${v.toFixed(1)}%<br>${Math.abs(diff) < 0.05 ? "Same as" : (diff > 0 ? diff.toFixed(1) + " points above" : (-diff).toFixed(1) + " points below")} the national figure`;
        const pr = chart4.parentElement.getBoundingClientRect(), gr = g.getBoundingClientRect();
        placeTip(tip4, chart4.parentElement, pr.width * 0.55, gr.top - pr.top - 46);
      };
      const hide = () => { tip4.classList.remove("is-on"); $$(".bar", chart4).forEach((o) => o.classList.remove("is-dim")); };
      g.addEventListener("mouseenter", show); g.addEventListener("mouseleave", hide); g.addEventListener("click", show);
    });
  }
  draw4();
  onceVisible(chart4, () => { chart4.dataset.seen = "1"; chart4.classList.add("is-in"); }, 0.25);
  $$("#fig4 .seg button").forEach((b) => b.addEventListener("click", () => {
    sort4 = b.dataset.sort;
    $$("#fig4 .seg button").forEach((x) => x.setAttribute("aria-checked", x === b ? "true" : "false"));
    draw4();
  }));
  $("#table4").innerHTML = `<table><thead><tr><th>Region</th><th>Justify beating (%)</th></tr></thead><tbody>` +
    [...regions].sort((a, b) => b[1] - a[1]).map(([n, v]) => `<tr><td>${n}</td><td>${v.toFixed(1)}</td></tr>`).join("") +
    `<tr><td><strong>Kazakhstan</strong></td><td><strong>3.5</strong></td></tr></tbody></table>`;

  /* ---------- Figure 5: the register ---------- */
  const ref = (id, t) => `<a class="ref" href="#src-${id}">[${t}]</a>`;
  const register = [
    ["How many women experience partner violence", "17%", "2017 survey " + ref("1", "1")],
    ["Women who say wife-beating can be justified", "3.5%", "2024 " + ref("2", "2")],
    ["People held liable for domestic offences", "96,194", "2025 " + ref("4", "4")],
    ["Protective orders issued", "85,035", "2024 " + ref("3", "3")],
    ["Criminal cases of family violence", "3,382", "2024 " + ref("3", "3")],
    ["Article 73 cases terminated", "45.6%", "2022 " + ref("r1", "R1")],
    ["Reports police refused to register", null, 1],
    ["Call-outs that ended with no measure", null, 1],
    ["Repeat call-outs to the same address", null, 0],
    ["Women in shelters and institutions", null, 0]
  ];
  $("#register").innerHTML = register.map(([q, v, note]) => v
    ? `<tr><td>${q}</td><td><span class="reg-val">${v}</span> <small class="reg-src">${note}</small></td></tr>`
    : `<tr class="${note ? "reg-key" : ""}"><td>${q}</td><td><span class="redact"><span class="redact-bar" aria-hidden="true"></span><span class="redact-tag">not recorded</span></span></td></tr>`).join("");
  onceVisible($("#fig5"), () => $("#fig5").classList.add("is-in"), 0.45);

  /* ---------- tabs (research lenses and the door) ---------- */
  function tabset(list, onSelect) {
    const select = (t) => { list.forEach((x) => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; }); onSelect(t); };
    list.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const n = list[(i + (e.key === "ArrowRight" ? 1 : list.length - 1)) % list.length]; select(n); n.focus(); }
      });
    });
  }
  const lensTabs = $$(".lens-tabs [role=tab]");
  tabset(lensTabs, (t) => lensTabs.forEach((x) => { document.getElementById(x.getAttribute("aria-controls")).hidden = x !== t; }));

  const measures = [
    { h: "Detention", p: "Only where the law gives grounds: administrative detention under the Code of Administrative Infractions, or detention of a suspect under Article 128 of the Criminal Procedure Code. It is never automatic.", law: `Basis: ${ref("13", "13, Art. 60(1)")} ${ref("22", "22")}`, rec: "the grounds used, the time and the officer." },
    { h: "Protective order", p: "If there are no grounds for detention, police issue an order on the fact of the unlawful acts; it does not depend on her complaint. For 30 days it bars violence, searching for, pursuing or visiting her against her will, and calls or other contact. She gets a copy the same day, and police check at least every seven days.", law: `Basis: ${ref("13", "13, Art. 60")}`, rec: "the order, its end date and every check." },
    { h: "Administrative case", p: "A protocol under Article 73 of the Code of Administrative Infractions, illegal actions in family and household relations. A court decides the penalty.", law: `Basis: ${ref("22", "22")} ${ref("r1", "R1, p. 226")}`, rec: "the protocol number, so the case can be followed." },
    { h: "Criminal report", p: "Since 16 June 2024, battery (Criminal Code, Art. 109-1) and minor injury to health (Art. 108-1) are crimes again, and police must register the case even without her complaint.", law: `Basis: ${ref("22", "22")} ${ref("7", "7")} ${ref("8", "8")}`, rec: "the registration number in the crime register." },
    { h: "No measure", p: "Police must respond to every report. If the officer still takes no measure, Із asks for a reason; high-risk cases go to his supervisor. She gets a copy and is told she can complain to the prosecutor or an investigating court.", law: `Basis: ${ref("13", "13, Art. 72(3)")} ${ref("15", "15")} ${ref("14", "14")}`, rec: "the reason. Today nothing is recorded." }
  ];
  const doorOut = $("#doorOut"), doorTabs = $$(".door-grid [role=tab]");
  const showMeasure = (t) => {
    const m = measures[+t.dataset.m];
    doorOut.style.animation = "none"; void doorOut.offsetWidth; doorOut.style.animation = "";
    doorOut.innerHTML = `<h4>${m.h}</h4><p>${m.p}</p><p class="law">${m.law}</p><p class="rec"><b>Із records:</b> <span>${m.rec}</span></p>`;
  };
  tabset(doorTabs, showMeasure);
  showMeasure(doorTabs[0]);

  /* ---------- the bill ---------- */
  const inp = { users: $("#i-users"), entries: $("#i-entries"), calls: $("#i-calls"), off: $("#i-off") };
  const C = { reqPer: 3, whReq: 0.24 * 5, mlReq: 0.26 * 5, serverKWh: 4 * 0.5 * 8760, tabletKWh: 10, co2: 0.9, natKWh: 117.9e9,
    build: 350e6, run: 100e6, audit: 30e6, tablet: 150000, train: 60000, usd: 510, crisis: 3e9 };
  const setVal = (el, txt) => { if (el.textContent !== txt) { el.textContent = txt; el.classList.remove("is-tick"); void el.offsetWidth; el.classList.add("is-tick"); } };
  function bill() {
    const U = +inp.users.value, E = +inp.entries.value, P = +inp.calls.value, O = +inp.off.value;
    $("#o-users").textContent = fmt(U); $("#o-entries").textContent = E; $("#o-calls").textContent = fmt(P); $("#o-off").textContent = fmt(O);
    const req = (U * E * 12 + P) * C.reqPer;
    const reqKWh = req * C.whReq / 1000, tabKWh = O * C.tabletKWh, kwh = reqKWh + C.serverKWh + tabKWh;
    const tCO2 = kwh * C.co2 / 1000, water = req * C.mlReq / 1000;
    const cost = C.build + C.run + C.audit + O * (C.tablet + C.train);
    const later = C.run + C.audit + O * C.tablet * 0.25;
    $("#r-meta").textContent = `${fmt(U)} women, ${E} entries a month, ${fmt(P)} police assessments, ${fmt(O)} officers`;
    setVal($("#v-env"), (kwh / 1000).toFixed(1) + " MWh");
    $("#env-detail").innerHTML = `At these settings <span lang="kk">Із</span> uses about <strong>${(kwh / 1000).toFixed(1)} MWh a year</strong>: ${fmt(reqKWh)} kWh for ${fmt(req)} AI requests, ${fmt(C.serverKWh)} kWh for servers and ${fmt(tabKWh)} kWh for tablets. That is about ${(kwh / C.natKWh * 100).toFixed(5)}% of the 117.9 billion kWh Kazakhstan generated in 2024 ${ref("20", "20")}, roughly ${fmt(tCO2)} tonnes of CO₂ and ${fmt(water)} litres of data-centre water.`;
    setVal($("#v-eco"), fmt(cost / 1e6) + " m ₸");
    $("#eco-detail").innerHTML = `Year one costs about <strong>${fmt(cost / 1e6)} million ₸</strong> (≈ $${(cost / C.usd / 1e6).toFixed(2)} million): building both parts (${C.build / 1e6} m ₸), running them (${C.run / 1e6} m ₸), the independent audit (${C.audit / 1e6} m ₸), ${fmt(O)} tablets (${fmt(O * C.tablet / 1e6)} m ₸) and training (${fmt(O * C.train / 1e6)} m ₸). From year two, about ${fmt(later / 1e6)} million ₸ a year, if a quarter of the tablets are replaced each year.`;
    setVal($("#v-per"), fmt(Math.round(cost / (U + P) / 100) * 100) + " ₸");
    $("#r-foot").innerHTML = `"Women reached" counts app users plus women at assessed call-outs. Year one equals about ${Math.round(cost / C.crisis * 100)}% of the almost 3 billion ₸ spent on crisis centres in 2024 ${ref("3", "3")}.`;
  }
  Object.values(inp).forEach((i) => i.addEventListener("input", bill));
  bill();
  const receipt = $("#receipt");
  if (!reduce) onceVisible(receipt, () => receipt.classList.add("is-printing"), 0.15);

  /* ---------- verdict ---------- */
  const boxes = $$("#conds input"), signEl = $("#sign"), word = $("#signWord"), text = $("#signText");
  const on = (k) => boxes.find((b) => b.dataset.k === k).checked;
  function verdict() {
    let st, w, t;
    const base = on("survivor") && on("money"), police = on("human") && on("audit") && on("power");
    if (base && police) { st = "yes"; w = "Yes, as a pilot"; t = "With all five conditions in place, pilot both parts in a few districts for a year, and judge them on what officers recorded and whether women were protected, not on how many scores were produced."; }
    else if (base) { st = "part"; w = "Survivor side only"; t = "Pilot the survivor app through crisis centres. Do not give police a risk score until it has a legal basis, a human decision with a reason, published error rates and oversight with power."; }
    else if (police) { st = "no"; w = "No"; t = "The police safeguards are there, but without survivor control and protected funding the tool serves the institution rather than the woman. Do not build it."; }
    else { st = "no"; w = "No"; t = "Without survivor control and protected funding for crisis centres, Із would create a new archive of women's suffering and possibly a score that rations protection. Kazakhstan should not build it."; }
    if (word.textContent !== w && !reduce) { word.classList.remove("is-flip"); void word.offsetWidth; word.classList.add("is-flip"); }
    signEl.dataset.state = st; word.textContent = w; text.textContent = t;
  }
  boxes.forEach((b) => b.addEventListener("change", verdict));
  verdict();
})();
