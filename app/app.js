// 👉 Seu endpoint (já preenchido com o do print). Altere se desejar.
const DEFAULT_ENDPOINT =
  "https://grupo3-16a7b-default-rtdb.firebaseio.com/.json";

// Faixas
const THERMO_MIN = 0,
  THERMO_MAX = 60;
const POT_MIN = 0,
  POT_MAX = 100;

const el = (id) => document.getElementById(id);
const endpointInput = el("endpoint");
const intervalInput = el("interval");
const statusEl = el("status");
endpointInput.value = DEFAULT_ENDPOINT;

// Estado UI simples
function setState(id, on) {
  const box = el(id + "State"),
    txt = el(id + "Txt"),
    raw = el(id + "Raw");
  if (!box || !txt || !raw) return;
  box.classList.toggle("on", !!on);
  box.classList.toggle("off", !on);
  txt.textContent = on ? "ON" : "OFF";
  raw.textContent = String(on);
}

/* ------------------ Gráfico tempo de vida ------------------ */
const chartCtx = document.getElementById("tempoChart");
const chart = new Chart(chartCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      { label: "tempo de vida", data: [], tension: 0.25, fill: false },
    ],
  },
  options: {
    responsive: true,
    animation: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  },
});
function pushTempo(v) {
  const max = 40,
    now = new Date();
  chart.data.labels.push(now.toLocaleTimeString());
  chart.data.datasets[0].data.push(v);
  if (chart.data.labels.length > max) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update("none");
}

/* ------------------ Termômetro ------------------ */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
function setThermometer(temp) {
  const fill = el("thermoFill");
  if (!fill) return;
  if (!Number.isFinite(temp)) {
    fill.style.height = "0%";
    return;
  }
  const pct = clamp01((temp - THERMO_MIN) / (THERMO_MAX - THERMO_MIN));
  fill.style.height = (pct * 100).toFixed(1) + "%";
}

/* ------------------ Potenciômetro (visual + som + háptico) ------------------ */
let lastPotZone = -1;
let audioEnabled = false,
  audioCtx = null,
  osc = null,
  gainNode = null;

function potZone(p) {
  if (p >= 90) return 4;
  if (p >= 75) return 3;
  if (p >= 50) return 2;
  if (p >= 25) return 1;
  return 0;
}
function potZoneLabel(z) {
  return ["baixo", "médio-", "médio+", "alto", "máximo"][z] || "—";
}
function updateAudioFromPot(p) {
  if (!audioEnabled) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.0001;
    osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.connect(gainNode).connect(audioCtx.destination);
    osc.start();
  }
  const pct = clamp01((p - POT_MIN) / (POT_MAX - POT_MIN));
  const freq = 180 + 700 * pct; // 180 Hz → 880 Hz
  const vol = 0.02 + 0.1 * pct; // volume suave
  const t = audioCtx.currentTime;
  osc.frequency.setTargetAtTime(freq, t, 0.02);
  gainNode.gain.setTargetAtTime(vol, t, 0.02);
}
function toggleAudio() {
  audioEnabled = !audioEnabled;
  const btn = el("audioToggle");
  if (audioEnabled) {
    if (!audioCtx) updateAudioFromPot(0);
    else audioCtx.resume && audioCtx.resume();
    btn.textContent = "Desativar áudio/háptico";
  } else {
    if (gainNode)
      gainNode.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.02);
    btn.textContent = "Ativar áudio/háptico";
  }
}
el("audioToggle").addEventListener("click", toggleAudio);

function vibrate(pattern) {
  if (navigator.vibrate)
    try {
      navigator.vibrate(pattern);
    } catch {}
}

function setSlider(v) {
  const fill = el("potFill");
  const zoneEl = el("potZone");
  if (!fill || !zoneEl) return;

  if (!Number.isFinite(v)) {
    fill.style.width = "0%";
    fill.style.background = "hsl(215 80% 75%)";
    fill.style.boxShadow = "none";
    fill.classList.remove("pulse");
    zoneEl.textContent = "—";
    return;
  }

  const pct = clamp01((v - POT_MIN) / (POT_MAX - POT_MIN));
  fill.style.width = (pct * 100).toFixed(1) + "%";

  // Cor HSL fixa em 215° com saturação e luminosidade variando pelo valor
  const sat = 70 + 20 * pct; // 70% → 90%
  const light = 75 - 35 * pct; // 75% → 40%
  fill.style.background = `hsl(215 ${sat.toFixed(0)}% ${light.toFixed(0)}%)`;
  fill.style.boxShadow = `0 0 ${8 + 24 * pct}px hsla(215, ${sat.toFixed(
    0
  )}%, ${light.toFixed(0)}%, ${0.35 * pct})`;

  // Pulso suave quando muito alto
  if (pct >= 0.9) fill.classList.add("pulse");
  else fill.classList.remove("pulse");

  // Zona + háptico em mudanças de faixa
  const z = potZone(v);
  zoneEl.textContent = potZoneLabel(z);
  if (z !== lastPotZone) {
    lastPotZone = z;
    // Vibrações diferentes por zona
    const patterns = {
      0: [20],
      1: [30, 30, 30],
      2: [40, 30, 40],
      3: [60, 30, 60],
      4: [90, 40, 90],
    };
    vibrate(patterns[z]);
  }

  // Som
  updateAudioFromPot(v);
}

/* ------------------ Correlação Temp × Umidade ------------------ */
const corrCtx = document.getElementById("corrChart");
const corrChart = new Chart(corrCtx, {
  type: "scatter",
  data: {
    datasets: [
      { label: "medidas", data: [], pointRadius: 3 },
      {
        label: "tendência",
        data: [],
        type: "line",
        fill: false,
        pointRadius: 0,
        borderDash: [6, 4],
      },
    ],
  },
  options: {
    responsive: true,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { title: { display: true, text: "Temperatura (°C)" } },
      y: {
        title: { display: true, text: "Umidade (%)" },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  },
});
const CORR_MAX = 100,
  histTemp = [],
  histHum = [];
function updateCorrelation(temp, hum) {
  if (!Number.isFinite(temp) || !Number.isFinite(hum)) return;
  histTemp.push(temp);
  histHum.push(hum);
  if (histTemp.length > CORR_MAX) {
    histTemp.shift();
    histHum.shift();
  }
  corrChart.data.datasets[0].data = histTemp.map((t, i) => ({
    x: t,
    y: histHum[i],
  }));
  const n = histTemp.length;
  if (n >= 2) {
    const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    const mx = mean(histTemp),
      my = mean(histHum);
    let num = 0,
      den = 0;
    for (let i = 0; i < n; i++) {
      const dx = histTemp[i] - mx;
      num += dx * (histHum[i] - my);
      den += dx * dx;
    }
    const b = den === 0 ? 0 : num / den,
      a = my - b * mx;
    const xmin = Math.min(...histTemp),
      xmax = Math.max(...histTemp);
    corrChart.data.datasets[1].data = [
      { x: xmin, y: a + b * xmin },
      { x: xmax, y: a + b * xmax },
    ];
  } else {
    corrChart.data.datasets[1].data = [];
  }
  corrChart.update("none");
}

/* ------------------ Polling ------------------ */
let timer = null;
function startPolling() {
  const url = endpointInput.value.trim();
  const every = Math.max(parseInt(intervalInput.value, 10) || 2000, 500);
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  async function tick() {
    try {
      statusEl.textContent = "🔄 atualizando…";
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();

      const botao = data?.botao ?? data?.button ?? data?.estadoBotao;
      const led = data?.led ?? data?.lampada ?? data?.estadoLed;
      const tempoVida =
        data?.tempovida ?? data?.tempoVida ?? data?.uptime ?? null;
      const humidity = data?.humidity ?? data?.umidade ?? null;
      const tempRaw = data?.temperature ?? data?.temperatura ?? null;
      const potRaw = data?.slider ?? data?.slider ?? data?.pot ?? null;

      setState("botao", !!botao);
      setState("led", !!led);

      if (tempoVida !== null && tempoVida !== undefined) {
        const n = Number(tempoVida);
        el("tempoVal").textContent = Number.isFinite(n) ? n : String(tempoVida);
        if (Number.isFinite(n)) pushTempo(n);
      } else {
        el("tempoVal").textContent = "—";
      }

      let tVal = NaN,
        hVal = NaN;

      if (tempRaw !== null && tempRaw !== undefined) {
        const t = Number(tempRaw);
        el("tempVal").textContent = Number.isFinite(t)
          ? t.toFixed(1)
          : String(tempRaw);
        setThermometer(Number.isFinite(t) ? t : NaN);
        tVal = Number.isFinite(t) ? t : NaN;
      } else {
        el("tempVal").textContent = "—";
        setThermometer(NaN);
      }

      if (humidity !== null && humidity !== undefined) {
        const h = Number(humidity);
        el("humVal").textContent = Number.isFinite(h)
          ? h.toFixed(1)
          : String(humidity);
        hVal = Number.isFinite(h) ? h : NaN;
      } else {
        el("humVal").textContent = "—";
      }

      if (potRaw !== null && potRaw !== undefined) {
        const p = Number(potRaw);
        el("potVal").textContent = Number.isFinite(p)
          ? p.toFixed(0)
          : String(potRaw);
        setSlider(Number.isFinite(p) ? p : NaN);
      } else {
        el("potVal").textContent = "—";
        setSlider(NaN);
      }

      if (Number.isFinite(tVal) && Number.isFinite(hVal))
        updateCorrelation(tVal, hVal);

      el("lastUpdate").textContent =
        "Atualizado " + new Date().toLocaleTimeString();
      statusEl.textContent = "🟢 conectado";
    } catch (err) {
      statusEl.textContent = "🔴 erro: " + err.message;
    }
  }

  tick();
  timer = setInterval(tick, every);
}
document.getElementById("apply").addEventListener("click", startPolling);
startPolling();
