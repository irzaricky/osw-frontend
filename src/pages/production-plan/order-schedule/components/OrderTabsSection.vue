<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProductionOrder, POProduct, POSchedule } from '../../../../types/production-plan/order-schedule'

const props = defineProps<{
  order:       ProductionOrder | null
  isEditable:  boolean
  saving:      boolean
  fmtDate:     (d?: string | null) => string
  fmtNum:      (n?: number | null) => string
}>()

const emit = defineEmits<{
  'add-schedule':    [product: POProduct]
  'edit-schedule':   [product: POProduct, schedule: POSchedule]
  'delete-schedule': [product: POProduct, schedule: POSchedule]
  'delete-product':  [product: POProduct]
  'reschedule':      []
}>()

const activeTab = ref(0)

const tabs = [
  { label: 'Products & Schedules', icon: 'i-lucide-list' },
  { label: 'Gantt Chart',          icon: 'i-lucide-bar-chart-2' },
  { label: 'Reschedule Log',       icon: 'i-lucide-history' },
]

// ── Gantt chart data ─────────────────────────────────────────────────────────

const ganttData = computed(() => {
  if (!props.order?.products) return []
  return props.order.products.map((product) => {
    const schedules = product.schedules ?? []
    const dates = schedules.map((s) => s.production_date).sort()
    return {
      product,
      start:     dates[0] ?? null,
      end:       dates[dates.length - 1] ?? null,
      schedules,
    }
  })
})

const ganttDateRange = computed(() => {
  if (!props.order) return { min: null, max: null }
  return {
    min: props.order.production_start_date,
    max: props.order.production_end_date,
  }
})

function getDaysBetween(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const days: string[] = []
  let cur = new Date(s)
  while (cur <= e) {
    days.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

const ganttDays = computed(() => {
  if (!ganttDateRange.value.min || !ganttDateRange.value.max) return []
  return getDaysBetween(ganttDateRange.value.min, ganttDateRange.value.max)
})

// Color palette for gantt bars
const GANTT_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
]

function getBarColor(idx: number) {
  return GANTT_COLORS[idx % GANTT_COLORS.length]
}

function getScheduledQtyForDay(product: POProduct, date: string) {
  return product.schedules?.find((s) => s.production_date === date)?.planned_qty_per_day ?? null
}

function hasScheduleOnDay(product: POProduct, date: string) {
  return product.schedules?.some((s) => s.production_date === date) ?? false
}

function utilizationClass(pct?: number | null) {
  if (pct == null) return 'text-muted'
  if (pct > 90) return 'text-error-500 font-semibold'
  if (pct > 70) return 'text-warning-500'
  return 'text-success-500'
}
</script>

<template>
  <UCard>
    <template #header>
      <UTabs
        v-model:selected-index="activeTab"
        :items="tabs"
      />
    </template>

    <!-- ── TAB 0: Products & Schedules ────────────────────────────────── -->
    <div v-if="activeTab === 0" class="space-y-4">
      <div v-if="!order?.products?.length" class="text-center text-muted text-sm py-8">
        No products found for this Production Order.
      </div>

      <div
        v-for="(product, pIdx) in order?.products ?? []"
        :key="product.id"
        class="border border-default rounded-lg overflow-hidden"
      >
        <!-- Product Header -->
        <div class="flex items-center justify-between gap-4 px-4 py-3 bg-muted/30">
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-xs font-mono text-muted w-6 shrink-0">#{{ product.sequence }}</span>
            <div class="min-w-0">
              <p class="font-semibold text-sm truncate">
                {{ product.part?.part_name ?? '-' }}
                <span class="font-mono text-muted ml-1 text-xs">{{ product.part?.part_number }}</span>
              </p>
              <p class="text-xs text-muted">
                {{ product.customer?.name ?? '-' }} ·
                Line: {{ product.line?.name ?? '-' }} ·
                Delivery: {{ fmtDate(product.delivery_date) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4 shrink-0">
            <div class="text-right text-sm">
              <p class="text-muted text-xs">Planned / Scheduled</p>
              <p class="font-mono">
                {{ fmtNum(product.planned_qty) }}
                <span class="text-muted">/</span>
                <span :class="product.scheduled_qty >= product.planned_qty ? 'text-success-500' : 'text-warning-500'">
                  {{ fmtNum(product.scheduled_qty) }}
                </span>
              </p>
            </div>
            <div class="flex gap-1">
              <UButton
                v-if="isEditable"
                icon="i-lucide-plus"
                size="xs"
                color="primary"
                variant="soft"
                label="Add Schedule"
                @click="emit('add-schedule', product)"
              />
              <UButton
                v-if="isEditable"
                icon="i-lucide-trash-2"
                size="xs"
                color="error"
                variant="ghost"
                @click="emit('delete-product', product)"
              />
            </div>
          </div>
        </div>

        <!-- Schedule Table -->
        <div v-if="product.schedules?.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/20 text-muted text-xs">
              <tr>
                <th class="text-left px-4 py-2 font-medium">Date</th>
                <th class="text-left px-4 py-2 font-medium">Shift</th>
                <th class="text-right px-4 py-2 font-medium">Qty/Day</th>
                <th class="text-right px-4 py-2 font-medium">Capacity</th>
                <th class="text-right px-4 py-2 font-medium">Utilization</th>
                <th class="text-left px-4 py-2 font-medium">Status</th>
                <th class="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="sched in product.schedules"
                :key="sched.id"
                class="hover:bg-muted/10 transition-colors"
              >
                <td class="px-4 py-2 font-mono text-xs">{{ fmtDate(sched.production_date) }}</td>
                <td class="px-4 py-2">{{ sched.shift?.name ?? '-' }}</td>
                <td class="px-4 py-2 text-right font-mono">{{ fmtNum(sched.planned_qty_per_day) }}</td>
                <td class="px-4 py-2 text-right font-mono text-muted">
                  {{ sched.line_capacity_per_day ? fmtNum(sched.line_capacity_per_day) : '-' }}
                </td>
                <td class="px-4 py-2 text-right">
                  <span :class="utilizationClass(sched.utilization_pct)">
                    {{ sched.utilization_pct != null ? `${sched.utilization_pct.toFixed(1)}%` : '-' }}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <UBadge
                    :label="sched.status"
                    :color="sched.status === 'Completed' ? 'success' : sched.status === 'Cancelled' ? 'error' : sched.status === 'In_Progress' ? 'warning' : 'neutral'"
                    variant="soft"
                    size="xs"
                  />
                </td>
                <td class="px-4 py-2">
                  <div v-if="isEditable" class="flex justify-end gap-1">
                    <UButton
                      icon="i-lucide-pencil"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      @click="emit('edit-schedule', product, sched)"
                    />
                    <UButton
                      icon="i-lucide-trash-2"
                      size="xs"
                      color="error"
                      variant="ghost"
                      @click="emit('delete-schedule', product, sched)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="px-4 py-3 text-sm text-muted italic">
          No schedules yet.
          <button
            v-if="isEditable"
            class="text-primary hover:underline ml-1"
            @click="emit('add-schedule', product)"
          >
            Add one
          </button>
        </div>
      </div>
    </div>

    <!-- ── TAB 1: Gantt Chart ──────────────────────────────────────────── -->
    <div v-else-if="activeTab === 1" class="overflow-x-auto">
      <div v-if="!ganttDays.length" class="text-center text-muted text-sm py-8">
        No date range set.
      </div>
      <div v-else>
        <!-- Gantt header: dates -->
        <div class="flex min-w-max">
          <div class="w-56 shrink-0 px-3 py-2 text-xs text-muted font-medium border-b border-default">Product</div>
          <div
            v-for="day in ganttDays"
            :key="day"
            class="w-10 shrink-0 text-center border-b border-default py-2"
            :title="fmtDate(day)"
          >
            <p class="text-xs font-mono leading-none">{{ new Date(day).getDate() }}</p>
            <p class="text-xs text-muted leading-none">{{ new Date(day).toLocaleDateString('en-US', { month: 'short' }) }}</p>
          </div>
        </div>

        <!-- Gantt rows -->
        <div
          v-for="(item, idx) in ganttData"
          :key="item.product.id"
          class="flex min-w-max border-b border-default hover:bg-muted/10"
        >
          <!-- Product label -->
          <div class="w-56 shrink-0 px-3 py-2">
            <p class="text-xs font-semibold truncate">{{ item.product.part?.part_name ?? '-' }}</p>
            <p class="text-xs text-muted truncate">{{ item.product.customer?.name }}</p>
          </div>

          <!-- Day cells -->
          <div
            v-for="day in ganttDays"
            :key="day"
            class="w-10 shrink-0 flex items-center justify-center py-1 relative"
            :title="hasScheduleOnDay(item.product, day) ? `${getScheduledQtyForDay(item.product, day)} units` : ''"
          >
            <div
              v-if="hasScheduleOnDay(item.product, day)"
              :class="['w-8 h-6 rounded flex items-center justify-center text-white text-xs font-mono', getBarColor(idx)]"
            >
              {{ getScheduledQtyForDay(item.product, day) }}
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap gap-3 mt-4 px-3">
          <div
            v-for="(item, idx) in ganttData"
            :key="item.product.id"
            class="flex items-center gap-1.5 text-xs"
          >
            <span :class="['w-3 h-3 rounded-sm inline-block', getBarColor(idx)]"></span>
            <span class="text-muted">{{ item.product.part?.part_name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TAB 2: Reschedule Log ───────────────────────────────────────── -->
    <div v-else-if="activeTab === 2" class="space-y-3">
      <div v-if="isEditable" class="flex justify-end">
        <UButton
          icon="i-lucide-calendar-clock"
          color="warning"
          variant="soft"
          label="Reschedule PO"
          @click="emit('reschedule')"
        />
      </div>

      <div v-if="!order?.reschedule_logs?.length" class="text-center text-muted text-sm py-8">
        No reschedule history.
      </div>

      <div
        v-for="log in order?.reschedule_logs ?? []"
        :key="log.id"
        class="border border-default rounded-lg p-4 space-y-2"
      >
        <div class="flex items-center justify-between text-xs text-muted">
          <span>Rescheduled by <span class="font-medium text-default">{{ log.rescheduler?.email ?? '-' }}</span></span>
          <span>{{ fmtDate(log.rescheduled_at) }}</span>
        </div>
        <div class="flex flex-wrap gap-6 text-sm">
          <div>
            <p class="text-xs text-muted mb-0.5">Old Range</p>
            <p class="font-mono">{{ fmtDate(log.old_start_date) }} – {{ fmtDate(log.old_end_date) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">New Range</p>
            <p class="font-mono text-primary">{{ fmtDate(log.new_start_date) }} – {{ fmtDate(log.new_end_date) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted mb-0.5">Impacted WOs</p>
            <p class="font-semibold">{{ log.impacted_wo_count }}</p>
          </div>
        </div>
        <div class="text-sm text-muted border-t border-default pt-2 mt-2">
          <span class="font-medium text-default">Reason: </span>{{ log.reschedule_reason }}
        </div>
      </div>
    </div>
  </UCard>
</template>