<script setup lang="ts">
import type { DockUtilization } from '../../../../types/sales/analytics'

defineProps<{
  dockUtilization: DockUtilization[]
  loading: boolean
}>()

function getOccupancyPercent(hours: number) {
  const percent = (hours / 10) * 100
  return Math.min(Math.max(percent, 0), 100)
}

function getDockColorClass(hours: number) {
  if (hours === 0) {
    return {
      bg: 'bg-zinc-800/10 border-zinc-700/20 text-zinc-500',
      label: 'Idle / Kosong',
      bar: 'bg-zinc-700/30'
    }
  }
  if (hours <= 4.0) {
    return {
      bg: 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400',
      label: 'Rendah / Optimal',
      bar: 'bg-emerald-500/40'
    }
  }
  if (hours <= 8.0) {
    return {
      bg: 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400',
      label: 'Sedang / Sibuk',
      bar: 'bg-indigo-500/40'
    }
  }
  return {
    bg: 'bg-amber-950/20 border-amber-500/20 text-amber-400',
    label: 'Padat / Penuh',
    bar: 'bg-amber-500/40'
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-base">Utilisasi Loading Dock</h3>
          <p class="text-xs text-muted">
            Tingkat occupancy loading dock berdasarkan jam operasional harian (08:00 - 18:00 WIB).
          </p>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-4 text-[10px] uppercase font-semibold">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
            <span class="text-muted">Idle</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            <span class="text-emerald-400">Optimal</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-500/50" />
            <span class="text-indigo-400">Sibuk</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500/50 animate-pulse" />
            <span class="text-amber-400">Padat</span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="loading && !dockUtilization.length" class="h-[200px] flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!dockUtilization.length" class="h-[120px] flex flex-col items-center justify-center text-center">
      <UIcon name="i-lucide-inbox" class="w-8 h-8 text-muted mb-2" />
      <span class="text-sm text-muted">Tidak ada data utilisasi loading dock tersedia.</span>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="dock in dockUtilization"
        :key="dock.id"
        class="border border-default rounded-xl p-4 transition-all duration-300 hover:border-primary/30 hover:bg-default/10"
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div>
            <h4 class="font-bold text-sm text-default-primary flex items-center gap-2">
              <UIcon name="i-lucide-anchor" class="w-4 h-4 text-primary" />
              {{ dock.name }}
            </h4>
            <p class="text-xs text-muted">
              Terjadwal {{ dock.plan_count }} Rencana Pengiriman (SDP)
            </p>
          </div>

          <div class="flex items-center gap-4 text-right">
            <div>
              <p class="text-xs text-muted">Durasi Terisi</p>
              <p class="text-sm font-bold">{{ dock.total_hours.toFixed(1) }} jam / 10 jam</p>
            </div>
            <div
              class="border rounded-lg px-2.5 py-1 text-xs font-semibold uppercase"
              :class="getDockColorClass(dock.total_hours).bg"
            >
              {{ getDockColorClass(dock.total_hours).label }} ({{ getOccupancyPercent(dock.total_hours).toFixed(0) }}%)
            </div>
          </div>
        </div>

        <!-- Custom Visual occupancy timeline bar -->
        <div class="relative w-full h-8 bg-zinc-950/40 rounded-lg overflow-hidden border border-zinc-800 flex items-center px-1">
          <!-- Active Segment -->
          <div
            class="h-6 rounded-md transition-all duration-500 ease-out flex items-center justify-end pr-3 text-[10px] font-bold text-white shadow-inner"
            :class="getDockColorClass(dock.total_hours).bar"
            :style="{ width: `${getOccupancyPercent(dock.total_hours)}%` }"
          >
            <span v-if="getOccupancyPercent(dock.total_hours) > 15">
              {{ getOccupancyPercent(dock.total_hours).toFixed(0) }}%
            </span>
          </div>

          <!-- Working Hours Ticks markers overlays -->
          <div class="absolute inset-0 flex justify-between pointer-events-none px-4 select-none">
            <span v-for="h in 11" :key="h" class="h-full w-[1px] bg-zinc-800/60 flex items-end pb-1 text-[8px] text-muted">
              {{ String(7 + h).padStart(2, '0') }}:00
            </span>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
