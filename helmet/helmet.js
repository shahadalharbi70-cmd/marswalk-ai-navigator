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

  if (document.hidden) {
    lastTimestamp = now;
    return;
  }

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

  const forwardScroll = (state.progress * 4.5) % 1;

  ctx.save();
  for (let i = 0; i < 16; i++) {
    const z = ((i / 16) + forwardScroll * 0.25) % 1;
    const persp = Math.pow(z, 1.75);
    const ry = horizonY + persp * (h - horizonY);
    ctx.strokeStyle = `rgba(42, 16, 8, ${0.15 + persp * 0.28})`;
    ctx.lineWidth = 1 + persp * 2.5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 40) {
      const wave = Math.sin(x * 0.015 + i * 1.4 + swayX * 0.05) * (3 * persp);
      if (x === 0) ctx.moveTo(x, ry + wave);
      else ctx.lineTo(x, ry + wave);
    }
    ctx.stroke();
  }
  ctx.restore();

  minorCraters.forEach((mc) => {
    const z = (mc.z + forwardScroll * 0.65) % 1;
    const persp = Math.pow(z, 1.8);
    const cy = horizonY + persp * (h - horizonY);
    const cx = w * 0.5 + (mc.x - 0.5) * w * (0.45 + persp * 1.3) + swayX * persp;
    const rx = mc.rx * (0.25 + persp * 1.4);
    const ry = mc.ry * (0.25 + persp * 1.4);
    drawDetailedCrater(cx, cy, rx, ry, false);
  });

  pebbles.forEach((p) => {
    const z = (p.z + forwardScroll) % 1;
    const persp = Math.pow(z, 1.85);
    const py = horizonY + persp * (h - horizonY);
    const px = w * 0.5 + (p.x - 0.5) * w * (0.4 + persp * 1.45) + swayX * persp;
    const pr = p.r * (0.3 + persp * 1.2);
    ctx.fillStyle = "rgba(38, 15, 8, 0.55)";
    ctx.fillRect(px, py, pr * 1.4, pr * 0.8);
  });

  boulders.forEach((b) => {
    const z = (b.z + forwardScroll) % 1;
    const persp = Math.pow(z, 1.85);
    const ry = horizonY + persp * (h - horizonY);
    const rx = w * 0.5 + (b.x - 0.5) * w * (0.35 + persp * 1.45) + swayX * persp;
    const rw = b.size * (0.25 + persp * 1.55);
    const rh = rw * 0.55;

    ctx.fillStyle = "rgba(22, 8, 4, 0.58)";
    ctx.beginPath();
    ctx.ellipse(rx - rw * 0.45, ry + rh * 0.25, rw * 1.15, rh * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(rx - rw, ry + rh * 0.2);
    ctx.lineTo(rx - rw * 0.65, ry - rh * 0.75);
    ctx.lineTo(rx + rw * 0.25, ry - rh * 0.9);
    ctx.lineTo(rx + rw, ry - rh * 0.1);
    ctx.lineTo(rx + rw * 0.7, ry + rh * 0.35);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(186, 102, 68, 0.42)";
    ctx.beginPath();
    ctx.moveTo(rx - rw * 0.2, ry - rh * 0.85);
    ctx.lineTo(rx + rw * 0.25, ry - rh * 0.9);
    ctx.lineTo(rx + rw, ry - rh * 0.1);
    ctx.lineTo(rx + rw * 0.1, ry - rh * 0.15);
    ctx.closePath();
    ctx.fill();
  });

  if (!state.emergency) {
    const craterApproach = ((state.progress * 1.25) % 1);
    const cPersp = 0.22 + Math.pow(craterApproach, 1.55) * 0.65;
    const craterY = horizonY + cPersp * (h - horizonY);
    const craterX = w * 0.5 - state.curveOffset * cPersp * 1.35 + swayX * cPersp;
    const craterRx = 145 * cPersp;
    const craterRy = 46 * cPersp;

    drawDetailedCrater(craterX, craterY, craterRx, craterRy, true);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(craterX, craterY, craterRx * 1.08, craterRy * 1.12, 0, 0, Math.PI * 2);
    ctx.strokeStyle = state.rerouted
      ? "rgba(255, 255, 255, 0.38)"
      : "rgba(245, 158, 11, 0.85)";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (cPersp > 0.26) {
      ctx.font = `600 ${Math.max(10, Math.round(11 * cPersp))}px "JetBrains Mono", monospace`;
      ctx.fillStyle = state.rerouted ? "rgba(255,255,255,0.7)" : "#fcd34d";
      ctx.textAlign = "center";
      ctx.fillText("BELVA CRATER DROP-OFF • 27°", craterX, craterY - craterRy - 10);
    }
    ctx.restore();
  }

  drawDemElevationLadder(w, h, state.currentElev, bobY);
  drawOpticalPitchReticle(w, h, horizonY, swayX);
  drawCollimatedTrajectoryLines(w, h, horizonY, swayX);
}

function drawDetailedCrater(cx, cy, rx, ry, isPrimaryHazard) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 1.16, ry * 1.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = isPrimaryHazard ? "rgba(158, 84, 52, 0.65)" : "rgba(138, 70, 42, 0.45)";
  ctx.fill();

  const pitGrad = ctx.createRadialGradient(
    cx - rx * 0.22,
    cy - ry * 0.2,
    rx * 0.08,
    cx,
    cy,
    rx
  );
  pitGrad.addColorStop(0, "#120603");
  pitGrad.addColorStop(0.62, "#290f07");
  pitGrad.addColorStop(0.88, "#4d2113");
  pitGrad.addColorStop(1, "#7d3d25");

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = pitGrad;
  ctx.fill();

  ctx.strokeStyle = "rgba(205, 122, 84, 0.45)";
  ctx.lineWidth = Math.max(1, rx * 0.025);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.94, ry * 0.92, 0, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();

  if (isPrimaryHazard && rx > 45) {
    ctx.fillStyle = "#1f0b05";
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.25, cy + ry * 0.15, rx * 0.08, ry * 0.09, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + rx * 0.18, cy - ry * 0.1, rx * 0.06, ry * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSedimentaryRidge(w, horizonY, shiftX, maxHeight, bodyColor, strataColor, freq, seed) {
  ctx.save();
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 2);
  for (let x = 0; x <= w; x += 10) {
    const worldX = x - shiftX;
    const ridge =
      Math.sin(worldX * freq + seed) * 0.5 +
      Math.cos(worldX * freq * 2.4 + seed * 1.7) * 0.3 +
      Math.sin(worldX * freq * 5.3) * 0.2;
    const y = horizonY - Math.max(8, (ridge + 1) * 0.5 * maxHeight);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, horizonY + 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = strataColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 14) {
    const worldX = x - shiftX;
    const ridge =
      Math.sin(worldX * freq + seed) * 0.5 +
      Math.cos(worldX * freq * 2.4 + seed * 1.7) * 0.3;
    const y = horizonY - Math.max(4, (ridge + 1) * 0.32 * maxHeight);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawJezeroButteAndPin(x, horizonY, lm) {
  ctx.save();
  ctx.fillStyle = "#4d2214";
  ctx.beginPath();
  ctx.moveTo(x - 68, horizonY + 1);
  ctx.lineTo(x - 34, horizonY - lm.height);
  ctx.lineTo(x + 34, horizonY - lm.height);
  ctx.lineTo(x + 68, horizonY + 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(176, 94, 60, 0.38)";
  ctx.beginPath();
  ctx.moveTo(x + 6, horizonY - lm.height);
  ctx.lineTo(x + 34, horizonY - lm.height);
  ctx.lineTo(x + 68, horizonY + 1);
  ctx.lineTo(x + 14, horizonY + 1);
  ctx.closePath();
  ctx.fill();

  const pinTopY = horizonY - lm.height - 18;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, horizonY - lm.height);
  ctx.lineTo(x, pinTopY + 4);
  ctx.stroke();

  ctx.font = '500 9.5px "JetBrains Mono", monospace';
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.textAlign = "center";
  ctx.fillText(`${lm.name} [${lm.elev}]`, x, pinTopY);
  ctx.restore();
}

function drawLanderSite(cx, cy) {
  ctx.save();
  ctx.fillStyle = "#e4e4e7";
  ctx.beginPath();
  ctx.arc(cx, cy, 22, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.strokeRect(cx - 92, cy - 48, 184, 20);
  ctx.font = '600 10px "JetBrains Mono", monospace';
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("OCTAVIA E. BUTLER LANDING", cx, cy - 35);
  ctx.restore();
}

function drawDemElevationLadder(w, h, currentElev, bobY) {
  ctx.save();
  const ladderX = Math.max(24, w * 0.045);
  const midY = h * 0.5 + bobY * 0.3;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
  ctx.font = '400 8.5px "JetBrains Mono", monospace';
  ctx.textAlign = "left";

  for (let i = -3; i <= 3; i++) {
    const y = midY + i * 24;
    const elevMark = Math.round(currentElev - i * 10);
    ctx.beginPath();
    ctx.moveTo(ladderX, y);
    ctx.lineTo(ladderX + (i === 0 ? 10 : 5), y);
    ctx.stroke();

    if (i === 0 || i === -2 || i === 2) {
      ctx.fillText(`${elevMark}m`, ladderX + 13, y + 3);
    }
  }
  ctx.restore();
}

function drawOpticalPitchReticle(w, h, horizonY, swayX) {
  ctx.save();
  const cx = w * 0.5 + swayX * 0.3;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 170, horizonY);
  ctx.lineTo(cx - 65, horizonY);
  ctx.moveTo(cx + 65, horizonY);
  ctx.lineTo(cx + 170, horizonY);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
  ctx.beginPath();
  ctx.moveTo(cx - 10, horizonY);
  ctx.lineTo(cx + 10, horizonY);
  ctx.moveTo(cx, horizonY - 10);
  ctx.lineTo(cx, horizonY + 10);
  ctx.stroke();
  ctx.restore();
}

function drawCollimatedTrajectoryLines(w, h, horizonY, swayX) {
  const startY = h * 0.90;
  const endY = horizonY + (h - horizonY) * 0.15;
  const lineColor = state.emergency
    ? "rgba(248, 113, 113, 0.72)"
    : "rgba(255, 255, 255, 0.62)";

  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;

  [-1, 1].forEach((side) => {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const y = startY + (endY - startY) * Math.pow(t, 0.82);
      const curve = Math.sin(t * Math.PI) * state.curveOffset * (1 - t * 0.35);
      const halfW = (1 - t * 0.80) * 54;
      const x = w * 0.5 + curve + swayX * (1 - t) + side * halfW;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  const pulseOffset = (performance.now() / 900) % 1;
  for (let i = 0; i < 6; i++) {
    const t = (i + pulseOffset) / 6;
    if (t > 0.94) continue;
    const y = startY + (endY - startY) * Math.pow(t, 0.82);
    const curve = Math.sin(t * Math.PI) * state.curveOffset * (1 - t * 0.35);
    const halfW = (1 - t * 0.80) * 54;
    const x = w * 0.5 + curve + swayX * (1 - t);

    ctx.strokeStyle = state.emergency
      ? `rgba(248, 113, 113, ${0.48 * (1 - t)})`
      : `rgba(255, 255, 255, ${0.45 * (1 - t)})`;
    ctx.beginPath();
    ctx.moveTo(x - halfW, y);
    ctx.lineTo(x + halfW, y);
    ctx.stroke();
  }
  ctx.restore();
}

resetSimulation();
requestAnimationFrame(renderFrame);
