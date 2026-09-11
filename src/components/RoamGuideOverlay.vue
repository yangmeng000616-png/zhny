<script setup lang="ts">
import { X, Mouse, Move, ZoomIn, Hand, Check } from 'lucide-vue-next';

defineProps<{
  isOpen: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
  >
    <div class="w-full max-w-lg bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] ring-1 ring-white/10 overflow-hidden text-slate-200">
      <!-- Header -->
      <div class="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2 text-cyan-300 font-bold text-sm">
          <Mouse class="w-5 h-5 text-cyan-400" />
          <span>三维数字孪生场景交互操作指南</span>
        </div>
        <button
          @click="$emit('close')"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-5 space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Left Click Drag -->
          <div class="bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex items-start gap-3 shadow-xs">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0 font-bold">
              <Move class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-slate-100">鼠标左键拖拽</div>
              <div class="text-slate-400 mt-1 leading-relaxed">
                360° 围绕大棚、河塘与种植区自由三维旋转观察角度。
              </div>
            </div>
          </div>

          <!-- Right Click Drag -->
          <div class="bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex items-start gap-3 shadow-xs">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0 font-bold">
              <Hand class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-slate-100">鼠标右键拖拽</div>
              <div class="text-slate-400 mt-1 leading-relaxed">
                平移场景视图，在园区道路、河塘和不同温室间平滑移动。
              </div>
            </div>
          </div>

          <!-- Scroll Wheel -->
          <div class="bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex items-start gap-3 shadow-xs">
            <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0 font-bold">
              <ZoomIn class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-slate-100">滚轮滑动缩放</div>
              <div class="text-slate-400 mt-1 leading-relaxed">
                拉近拉远镜头，进入大棚内部观察作物，或拉远俯瞰园区全局。
              </div>
            </div>
          </div>

          <!-- Component Picking -->
          <div class="bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex items-start gap-3 shadow-xs">
            <div class="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 font-bold">
              <Mouse class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-slate-100">鼠标点击拾取</div>
              <div class="text-slate-400 mt-1 leading-relaxed">
                点击风机、天窗、水泵、水质浮标、补光灯或种植床，查看实时数字孪生状态。
              </div>
            </div>
          </div>
        </div>

        <div class="bg-cyan-950/60 p-3.5 rounded-xl border border-cyan-500/30 text-[11px] leading-relaxed text-slate-300">
          💡 <strong class="text-cyan-300">操作提示:</strong> 顶部导航栏提供了
          <span class="text-cyan-200 font-semibold">「园区全景」「生态河塘」「1#示范棚」「2#玻璃棚」「3#圆拱棚」「4#育苗厂」「室内漫游」</span>
          等快捷视角，并支持「X-Ray透视」「隐藏覆盖层」快速查看大棚钢结构骨架与内部排布。视角切换后可通过鼠标自由旋转缩放，不会意外自动回跳。
        </div>

        <button
          @click="$emit('close')"
          class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 cursor-pointer border border-cyan-400/40"
        >
          <Check class="w-4 h-4" />
          <span>我已了解，进入数字孪生</span>
        </button>
      </div>
    </div>
  </div>
</template>
