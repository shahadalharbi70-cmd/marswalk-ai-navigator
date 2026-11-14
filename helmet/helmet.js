// js/helmet.js — MarsWalk AI Navigator (Jezero Crater Terrain & HUD Logic)

const nasaLandmarks = [
  { name: "KODIAK BUTTE", elev: "-2,510m", bearingOffset: -0.45, height: 54 },
  { name: "WESTERN FAN DELTA", elev: "WPT-01", bearingOffset: 0.04, height: 36 },
  { name: "JEZERO NORTHERN RIM", elev: "-2,180m", bearingOffset: 0.56, height: 68 },
  { name: "NERETVA VALLIS", elev: "WPT-02", bearingOffset: 1.15, height: 42 },
  { name: "SÉÍTAH BEDROCK", elev: "-2,565m", bearingOffset: -1.12, height: 28 }
];

const state = {
  walking: false,
  rerouted: false,
  emergency: false,
  progress: 0.18,
  walkPhase: 0,
  currentYaw: 0,
  targetYaw: 0,
  curveOffset: 0,
  targetCurveOffset: 0,
  distanceKm: 2.40,
  etaMinutes: 72,
  energyPct: 62,
  baseHeading: 42,
  baseElev: -2540,
  currentElev: -2540
};

const canvas = document.getElementById("marsCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const headingVal = document.getElementById("headingVal");
const attitudeVal = document.getElementById("attitudeVal");
const hrVal = document.getElementById("hrVal");
const gaitStatus = document.getElementById("gaitStatus");
const distVal = document.getElementById("distVal");
const elevReadout = document.getElementById("elevReadout");
const timeVal = document.getElementById("timeVal");
const energyVal = document.getElementById("energyVal");
const energyBar = document.getElementById("energyBar");
const slopeReadout = document.getElementById("slopeReadout");
const walkBtn = document.getElementById("walkBtn");
const rerouteBtn = document.getElementById("rerouteBtn");
const resetBtn = document.getElementById("resetBtn");
const returnBaseBtn = document.getElementById("returnBaseBtn");
const returnBtnTitle = document.getElementById("returnBtnTitle");
const returnBtnSub = document.getElementById("returnBtnSub");
const bottomLed = document.getElementById("bottomLed");

// Integration Bridge for Role 4 (AI Navigation) & Role 1 (App Integration)
window.updateHelmet = function (result) {
  if (!result) return;
  if (typeof result.distanceMeters === "number") {
    state.distanceKm = result.distanceMeters / 1000;
    state.etaMinutes = Math.max(1, Math.round(result.distanceMeters / 36));
  }
  if (Array.isArray(result.routePoints) && result.routePoints.length >= 2) {
    const p1 = result.routePoints[0];
    const p2 = result.routePoints[1];
    state.baseHeading = Math.round((Math.atan2(p2.x - p1.x, p2.y - p1.y) * 180) / Math.PI + 360) % 360;
  }
  const alertEl = document.getElementById("helmet-alert");
  if (alertEl && result.missionStatus) {
    alertEl.textContent = result.missionStatus === "GO"
      ? "MISSION APPROVED (GO)"
      : "REVIEW REQUIRED";
  }
  updateTelemetryUI();
};

window.triggerHelmetEmergencyReturn = function (returnRouteData) {
  state.emergency = true;
  state.rerouted = false;
  state.walking = true;
  state.targetYaw = Math.PI;
  state.targetCurveOffset = 0;
  state.distanceKm = returnRouteData && returnRouteData.distanceMeters
    ? returnRouteData.distanceMeters / 1000
    : 1.80;
  state.etaMinutes = Math.round(state.distanceKm * 30);

  if (walkBtn) {
    walkBtn.classList.add("active");
    walkBtn.textContent = "Pause EVA Traverse";
  }
  if (rerouteBtn) rerouteBtn.classList.remove("active");
  if (gaitStatus) gaitStatus.textContent = "EVA PACE: RTB ACTIVE";
  if (hrVal) hrVal.textContent = "112 BPM";
  if (bottomLed) bottomLed.classList.add("emergency");
  if (returnBtnTitle) returnBtnTitle.textContent = "RTB IN PROGRESS";
  if (returnBtnSub) returnBtnSub.textContent = "Heading: Octavia E. Butler";
  updateTelemetryUI();
};

const boulders = Array.from({ length: 85 }, (_, i) => ({
  x: ((i * 67 + 19) % 100) / 100,
  z: ((i * 43 + 11) % 100) / 100,
  size: 4 + (i % 7) * 3.5,
  color: i % 3 === 0 ? "#4a2214" : i % 3 === 1 ? "#63301d" : "#3a190e"
}));

const pebbles = Array.from({ length: 180 }, (_, i) => ({
  x: ((i * 97 + 7) % 1000) / 1000,
  z: ((i * 53 + 23) % 1000) / 1000,
  r: 1.2 + (i % 3) * 0.9
}));

const minorCraters = [
  { x: 0.22, z: 0.32, rx: 48, ry: 15 },
  { x: 0.78, z: 0.54, rx: 64, ry: 20 },
  { x: 0.16, z: 0.76, rx: 56, ry: 18 },
  { x: 0.84, z: 0.24, rx: 38, ry: 12 }
];

const HELMET_DPR = Math.min(window.devicePixelRatio || 1, 1.25);

function resizeCanvas() {
  if (!canvas || !ctx) return;

  const rect = canvas.parentElement.getBoundingClientRect();

  canvas.width = Math.max(1, Math.round(rect.width * HELMET_DPR));
  canvas.height = Math.max(1, Math.round(rect.height * HELMET_DPR));

  ctx.setTransform(HELMET_DPR, 0, 0, HELMET_DPR, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function formatEta(mins) {
  const m = Math.max(1, Math.round(mins));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${String(h).padStart(2, "0")}h ${String(rem).padStart(2, "0")}m`;
}

function resetSimulation() {
  state.walking = false;
  state.rerouted = false;
  state.emergency = false;
  state.progress = 0.18;
  state.walkPhase = 0;
  state.currentYaw = 0;
  state.targetYaw = 0;
  state.curveOffset = 0;
  state.targetCurveOffset = 0;
  state.distanceKm = 2.40;
  state.etaMinutes = 72;
  state.energyPct = 62;
  state.currentElev = state.baseElev;

  if (walkBtn) {
    walkBtn.textContent = "Initiate EVA Traverse";
    walkBtn.classList.remove("active");
  }
  if (rerouteBtn) {
    rerouteBtn.textContent = "Engage AI Safe Detour";
    rerouteBtn.classList.remove("active");
  }
  if (gaitStatus) gaitStatus.textContent = "EVA PACE: STANDBY";
  if (hrVal) hrVal.textContent = "82 BPM";
  if (bottomLed) bottomLed.classList.remove("emergency");
  if (returnBtnTitle) returnBtnTitle.textContent = "RETURN TO LANDER";
  if (returnBtnSub) returnBtnSub.textContent = "Octavia E. Butler: 1.8 km";
  updateTelemetryUI();
}

function updateTelemetryUI() {
  if (distVal) distVal.textContent = `${state.distanceKm.toFixed(2)} km`;
  if (elevReadout) elevReadout.textContent = `MOLA: ${Math.round(state.currentElev).toLocaleString()} m`;
  if (timeVal) timeVal.textContent = formatEta(state.etaMinutes);
  if (energyVal) energyVal.textContent = `${Math.max(10, Math.round(state.energyPct))}%`;
  if (energyBar) energyBar.style.width = `${Math.max(10, Math.round(state.energyPct))}%`;

  if (slopeReadout) {
    if (state.emergency) {
      slopeReadout.textContent = "SLOPE 08°";
      slopeReadout.className = "text-[11px] mono text-zinc-200";
    } else if (state.rerouted) {
      slopeReadout.textContent = "SLOPE 11°";
      slopeReadout.className = "text-[11px] mono text-zinc-200";
    } else {
      slopeReadout.textContent = "SLOPE 27°";
      slopeReadout.className = "text-[11px] mono text-amber-300";
    }
  }

  if (headingVal) {
    const deg = Math.round((state.baseHeading + (state.currentYaw * 180) / Math.PI + 360) % 360);
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const dirLabel = dirs[Math.round(deg / 45) % 8];
    headingVal.textContent = `${String(deg).padStart(3, "0")}° ${dirLabel}`;
  }
}

if (walkBtn) {
  walkBtn.addEventListener("click", () => {
    state.walking = !state.walking;
    walkBtn.classList.toggle("active", state.walking);
    walkBtn.textContent = state.walking ? "Pause EVA Traverse" : "Resume EVA Traverse";
    if (gaitStatus) gaitStatus.textContent = state.walking ? "EVA PACE: 0.6 M/S (ACTIVE)" : "EVA PACE: PAUSED";
    if (hrVal) hrVal.textContent = state.walking ? "96 BPM" : "82 BPM";
  });
}

if (rerouteBtn) {
  rerouteBtn.addEventListener("click", () => {
    if (state.emergency) return;
    state.rerouted = !state.rerouted;
    rerouteBtn.classList.toggle("active", state.rerouted);
    state.targetYaw = state.rerouted ? 0.36 : 0;
    state.targetCurveOffset = state.rerouted ? 155 : 0;
    rerouteBtn.textContent = state.rerouted ? "Detour Active (11°)" : "Engage AI Safe Detour";
    updateTelemetryUI();
  });
}

if (returnBaseBtn && !window.APP_JS_MANAGES_EMERGENCY_BTN) {
  returnBaseBtn.addEventListener("click", () => {
    window.triggerHelmetEmergencyReturn();
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", resetSimulation);
}

let lastTimestamp = performance.now();
let lastDrawTime = 0;

function renderFrame(now) {
  requestAnimationFrame(renderFrame);

  if (!canvas || !ctx) return;

  // Stop drawing when the page is hidden
  if (document.hidden) {
    lastTimestamp = now;
    return;
  }

  // 30 FPS while walking, 15 FPS while idle
  const targetFPS = state.walking ? 30 : 15;
  const frameInterval = 1000 / targetFPS;

  if (now - lastDrawTime < frameInterval) return;

  lastDrawTime = now;

  const dt = Math.min(0.1, (now - lastTimestamp) / 1000);
  lastTimestamp = now;

  const w = canvas.width / HELMET_DPR;
  const h = canvas.height / HELMET_DPR;

  state.currentYaw += (state.targetYaw - state.currentYaw) * Math.min(1, dt * 1.35);
  state.curveOffset += (state.targetCurveOffset - state.curveOffset) * Math.min(1, dt * 1.7);

  let bobY = 0;
  let swayX = 0;
  if (state.walking) {
    state.walkPhase += dt * 1.9;
    bobY = Math.sin(state.walkPhase * 2) * 4.5;
    swayX = Math.cos(state.walkPhase) * 3.0;

    state.progress = (state.progress + dt * 0.015) % 1;
    state.distanceKm = Math.max(0.05, state.distanceKm - dt * 0.004);
    state.etaMinutes = Math.max(1, state.etaMinutes - dt * 0.12);
    state.energyPct = Math.max(12, state.energyPct - dt * 0.03);
    state.currentElev = state.baseElev + state.progress * 18;

    const pitchDeg = Math.round(2 + Math.sin(state.walkPhase * 2) * 2);
    const rollDeg = Math.round(Math.cos(state.walkPhase) * 1);
    if (attitudeVal) {
      attitudeVal.textContent = `P:+0${Math.abs(pitchDeg)}° R:${rollDeg >= 0 ? "+" : "-"}${Math.abs(rollDeg)}°`;
    }
    updateTelemetryUI();
  } else {
    state.walkPhase += dt * 0.8;
    bobY = Math.sin(state.walkPhase) * 1.0;
  }

  const horizonY = h * 0.43 + bobY;
  const panShift = -state.currentYaw * (w * 0.46) + swayX;

  ctx.clearRect(0, 0, w, h);

  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, "#472316");
  skyGrad.addColorStop(0.55, "#8f4c32");
  skyGrad.addColorStop(1, "#cc7d59");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, horizonY + 4);

  const sunX = ((w * 0.66 + panShift * 0.35) % (w * 1.4) + w * 1.4) % (w * 1.4) - w * 0.2;
  const sunGlow = ctx.createRadialGradient(sunX, horizonY * 0.42, 4, sunX, horizonY * 0.42, 95);
  sunGlow.addColorStop(0, "rgba(255, 245, 232, 0.82)");
  sunGlow.addColorStop(0.32, "rgba(244, 185, 145, 0.30)");
  sunGlow.addColorStop(1, "rgba(201, 122, 87, 0)");
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, w, horizonY);

  drawSedimentaryRidge(w, horizonY, panShift * 0.55, 62, "#6b3320", "#82412a", 0.0042, 1.2);
  drawSedimentaryRidge(w, horizonY, panShift * 0.85, 36, "#522415", "#69311e", 0.0075, 2.7);

  nasaLandmarks.forEach((lm) => {
    const relAngle = lm.bearingOffset - state.currentYaw;
    const screenX = w * 0.5 + relAngle * (w * 0.46) + swayX * 0.5;
    if (screenX > 70 && screenX < w - 70) {
      drawJezeroButteAndPin(screenX, horizonY, lm);
    }
  });

  if (state.currentYaw > 1.55) {
    const baseScreenX = w * 0.5 + (Math.PI - state.currentYaw) * (w * 0.46);
    drawLanderSite(baseScreenX, horizonY - 4);
  }

  const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
  groundGrad.addColorStop(0, "#91472a");
  groundGrad.addColorStop(0.35, "#6b301b");
  groundGrad.addColorStop(1, "#33140a");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, horizonY, w, h - horizonY);

  const forwardScroll = (state.progress * 4.
