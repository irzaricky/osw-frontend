<script setup lang="ts">
import type { DockUtilization } from '../../../../types/sales/analytics'

defineProps<{
  dockUtilization: DockUtilization[]
  loading: boolean
}>()

function getOccupancyPercent(dock: DockUtilization) {
  const hours = dock.avg_daily_hours !== undefined ? dock.avg_daily_hours : dock.total_hours
  const percent = (hours / 10) * 100
  return Math.min(Math.max(percent, 0), 100)
}

function getDockColorClass(dock: DockUtilization) {
  const hours = dock.avg_daily_hours !== undefined ? dock.avg_daily_hours : dock.total_hours
  if (hours === 0) {
    return {
      bg: 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500',
      label: 'Idle / Kosong',
      bar: 'bg-zinc-300 dark:bg-zinc-800'
    }
  }
  if (hours <= 4.0) {
    return {
      bg: 'bg-white dark:bg-zinc-900 border-emerald-400 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400',
      label: 'Rendah / Optimal',
      bar: 'bg-emerald-500'
    }
  }
  if (hours <= 8.0) {
    return {
      bg: 'bg-white dark:bg-zinc-900 border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400',
      label: 'Sedang / Sibuk',
      bar: 'bg-indigo-500'
    }
  }
  return {
    bg: 'bg-white dark:bg-zinc-900 border-amber-400 dark:border-amber-600 text-amber-600 dark:text-amber-400',
    label: 'Padat / Penuh',
    bar: 'bg-amber-500'
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="font-semibold text-base">Utilisasi Loading Dock</h3>
          <p class="text-xs text-muted">
            Tingkat occupancy loading dock berdasarkan jam operasional harian (08:00 - 18:00 WIB).
          </p>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap items-center gap-3 text-[10px] uppercase font-semibold">
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-zinc-400" />
            <span class="text-zinc-500">Idle (0%)</span>
          </div>
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-zinc-900 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-500" />
            <span class="text-emerald-600 dark:text-emerald-400">Optimal (&le; 40%)</span>
          </div>
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-zinc-900 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-indigo-500" />
            <span class="text-indigo-600 dark:text-indigo-400">Sibuk (&le; 80%)</span>
          </div>
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-400 dark:border-amber-600 bg-white dark:bg-zinc-900 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span class="text-amber-600 dark:text-amber-400">Padat (&gt; 80%)</span>
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

    <div v-else class="space-y-6">
      <div
        v-for="dock in dockUtilization"
        :key="dock.id"
        class="border border-default rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:bg-default/5 bg-elevated/20"
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h4 class="font-bold text-sm text-default-primary flex items-center gap-2">
              <UIcon name="i-lucide-anchor" class="w-4 h-4 text-primary" />
              {{ dock.name }}
            </h4>
            <p class="text-xs text-muted">
              Terjadwal {{ dock.plan_count }} Rencana Pengiriman (SDP)
            </p>
          </div>

          <div class="flex items-center gap-4 text-right justify-between md:justify-end">
            <div>
              <p class="text-[10px] text-muted uppercase font-bold tracking-wider">Durasi Terisi</p>
              <p class="text-xs font-semibold mt-0.5" v-if="dock.avg_daily_hours !== undefined">
                {{ dock.avg_daily_hours.toFixed(1) }} jam / 10 jam <span class="text-[10px] text-muted-foreground font-normal lowercase">(rata-rata / hari)</span>
              </p>
              <p class="text-xs font-semibold mt-0.5" v-else>
                {{ dock.total_hours.toFixed(1) }} jam / 10 jam
              </p>
            </div>
            <div
              class="border rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm"
              :class="getDockColorClass(dock).bg"
            >
              {{ getDockColorClass(dock).label }} ({{ getOccupancyPercent(dock).toFixed(0) }}%)
            </div>
          </div>
        </div>

        <!-- Occupancy Progress timeline Bar -->
        <div class="relative w-full h-8 bg-zinc-100 dark:bg-zinc-950/40 rounded-lg overflow-hidden border border-default flex items-center p-1 select-none shadow-inner">
          <!-- Active Occupancy Bar segment -->
          <div
            class="h-6 rounded-md transition-all duration-500 ease-out flex items-center justify-end pr-3 text-[10px] font-black text-white shadow-md"
            :class="getDockColorClass(dock).bar"
            :style="{ width: `${getOccupancyPercent(dock)}%` }"
          >
            <span v-if="getOccupancyPercent(dock) > 20">
              {{ getOccupancyPercent(dock).toFixed(0) }}% Terisi
            </span>
          </div>
          <!-- Centered fallback label if occupancy is low -->
          <div v-if="getOccupancyPercent(dock) <= 20" class="absolute inset-0 flex items-center justify-center text-[10px] font-black text-muted-foreground/80">
            {{ getOccupancyPercent(dock).toFixed(0) }}% Terisi
          </div>
        </div>

        <!-- Interactive Timeline Hour axis guide ruler below -->
        <div class="flex justify-between text-[10px] text-muted-foreground px-2 pt-2.5 font-mono select-none">
          <div class="flex flex-col items-center"><span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>08:00</span></div>
          <div class="flex flex-col items-center"><span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>10:00</span></div>
          <div class="flex flex-col items-center"><span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>12:00</span></div>
          <div class="flex flex-col items-center"><span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>14:00</span></div>
          <div class="flex flex-col items-center"><span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>16:00</span></div>
          <div class="flex flex-col items-center"><span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>18:00</span></div>
        </div>
      </div>
    </div>
  </UCard>
</template>
