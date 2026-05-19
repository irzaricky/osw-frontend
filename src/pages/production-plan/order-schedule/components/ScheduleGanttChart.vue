<script setup lang="ts">
/**
 * ScheduleGanttChart.vue
 * Gantt Chart interaktif — hover tooltip menampilkan qty per hari
 * Sesuai panduan FR-09: Sub-tab Gantt Chart
 */

import { computed } from 'vue'
import type { POProduct } from '../../../../types/production-plan/order-schedule'

const props = defineProps<{
  products:  POProduct[]
  startDate: string
  endDate:   string
}>()

// ─── Kolom tanggal ────────────────────────────────────────────────────────────
const dateColumns = computed(() => {
  const cols: string[] = []
  if (!props.startDate || !props.endDate) return cols
  const cur = new Date(props.startDate)
  const end = new Date(props.endDate)
  while (cur <= end) {
    cols.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return cols
})

const isWeekend = (d: string) => {
  const day = new Date(d).getDay()
  return day === 0 || day === 6
}

// ─── Map jadwal per produk per hari ──────────────────────────────────────────
const scheduleMap = computed(() => {
  const map: Record<number, Record<string, { qty: number; utilPct: number | null; status: string; shift: string }>> = {}
  for (const product of props.products) {
    map[product.id] = {}
    for (const sch of product.schedules ?? []) {
      const d = sch.production_date?.split('T')[0]
      if (d) {
        map[product.id][d] = {
          qty:     sch.planned_qty_per_day,
          utilPct: sch.utilization_pct,
          status:  sch.status,
          shift:   sch.shift?.name ?? '—',
        }
      }
    }
  }
  return map
})

function cellColorClass(utilPct: number | null, status: string): string {
  if (status === 'Cancelled')   return 'cell-cancelled'
  if (status === 'Completed')   return 'cell-completed'
  if (status === 'In_Progress') return 'cell-inprogress'
  if (utilPct === null)         return 'cell-scheduled'
  if (utilPct > 100)            return 'cell-over'
  if (utilPct >= 80)            return 'cell-high'
  return 'cell-scheduled'
}

function buildTooltip(product: POProduct, d: string, cell: { qty: number; utilPct: number | null; status: string; shift: string }) {
  const dateStr = new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  return [
    `${product.part?.part_number} – ${product.part?.part_name ?? ''}`,
    `Tanggal: ${dateStr}`,
    `Shift: ${cell.shift}`,
    `Qty: ${cell.qty.toLocaleString('id-ID')} unit`,
    cell.utilPct !== null ? `Utilisasi: ${cell.utilPct}%` : 'Utilisasi: —',
    `Status: ${cell.status === 'In_Progress' ? 'In Progress' : cell.status}`,
  ].join('\n')
}

function fmtDayName(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { weekday: 'short' }).slice(0, 2)
}

// ─── Statistik ringkasan ──────────────────────────────────────────────────────
const totalScheduled = computed(() =>
  props.products.filter(p => (p.schedules?.length ?? 0) > 0).length
)

const overCapacityCount = computed(() => {
  let n = 0
  for (const pid in scheduleMap.value) {
    for (const d in scheduleMap.value[pid]) {
      if ((scheduleMap.value[pid][d].utilPct ?? 0) > 100) n++
    }
  }
  return n
})
</script>

<template>
  <div class="gantt-wrapper space-y-4">

    <!-- Summary quick stats -->
    <div class="flex flex-wrap gap-4 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-muted">Produk terjadwal:</span>
        <span class="font-semibold">{{ totalScheduled }} / {{ products.length }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-muted">Rentang:</span>
        <span class="font-mono text-xs font-semibold">{{ startDate }} → {{ endDate }}</span>
      </div>
      <div v-if="overCapacityCount > 0" class="flex items-center gap-1.5 text-error-600 dark:text-error-400">
        <UIcon name="i-lucide-alert-triangle" class="w-3.5 h-3.5" />
        <span class="font-semibold">{{ overCapacityCount }} slot melebihi kapasitas!</span>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap gap-4 text-xs">
      <div class="flex items-center gap-1.5"><span class="legend-dot cell-scheduled" />Terjadwal</div>
      <div class="flex items-center gap-1.5"><span class="legend-dot cell-high" />Utilisasi Tinggi (≥80%)</div>
      <div class="flex items-center gap-1.5"><span class="legend-dot cell-over" />Over Kapasitas (&gt;100%)</div>
      <div class="flex items-center gap-1.5"><span class="legend-dot cell-inprogress" />Sedang Berjalan</div>
      <div class="flex items-center gap-1.5"><span class="legend-dot cell-completed" />Selesai</div>
      <div class="flex items-center gap-1.5"><span class="legend-dot cell-cancelled" />Dibatalkan</div>
    </div>

    <!-- Gantt table -->
    <div class="gantt-scroll rounded-lg border border-default overflow-x-auto">
      <table class="gantt-table">
        <thead>
          <tr>
            <th class="gantt-col-product">
              <div class="text-xs font-semibold text-muted uppercase tracking-wide">Produk / Lini</div>
            </th>
            <!-- Month groups (opsional visual) -->
            <th
              v-for="d in dateColumns"
              :key="d"
              :class="['gantt-col-day', isWeekend(d) ? 'weekend' : '']"
              :title="new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })"
            >
              <div class="day-label">{{ fmtDayName(d) }}</div>
              <div class="date-label">{{ new Date(d).getDate() }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!products.length">
            <td :colspan="dateColumns.length + 1" class="gantt-empty">
              Tidak ada produk untuk ditampilkan.
            </td>
          </tr>
          <tr v-for="product in products" :key="product.id" class="gantt-row">
            <!-- Info produk -->
            <td class="gantt-col-product">
              <div class="product-info">
                <span class="part-number">{{ product.part?.part_number ?? '—' }}</span>
                <span class="line-name">{{ product.line?.name ?? '—' }}</span>
              </div>
              <!-- Delivery date indicator -->
              <div class="delivery-badge">
                <UIcon name="i-lucide-truck" class="w-2.5 h-2.5" />
                {{ new Date(product.delivery_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) }}
              </div>
            </td>

            <!-- Sel per hari -->
            <td
              v-for="d in dateColumns"
              :key="d"
              :class="['gantt-cell', isWeekend(d) ? 'weekend' : '']"
            >
              <!-- Blok jadwal -->
              <div
                v-if="scheduleMap[product.id]?.[d]"
                :class="['gantt-block', cellColorClass(scheduleMap[product.id][d].utilPct, scheduleMap[product.id][d].status)]"
                :title="buildTooltip(product, d, scheduleMap[product.id][d])"
              >
                <span class="block-qty">{{ scheduleMap[product.id][d].qty.toLocaleString('id-ID') }}</span>
              </div>

              <!-- Delivery date marker -->
              <div
                v-else-if="d === product.delivery_date?.split('T')[0]"
                class="delivery-marker"
                title="Tanggal Pengiriman"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-if="products.length && !products.some(p => p.schedules?.length)"
      class="rounded-lg border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-950/20 p-4 flex items-center gap-3">
      <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-warning-600 flex-shrink-0" />
      <p class="text-sm text-warning-700 dark:text-warning-400">
        Belum ada jadwal yang dibuat. Tambahkan jadwal melalui tab <strong>Daftar Produk</strong>.
      </p>
    </div>
  </div>
</template>

<style scoped>
.gantt-wrapper { overflow: hidden; }

/* Legend */
.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
  flex-shrink: 0;
}

/* Table */
.gantt-scroll { overflow-x: auto; }
.gantt-table  {
  border-collapse: collapse;
  min-width: 100%;
  font-size: 11px;
}
.gantt-table thead th {
  padding: 4px 2px;
  text-align: center;
  font-weight: 600;
  border-bottom: 2px solid var(--color-border, #e5e7eb);
  background: var(--color-elevated, #f9fafb);
  white-space: nowrap;
}

/* Sticky product column */
.gantt-col-product {
  min-width: 180px;
  max-width: 220px;
  padding: 6px 12px !important;
  text-align: left !important;
  position: sticky;
  left: 0;
  background: var(--color-surface, #fff);
  z-index: 2;
  border-right: 2px solid var(--color-border, #e5e7eb);
}

/* Day column */
.gantt-col-day {
  min-width: 44px;
  width: 44px;
  padding: 2px !important;
}
.gantt-col-day.weekend { background: var(--color-surface-2, #f3f4f6); }
.day-label  { font-size: 9px; color: var(--color-text-muted, #9ca3af); font-weight: 700; }
.date-label { font-size: 11px; font-weight: 800; }

/* Row */
.gantt-row:hover { background: var(--color-elevated, #f9fafb); }
.gantt-cell {
  padding: 3px 2px !important;
  vertical-align: middle;
  text-align: center;
  height: 48px;
  border-bottom: 1px solid var(--color-border, #f3f4f6);
}
.gantt-cell.weekend { background: var(--color-surface-2, #fafafa); }

/* Block */
.gantt-block {
  border-radius: 4px;
  padding: 2px 3px;
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.gantt-block:hover { opacity: 0.85; transform: scale(1.05); }
.block-qty  { font-size: 10px; font-weight: 800; color: white; white-space: nowrap; }

/* Product info */
.product-info { display: flex; flex-direction: column; gap: 1px; }
.part-number  { font-family: monospace; font-size: 11px; font-weight: 700; }
.line-name    { font-size: 10px; color: var(--color-text-muted, #9ca3af); }
.delivery-badge {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 9px;
  color: var(--color-text-muted, #9ca3af);
  margin-top: 2px;
}

/* Delivery date marker */
.delivery-marker {
  width: 4px;
  height: 30px;
  background: var(--color-warning, #f59e0b);
  margin: auto;
  border-radius: 2px;
  opacity: 0.7;
}

.gantt-empty {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted, #9ca3af);
  font-size: 12px;
}

/* Cell Colors */
.cell-scheduled  { background: var(--color-primary, #3b82f6); }
.cell-high       { background: var(--color-warning, #f59e0b); }
.cell-over       {
  background: var(--color-error, #ef4444);
  animation: pulse-over 1.5s ease-in-out infinite;
}
.cell-inprogress { background: var(--color-info, #0ea5e9); }
.cell-completed  { background: var(--color-success, #22c55e); }
.cell-cancelled  { background: var(--color-neutral, #9ca3af); }

@keyframes pulse-over {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.7; }
}
</style>