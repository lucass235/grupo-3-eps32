// 👉 Seu endpoint (já preenchido com o do print). Altere se desejar.
const DEFAULT_ENDPOINT =
  "https://grupo3-16a7b-default-rtdb.firebaseio.com/.json";

// Faixa do termômetro (ajuste se precisar)
const THERMO_MIN = 0;
const THERMO_MAX = 60;

const el = (id) => document.getElementById(id);
const endpointInput = el("endpoint");
const intervalInput = el("interval");
const statusEl = el("status");

endpointInput.value = DEFAULT_ENDPOINT;

// Estado UI simples
function setState(id, on) {
  const box = el(id + "State");
  const txt = el(id + "Txt");
  const raw = el(id + "Raw");
  if (!box || !txt || !raw) return;
  box.classList.toggle("on", !!on);
  box.classList.toggle("off", !on);
  txt.textContent = on ? "ON" : "OFF";
  raw.textContent = String(on);
}

// Chart: tempo de vida
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
  const max = 40;
  const now = new Date();
  chart.data.labels.push(now.toLocaleTimeString());
  chart.data.datasets[0].data.push(v);
  if (chart.data.labels.length > max) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update("none");
}

// Termômetro
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function setThermometer(temp) {
  const fill = el("thermoFill");
  if (!fill) return;
  if (!Number.isFinite(temp)) { fill.style.height = "0%"; return; }
  const pct = clamp01((temp - THERMO_MIN) / (THERMO_MAX - THERMO_MIN));
  fill.style.height = (pct * 100).toFixed(1) + "%";
}

// --- NOVO: gráfico de correlação Temp × Umidade ---
const corrCtx = document.getElementById("corrChart");
const corrChart = new Chart(corrCtx, {
  type: "scatter",
  data: {
    datasets: [
      { label: "medidas", data: [], pointRadius: 3 },
      { label: "tendência", data: [], type: "line", fill: false, pointRadius: 0, borderDash: [6, 4] },
    ],
  },
  options: {
    responsive: true,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { title: { display: true, text: "Temperatura (°C)" } },
      y: { title: { display: true, text: "Umidade (%)" }, suggestedMin: 0, suggestedMax: 100 },
    },
  },
});

const CORR_MAX = 100;
const histTemp = [];
const histHum = [];

function updateCorrelation(temp, hum) {
  if (!Number.isFinite(temp) || !Number.isFinite(hum)) return;

  histTemp.push(temp);
  histHum.push(hum);
  if (histTemp.length > CORR_MAX) { histTemp.shift(); histHum.shift(); }

  // Atualiza pontos
  corrChart.data.datasets[0].data = histTemp.map((t, i) => ({ x: t, y: histHum[i] }));

  // Regressão linear simples (y = a + b x)
  const n = histTemp.length;
  if (n >= 2) {
    const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
    const mx = mean(histTemp);
    const my = mean(histHum);
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      const dx = histTemp[i] - mx;
      num += dx * (histHum[i] - my);
      den += dx * dx;
    }
    const b = den === 0 ? 0 : num / den;
    const a = my - b * mx;

    const xmin = Math.min(...histTemp);
    const xmax = Math.max(...histTemp);
    const line = [
      { x: xmin, y: a + b * xmin },
      { x: xmax, y: a + b * xmax },
    ];
    corrChart.data.datasets[1].data = line;
  } else {
    corrChart.data.datasets[1].data = [];
  }

  corrChart.update("none");
}

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

      // Nomes flexíveis
      const botao = data?.botao ?? data?.button ?? data?.estadoBotao;
      const led = data?.led ?? data?.lampada ?? data?.estadoLed;
      const tempoVida = data?.tempovida ?? data?.tempoVida ?? data?.uptime ?? null;
      const humidity = data?.humidity ?? data?.umidade ?? null;
      const tempRaw = data?.temperature ?? data?.temperatura ?? null;

      setState("botao", !!botao);
      setState("led", !!led);

      if (tempoVida !== null && tempoVida !== undefined) {
        const n = Number(tempoVida);
        el("tempoVal").textContent = Number.isFinite(n) ? n : String(tempoVida);
        if (Number.isFinite(n)) pushTempo(n);
      } else {
        el("tempoVal").textContent = "—";
      }

      let tVal = NaN, hVal = NaN;

      if (tempRaw !== null && tempRaw !== undefined) {
        const t = Number(tempRaw);
        el("tempVal").textContent = Number.isFinite(t) ? t.toFixed(1) : String(tempRaw);
        setThermometer(Number.isFinite(t) ? t : NaN);
        tVal = Number.isFinite(t) ? t : NaN;
      } else {
        el("tempVal").textContent = "—";
        setThermometer(NaN);
      }

      if (humidity !== null && humidity !== undefined) {
        const h = Number(humidity);
        el("humVal").textContent = Number.isFinite(h) ? h.toFixed(1) : String(humidity);
        hVal = Number.isFinite(h) ? h : NaN;
      } else {
        el("humVal").textContent = "—";
      }

      // Atualiza correlação se ambos válidos
      if (Number.isFinite(tVal) && Number.isFinite(hVal)) {
        updateCorrelation(tVal, hVal);
      }

      el("lastUpdate").textContent = "Atualizado " + new Date().toLocaleTimeString();
      statusEl.textContent = "🟢 conectado";
    } catch (err) {
      statusEl.textContent = "🔴 erro: " + err.message;
    }
  }

  tick();
  timer = setInterval(tick, every);
}

document.getElementById("apply").addEventListener("click", startPolling);

// conecta automaticamente ao carregar
startPolling();
