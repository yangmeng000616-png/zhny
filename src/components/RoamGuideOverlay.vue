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
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200"
  >
    <div class="w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-2xl shadow-slate-400/40 overflow-hidden text-slate-800">
      <!-- Header -->
      <div class="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div class="flex items-center gap-2 text-cyan-800 font-bold text-sm">
          <Mouse class="w-5 h-5 text-cyan-600" />
          <span>三维数字孪生场景交互操作指南</span>
        </div>
        <button
          @click="$emit('close')"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-5 space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Left Click Drag -->
          <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex items-start gap-3 shadow-xs">
            <div class="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 font-bold">
              <Move class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-slate-900">鼠标左键拖拽</div>
              <div class="text-slate-600 mt-1 leading-relaxed">
                360° 围绕大棚、河塘与种植区自由三维旋转观察角度。
              </div>
            </div>
          </div>

          <!-- Right Click Drag -->
          <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex items-start gap-3 shadow-xs">
            <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
              <Hand class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-slate-900">鼠标右键拖拽</div>
              <div class="text-slate-600 mt-1 leading-relaxed">
                平移场景视图，在园区道路、河塘和不同温室间平滑移动。
              </div>
            </div>
          </div>

          <!-- Scroll Wheel -->
          <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex items-start gap-3 shadow-xs">
            <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
              <ZoomIn class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-slate-900">滚轮滑动缩放</div>
              <div class="text-slate-600 mt-1 leading-relaxed">
                拉近拉远镜头，进入大棚内部观察作物，或拉远俯瞰园区全局。
              </div>
            </div>
          </div>

          <!-- Component Picking -->
          <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex items-start gap-3 shadow-xs">
            <div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold">
              <Mouse class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-slate-900">鼠标点击拾取</div>
              <div class="text-slate-600 mt-1 leading-relaxed">
                点击风机、天窗、水泵、水质浮标、补光灯或种植床，查看实时数字孪生状态。
              </div>
            </div>
          </div>
        </div>

        <div class="bg-cyan-50/80 p-3.5 rounded-xl border border-cyan-200 text-[11px] leading-relaxed text-slate-700">
          💡 <strong class="text-cyan-800">操作提示:</strong> 顶部导航栏提供了
          <span class="text-cyan-900 font-semibold">「园区全景」「生态河塘」「1#示范棚」「2#玻璃棚」「3#圆拱棚」「4#育苗厂」「室内漫游」</span>
          等快捷视角，并支持「X-Ray透视」「隐藏覆盖层」快速查看大棚钢结构骨架与内部排布。
        </div>

        <button
          @click="$emit('close')"
          class="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <Check class="w-4 h-4" />
          <span>我已了解，进入数字孪生</span>
        </button>
      </div>
    </div>
  </div>
</template>
