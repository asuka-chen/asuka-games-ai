const video = document.getElementById("camera");
const canvas = document.getElementById("overlay");
const statusBadge = document.getElementById("statusBadge");
const clearBtn = document.getElementById("clearBtn");
const ctx = canvas.getContext("2d");

const trail = [];
const sparks = [];
let ringPulse = 0;
let handVisible = false;
let drawing = false;

const maxTrail = 140;
const ringRadius = 150;

function setStatus(message, isWarning = false) {
  statusBadge.textContent = message;
  statusBadge.style.borderColor = isWarning ? "rgba(255, 202, 122, 0.7)" : "rgba(111, 255, 233, 0.45)";
  statusBadge.style.color = isWarning ? "#ffcf8f" : "#95ffe8";
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
clearBtn.addEventListener("click", () => {
  trail.length = 0;
  sparks.length = 0;
  setStatus("已清空魔法阵，继续施法");
});

function addSpark(x, y) {
  sparks.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 3,
    vy: (Math.random() - 0.5) * 3,
    life: 1,
    size: 1.5 + Math.random() * 2.8,
    hue: 180 + Math.random() * 120,
  });
}

function updateEffects() {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.02;
    p.life -= 0.03;
    if (p.life <= 0) {
      sparks.splice(i, 1);
    }
  }

  for (let i = trail.length - 1; i >= 0; i--) {
    trail[i].life -= 0.012;
    if (trail[i].life <= 0) {
      trail.splice(i, 1);
    }
  }

  ringPulse += 0.05;
}

function drawMagicCircle(cx, cy) {
  ctx.save();
  const pulse = Math.sin(ringPulse) * 5;

  ctx.strokeStyle = "rgba(148, 108, 255, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, ringRadius + pulse, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(91, 232, 255, 0.65)";
  ctx.beginPath();
  ctx.arc(cx, cy, ringRadius * 0.72 - pulse * 0.2, 0, Math.PI * 2);
  ctx.stroke();

  const spikes = 12;
  for (let i = 0; i < spikes; i++) {
    const angle = ((Math.PI * 2) / spikes) * i + ringPulse * 0.25;
    const x1 = cx + Math.cos(angle) * (ringRadius * 0.76);
    const y1 = cy + Math.sin(angle) * (ringRadius * 0.76);
    const x2 = cx + Math.cos(angle) * (ringRadius + 18 + pulse);
    const y2 = cy + Math.sin(angle) * (ringRadius + 18 + pulse);

    ctx.strokeStyle = "rgba(202, 229, 255, 0.4)";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTrail() {
  if (trail.length < 2) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 1; i < trail.length; i++) {
    const prev = trail[i - 1];
    const curr = trail[i];
    const alpha = Math.max(0.08, curr.life);

    ctx.strokeStyle = `hsla(${200 + i * 0.6}, 100%, 68%, ${alpha})`;
    ctx.lineWidth = 2 + alpha * 5;
    ctx.shadowBlur = 20;
    ctx.shadowColor = `hsla(${240 + i * 0.3}, 100%, 65%, ${alpha})`;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSparks() {
  for (const p of sparks) {
    ctx.beginPath();
    ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.life})`;
    ctx.shadowBlur = 14;
    ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, ${p.life})`;
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.clientWidth * 0.5;
  const centerY = canvas.clientHeight * 0.52;
  drawMagicCircle(centerX, centerY);
  drawTrail();
  drawSparks();
  updateEffects();

  requestAnimationFrame(render);
}

function normalizedToCanvas(point) {
  return {
    x: canvas.clientWidth - point.x * canvas.clientWidth,
    y: point.y * canvas.clientHeight,
  };
}

function handleResults(results) {
  if (!results.multiHandLandmarks?.length) {
    handVisible = false;
    drawing = false;
    setStatus("未检测到手势，请将手放入画面", true);
    return;
  }

  handVisible = true;
  const landmarks = results.multiHandLandmarks[0];
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];

  const dx = indexTip.x - thumbTip.x;
  const dy = indexTip.y - thumbTip.y;
  const pinchDistance = Math.hypot(dx, dy);
  drawing = pinchDistance < 0.055;

  setStatus(drawing ? "绘制模式：施放中" : "检测到手势：张开手指可暂停");

  const pos = normalizedToCanvas(indexTip);
  if (drawing) {
    trail.push({ ...pos, life: 1 });
    if (trail.length > maxTrail) {
      trail.shift();
    }

    if (Math.random() > 0.6) {
      addSpark(pos.x, pos.y);
    }
  }
}

async function setup() {
  resizeCanvas();

  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6,
  });

  hands.onResults(handleResults);

  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 1280,
    height: 720,
  });

  try {
    await camera.start();
    setStatus("摄像头已启动：捏合拇指与食指开始绘制");
  } catch (error) {
    console.error(error);
    setStatus("摄像头启动失败，请检查权限或 HTTPS 环境", true);
  }

  requestAnimationFrame(render);
}

setup();
