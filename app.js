/**
 * Ethical Algorithm Simulator for Autonomous Vehicles
 * Decision engine: scenario → mode → decision → outcome → liability → public reaction
 */

// ——— Scenario defaults (inputs override these at run time) ———
const SCENARIO_DEFAULTS = { speed: 60, brakeFailure: 0.2 };

function getScenario() {
  const passengersEl = document.getElementById('inputPassengers');
  const pedestriansEl = document.getElementById('inputPedestrians');
  const passengers = Math.max(0, Math.min(10, parseInt(passengersEl?.value || '2', 10) || 2));
  const pedestrians = Math.max(0, Math.min(10, parseInt(pedestriansEl?.value || '1', 10) || 1));
  return { ...SCENARIO_DEFAULTS, passengers, pedestrians };
}

// ——— State ———
let selectedMode = null;
let lastResult = null;

// ——— DOM ———
const runBtn = document.getElementById('runBtn');
const modeHint = document.getElementById('modeHint');
const processingOverlay = document.getElementById('processingOverlay');
const carEl = document.getElementById('carEl');
const carBrakeLights = document.getElementById('carBrakeLights');
const pedestriansWrap = document.getElementById('pedestriansWrap');
const animationStage = document.getElementById('animationStage');
const impactFlash = document.getElementById('impactFlash');
const obstacleEl = document.getElementById('obstacleEl');
const dashboardSection = document.getElementById('dashboardSection');

// ——— Build pedestrian figures (up to 3 for display) ———
// Pedestrians cross the road vertically (from curb into car's path) when simulation runs
function buildPedestrians(animate = false) {
  if (!pedestriansWrap) return;
  const count = Math.min(3, getScenario().pedestrians);
  pedestriansWrap.innerHTML = '';
  const positions = [52, 58, 64]; // % from left — crossing points in the lane
  for (let i = 0; i < count; i++) {
    const ped = document.createElement('div');
    ped.className = 'pedestrian';
    ped.style.left = positions[i] + '%';
    ped.style.bottom = animate ? '95px' : '52px'; // Start at curb when animating
    ped.innerHTML = '<div class="pedestrian-body"></div><div class="pedestrian-head"></div>';
    pedestriansWrap.appendChild(ped);
  }
  if (animate) {
    pedestriansWrap.querySelectorAll('.pedestrian').forEach((p) => p.classList.add('crossing'));
  }
}

// Initialize pedestrians on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', buildPedestrians);
} else {
  buildPedestrians();
}

// ——— Step 2: Mode selection ———
function selectMode(mode) {
  selectedMode = mode;
  document.querySelectorAll('.mode-btn').forEach((btn) => btn.classList.remove('selected'));
  const btn = document.querySelector(`[data-mode="${mode}"]`);
  if (btn) btn.classList.add('selected');

  const labels = {
    utilitarian: 'Utilitarian Mode — minimize total loss of life',
    passenger: 'Passenger Priority — protect occupants first',
    pedestrian: 'Pedestrian Priority — protect vulnerable road users',
  };
  modeHint.textContent = labels[mode];
  runBtn.disabled = false;
}

// ——— Step 3: Ethical logic engine ———
function getDecision(mode) {
  const scenario = getScenario();
  const { passengers, pedestrians } = scenario;

  if (mode === 'utilitarian') {
    if (passengers > pedestrians) return 'Hit Pedestrian';
    if (pedestrians > passengers) return 'Swerve and Hit Obstacle';
    return Math.random() < 0.5 ? 'Hit Pedestrian' : 'Swerve and Hit Obstacle';
  }

  if (mode === 'passenger') {
    return 'Hit Pedestrian';
  }

  if (mode === 'pedestrian') {
    return 'Swerve and Hit Obstacle';
  }

  return 'Swerve and Hit Obstacle';
}

// ——— Step 4: Simulate outcome (survival %) ———
function simulateOutcome(decision) {
  let passengerSurvival, pedestrianSurvival;

  if (decision === 'Hit Pedestrian') {
    pedestrianSurvival = 0;
    passengerSurvival = 95;
  } else {
    pedestrianSurvival = 100;
    passengerSurvival = 50;
  }

  // Slight randomness for realism
  passengerSurvival = Math.max(0, Math.min(100, passengerSurvival + (Math.random() * 10 - 5)));
  if (decision !== 'Hit Pedestrian') {
    pedestrianSurvival = Math.max(0, Math.min(100, pedestrianSurvival + (Math.random() * 6 - 3)));
  }

  return { passengerSurvival, pedestrianSurvival };
}

// ——— Step 5: Legal liability ———
function getLiability(mode, decision, passengerSurvival, pedestrianSurvival) {
  const pedestrianDies = pedestrianSurvival === 0;
  const passengerDies = passengerSurvival < 50;

  if (mode === 'passenger' && pedestrianDies) {
    return 'Manufacturer — Design Bias (Strict Liability Triggered)';
  }

  if (mode === 'utilitarian' && !pedestrianDies && !passengerDies) {
    return 'Shared Liability — No-Fault Insurance';
  }

  if (mode === 'utilitarian' && (pedestrianDies || passengerDies)) {
    return 'Shared Liability — Unavoidable Accident';
  }

  if (mode === 'pedestrian' && passengerDies) {
    return 'Manufacturer — Product Defect (Swerved Into Obstacle)';
  }

  if (pedestrianDies) {
    return 'Manufacturer — Partial Liability';
  }

  return 'Shared Liability — No-Fault';
}

// ——— Step 6: Public reaction index (0–100) ———
function getPublicTrust(passengerSurvival, pedestrianSurvival) {
  let publicTrust = 100;
  if (pedestrianSurvival === 0) publicTrust -= 40;
  else if (pedestrianSurvival < 50) publicTrust -= 20;
  if (passengerSurvival < 50) publicTrust -= 30;
  else if (passengerSurvival < 80) publicTrust -= 10;
  if (pedestrianSurvival === 100 && passengerSurvival >= 80) publicTrust += 20;
  return Math.max(0, Math.min(100, Math.round(publicTrust)));
}

function getSentiment(publicTrust) {
  if (publicTrust >= 75) return 'Positive — Public confidence maintained';
  if (publicTrust >= 50) return 'Mixed — Social media debate';
  return 'Negative — Social media outrage';
}

function getStockImpact(publicTrust) {
  if (publicTrust >= 70) return 'Neutral to +2%';
  if (publicTrust >= 50) return '−3% to −5%';
  return '−8% to −12% (simulated)';
}

// ——— Step 7: Animation ———
function resetAnimation() {
  animationStage.classList.remove('impact-shake');
  impactFlash.classList.remove('visible', 'obstacle-impact');
  if (obstacleEl) obstacleEl.classList.remove('hit');
  carEl.className = 'car';
  carEl.style.left = '';
  carEl.style.transform = '';
  carEl.style.bottom = '';
  carEl.style.transition = '';
  if (carBrakeLights) carBrakeLights.classList.remove('on');
  buildPedestrians(false);
  pedestriansWrap.querySelectorAll('.pedestrian').forEach((p) => {
    p.classList.remove('hit', 'crossing');
  });
}

function playAnimation(decision, callback) {
  resetAnimation();
  buildPedestrians(true); // Start with crossing animation
  carEl.classList.add('decision-straight');
  carEl.style.left = '40px';

  const run = () => {
    if (decision === 'Hit Pedestrian') {
      carEl.style.transition = 'left 0.9s cubic-bezier(0.25, 0.1, 0.3, 1)';
      carEl.style.left = '52%'; // Stops at pedestrian (in car's path)
      setTimeout(() => {
        animationStage.classList.add('impact-shake');
        impactFlash.classList.remove('obstacle-impact');
        impactFlash.classList.add('visible');
        pedestriansWrap.querySelectorAll('.pedestrian').forEach((p) => p.classList.add('hit'));
        setTimeout(() => {
          impactFlash.classList.remove('visible');
          animationStage.classList.remove('impact-shake');
          setTimeout(() => (callback && callback()), 300);
        }, 400);
      }, 950);
    } else if (decision === 'Swerve and Hit Obstacle') {
      carEl.classList.remove('decision-straight');
      carEl.classList.add('decision-swerve');
      carEl.style.transition = 'left 0.5s ease-out, transform 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)';
      carEl.style.left = '22%'; // Swerves up-left into obstacle
      carEl.style.transform = 'translate(-50%, -55px) rotate(-14deg)';
      carEl.style.bottom = '48px';
      setTimeout(() => {
        animationStage.classList.add('impact-shake');
        impactFlash.classList.add('visible', 'obstacle-impact');
        if (obstacleEl) obstacleEl.classList.add('hit');
        setTimeout(() => {
          impactFlash.classList.remove('visible', 'obstacle-impact');
          animationStage.classList.remove('impact-shake');
          if (obstacleEl) obstacleEl.classList.remove('hit');
          setTimeout(() => (callback && callback()), 300);
        }, 450);
      }, 700);
    }
  };

  requestAnimationFrame(() => setTimeout(run, 200));
}

// ——— Dashboard update ———
function modeDisplayName(mode) {
  const names = { utilitarian: 'Utilitarian', passenger: 'Passenger Priority', pedestrian: 'Pedestrian Priority' };
  return names[mode] || mode;
}

function updateDashboard(result) {
  const scenario = getScenario();
  const { mode, decision, passengerSurvival, pedestrianSurvival, liability, publicTrust, sentiment, stockImpact } = result;
  const { passengers, pedestrians } = scenario;

  document.getElementById('outcomeMode').textContent = modeDisplayName(mode);
  document.getElementById('outcomeDecision').textContent = decision;
  document.getElementById('outcomePassengers').textContent =
    `${Math.round(passengerSurvival) >= 50 ? passengers : 0}/${passengers} (${Math.round(passengerSurvival)}% survival)`;
  document.getElementById('outcomePedestrian').textContent =
    `${pedestrianSurvival > 0 ? pedestrians : 0}/${pedestrians} (${Math.round(pedestrianSurvival)}% survival)`;
  document.getElementById('outcomeSurvivors').textContent =
    `Passengers ${Math.round(passengerSurvival) >= 50 ? passengers : 0}/${passengers} · Pedestrians ${pedestrianSurvival > 0 ? pedestrians : 0}/${pedestrians}`;

  const passEl = document.getElementById('outcomePassengers');
  const pedEl = document.getElementById('outcomePedestrian');
  passEl.classList.toggle('alive', passengerSurvival >= 50);
  passEl.classList.toggle('dead', passengerSurvival < 50);
  pedEl.classList.toggle('alive', pedestrianSurvival > 0);
  pedEl.classList.toggle('dead', pedestrianSurvival === 0);

  document.getElementById('outcomeLiability').textContent = liability;
  document.getElementById('outcomePublicTrust').textContent = `Public Confidence Score: ${publicTrust}/100`;
  document.getElementById('publicBar').style.width = `${publicTrust}%`;
  document.getElementById('outcomeSentiment').textContent = sentiment;
  document.getElementById('outcomeStock').textContent = stockImpact;

  dashboardSection.classList.add('has-results');
  dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ——— Main: Run simulation ———
function runSimulation() {
  if (!selectedMode) return;

  processingOverlay.classList.add('visible');
  runBtn.disabled = true;

  const decision = getDecision(selectedMode);
  const { passengerSurvival, pedestrianSurvival } = simulateOutcome(decision);
  const liability = getLiability(selectedMode, decision, passengerSurvival, pedestrianSurvival);
  const publicTrust = getPublicTrust(passengerSurvival, pedestrianSurvival);
  const sentiment = getSentiment(publicTrust);
  const stockImpact = getStockImpact(publicTrust);

  lastResult = {
    mode: selectedMode,
    decision,
    passengerSurvival,
    pedestrianSurvival,
    liability,
    publicTrust,
    sentiment,
    stockImpact,
  };

  // Brief "AI processing" delay, then animate and show results
  setTimeout(() => {
    processingOverlay.classList.remove('visible');
    playAnimation(decision, () => {
      updateDashboard(lastResult);
      runBtn.disabled = false;
    });
  }, 1400);
}
