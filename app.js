(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  /* ---------- hero: one word, three scripts ---------- */
  const words = $$(".sw");
  const names = [
    "Cyrillic, used in Kazakhstan's schools",
    "Tote zhazu, the Arabic-based script used by Kazakhs in China",
    "Latin, the alphabet Kazakhstan plans to move to"
  ];
  const cap = $("#scriptName");
  let wi = 0;
  if (!reduce) {
    setInterval(() => {
      words[wi].classList.remove("is-on");
      wi = (wi + 1) % words.length;
      words[wi].classList.add("is-on");
      cap.textContent = names[wi];
    }, 2800);
  }

  /* ---------- try-it ---------- */
  const line = $("#tryLine"), note = $("#tryNote");
  const tries = {
    cyr: { text: "Мен мектепке барамын", lang: "kk", dir: "ltr", note: "The same sentence in Cyrillic, the script used in Kazakhstan's schools. A child from Xinjiang may speak this sentence perfectly and still be unable to read it here." },
    en: { text: "I go to school.", lang: "en", dir: "ltr", note: "Speaking a language and reading it in an unfamiliar script are separate skills. Kandas children often have the first and not the second." },
    ar: { text: "مەن مەكتەپكە بارامىن", lang: "kk-Arab", dir: "rtl", note: note.textContent }
  };
  $$("[data-try]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.try;
    const current = line.dataset.state || "ar";
    const target = current === k ? "ar" : k;
    line.classList.add("is-swap");
    setTimeout(() => {
      const t = tries[target];
      line.textContent = t.text; line.lang = t.lang; line.dir = t.dir;
      line.dataset.state = target; note.textContent = t.note;
      line.classList.remove("is-swap");
      $$("[data-try]").forEach((x) => {
        const on = x.dataset.try === target;
        x.textContent = x.dataset.try === "cyr" ? (on ? "Back to tote zhazu" : "Show it in Cyrillic") : (on ? "Back to tote zhazu" : "What does it mean?");
      });
    }, reduce ? 0 : 300);
  }));

  /* ---------- rail ---------- */
  const rail = $(".rail"), fill = $("#railFill");
  const secIds = ["problem", "data", "research", "solution", "bill", "verdict"];
  const links = secIds.map((id) => $(`.rail a[data-sec="${id}"]`));
  const onScroll = () => {
    const y = window.scrollY, hero = $(".hero").offsetHeight;
    rail.classList.toggle("is-shown", y > hero * 0.6);
    let active = 0;
    secIds.forEach((id, i) => { const el = document.getElementById(id); if (el.getBoundingClientRect().top < window.innerHeight * 0.4) active = i; });
    links.forEach((a, i) => { a.classList.toggle("is-active", i === active); a.classList.toggle("is-done", i < active); });
    const v = document.getElementById("verdict").getBoundingClientRect();
    rail.classList.toggle("on-dark", window.innerWidth >= 1100 && v.top < window.innerHeight / 2 && v.bottom > window.innerHeight / 2);
    const doc = document.documentElement;
    const p = Math.min(1, Math.max(0, (y - hero) / (doc.scrollHeight - window.innerHeight - hero)));
    fill.style.height = (p * 100) + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- dots ---------- */
  const dots = $("#dots");
  const nDots = Math.round(16805 * 0.34 / 50); // 114
  for (let i = 0; i < nDots; i++) { const d = document.createElement("span"); d.className = "dot"; d.style.setProperty("--i", i); dots.appendChild(d); }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { dots.classList.add("is-in"); io.disconnect(); } }), { threshold: 0.4 });
  io.observe(dots);

  /* ---------- Figure 1: stacked columns ---------- */
  // shares as % of arrivals; totals = full-year totals
  const arr = [
    { y: "2022", total: 19178, uz: 63.5, cn: 8.6, note: "shares to 1 Dec 2022" },
    { y: "2023", total: 21325, uz: 50.3, cn: 21.5, note: "full year" },
    { y: "2024", total: 19700, uz: 38.9, cn: 45.4, note: "shares to 1 Dec 2024; total 'more than 19.7 thousand'" },
    { y: "2025", total: 16805, uz: 44.5, cn: 44.1, note: "full year" }
  ].map((d) => ({ ...d, ot: +(100 - d.uz - d.cn).toFixed(1) }));
  const series = [
    { k: "uz", name: "Uzbekistan", c: "var(--s1)", hex: "#2a78d6" },
    { k: "cn", name: "China", c: "var(--s2)", hex: "#eb6834" },
    { k: "ot", name: "All other countries", c: "var(--s3)", hex: "#1baf7a" }
  ];
  const chart1 = $("#chart1"), tip1 = $("#tip1");
  let mode = "count";
  const W = 640, H = 300, m = { t: 26, r: 16, b: 34, l: 52 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  function draw1() {
    const max = mode === "count" ? 25000 : 100;
    const ticks = mode === "count" ? [0, 5000, 10000, 15000, 20000, 25000] : [0, 25, 50, 75, 100];
    const yS = (v) => m.t + ih - (v / max) * ih;
    const band = iw / arr.length, bw = Math.min(30, band * 0.42);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Stacked columns of kandas arrivals by origin, 2022 to 2025">`;
    ticks.forEach((t) => {
      s += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${yS(t)}" y2="${yS(t)}"/>`;
      s += `<text x="${m.l - 8}" y="${yS(t) + 4}" text-anchor="end">${mode === "count" ? (t === 0 ? "0" : (t / 1000) + "K") : t + "%"}</text>`;
    });
    arr.forEach((d, i) => {
      const cx = m.l + band * i + band / 2, x = cx - bw / 2;
      let acc = 0;
      s += `<g class="col" data-i="${i}">`;
      series.forEach((se, j) => {
        const v = mode === "count" ? d.total * d[se.k] / 100 : d[se.k];
        const y0 = yS(acc), y1 = yS(acc + v);
        const gap = j === 0 ? 0 : 2;
        const h = Math.max(0, y0 - y1 - gap);
        const r = j === series.length - 1 ? 4 : 0;
        if (r) s += `<path class="seg-rect" fill="${se.hex}" d="M${x},${y0 - gap} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + bw - r} Q${x + bw},${y1} ${x + bw},${y1 + r} V${y0 - gap} Z"/>`;
        else s += `<rect class="seg-rect" fill="${se.hex}" x="${x}" y="${y1}" width="${bw}" height="${h}"/>`;
        acc += v;
      });
      const topLabel = fmt(d.total) + (d.y === "2024" ? "+" : "");
      s += `<text class="lbl-strong" x="${cx}" y="${yS(acc) - 8}" text-anchor="middle">${mode === "count" ? topLabel : ""}</text>`;
      s += `<text x="${cx}" y="${H - 10}" text-anchor="middle">${d.y}${d.note.startsWith("shares") ? "*" : ""}</text>`;
      s += `<rect class="hit" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}"/>`;
      s += `</g>`;
    });
    s += `</svg>`;
    chart1.innerHTML = s;
    $$(".col", chart1).forEach((g) => {
      const i = +g.dataset.i, d = arr[i];
      const show = (ev) => {
        $$(".col", chart1).forEach((o) => o.classList.toggle("is-dim", o !== g));
        tip1.innerHTML = `<b>${d.y}</b>: ${fmt(d.total)}${d.y === "2024" ? "+" : ""} people<br>` + series.map((se) =>
          `<span class="tk" style="background:${se.hex}"></span>${se.name}: ${d[se.k]}% (≈${fmt(d.total * d[se.k] / 100)})`).join("<br>") +
          `<br><small>${d.note}</small>`;
        const fr = chart1.getBoundingClientRect(), pr = chart1.parentElement.getBoundingClientRect();
        const colX = (m.l + (iw / arr.length) * (i + 0.5)) / W * fr.width + (fr.left - pr.left);
        tip1.style.left = Math.min(pr.width - 250, Math.max(8, colX + 30)) + "px";
        tip1.style.top = (fr.top - pr.top + 20) + "px";
        tip1.classList.add("is-on");
      };
      const hide = () => { tip1.classList.remove("is-on"); $$(".col", chart1).forEach((o) => o.classList.remove("is-dim")); };
      g.addEventListener("mouseenter", show); g.addEventListener("mouseleave", hide);
      g.addEventListener("click", show);
    });
  }
  $$("#fig1 .seg button").forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.mode;
    $$("#fig1 .seg button").forEach((x) => x.setAttribute("aria-checked", x === b ? "true" : "false"));
    draw1();
  }));
  draw1();
  $("#table1").innerHTML = `<table><thead><tr><th>Year</th><th>Total</th><th>Uzbekistan</th><th>China</th><th>Other</th></tr></thead><tbody>` +
    arr.map((d) => `<tr><td>${d.y}${d.note.startsWith("shares") ? "*" : ""}</td><td>${fmt(d.total)}${d.y === "2024" ? "+" : ""}</td><td>${d.uz}%</td><td>${d.cn}%</td><td>${d.ot}%</td></tr>`).join("") +
    `</tbody></table><p class="fig-note">* Origin shares published only up to 1 December of that year.</p>`;

  /* ---------- Figure 2: settlement bars ---------- */
  const reg = [["Almaty region", 27.2], ["Mangystau region", 13.8], ["Astana", 11.0], ["Almaty city", 8.8], ["Shymkent", 7.1], ["Turkestan region", 6.4], ["Zhambyl region", 5.1], ["All other regions", 20.6]];
  const chart2 = $("#chart2"), tip2 = $("#tip2");
  (function draw2() {
    const W2 = 640, row = 34, H2 = reg.length * row + 10, l = 150, r = 60;
    const xS = (v) => l + (v / 30) * (W2 - l - r);
    let s = `<svg viewBox="0 0 ${W2} ${H2}" role="img" aria-label="Horizontal bars: share of new kandas settling in each region, early 2023">`;
    reg.forEach(([name, v], i) => {
      const y = 6 + i * row, bh = 20, x1 = xS(v), rr = 4;
      const isOther = i === reg.length - 1;
      const fill = isOther ? "#a9b6c6" : "#2a78d6";
      s += `<g class="bar" data-i="${i}">`;
      s += `<text x="${l - 10}" y="${y + 14}" text-anchor="end" class="${isOther ? "" : "lbl-strong"}" style="font-weight:${isOther ? 400 : 600}">${name}</text>`;
      s += `<path fill="${fill}" d="M${l},${y} H${x1 - rr} Q${x1},${y} ${x1},${y + rr} V${y + bh - rr} Q${x1},${y + bh} ${x1 - rr},${y + bh} H${l} Z"/>`;
      s += `<text x="${x1 + 8}" y="${y + 14}">${v}%</text>`;
      s += `<rect class="hit" x="0" y="${y - 6}" width="${W2}" height="${row}"/></g>`;
    });
    s += `<line x1="${l}" x2="${l}" y1="0" y2="${H2}" stroke="#c9d4dd"/>`;
    s += `</svg>`;
    chart2.innerHTML = s;
    $$(".bar", chart2).forEach((g) => {
      const [name, v] = reg[+g.dataset.i];
      const show = () => {
        tip2.innerHTML = `<b>${name}</b>: ${v}% of new kandas, Jan–Apr 2023` + (name.startsWith("All other") ? "<br><small>Remainder, calculated</small>" : "");
        const fr = chart2.getBoundingClientRect(), pr = chart2.parentElement.getBoundingClientRect();
        const gy = g.getBoundingClientRect().top - pr.top;
        tip2.style.left = Math.min(pr.width - 250, 180) + "px"; tip2.style.top = (gy - 44) + "px";
        tip2.classList.add("is-on");
      };
      g.addEventListener("mouseenter", show); g.addEventListener("click", show);
      g.addEventListener("mouseleave", () => tip2.classList.remove("is-on"));
    });
  })();

  /* ---------- Figure 3: silence list ---------- */
  const silence = [
    [1, "People granted kandas status, per year", "Monthly Ministry of Labour releases [1–5]."],
    [1, "Country of origin", "Published as percentage shares [2][3][5][7]."],
    [1, "Age group: working age, minors, pensioners", "Shares only. The 'minors' band runs from newborns to 17-year-olds."],
    [1, "Education of working-age adults", "Published for adults only, never for children."],
    [1, "University grants under the kandas quota", "Ministry of Science and Higher Education [10]."],
    [0, "Kandas children enrolled in school", "No public count. My figure of about 5,700 in 2025 is arrivals × the minors share."],
    [0, "Grade and language of instruction (Kazakh or Russian class)", "Needed to see where the Russian barrier bites. Not published."],
    [0, "Script the child was schooled in", "Arabic, Latin or Cyrillic: the single most useful number for this project. Not collected."],
    [0, "Waiting time before school enrolment", "Mentioned anecdotally; never measured."],
    [0, "Test results, repeated years, dropout", "No breakdown by migration background that I could find."]
  ];
  $("#silenceList").innerHTML = silence.map(([y, label, why], i) =>
    `<li><button type="button" class="${y ? "yes" : "no"}" aria-expanded="false"><span class="mark" aria-hidden="true">${y ? "✓" : "?"}</span><span>${label}</span><span class="state">${y ? "Published" : "Not published"}</span><span class="why">${why}</span></button></li>`).join("");
  $$("#silenceList button").forEach((b) => b.addEventListener("click", () => b.setAttribute("aria-expanded", b.getAttribute("aria-expanded") === "true" ? "false" : "true")));

  /* ---------- lenses (tabs) ---------- */
  const tabs = $$(".lens-tabs [role=tab]");
  const select = (t) => {
    tabs.forEach((x) => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute("aria-controls")).hidden = !on; });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; select(n); n.focus();
      }
    });
  });

  /* ---------- flow ---------- */
  const steps = $$(".flow-steps li");
  let playing = false;
  $("#playFlow").addEventListener("click", () => {
    if (playing) return; playing = true;
    steps.forEach((s, i) => {
      setTimeout(() => { steps.forEach((x) => x.classList.remove("is-lit")); s.classList.add("is-lit"); }, i * (reduce ? 0 : 900));
    });
    setTimeout(() => { steps.forEach((x) => x.classList.remove("is-lit")); playing = false; }, steps.length * (reduce ? 0 : 900) + 900);
  });

  /* ---------- the bill ---------- */
  const inp = { pupils: $("#i-pupils"), min: $("#i-min"), req: $("#i-req"), share: $("#i-share") };
  const C = { days: 170, tabletW: 5, whPerReq: 0.24 * 5, co2: 0.9, waterLkWh: 1.15, natKWh: 117.9e9, tabletKZT: 100000, buildKZT: 250e6, runKZT: 60e6, trainKZT: 50000, pupilsPerTeacher: 15, usd: 510, housing: 4.56e6, finetuneKWh: 525 };
  function bill() {
    const P = +inp.pupils.value, M = +inp.min.value, R = +inp.req.value, S = +inp.share.value;
    $("#o-pupils").textContent = fmt(P); $("#o-min").textContent = M; $("#o-req").textContent = R; $("#o-share").textContent = S;
    const tabletKWh = P * C.tabletW * (M / 60) * C.days / 1000;
    const serverKWh = P * R * C.whPerReq * C.days / 1000;
    const kwh = tabletKWh + serverKWh + C.finetuneKWh;
    const share = kwh / C.natKWh * 100;
    const tCO2 = kwh * C.co2 / 1000;
    const water = serverKWh * C.waterLkWh;
    const tablets = Math.ceil(P / S), teachers = Math.ceil(P / C.pupilsPerTeacher);
    const cost = tablets * C.tabletKZT + C.buildKZT + C.runKZT + teachers * C.trainKZT;
    $("#r-meta").textContent = `${fmt(P)} pupils, ${M} min a day, ${R} AI requests a day`;
    $("#v-env").textContent = kwh >= 1000 ? (kwh / 1000).toFixed(1) + " MWh" : fmt(kwh) + " kWh";
    $("#env-detail").innerHTML = `At these settings Көпір uses about <strong>${(kwh / 1000).toFixed(1)} MWh a year</strong>: ${fmt(tabletKWh)} kWh for tablets, ${fmt(serverKWh)} kWh for server-side text generation and about ${C.finetuneKWh} kWh for one-time fine-tuning. That is about ${share.toFixed(5)}% of the 117.9 billion kWh Kazakhstan generated in 2024 <a class="ref" href="#src-39">[39]</a>, roughly ${fmt(tCO2)} tonnes of CO₂, and about ${fmt(water)} litres of data-centre cooling water.`;
    $("#v-eco").textContent = (cost / 1e6).toFixed(0) + " m ₸";
    $("#eco-detail").innerHTML = `Year one costs about <strong>${(cost / 1e6).toFixed(0)} million ₸</strong> (≈ $${(cost / C.usd / 1e6).toFixed(2)} million): ${fmt(tablets)} shared tablets (${(tablets * C.tabletKZT / 1e6).toFixed(0)} m ₸), building the system and a child-speech dataset (${C.buildKZT / 1e6} m ₸), running costs (${C.runKZT / 1e6} m ₸) and training ${fmt(teachers)} teachers (${(teachers * C.trainKZT / 1e6).toFixed(0)} m ₸). From year two, only running costs and tablet replacement remain.`;
    $("#v-per").textContent = fmt(Math.round(cost / P / 100) * 100) + " ₸";
    $("#r-foot").innerHTML = `Year one equals about ${fmt(cost / C.housing)} kandas housing certificates. The state pays up to 4.56 million ₸ per family <a class="ref" href="#src-12">[12]</a>.`;
  }
  Object.values(inp).forEach((i) => i.addEventListener("input", bill));
  bill();
  const receipt = $("#receipt");
  const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !reduce) { receipt.classList.add("is-printing"); io2.disconnect(); } }), { threshold: 0.2 });
  io2.observe(receipt);

  /* ---------- verdict ---------- */
  const boxes = $$("#conds input"), signEl = $("#sign"), word = $("#signWord"), text = $("#signText");
  function verdict() {
    const core = boxes.filter((b) => b.dataset.core && b.checked).length;
    const all = boxes.filter((b) => b.checked).length;
    let st, w, t;
    if (all === boxes.length) { st = "yes"; w = "Yes, as a pilot"; t = "With all five conditions met, Kazakhstan should pilot Көпір in a few schools for a year and judge it on reading results and on how the children feel about their Kazakh."; }
    else if (core === 3) { st = "notyet"; w = "Not yet"; t = "The core protections are in place. Without two-way inclusion and an independent evaluation, though, nobody will know whether the tool helps or simply shifts the burden onto children. Wait until those are in place."; }
    else { st = "no"; w = "No"; t = core === 0 && all === 0 ? "With none of the conditions met, Көпір would be a tablet that tells returnee children their Kazakh is wrong. Kazakhstan should not build it." : "At least one core condition (teachers first, fairness to dialects, privacy by design) is missing. Without all three, the harm to trust and identity outweighs a modest gain in reading. Kazakhstan should not build it."; }
    if (word.textContent !== w) { word.classList.remove("is-flip"); void word.offsetWidth; word.classList.add("is-flip"); }
    signEl.dataset.state = st; word.textContent = w; text.textContent = t;
  }
  boxes.forEach((b) => b.addEventListener("change", verdict));
  verdict();
})();
