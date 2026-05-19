<script setup lang="ts">
/**
 * ResourceAllocation.vue
 * Tab 5 — Alokasi Resource: utilisasi per lini per hari
 * Sesuai panduan: "Tab 5: Alokasi Resource (utilisasi lini per hari)"
 */

import { computed } from 'vue'
import type { POProduct } from '../../../../types/production-plan/order-schedule'

const props = defineProps<{
  products:  POProduct[]
  startDate: string
  endDate:   string
}>()

// ─── Buat kolom tanggal ───────────────────────────────────────────────────────
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

const isWeekend = (d: string) => { const day = new Date(d).getDay(); return day === 0 || day === 6 }

function fmtColDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}
function fmtDayName(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { weekday: 'short' }).slice(0, 2)
}

// ─── Agregasi utilisasi per lini per hari ────────────────────────────────────
interface LineDay {
  totalQty:      number
  totalCapacity: number
  utilPct:       number | null
  scheduleCount: number
}

const lineNames = computed(() => {
  const names = new Map<number, string>()
  for (const p of props.products) {
    if (p.line_id && p.line) names.set(p.line_id, p.line.name)
  }
  return names
})

// Map: lineId → dateStr → { totalQty, totalCapacity, utilPct }
const allocationMap = computed(() => {
  const map: Record<number, Record<string, LineDay>> = {}

  for (const product of props.products) {
    const lineId = product.line_id
    if (!lineId) continue
    if (!map[lineId]) map[lineId] = {}

    for (const sch of product.schedules ?? []) {
      if (sch.status === 'Cancelled') continue
      const d = sch.production_date?.split('T')[0]
      if (!d) continue
      if (!map[lineId][d]) {
        map[lineId][d] = { totalQty: 0, totalCapacity: 0, utilPct: null, scheduleCount: 0 }
      }
      map[lineId][d].totalQty      += sch.planned_qty_per_day
      map[lineId][d].totalCapacity += sch.line_capacity_per_day ?? 0
      map[lineId][d].scheduleCount += 1
    }
  }

  // Hitung utilPct per lini per hari
  for (const lineId in map) {
    for (const d in map[lineId]) {
      const cell = map[lineId][d]
      if (cell.totalCapacity > 0) {
        cell.utilPct = Math.round((cell.totalQty / cell.totalCapacity) * 100)
      }
    }
  }

  return map
})

const lineIds = computed(() => Object.keys(allocationMap.value).map(Number))

function utilColor(pct: number | null): string {
  if (pct === null) return 'cell-empty'
  if (pct > 100)    return 'cell-over'
  if (pct >= 90)    return 'cell-critical'
  if (pct >= 70)    return 'cell-high'
  if (pct >= 40)    return 'cell-medium'
  return 'cell-low'
}

function utilTextColor(pct: number | null): string {
  if (pct === null) return ''
  if (pct > 100)    return 'text-white'
  if (pct >= 70)    return 'text-white'
  return 'text-white'
}

// ─── Summary stats ────────────────────────────────────────────────────────────
const overCapacityDays = computed(() => {
  let count = 0
  for (const lineId in allocationMap.value) {
    for (const d in allocationMap.value[lineId]) {
      const cell = allocationMap.value[lineId][d]
      if (cell.utilPct !== null && cell.utilPct > 100) count++
    }
  }
  return count
})

const avgUtilization = computed(() => {
  const cells: number[] = []
  for (const lineId in allocationMap.value) {
    for (const d in allocationMap.value[lineId]) {
      const pct = allocationMap.value[lineId][d].utilPct
      if (pct !== null) cells.push(pct)
    }
  }
  if (!cells.length) return null
  return Math.round(cells.reduce((a, b) => a + b, 0) / cells.length)
})

function fmtNum(n?: number | null) {
  if (n == null) return '—'
  return n.toLocaleString('id-ID')
}
</script>

<template>
  <div class="space-y-4">
    <!-- Summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="rounded-lg border border-default bg-elevated/50 p-3 space-y-0.5">
        <p class="text-xs text-muted font-medium uppercase tracking-wide">Lini Aktif</p>
        <p class="text-xl font-bold font-mono">{{ lineIds.length }}</p>
      </div>
      <div class="rounded-lg border border-default bg-elevated/50 p-3 space-y-0.5">
        <p class="text-xs text-muted font-medium uppercase tracking-wide">Hari Produksi</p>
        <p class="text-xl font-bold font-mono">{{ dateColumns.filter(d => !isWeekend(d)).length }}</p>
      </div>
      <div
        class="rounded-lg p-3 space-y-0.5"
        :class="overCapacityDays > 0
          ? 'border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-950/30'
          : 'border border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-950/30'"
      >
        <p class="text-xs font-medium uppercase tracking-wide"
          :class="overCapacityDays > 0 ? 'text-error-600 dark:text-error-400' : 'text-success-600 dark:text-success-400'">
          Hari Over Kapasitas
        </p>
        <p class="text-xl font-bold font-mono"
          :class="overCapacityDays > 0 ? 'text-error-700 dark:text-error-300' : 'text-success-700 dark:text-success-300'">
          {{ overCapacityDays }}
        </p>
      </div>
      <div class="rounded-lg border border-default bg-elevated/50 p-3 space-y-0.5">
        <p class="text-xs text-muted font-medium uppercase tracking-wide">Rata-rata Utilisasi</p>
        <p class="text-xl font-bold font-mono"
          :class="avgUtilization === null ? 'text-muted' :
            avgUtilization > 100 ? 'text-error-600' :
            avgUtilization >= 80 ? 'text-warning-600' : 'text-success-600'">
          {{ avgUtilization !== null ? `${avgUtilization}%` : '—' }}
        </p>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap gap-3 text-xs">
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded cell-low inline-block" />
        <span class="text-muted">&lt; 40% (Rendah)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded cell-medium inline-block" />
        <span class="text-muted">40–69% (Sedang)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded cell-high inline-block" />
        <span class="text-muted">70–89% (Tinggi)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded cell-critical inline-block" />
        <span class="text-muted">90–100% (Kritis)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded cell-over inline-block" />
        <span class="text-muted">&gt; 100% (Over!)</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!lineIds.length" class="flex flex-col items-center justify-center py-12 gap-3 text-muted">
      <UIcon name="i-lucide-layers" class="w-10 h-10" />
      <p class="text-sm">Belum ada alokasi resource. Tambahkan jadwal pada tab Daftar Produk.</p>
    </div>

    <!-- Alokasi table -->
    <div v-else class="overflow-x-auto rounded-lg border border-default">
      <table class="resource-table">
        <thead>
          <tr>
            <th class="resource-col-line">Lini Produksi</th>
            <th
              v-for="d in dateColumns"
              :key="d"
              :class="['resource-col-day', isWeekend(d) ? 'weekend' : '']"
              :title="fmtColDate(d)"
            >
              <div class="day-abbr">{{ fmtDayName(d) }}</div>
              <div class="day-num">{{ new Date(d).getDate() }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lineId in lineIds" :key="lineId" class="resource-row">
            <!-- Nama lini -->
            <td class="resource-col-line">
              <div class="line-label">
                <span class="line-name">{{ lineNames.get(lineId) ?? `Lini #${lineId}` }}</span>
              </div>
            </td>

            <!-- Sel per hari -->
            <td
              v-for="d in dateColumns"
              :key="d"
              :class="['resource-cell', isWeekend(d) ? 'weekend' : '']"
            >
              <div
                v-if="allocationMap[lineId]?.[d]"
                :class="['resource-block', utilColor(allocationMap[lineId][d].utilPct), utilTextColor(allocationMap[lineId][d].utilPct)]"
                :title="`Lini: ${lineNames.get(lineId)}\nTanggal: ${fmtColDate(d)}\nTotal Qty: ${fmtNum(allocationMap[lineId][d].totalQty)}\nKapasitas: ${fmtNum(allocationMap[lineId][d].totalCapacity)}\nUtilisasi: ${allocationMap[lineId][d].utilPct ?? 'N/A'}%\n${allocationMap[lineId][d].scheduleCount} jadwal`"
              >
                {{ allocationMap[lineId][d].utilPct !== null ? `${allocationMap[lineId][d].utilPct}%` : '—' }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail per lini table -->
    <div v-if="lineIds.length" class="space-y-2">
      <h4 class="text-sm font-semibold">Ringkasan Per Lini</h4>
      <div class="rounded-lg border border-default overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-elevated border-b border-default">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Lini</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Hari Aktif</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Total Qty</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Total Kapasitas</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Utilisasi Rata-rata</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Hari Over</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="lineId in lineIds" :key="lineId" class="hover:bg-elevated/50">
              <td class="px-4 py-3 font-semibold">{{ lineNames.get(lineId) ?? `Lini #${lineId}` }}</td>
              <td class="px-4 py-3 text-right font-mono">
                {{ Object.keys(allocationMap[lineId]).length }}
              </td>
              <td class="px-4 py-3 text-right font-mono">
                {{ fmtNum(Object.values(allocationMap[lineId]).reduce((s, c) => s + c.totalQty, 0)) }}
              </td>
              <td class="px-4 py-3 text-right font-mono text-muted">
                {{ fmtNum(Object.values(allocationMap[lineId]).reduce((s, c) => s + c.totalCapacity, 0)) }}
              </td>
              <td class="px-4 py-3 text-right">
                <UBadge
                  v-if="Object.values(allocationMap[lineId]).some(c => c.utilPct !== null)"
                  :label="`${Math.round(
                    Object.values(allocationMap[lineId]).filter(c => c.utilPct !== null).reduce((s, c) => s + (c.utilPct ?? 0), 0) /
                    Object.values(allocationMap[lineId]).filter(c => c.utilPct !== null).length
                  )}%`"
                  :color="
                    Math.round(
                      Object.values(allocationMap[lineId]).filter(c => c.utilPct !== null).reduce((s, c) => s + (c.utilPct ?? 0), 0) /
                      Object.values(allocationMap[lineId]).filter(c => c.utilPct !== null).length
                    ) > 100 ? 'error' :
                    Math.round(
                      Object.values(allocationMap[lineId]).filter(c => c.utilPct !== null).reduce((s, c) => s + (c.utilPct ?? 0), 0) /
                      Object.values(allocationMap[lineId]).filter(c => c.utilPct !== null).length
                    ) >= 80 ? 'warning' : 'success'
                  "
                  variant="subtle"
                  size="sm"
                />
                <span v-else class="text-muted text-xs">—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span
                  class="font-mono font-bold"
                  :class="Object.values(allocationMap[lineId]).filter(c => (c.utilPct ?? 0) > 100).length > 0
                    ? 'text-error-600 dark:text-error-400'
                    : 'text-success-600 dark:text-success-400'"
                >
                  {{ Object.values(allocationMap[lineId]).filter(c => (c.utilPct ?? 0) > 100).length }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─── Resource table ──────────────────────────────────────────────── */
.resource-table {
  border-collapse: collapse;
  font-size: 11px;
  min-width: 100%;
}
.resource-table thead th {
  padding: 4px 2px;
  text-align: center;
  font-weight: 600;
  border-bottom: 2px solid var(--color-border, #e5e7eb);
  white-space: nowrap;
}
.resource-col-line {
  min-width: 140px;
  max-width: 180px;
  padding: 6px 12px !important;
  text-align: left !important;
  position: sticky;
  left: 0;
  background: var(--color-surface, #fff);
  z-index: 2;
  border-right: 2px solid var(--color-border, #e5e7eb);
}
.resource-col-day {
  min-width: 42px;
  width: 42px;
  padding: 2px !important;
}
.resource-col-day.weekend { background: var(--color-surface-2, #f9fafb); }
.day-abbr {
  font-size: 9px;
  color: var(--color-text-muted, #9ca3af);
  font-weight: 600;
}
.day-num {
  font-size: 11px;
  font-weight: 700;
}
.resource-row:hover { background: var(--color-surface-2, #f9fafb); }
.resource-cell {
  padding: 3px 2px !important;
  vertical-align: middle;
  text-align: center;
  height: 40px;
  border-bottom: 1px solid var(--color-border, #f3f4f6);
}
.resource-cell.weekend { background: var(--color-surface-2, #f9fafb); }
.resource-block {
  border-radius: 4px;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}
.resource-block:hover { opacity: 0.85; }
.line-label { display: flex; flex-direction: column; gap: 1px; }
.line-name { font-size: 12px; font-weight: 600; }

/* Utilization colors */
.cell-empty    { background: transparent; }
.cell-low      { background: #22c55e; }
.cell-medium   { background: #3b82f6; }
.cell-high     { background: #f59e0b; }
.cell-critical { background: #ef4444; opacity: 0.85; }
.cell-over     {
  background: #b91c1c;
  animation: pulse-over 1.5s ease-in-out infinite;
}

@keyframes pulse-over {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.7; }
}
</style>