(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const onceVisible = (el, fn, threshold = 0.3) => {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(); io.disconnect(); } }), { threshold });
    io.observe(el);
  };

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

  /* ---------- stats count up ---------- */
  $$(".stat-n").forEach((el) => {
    const target = +el.dataset.count, suf = el.dataset.suffix || "";
    if (reduce) return;
    el.textContent = "0" + suf;
    onceVisible(el, () => {
      const t0 = performance.now(), dur = 1200;
      const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(target * e) + suf; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, 0.6);
  });

  /* ---------- rail ---------- */
  const rail = $(".rail"), fill = $("#railFill");
  const secIds = ["problem", "data", "research", "solution", "bill", "verdict"];
  const links = secIds.map((id) => $(`.rail a[data-sec="${id}"]`));
  const onScroll = () => {
    const y = window.scrollY, hero = $(".hero").offsetHeight;
    rail.classList.toggle("is-shown", y > hero * 0.6);
    let active = 0;
    secIds.forEach((id, i) => { if (document.getElementById(id).getBoundingClientRect().top < window.innerHeight * 0.4) active = i; });
    links.forEach((a, i) => { a.classList.toggle("is-active", i === active); a.classList.toggle("is-done", i < active); });
    const v = document.getElementById("verdict").getBoundingClientRect();
    rail.classList.toggle("on-dark", v.top < window.innerHeight / 2 && v.bottom > window.innerHeight / 2);
    const doc = document.documentElement;
    const p = Math.min(1, Math.max(0, (y - hero) / (doc.scrollHeight - window.innerHeight - hero)));
    fill.style.height = (p * 100) + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Figure 1: waffle of 100 women ---------- */
  const groups = [["none", 51, "#3b6fd1"], ["other", 41, "#a3399e"], ["police", 8, "#e8890c"]];
  const waffle = $("#waffle");
  let idx = 0;
  groups.forEach(([g, n, c]) => { for (let i = 0; i < n; i++) { const d = document.createElement("span"); d.className = "cell"; d.dataset.g = g; d.style.setProperty("--c", c); d.style.setProperty("--i", idx++); waffle.appendChild(d); } });
  onceVisible(waffle, () => waffle.classList.add("is-in"), 0.4);
  $$("#fig1 .seg button").forEach((b) => b.addEventListener("click", () => {
    $$("#fig1 .seg button").forEach((x) => x.setAttribute("aria-checked", x === b ? "true" : "false"));
    waffle.dataset.focus = b.dataset.w;
  }));

  /* ---------- Figure 2: criminal cases, stacked columns ---------- */
  const cases = [
    { y: "2020", total: 1073, bat: 0 },
    { y: "2021", total: 1047, bat: 0 },
    { y: "2022", total: 942, bat: 0 },
    { y: "2023", total: 923, bat: 0 },
    { y: "2024", total: 3382, bat: 2553 }
  ].map((d) => ({ ...d, oth: d.total - d.bat }));
  const C2 = { oth: "#3b6fd1", bat: "#e8890c" };
  const chart2 = $("#chart2"), tip2 = $("#tip2");
  (function draw2() {
    const W = 640, H = 300, m = { t: 26, r: 12, b: 32, l: 48 }, iw = W - m.l - m.r, ih = H - m.t - m.b, max = 3500;
    const yS = (v) => m.t + ih - (v / max) * ih, band = iw / cases.length, bw = Math.min(56, band * 0.5);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Columns: criminal cases of family violence, 1,073 in 2020 falling to 923 in 2023, then 3,382 in 2024, of which 2,553 battery and minor harm.">`;
    [0, 1000, 2000, 3000].forEach((t) => { s += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${yS(t)}" y2="${yS(t)}"/><text x="${m.l - 8}" y="${yS(t) + 4}" text-anchor="end">${t ? fmt(t) : 0}</text>`; });
    cases.forEach((d, i) => {
      const cx = m.l + band * i + band / 2, x = cx - bw / 2, r = 4;
      const yOth = yS(d.oth), yTop = yS(d.total), base = yS(0);
      s += `<g class="col" data-i="${i}">`;
      if (d.bat) {
        s += `<rect class="grow" fill="${C2.oth}" x="${x}" y="${yOth}" width="${bw}" height="${base - yOth}"/>`;
        s += `<path class="grow" fill="${C2.bat}" d="M${x},${yOth - 2} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + bw - r} Q${x + bw},${yTop} ${x + bw},${yTop + r} V${yOth - 2} Z"/>`;
      } else {
        s += `<path class="grow" fill="${C2.oth}" d="M${x},${base} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + bw - r} Q${x + bw},${yTop} ${x + bw},${yTop + r} V${base} Z"/>`;
      }
      s += `<text class="lbl-strong" x="${cx}" y="${yTop - 8}" text-anchor="middle">${fmt(d.total)}</text>`;
      s += `<text x="${cx}" y="${H - 10}" text-anchor="middle">${d.y}</text>`;
      s += `<rect class="hit" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}"/></g>`;
    });
    s += `</svg>`;
    chart2.innerHTML = s;
    onceVisible(chart2, () => chart2.classList.add("is-in"), 0.4);
    $$(".col", chart2).forEach((g) => {
      const i = +g.dataset.i, d = cases[i];
      const show = () => {
        $$(".col", chart2).forEach((o) => o.classList.toggle("is-dim", o !== g));
        tip2.innerHTML = `<b>${d.y}</b>: ${fmt(d.total)} cases` + (d.bat ? `<br><span class="tk" style="background:${C2.bat}"></span>Battery and minor harm: ${fmt(d.bat)}<br><span class="tk" style="background:${C2.oth}"></span>Other: ${fmt(d.oth)}` : "");
        const pr = chart2.parentElement.getBoundingClientRect(), gr = g.getBoundingClientRect();
        tip2.style.left = Math.max(8, Math.min(pr.width - 260, gr.left - pr.left + gr.width / 2 + 24)) + "px";
        tip2.style.top = (gr.top - pr.top + 30) + "px";
        tip2.classList.add("is-on");
      };
      const hide = () => { tip2.classList.remove("is-on"); $$(".col", chart2).forEach((o) => o.classList.remove("is-dim")); };
      g.addEventListener("mouseenter", show); g.addEventListener("mouseleave", hide); g.addEventListener("click", show);
    });
  })();
  $("#table2").innerHTML = `<table><thead><tr><th>Year</th><th>All cases</th><th>Battery and minor harm</th><th>Other</th></tr></thead><tbody>` +
    cases.map((d) => `<tr><td>${d.y}</td><td>${fmt(d.total)}</td><td>${d.bat ? fmt(d.bat) : "not crimes"}</td><td>${fmt(d.oth)}</td></tr>`).join("") + `</tbody></table>`;

  /* ---------- Figure 3: MICS regions ---------- */
  const regions = [["Abay", 6.2], ["Akmola", 4.2], ["Aktobe", 0.2], ["Almaty region", 2.0], ["Atyrau", 0.5], ["West Kazakhstan", 1.8], ["Zhambyl", 5.8], ["Zhetysu", 7.7], ["Karaganda", 3.7], ["Kostanay", 8.5], ["Kyzylorda", 2.6], ["Mangystau", 0.1], ["Pavlodar", 4.7], ["North Kazakhstan", 6.6], ["Turkistan", 9.8], ["Ulytau", 2.3], ["East Kazakhstan", 3.0], ["Astana city", 1.3], ["Almaty city", 0.9], ["Shymkent city", 2.0]];
  const NAT = 3.5;
  const chart3 = $("#chart3"), tip3 = $("#tip3");
  let sort3 = "value";
  function draw3() {
    const data = [...regions].sort(sort3 === "value" ? (a, b) => b[1] - a[1] : (a, b) => a[0].localeCompare(b[0]));
    const W = 640, row = 24, top = 22, H = top + data.length * row + 6, l = 132, r = 46, max = 10;
    const xS = (v) => l + (v / max) * (W - l - r);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Horizontal bars by region. Highest Turkistan 9.8%, Kostanay 8.5%, Zhetysu 7.7%; lowest Mangystau 0.1% and Aktobe 0.2%. National 3.5%.">`;
    [0, 2, 4, 6, 8, 10].forEach((t) => { s += `<line class="grid" x1="${xS(t)}" x2="${xS(t)}" y1="${top - 4}" y2="${H}"/><text x="${xS(t)}" y="${top - 9}" text-anchor="middle">${t}%</text>`; });
    s += `<line x1="${xS(NAT)}" x2="${xS(NAT)}" y1="${top - 4}" y2="${H}" stroke="#1c1733" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    data.forEach(([name, v], i) => {
      const y = top + i * row + 3, bh = row - 8, x1 = Math.max(xS(v), l + 2), rr = Math.min(4, (x1 - l) / 2);
      s += `<g class="bar" data-i="${regions.findIndex((d) => d[0] === name)}">`;
      s += `<text x="${l - 10}" y="${y + bh - 4}" text-anchor="end" class="lbl-strong" style="font-weight:600;font-size:12px">${name}</text>`;
      s += `<path class="grow-x" fill="#3b6fd1" style="transition-delay:${i * 25}ms" d="M${l},${y} H${x1 - rr} Q${x1},${y} ${x1},${y + rr} V${y + bh - rr} Q${x1},${y + bh} ${x1 - rr},${y + bh} H${l} Z"/>`;
      s += `<text class="val" x="${x1 + 6}" y="${y + bh - 4}">${v.toFixed(1)}%</text>`;
      s += `<rect class="hit" x="0" y="${y - 4}" width="${W}" height="${row}"/></g>`;
    });
    s += `<text x="${xS(NAT) + 5}" y="${H - 4}" class="lbl-strong" style="font-size:11px">National 3.5%</text>`;
    s += `</svg>`;
    chart3.innerHTML = s;
    if (chart3.dataset.seen) chart3.classList.add("is-in");
    $$(".bar", chart3).forEach((g) => {
      const [name, v] = regions[+g.dataset.i];
      const show = () => {
        $$(".bar", chart3).forEach((o) => o.classList.toggle("is-dim", o !== g));
        const diff = v - NAT;
        tip3.innerHTML = `<b>${name}</b>: ${v.toFixed(1)}%<br>${Math.abs(diff) < 0.05 ? "Same as" : (diff > 0 ? (diff).toFixed(1) + " points above" : (-diff).toFixed(1) + " points below")} the national figure`;
        const pr = chart3.parentElement.getBoundingClientRect(), gr = g.getBoundingClientRect();
        tip3.style.left = Math.max(8, Math.min(pr.width - 260, pr.width * 0.55)) + "px";
        tip3.style.top = (gr.top - pr.top - 46) + "px";
        tip3.classList.add("is-on");
      };
      const hide = () => { tip3.classList.remove("is-on"); $$(".bar", chart3).forEach((o) => o.classList.remove("is-dim")); };
      g.addEventListener("mouseenter", show); g.addEventListener("mouseleave", hide); g.addEventListener("click", show);
    });
  }
  draw3();
  onceVisible(chart3, () => { chart3.dataset.seen = "1"; chart3.classList.add("is-in"); }, 0.25);
  $$("#fig3 .seg button").forEach((b) => b.addEventListener("click", () => {
    sort3 = b.dataset.sort;
    $$("#fig3 .seg button").forEach((x) => x.setAttribute("aria-checked", x === b ? "true" : "false"));
    draw3();
  }));
  $("#table3").innerHTML = `<table><thead><tr><th>Region</th><th>Justify beating (%)</th></tr></thead><tbody>` +
    [...regions].sort((a, b) => b[1] - a[1]).map(([n, v]) => `<tr><td>${n}</td><td>${v.toFixed(1)}</td></tr>`).join("") +
    `<tr><td><strong>Kazakhstan</strong></td><td><strong>3.5</strong></td></tr></tbody></table>`;

  /* ---------- Figure 4: the silence list ---------- */
  const silence = [
    [1, 0, "How many women experience violence", "2017 only; never repeated, so no trend."],
    [1, 0, "Attitudes toward violence", "MICS 2024; women 15–49, men 15–24."],
    [1, 0, "People held liable, arrests, protective orders", "Ministry statements, often rounded."],
    [1, 0, "Criminal cases of family violence", "Prosecutor General's statistics."],
    [0, 1, "Reports police refused to register", "Refusals leave no record. The core gap."],
    [0, 1, "Call-outs that ended with no measure", "Without a record, \"nothing done\" looks like \"no call\"."],
    [0, 0, "Repeat call-outs to the same address", "A key warning sign of escalation."],
    [0, 0, "How survivors rate the police response", "Asked once, in 2017."],
    [0, 0, "Women outside ordinary households", "Shelters are outside household surveys."]
  ];
  $("#silenceList").innerHTML = silence.map(([y, key, label, why]) =>
    `<li><button type="button" class="${y ? "yes" : "no"}${key ? " is-key" : ""}" aria-expanded="false"><span class="mark" aria-hidden="true">${y ? "✓" : "?"}</span><span>${label}</span><span class="state">${y ? "Published" : "Not published"}</span><span class="why">${why}</span></button></li>`).join("");
  $$("#silenceList button").forEach((b) => b.addEventListener("click", () => b.setAttribute("aria-expanded", b.getAttribute("aria-expanded") === "true" ? "false" : "true")));

  /* ---------- tabs (research lenses and the door) ---------- */
  function tabset(list, onSelect) {
    const select = (t) => { list.forEach((x) => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; }); onSelect(t); };
    list.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const n = list[(i + (e.key === "ArrowRight" ? 1 : list.length - 1)) % list.length]; select(n); n.focus(); }
      });
    });
    return select;
  }
  const lensTabs = $$(".lens-tabs [role=tab]");
  tabset(lensTabs, (t) => lensTabs.forEach((x) => { document.getElementById(x.getAttribute("aria-controls")).hidden = x !== t; }));

  const measures = [
    { h: "Detention", p: "Only where the law gives grounds: administrative detention under the Code of Administrative Offences, or detention of a suspect under Article 128 of the Criminal Procedure Code. It is never automatic.", law: 'Basis: <a class="ref" href="#src-22">[22]</a>', rec: "the grounds used, the time and the officer." },
    { h: "Protective order", p: "A 30-day order restricting the offender's behaviour toward her. It does not need her consent, and police check on it while it runs.", law: 'Basis: Article 60, Law No. 245-VIII <a class="ref" href="#src-13">[13]</a>', rec: "the order, its end date and every check." },
    { h: "Administrative case", p: "A protocol under Article 73 of the Code of Administrative Offences (family and domestic relations). A court decides the penalty.", law: 'Basis: <a class="ref" href="#src-22">[22]</a>', rec: "the protocol number, so the case can be followed." },
    { h: "Criminal report", p: "Since 16 June 2024, battery (Art. 109-1) and minor harm (Art. 108-1) are crimes again, registered even without her complaint.", law: 'Basis: <a class="ref" href="#src-7">[7]</a> <a class="ref" href="#src-8">[8]</a> <a class="ref" href="#src-22">[22]</a>', rec: "the registration number in the crime register." },
    { h: "No measure", p: "Sometimes justified. Із does not block the officer, but he must give a reason; high-risk cases go to his supervisor. She gets a copy and is told she can complain to the prosecutor or an investigating court.", law: 'Basis: <a class="ref" href="#src-14">[14]</a> <a class="ref" href="#src-15">[15]</a>', rec: "the reason. Today nothing is recorded." }
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
    $("#env-detail").innerHTML = `At these settings <span lang="kk">Із</span> uses about <strong>${(kwh / 1000).toFixed(1)} MWh a year</strong>: ${fmt(reqKWh)} kWh for ${fmt(req)} AI requests, ${fmt(C.serverKWh)} kWh for servers and ${fmt(tabKWh)} kWh for tablets. That is about ${(kwh / C.natKWh * 100).toFixed(5)}% of the 117.9 billion kWh Kazakhstan generated in 2024 <a class="ref" href="#src-20">[20]</a>, roughly ${fmt(tCO2)} tonnes of CO₂ and ${fmt(water)} litres of data-centre water.`;
    setVal($("#v-eco"), fmt(cost / 1e6) + " m ₸");
    $("#eco-detail").innerHTML = `Year one costs about <strong>${fmt(cost / 1e6)} million ₸</strong> (≈ $${(cost / C.usd / 1e6).toFixed(2)} million): building both parts (${C.build / 1e6} m ₸), running them (${C.run / 1e6} m ₸), the independent audit (${C.audit / 1e6} m ₸), ${fmt(O)} tablets (${fmt(O * C.tablet / 1e6)} m ₸) and training (${fmt(O * C.train / 1e6)} m ₸). From year two, about ${fmt(later / 1e6)} million ₸ a year, if a quarter of the tablets are replaced each year.`;
    setVal($("#v-per"), fmt(Math.round(cost / (U + P) / 100) * 100) + " ₸");
    $("#r-foot").innerHTML = `"Women reached" counts app users plus women at assessed call-outs. Year one equals about ${Math.round(cost / C.crisis * 100)}% of the almost 3 billion ₸ spent on crisis centres in 2024 <a class="ref" href="#src-3">[3]</a>.`;
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
    const base = on("survivor") && on("money");
    const police = on("human") && on("audit") && on("power");
    if (base && police) { st = "yes"; w = "Yes, as a pilot"; t = "With all five conditions in place, pilot both parts in a few districts for a year, and judge them on what officers recorded and whether women were protected, not on how many scores were produced."; }
    else if (base) { st = "part"; w = "Survivor side only"; t = "Pilot the survivor app through crisis centres. Do not give police a risk score until a human decision with a reason, published error rates and oversight with power are all in place."; }
    else if (police) { st = "no"; w = "No"; t = "The police safeguards are there, but without survivor control and protected funding the tool serves the institution rather than the woman. Do not build it."; }
    else { st = "no"; w = "No"; t = "Without survivor control and protected funding for crisis centres, Із would create a new archive of women's suffering and possibly a score that rations protection. Kazakhstan should not build it."; }
    if (word.textContent !== w && !reduce) { word.classList.remove("is-flip"); void word.offsetWidth; word.classList.add("is-flip"); }
    signEl.dataset.state = st; word.textContent = w; text.textContent = t;
  }
  boxes.forEach((b) => b.addEventListener("change", verdict));
  verdict();
})();
