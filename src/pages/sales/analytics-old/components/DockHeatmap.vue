<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import type { DockUtilization, DockPlan } from '../../../../types/sales/analytics'

const props = defineProps<{
  dockUtilization: DockUtilization[]
  loading: boolean
}>()

// Store accordion expansion state by key `${dockId}-${dateStr}`
const expandedState = ref<{ [key: string]: boolean }>({})

function toggleExpanded(dockId: number, date: string) {
  const key = `${dockId}-${date}`
  expandedState.value[key] = !expandedState.value[key]
}

function isExpanded(dockId: number, date: string) {
  const key = `${dockId}-${date}`
  return !!expandedState.value[key]
}

function formatDateIndo(dateStr: string) {
  return dayjs(dateStr).locale('id').format('dddd, DD MMM YYYY')
}

function getGroupedPlans(plans?: DockPlan[]) {
  if (!plans || !plans.length) return []
  
  const groups: { [date: string]: { date: string; hours: number; plans: DockPlan[] } } = {}
  for (const p of plans) {
    if (!groups[p.scheduled_date]) {
      groups[p.scheduled_date] = {
        date: p.scheduled_date,
        hours: 0,
        plans: []
      }
    }
    groups[p.scheduled_date].hours += p.hours
    groups[p.scheduled_date].plans.push(p)
  }
  
  // Sort by date ascending
  const sorted = Object.values(groups).sort((a, b) => a.date.localeCompare(b.date))
  
  // Sort plans inside each group by time_start ascending
  for (const group of sorted) {
    group.plans.sort((a, b) => a.time_start.localeCompare(b.time_start))
  }
  
  return sorted
}

function getOccupancyPercent(hours: number) {
  const percent = (hours / 10) * 100
  return Math.min(Math.max(percent, 0), 100)
}

function getDockColorClass(hours: number) {
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

// Auto-expand the first date of each dock when data loads
watch(() => props.dockUtilization, (newVal) => {
  if (!newVal) return
  for (const dock of newVal) {
    const groups = getGroupedPlans(dock.plans)
    if (groups.length > 0) {
      const key = `${dock.id}-${groups[0].date}`
      if (expandedState.value[key] === undefined) {
        expandedState.value[key] = true
      }
    }
  }
}, { immediate: true })
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="font-semibold text-base">
            Utilisasi Loading Dock
          </h3>
          <p class="text-xs text-muted">
            Daily loading dock occupancy based on operational hours (08:00 - 18:00 WIB).
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
        class="border border-default rounded-xl p-5 bg-elevated/20"
      >
        <!-- Dock Main Info -->
        <div class="flex items-center justify-between border-b border-default pb-3 mb-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-anchor" class="w-5 h-5 text-primary" />
            <div>
              <h4 class="font-bold text-sm text-default-primary">
                {{ dock.name }}
              </h4>
              <p class="text-xs text-muted">
                Total Scheduled: {{ dock.plan_count }} Delivery Plans (SDP)
              </p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-[10px] uppercase font-bold tracking-wider text-muted">Akumulasi Jam</span>
            <p class="text-xs font-semibold text-default-primary">
              {{ dock.total_hours.toFixed(1) }} jam total
            </p>
          </div>
        </div>

        <!-- Grouped Dates Accordions -->
        <div v-if="getGroupedPlans(dock.plans).length" class="space-y-3">
          <div
            v-for="group in getGroupedPlans(dock.plans)"
            :key="group.date"
            class="border border-default rounded-lg overflow-hidden transition-all duration-300 bg-default/10"
          >
            <!-- Accordion Header Button -->
            <button
              type="button"
              class="w-full flex items-center justify-between p-3.5 hover:bg-default/20 transition-all text-left outline-none select-none"
              @click="toggleExpanded(dock.id, group.date)"
            >
              <div class="flex items-center gap-2.5">
                <UIcon name="i-lucide-calendar" class="w-4 h-4 text-muted-foreground" />
                <span class="text-xs font-semibold text-default-primary">
                  {{ formatDateIndo(group.date) }}
                </span>
              </div>

              <div class="flex items-center gap-3">
                <UBadge size="xs" variant="soft" color="primary">
                  {{ group.plans.length }} SDP
                </UBadge>
                <div
                  class="border rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm"
                  :class="getDockColorClass(group.hours).bg"
                >
                  {{ getOccupancyPercent(group.hours).toFixed(0) }}% Terisi
                </div>
                <UIcon
                  :name="isExpanded(dock.id, group.date) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="w-4 h-4 text-muted transition-transform duration-300"
                />
              </div>
            </button>

            <!-- Collapsible Accordion Content -->
            <div
              v-show="isExpanded(dock.id, group.date)"
              class="border-t border-default p-4 bg-background/50 space-y-4 transition-all duration-300"
            >
              <!-- Info Title & Status -->
              <div class="flex justify-between items-center text-xs">
                <span class="text-muted">Durasi Terisi Hari Ini:</span>
                <span class="font-bold text-default-primary">
                  {{ group.hours.toFixed(1) }} jam / 10 jam ({{ getDockColorClass(group.hours).label }})
                </span>
              </div>

              <!-- Occupancy Progress timeline Bar -->
              <div class="relative w-full h-8 bg-zinc-100 dark:bg-zinc-950/40 rounded-lg overflow-hidden border border-default flex items-center p-1 select-none shadow-inner">
                <!-- Active Occupancy Bar segment -->
                <div
                  class="h-6 rounded-md transition-all duration-500 ease-out flex items-center justify-end pr-3 text-[10px] font-black text-white shadow-md"
                  :class="getDockColorClass(group.hours).bar"
                  :style="{ width: `${getOccupancyPercent(group.hours)}%` }"
                >
                  <span v-if="getOccupancyPercent(group.hours) > 20">
                    {{ getOccupancyPercent(group.hours).toFixed(0) }}% Terisi
                  </span>
                </div>
                <!-- Centered fallback label if occupancy is low -->
                <div v-if="getOccupancyPercent(group.hours) <= 20" class="absolute inset-0 flex items-center justify-center text-[10px] font-black text-muted-foreground/80">
                  {{ getOccupancyPercent(group.hours).toFixed(0) }}% Terisi
                </div>
              </div>

              <!-- Interactive Timeline Hour axis guide ruler below -->
              <div class="flex justify-between text-[10px] text-muted-foreground px-2 font-mono select-none">
                <div class="flex flex-col items-center">
                  <span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>08:00</span>
                </div>
                <div class="flex flex-col items-center">
                  <span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>10:00</span>
                </div>
                <div class="flex flex-col items-center">
                  <span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>12:00</span>
                </div>
                <div class="flex flex-col items-center">
                  <span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>14:00</span>
                </div>
                <div class="flex flex-col items-center">
                  <span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>16:00</span>
                </div>
                <div class="flex flex-col items-center">
                  <span class="h-1.5 w-[1px] bg-zinc-300 dark:bg-zinc-800 mb-1" /><span>18:00</span>
                </div>
              </div>

              <!-- Individual Schedule List Details -->
              <div class="space-y-2 border-t border-default pt-3 mt-1">
                <span class="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1">Scheduled Plan Details:</span>
                <div
                  v-for="plan in group.plans"
                  :key="plan.id"
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 rounded bg-default/5 hover:bg-default/10 transition-colors border border-default text-xs gap-2"
                >
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-truck" class="w-3.5 h-3.5 text-primary" />
                    <span class="font-semibold text-default-primary">{{ plan.dp_number }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-muted-foreground font-mono">
                    <UIcon name="i-lucide-clock" class="w-3.5 h-3.5" />
                    <span>{{ plan.time_start.slice(0,5) }} - {{ plan.time_end.slice(0,5) }} WIB</span>
                    <UBadge
                      size="xs"
                      variant="subtle"
                      color="neutral"
                      class="ml-1 font-sans"
                    >
                      {{ plan.hours }} jam
                    </UBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center p-4 border border-dashed border-default rounded-lg">
          <span class="text-xs text-muted">No plans scheduled for this dock.</span>
        </div>
      </div>
    </div>
  </UCard>
</template>
/template>

