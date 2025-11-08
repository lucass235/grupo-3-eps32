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

// Chart.js – série do tempo de vida
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
  const max = 40; // pontos no gráfico
  const now = new Date();
  chart.data.labels.push(now.toLocaleTimeString());
  chart.data.datasets[0].data.push(v);
  if (chart.data.labels.length > max) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update("none");
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

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

      // Tenta nomes flexíveis (ex.: tempovida vs tempoVida)
      const botao = data?.botao ?? data?.button ?? data?.estadoBotao;
      const led = data?.led ?? data?.lampada ?? data?.estadoLed;
      const tempoVida =
        data?.tempovida ?? data?.tempoVida ?? data?.uptime ?? null;

      // Novas variáveis
      const humidity = data?.humidity ?? data?.umidade ?? null;
      const tempRaw =
        data?.temperature ?? data?.temperatura ?? null;

      setState("botao", !!botao);
      setState("led", !!led);

      if (tempoVida !== null && tempoVida !== undefined) {
        const n = Number(tempoVida);
        el("tempoVal").textContent = Number.isFinite(n)
          ? n
          : String(tempoVida);
        if (Number.isFinite(n)) pushTempo(n);
      } else {
        el("tempoVal").textContent = "—";
      }

      if (tempRaw !== null && tempRaw !== undefined) {
        const t = Number(tempRaw);
        el("tempVal").textContent = Number.isFinite(t)
          ? t.toFixed(1)
          : String(tempRaw);
        setThermometer(Number.isFinite(t) ? t : NaN);
      } else {
        el("tempVal").textContent = "—";
        setThermometer(NaN);
      }

      if (humidity !== null && humidity !== undefined) {
        const h = Number(humidity);
        el("humVal").textContent = Number.isFinite(h)
          ? h.toFixed(1)
          : String(humidity);
      } else {
        el("humVal").textContent = "—";
      }

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

// conecta automaticamente ao carregar
startPolling();
