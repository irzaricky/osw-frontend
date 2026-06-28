<script setup lang="ts">
import { computed } from 'vue'
import type { MdoDockUtilization } from '../../../../types/material/analytics'

const props = defineProps<{
  dockUtilization: MdoDockUtilization[]
  loading: boolean
}>()

const maxCount = computed(() => {
  if (!props.dockUtilization.length) return 1
  return Math.max(...props.dockUtilization.map(d => d.mdo_count), 1)
})

function getOccupancyPercent(count: number) {
  return Math.min(Math.max((count / maxCount.value) * 100, 0), 100)
}

function getColorClass(count: number) {
  if (count === 0) return { bar: 'bg-zinc-300 dark:bg-zinc-800', label: 'Idle', text: 'text-zinc-500' }
  const pct = (count / maxCount.value) * 100
  if (pct <= 40) return { bar: 'bg-emerald-500', label: 'Optimal', text: 'text-emerald-600 dark:text-emerald-400' }
  if (pct <= 80) return { bar: 'bg-indigo-500', label: 'Busy', text: 'text-indigo-600 dark:text-indigo-400' }
  return { bar: 'bg-amber-500', label: 'Full', text: 'text-amber-600 dark:text-amber-400' }
}
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h3 class="font-semibold text-base">
          Dock Utilization
        </h3>
        <p class="text-xs text-muted">
          Jumlah MDO terjadwal per dock (estimasi jam berdasarkan slot 30 menit)
        </p>
      </div>
    </template>

    <div v-if="loading && !dockUtilization.length" class="h-[200px] flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!dockUtilization.length" class="h-[120px] flex flex-col items-center justify-center text-center">
      <UIcon name="i-lucide-inbox" class="w-8 h-8 text-muted mb-2" />
      <span class="text-sm text-muted">Tidak ada data dock pada rentang ini.</span>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="dock in dockUtilization"
        :key="dock.dock_id"
        class="border border-default rounded-xl p-4 bg-elevated/20"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-anchor" class="w-4 h-4 text-primary" />
            <span class="text-sm font-semibold text-default-primary">{{ dock.dock_name || `Dock #${dock.dock_id}` }}</span>
          </div>
          <div class="text-right">
            <span class="text-xs font-semibold" :class="getColorClass(dock.mdo_count).text">
              {{ dock.mdo_count }} MDO &middot; ~{{ dock.estimated_hours }} jam
            </span>
          </div>
        </div>

        <div class="relative w-full h-5 bg-zinc-100 dark:bg-zinc-950/40 rounded-md overflow-hidden border border-default">
          <div
            class="h-full rounded-md transition-all duration-500 ease-out"
            :class="getColorClass(dock.mdo_count).bar"
            :style="{ width: `${getOccupancyPercent(dock.mdo_count)}%` }"
          />
        </div>
        <p class="text-[10px] text-muted mt-1">
          {{ getColorClass(dock.mdo_count).label }} relatif terhadap dock paling sibuk pada rentang ini
        </p>
      </div>
    </div>
  </UCard>
</template>