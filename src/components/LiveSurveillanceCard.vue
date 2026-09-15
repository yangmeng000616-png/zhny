<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  Video,
  Camera,
  Maximize2,
  Minimize2,
  Crosshair,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Layers,
  Radio,
  Download,
  SlidersHorizontal,
  Compass,
} from 'lucide-vue-next';
import { surveillanceCamerasData } from '../data/surveillanceData';
import type { SurveillanceCameraConfig, GreenhouseMicroclimate, OutdoorWeatherSnapshot } from '../types/digitalTwin';

const props = defineProps<{
  selectedGreenhouseId: string;
  greenhousesMicroclimates?: Record<string, GreenhouseMicroclimate>;
  outdoorWeather?: OutdoorWeatherSnapshot;
  pondWater?: any;
  isSurveillanceFovActive?: boolean;
}>();

const emit = defineEmits<{
  (e: 'selectGreenhouse', ghId: string): void;
  (e: 'flyToCameraView', ghId: string): void;
  (e: 'toggleFovVisible', visible: boolean): void;
  (e: 'toggleAllFovs', showAll: boolean): void;
  (e: 'openStation', ghId: string): void;
}>();

// State
const isFovVisible = ref(props.isSurveillanceFovActive ?? true);
const showAllFovs = ref(false);
const showAiBoxes = ref(true);
const isFullscreen = ref(false);
const streamQuality = ref<'4K' | '1080P'>('4K');
const ptzPan = ref(0); // Offset in pixels
const ptzTilt = ref(0);
const ptzZoom = ref(1.0);
const snapshotToast = ref(false);

// Canvas Ref
const videoCanvasRef = ref<HTMLCanvasElement | null>(null);
let animFrameId: number | null = null;
let simulatedClock = ref('');

// Current Camera Config
const currentCamera = computed<SurveillanceCameraConfig>(() => {
  const matched = surveillanceCamerasData.find((c) => c.ghId === props.selectedGreenhouseId);
  return matched || surveillanceCamerasData[0];
});

// Current Environmental Telemetry for this camera's greenhouse
const currentEnvMetrics = computed(() => {
  const ghId = currentCamera.value.ghId;
  if (ghId === 'outdoor') {
    return {
      temp: props.outdoorWeather?.temperature?.toFixed(1) ?? '23.8',
      humidity: props.outdoorWeather?.humidity?.toFixed(1) ?? '54.2',
      co2: '418',
      light: (props.outdoorWeather?.solarRadiation ? props.outdoorWeather.solarRadiation * 55 : 45000).toFixed(0),
      label: '室外气象站',
    };
  }
  if (ghId === 'pond') {
    return {
      temp: props.pondWater?.temperature?.toFixed(1) ?? '22.4',
      humidity: '82.0',
      co2: '430',
      light: '38000',
      label: '生态河塘水质站',
    };
  }
  const micro = props.greenhousesMicroclimates?.[ghId];
  return {
    temp: micro?.airTemp?.toFixed(1) ?? '24.5',
    humidity: micro?.airHumidity?.toFixed(1) ?? '68.0',
    co2: micro?.co2?.toString() ?? '750',
    light: micro?.lightLux?.toString() ?? '32000',
    label: micro?.name ?? currentCamera.value.name,
  };
});

// Quick greenhouse options
const cameraOptions = [
  { id: 'gh_001', name: '1# 核心玻璃', icon: '1#' },
  { id: 'gh_002', name: '2# 茄果连栋', icon: '2#' },
  { id: 'gh_003', name: '3# 圆拱草莓', icon: '3#' },
  { id: 'gh_004', name: '4# 数字育苗', icon: '4#' },
  { id: 'gh_005', name: '5# 日光蓄热', icon: '5#' },
  { id: 'gh_006', name: '6# 鱼菜共生', icon: '6#' },
  { id: 'gh_007', name: '7# 垂直气雾', icon: '7#' },
  { id: 'gh_008', name: '8# 光伏一体', icon: '8#' },
  { id: 'pond', name: '生态河塘', icon: '塘' },
  { id: 'outdoor', name: '通量铁塔', icon: '塔' },
];

const selectCamera = (ghId: string) => {
  emit('selectGreenhouse', ghId);
  // Reset PTZ when changing cameras
  ptzPan.value = 0;
  ptzTilt.value = 0;
  ptzZoom.value = 1.0;
};

// PTZ Actions
const panLeft = () => { ptzPan.value = Math.max(ptzPan.value - 20, -120); };
const panRight = () => { ptzPan.value = Math.min(ptzPan.value + 20, 120); };
const tiltUp = () => { ptzTilt.value = Math.max(ptzTilt.value - 15, -80); };
const tiltDown = () => { ptzTilt.value = Math.min(ptzTilt.value + 15, 80); };
const zoomIn = () => { ptzZoom.value = Math.min(Number((ptzZoom.value + 0.25).toFixed(2)), 3.0); };
const zoomOut = () => { ptzZoom.value = Math.max(Number((ptzZoom.value - 0.25).toFixed(2)), 1.0); };
const resetPtz = () => {
  ptzPan.value = 0;
  ptzTilt.value = 0;
  ptzZoom.value = 1.0;
};

const applyPreset = (preset: { pan: number; tilt: number; zoom: number }) => {
  ptzPan.value = preset.pan * 2.5;
  ptzTilt.value = preset.tilt * 1.5;
  ptzZoom.value = preset.zoom;
};

const toggleFov = () => {
  isFovVisible.value = !isFovVisible.value;
  emit('toggleFovVisible', isFovVisible.value);
};

const toggleAllFovsMode = () => {
  showAllFovs.value = !showAllFovs.value;
  emit('toggleAllFovs', showAllFovs.value);
};

const flyToView = () => {
  emit('flyToCameraView', currentCamera.value.ghId);
};

const takeSnapshot = () => {
  snapshotToast.value = true;
  setTimeout(() => {
    snapshotToast.value = false;
  }, 2400);

  if (videoCanvasRef.value) {
    try {
      const link = document.createElement('a');
      link.download = `${currentCamera.value.code}_snapshot_${Date.now()}.png`;
      link.href = videoCanvasRef.value.toDataURL('image/png');
      link.click();
    } catch {
      // Ignored in sandboxed iframes
    }
  }
};

// -------------------------------------------------------------
// Canvas Virtual Video Simulation Loop
// -------------------------------------------------------------
let step = 0;

const drawSimulatedVideoFrame = () => {
  step++;
  const canvas = videoCanvasRef.value;
  if (!canvas) {
    animFrameId = requestAnimationFrame(drawSimulatedVideoFrame);
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Format real-time timestamp
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  simulatedClock.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${String(Math.floor(now.getMilliseconds() / 100))}`;

  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Apply PTZ Transformation
  ctx.translate(w / 2, h / 2);
  ctx.scale(ptzZoom.value, ptzZoom.value);
  ctx.translate(-w / 2 + ptzPan.value, -h / 2 + ptzTilt.value);

  // 1. Draw Greenhouse Interior Environment depending on ghId
  const ghId = currentCamera.value.ghId;

  // Background Gradient (Roof Glass & Daylight)
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (ghId === 'pond') {
    grad.addColorStop(0, '#0a2333');
    grad.addColorStop(0.5, '#0d4052');
    grad.addColorStop(1, '#07242e');
  } else if (ghId === 'outdoor') {
    grad.addColorStop(0, '#132845');
    grad.addColorStop(0.5, '#1e3a5f');
    grad.addColorStop(1, '#0e1f36');
  } else if (ghId === 'gh_004') {
    // Pink/purple nursery LED spectrum
    grad.addColorStop(0, '#2a1138');
    grad.addColorStop(0.5, '#40184b');
    grad.addColorStop(1, '#1b0a26');
  } else {
    // Modern high-tech glasshouse
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.45, '#132338');
    grad.addColorStop(1, '#0a1622');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(-100, -100, w + 200, h + 200);

  // 2. Structural Steel Trusses / Overhead Glass Architecture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;

  // Vanishing point in the center
  const vpX = w * 0.5;
  const vpY = h * 0.42;

  // Overhead ridge trusses
  for (let i = -3; i <= 3; i++) {
    const rx = vpX + i * (w * 0.22);
    ctx.beginPath();
    ctx.moveTo(vpX, vpY - 40);
    ctx.lineTo(rx, -40);
    ctx.stroke();
  }

  // Cross truss beams
  for (let y = 10; y < vpY; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 3. Ground Perspective Floor & Planting Rows / Facilities
  ctx.fillStyle = ghId === 'pond' ? 'rgba(6, 78, 90, 0.5)' : 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(-50, vpY, w + 100, h - vpY + 100);

  // Perspective row gutters
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 2;
  const rowOffsets = [-0.42, -0.26, -0.1, 0.1, 0.26, 0.42];
  rowOffsets.forEach((rx) => {
    ctx.beginPath();
    ctx.moveTo(vpX, vpY);
    ctx.lineTo(w * (0.5 + rx * 2.2), h + 40);
    ctx.stroke();
  });

  // 4. Crop Specific Animated Elements
  const time = step * 0.04;
  if (ghId === 'pond') {
    // Water ripples & reflection
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
    ctx.lineWidth = 1.5;
    for (let r = 1; r <= 5; r++) {
      const rad = ((time * 20 + r * 30) % 120) + 15;
      ctx.beginPath();
      ctx.ellipse(w * 0.48, h * 0.65, rad * 1.8, rad * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Water aeration fountain bubbles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 18; i++) {
      const bx = w * 0.48 + Math.sin(time * 3 + i) * 22;
      const by = h * 0.65 - ((time * 15 + i * 8) % 35);
      ctx.beginPath();
      ctx.arc(bx, by, (i % 3) + 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ghId === 'gh_004') {
    // Multi-layer nursery racks with bright magenta/cyan grow lights
    ctx.fillStyle = 'rgba(244, 114, 182, 0.25)';
    ctx.fillRect(w * 0.1, h * 0.35, w * 0.8, 14);
    ctx.fillRect(w * 0.1, h * 0.55, w * 0.8, 16);

    // Green seedling sprouts in trays
    ctx.fillStyle = '#4ade80';
    for (let sx = w * 0.12; sx < w * 0.88; sx += 14) {
      const sproutH = 6 + Math.sin(sx) * 2;
      ctx.fillRect(sx, h * 0.52 - sproutH, 4, sproutH);
      ctx.fillRect(sx + 3, h * 0.72 - sproutH, 4, sproutH);
    }
  } else {
    // High-wire Dutch tomato / cucumber vine canopy
    // Lush green foliage clusters
    const vinePositions = [
      { x: w * 0.22, y: h * 0.62, scale: 0.9 },
      { x: w * 0.4, y: h * 0.55, scale: 0.75 },
      { x: w * 0.6, y: h * 0.55, scale: 0.75 },
      { x: w * 0.78, y: h * 0.64, scale: 0.95 },
    ];

    vinePositions.forEach((v) => {
      // Leaves
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(v.x, v.y, 40 * v.scale, 28 * v.scale, Math.sin(time * 0.5) * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Tomato clusters (red fruits)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(v.x - 12 * v.scale, v.y + 16 * v.scale, 7 * v.scale, 0, Math.PI * 2);
      ctx.arc(v.x + 8 * v.scale, v.y + 20 * v.scale, 8 * v.scale, 0, Math.PI * 2);
      ctx.arc(v.x + 2 * v.scale, v.y + 30 * v.scale, 7.5 * v.scale, 0, Math.PI * 2);
      ctx.fill();

      // Yellow flower blossoms
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(v.x + 14 * v.scale, v.y - 12 * v.scale, 3.5 * v.scale, 0, Math.PI * 2);
      ctx.fill();
    });

    // Overhead high pressure irrigation mist shimmer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let m = 0; m < 30; m++) {
      const mx = ((time * 40 + m * 28) % w);
      const my = vpY + ((m * 17) % (h - vpY));
      ctx.beginPath();
      ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5. AI Detection Bounding Boxes (if enabled)
  if (showAiBoxes.value && currentCamera.value.aiDetections) {
    currentCamera.value.aiDetections.forEach((det, idx) => {
      const bx = (det.box[0] / 100) * w;
      const by = (det.box[1] / 100) * h;
      const bw = (det.box[2] / 100) * w;
      const bh = (det.box[3] / 100) * h;

      // Color scheme based on status
      const strokeCol = det.status === 'warning' ? '#f59e0b' : '#06b6d4';
      const bgCol = det.status === 'warning' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(6, 182, 212, 0.12)';

      // Box fill & border
      ctx.fillStyle = bgCol;
      ctx.fillRect(bx, by, bw, bh);

      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(bx, by, bw, bh);

      // Corner target brackets
      const cl = Math.min(10, bw * 0.2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke();

      // Label Tag
      const labelText = `[AI ${(det.confidence * 100).toFixed(1)}%] ${det.label}`;
      ctx.font = '10px "Inter", sans-serif';
      const textWidth = ctx.measureText(labelText).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(bx, by - 16, textWidth + 12, 16);
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by - 16, textWidth + 12, 16);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(labelText, bx + 6, by - 4);
    });
  }

  // Restore transform before OSD & scanline raster
  ctx.restore();

  // 6. Camera Scanline & CCTV Raster Effect
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  for (let sl = 0; sl < h; sl += 4) {
    ctx.fillRect(0, sl, w, 1.2);
  }

  // 7. Center Crosshair Reticle (Subtle)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 12, h / 2); ctx.lineTo(w / 2 + 12, h / 2);
  ctx.moveTo(w / 2, h / 2 - 12); ctx.lineTo(w / 2, h / 2 + 12);
  ctx.stroke();

  animFrameId = requestAnimationFrame(drawSimulatedVideoFrame);
};

onMounted(() => {
  animFrameId = requestAnimationFrame(drawSimulatedVideoFrame);
});

onUnmounted(() => {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
  }
});

watch(
  () => props.isSurveillanceFovActive,
  (val) => {
    if (val !== undefined) {
      isFovVisible.value = val;
    }
  }
);
</script>

<template>
  <div class="space-y-2.5">
    <!-- Camera Location Quick Selector Pills -->
    <div class="bg-slate-900/70 p-1.5 rounded-xl border border-white/10">
      <div class="text-[10px] text-slate-400 font-medium px-1 pb-1 flex items-center justify-between">
        <span class="flex items-center gap-1.5 text-slate-200">
          <Camera class="w-3 h-3 text-cyan-400" />
          <span>选择监控区域 / 摄像头:</span>
        </span>
        <span class="text-emerald-400 font-mono text-[9px] flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          10路全彩在线
        </span>
      </div>
      <div class="grid grid-cols-5 gap-1 pt-0.5">
        <button
          v-for="opt in cameraOptions"
          :key="opt.id"
          @click="selectCamera(opt.id)"
          :class="[
            'py-1 px-1 rounded-lg text-center transition-all cursor-pointer text-[10px] font-medium border flex flex-col items-center justify-center gap-0.5',
            selectedGreenhouseId === opt.id
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
              : 'bg-slate-950/50 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          ]"
          :title="opt.name"
        >
          <span class="font-mono text-[9px] opacity-75">{{ opt.icon }}</span>
          <span class="truncate max-w-full text-[9px]">{{ opt.name.split(' ')[1] || opt.name }}</span>
        </button>
      </div>
    </div>

    <!-- Active Camera Live Video Player Viewport -->
    <div class="relative bg-slate-950 rounded-xl border border-cyan-500/40 overflow-hidden shadow-lg group">
      <!-- Player Header OSD Bar -->
      <div class="absolute top-0 left-0 right-0 z-20 px-2 py-1 bg-gradient-to-b from-slate-950/90 to-transparent flex items-center justify-between text-[9px] font-mono text-slate-300 pointer-events-none">
        <div class="flex items-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-red-400 font-bold bg-red-500/20 px-1 py-0.2 rounded border border-red-500/30">
            <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
            REC
          </span>
          <span class="text-cyan-300 font-semibold truncate max-w-[120px] sm:max-w-[150px]">
            {{ currentCamera.code }}
          </span>
          <span class="hidden sm:inline text-slate-400 text-[8px]">
            {{ streamQuality }} UHD
          </span>
        </div>

        <div class="flex items-center gap-1.5 text-slate-300">
          <span class="text-emerald-400 text-[8px] bg-emerald-500/15 px-1 py-0.2 rounded border border-emerald-500/25">
            25 FPS
          </span>
          <span class="text-[9px] text-slate-300 font-mono">
            {{ simulatedClock.split(' ')[1] || '12:00:00' }}
          </span>
        </div>
      </div>

      <!-- Main HTML5 Surveillance Canvas -->
      <div class="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        <canvas
          ref="videoCanvasRef"
          width="480"
          height="270"
          class="w-full h-full object-cover block"
        ></canvas>

        <!-- PTZ Zoom & Pan Overlay Indicator -->
        <div
          v-if="ptzZoom > 1.0 || ptzPan !== 0 || ptzTilt !== 0"
          class="absolute bottom-2 right-2 z-20 px-1.5 py-0.5 rounded bg-slate-950/80 border border-white/20 text-[9px] font-mono text-cyan-300 pointer-events-none"
        >
          Zoom: {{ ptzZoom.toFixed(1) }}x | P:{{ ptzPan }} T:{{ ptzTilt }}
        </div>

        <!-- Snapshot Flash Toast -->
        <div
          v-if="snapshotToast"
          class="absolute inset-0 z-30 bg-white/40 flex items-center justify-center pointer-events-none transition-opacity"
        >
          <div class="bg-slate-900/90 text-emerald-300 border border-emerald-400/50 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xl flex items-center gap-1.5">
            <Sparkles class="w-4 h-4 text-emerald-400" />
            <span>监控抓拍已保存并存档</span>
          </div>
        </div>
      </div>

      <!-- Camera Bottom Telemetry & Quick Action Overlay Strip -->
      <div class="px-2 py-1 bg-slate-900/95 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-300 font-mono">
        <div class="flex items-center gap-2 truncate">
          <span class="text-slate-400 truncate">{{ currentCamera.name }}</span>
        </div>
        <div class="flex items-center gap-1 text-slate-200">
          <span class="text-amber-400">{{ currentEnvMetrics.temp }}℃</span>
          <span class="text-slate-500">/</span>
          <span class="text-blue-400">{{ currentEnvMetrics.humidity }}%</span>
          <span class="text-slate-500">/</span>
          <span class="text-emerald-400">{{ currentEnvMetrics.co2 }}ppm</span>
        </div>
      </div>
    </div>

    <!-- Surveillance Controls & 3D Linkage Toolbar -->
    <div class="bg-slate-900/70 p-2 rounded-xl border border-white/10 space-y-2">
      <!-- 1. 3D Scene FOV Linkage & Perspective Buttons -->
      <div class="grid grid-cols-2 gap-1.5">
        <button
          @click="toggleFov"
          :class="[
            'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer',
            isFovVisible
              ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
              : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200'
          ]"
          title="在三维大棚场景中标记并高亮当前摄像头的视野锥体范围"
        >
          <Eye v-if="isFovVisible" class="w-3.5 h-3.5 text-cyan-400" />
          <EyeOff v-else class="w-3.5 h-3.5 text-slate-500" />
          <span>{{ isFovVisible ? '3D视野范围: 已开启' : '3D视野范围: 已隐藏' }}</span>
        </button>

        <button
          @click="flyToView"
          class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[10px] font-semibold transition-all cursor-pointer"
          title="将三维主镜头直接对齐飞向该监控摄像头的安装机位与俯仰视角"
        >
          <Compass class="w-3.5 h-3.5 text-emerald-400" />
          <span>切换摄像头第一视角</span>
        </button>
      </div>

      <!-- 2. PTZ Pan/Tilt Directional Pad & Zoom Controller -->
      <div class="bg-slate-950/60 p-2 rounded-lg border border-white/5 flex items-center justify-between gap-2">
        <!-- PTZ D-Pad -->
        <div class="flex flex-col items-center">
          <div class="text-[9px] text-slate-400 font-mono mb-1">PTZ云台方向</div>
          <div class="grid grid-cols-3 gap-1 w-20">
            <div></div>
            <button
              @click="tiltUp"
              class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center justify-center cursor-pointer active:scale-95"
              title="向上仰视"
            >
              <ChevronUp class="w-3 h-3 text-cyan-400" />
            </button>
            <div></div>

            <button
              @click="panLeft"
              class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center justify-center cursor-pointer active:scale-95"
              title="向左转动"
            >
              <ChevronLeft class="w-3 h-3 text-cyan-400" />
            </button>
            <button
              @click="resetPtz"
              class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center justify-center cursor-pointer active:scale-95"
              title="复位回中"
            >
              <RotateCcw class="w-3 h-3 text-amber-400" />
            </button>
            <button
              @click="panRight"
              class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center justify-center cursor-pointer active:scale-95"
              title="向右转动"
            >
              <ChevronRight class="w-3 h-3 text-cyan-400" />
            </button>

            <div></div>
            <button
              @click="tiltDown"
              class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center justify-center cursor-pointer active:scale-95"
              title="向下俯视"
            >
              <ChevronDown class="w-3 h-3 text-cyan-400" />
            </button>
            <div></div>
          </div>
        </div>

        <!-- Zoom & Quality Controls -->
        <div class="flex-1 space-y-1.5 pl-2 border-l border-white/10">
          <div class="flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span>光学变倍</span>
            <span class="text-cyan-300 font-bold">{{ ptzZoom.toFixed(1) }}X</span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click="zoomOut"
              class="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer active:scale-95"
              title="缩小"
            >
              <ZoomOut class="w-3 h-3 text-cyan-400" />
              -
            </button>
            <button
              @click="zoomIn"
              class="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer active:scale-95"
              title="放大"
            >
              <ZoomIn class="w-3 h-3 text-cyan-400" />
              +
            </button>
          </div>

          <!-- AI Box & Snapshot Tools -->
          <div class="flex items-center gap-1 pt-0.5">
            <button
              @click="showAiBoxes = !showAiBoxes"
              :class="[
                'flex-1 py-1 px-1 rounded text-[9px] font-medium border flex items-center justify-center gap-1 transition-colors cursor-pointer',
                showAiBoxes
                  ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                  : 'bg-slate-800/80 border-white/10 text-slate-400'
              ]"
              title="开关AI目标识别与作物物候检测框"
            >
              <Crosshair class="w-2.5 h-2.5" />
              <span>AI识别: {{ showAiBoxes ? '开' : '关' }}</span>
            </button>
            <button
              @click="takeSnapshot"
              class="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-emerald-300 text-[9px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title="抓拍高清快照并下载"
            >
              <Camera class="w-2.5 h-2.5 text-emerald-400" />
              <span>抓拍</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 3. PTZ Presets -->
      <div v-if="currentCamera.ptzPresets && currentCamera.ptzPresets.length > 0" class="pt-0.5">
        <div class="text-[9px] text-slate-400 mb-1 flex items-center justify-between">
          <span>巡视预置位:</span>
          <span class="text-[8px] text-slate-500 font-mono">PTZ PRESETS</span>
        </div>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="pst in currentCamera.ptzPresets"
            :key="pst.id"
            @click="applyPreset(pst)"
            class="px-2 py-0.5 rounded-md bg-slate-950/60 hover:bg-slate-800 border border-white/10 text-[9px] text-slate-300 hover:text-cyan-300 font-medium cursor-pointer transition-colors"
          >
            {{ pst.name }}
          </button>
        </div>
      </div>

      <!-- 4. Camera Hardware Specs & Coverage Info -->
      <div class="bg-slate-950/40 p-1.5 rounded-lg border border-white/5 text-[9px] text-slate-400 space-y-0.5 font-mono">
        <div class="flex justify-between">
          <span>设备型号:</span>
          <span class="text-slate-300 truncate max-w-[170px]">{{ currentCamera.model }}</span>
        </div>
        <div class="flex justify-between">
          <span>安装位置:</span>
          <span class="text-slate-300 truncate max-w-[170px]">{{ currentCamera.mountLocation }}</span>
        </div>
        <div class="flex justify-between">
          <span>监控视场角 / 覆盖:</span>
          <span class="text-cyan-400">{{ currentCamera.fov }}° FOV · 约 {{ currentCamera.groundCoverageM2 }} m²</span>
        </div>
        <div class="flex justify-between">
          <span>视频流协议:</span>
          <span class="text-emerald-400">{{ currentCamera.streamProtocol }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
