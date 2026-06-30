<script setup lang="ts">
import { computed } from 'vue'
import type { WorkOrder } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  wo: WorkOrder
}>()

function fmtDate(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtNum(n?: number | null) {
  if (n == null) return '-'
  return n.toLocaleString()
}

// ✅ FIXED: Ambil dari station terakhir (final output)
// Bukan aggregate semua stations
const qtyGood   = computed(() => props.wo.actual_quantity ?? props.wo.cumulative_qty_good ?? 0)
const qtyReject = computed(() => props.wo.cumulative_qty_reject ?? 0)
const qtyScrap  = computed(() => props.wo.cumulative_qty_scrap  ?? 0)
const progressPct = computed(() => props.wo.completion_pct ?? 0)

// ✅ NEW: Status info (station terakhir mana yang jadi final output)
const finalStationInfo = computed(() => {
  if (!props.wo.final_station_seq) return null
  const station = props.wo.stations?.find(s => s.sequence === props.wo.final_station_seq)
  return station
})

const progressBarColor = computed(() => {
  if (progressPct.value >= 100) return 'bg-success-500'
  if (progressPct.value >= 60)  return 'bg-primary-500'
  if (progressPct.value >= 30)  return 'bg-warning-500'
  return 'bg-error-400'
})

// ✅ NEW: Calculate efficiency
// Final good output / planned quantity
const efficiency = computed(() => {
  if (!props.wo.planned_quantity) return 0
  return Math.round((qtyGood.value / props.wo.planned_quantity) * 100)
})

// ✅ NEW: Calculate yield
// (Final good output) / (Final good + reject + scrap)
const yield_ = computed(() => {
  const total = qtyGood.value + qtyReject.value + qtyScrap.value
  if (total === 0) return 100
  return Math.round((qtyGood.value / total) * 100)
})
</script>

<template>
  <div class="bg-default border border-default rounded-xl overflow-hidden">

    <!-- Top info row -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-default border-b border-default">
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">PO Number</p>
        <p class="text-sm font-semibold font-mono">{{ wo.production_order?.po_number ?? '-' }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Work Date</p>
        <p class="text-sm font-semibold">{{ fmtDate(wo.work_date) }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Line</p>
        <p class="text-sm font-semibold">{{ wo.line?.name ?? '-' }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Shift</p>
        <p class="text-sm font-semibold">{{ wo.shift?.name ?? '-' }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Planned Qty</p>
        <p class="text-sm font-semibold font-mono">{{ fmtNum(wo.planned_quantity) }}</p>
      </div>
    </div>

    <!-- 
      ✅ FINAL OUTPUT ROW
      Menampilkan output dari station terakhir (Finished Goods Transfer)
      - Good: output final yang ready untuk dikirim
      - Reject: unit yang ditolak di station terakhir
      - Scrap: unit yang di-scrap di station terakhir
    -->
    <div class="grid grid-cols-3 divide-x divide-default border-b border-default">
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Good (OK) — Final Output</p>
        <p class="text-lg font-bold font-mono text-success-600">{{ fmtNum(qtyGood) }}</p>
        <p class="text-xs text-muted mt-1">
          Ready for shipment
        </p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Reject (NG) — Final Stage</p>
        <p
          class="text-lg font-bold font-mono"
          :class="qtyReject > 0 ? 'text-warning-600' : 'text-muted'"
        >
          {{ fmtNum(qtyReject) }}
        </p>
        <p class="text-xs text-muted mt-1">
          Quality fail at final check
        </p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Scrap — Final Stage</p>
        <p
          class="text-lg font-bold font-mono"
          :class="qtyScrap > 0 ? 'text-error-600' : 'text-muted'"
        >
          {{ fmtNum(qtyScrap) }}
        </p>
        <p class="text-xs text-muted mt-1">
          Beyond recovery
        </p>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="px-5 py-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-muted font-medium">Production Progress</span>
        <span class="text-xs font-semibold font-mono">{{ progressPct }}% Complete</span>
      </div>

      <UProgress
        :value="progressPct"
        size="md"
        :color="progressPct >= 100 ? 'success' : progressPct >= 60 ? 'primary' : progressPct >= 30 ? 'warning' : 'error'"
      />

      <div class="flex items-center justify-between mt-2">
        <span class="text-xs text-muted">
          {{ fmtNum(qtyGood) }} / {{ fmtNum(wo.planned_quantity) }} units
        </span>
        <span v-if="finalStationInfo" class="text-xs text-muted font-mono">
          Final station: {{ finalStationInfo.station?.name ?? 'S' + finalStationInfo.sequence }}
        </span>
      </div>
    </div>

    <!-- ✅ NEW: KPI Summary Row -->
    <div class="grid grid-cols-3 divide-x divide-default bg-elevated/50 border-t border-default">
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Efficiency</p>
        <div class="flex items-baseline gap-1">
          <span class="text-lg font-bold font-mono" :class="{
            'text-success-600': efficiency >= 90,
            'text-warning-600': efficiency >= 70,
            'text-error-600': efficiency < 70,
          }">{{ efficiency }}%</span>
        </div>
        <p class="text-xs text-muted mt-1">vs Planned Qty</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Yield (Final Stage)</p>
        <div class="flex items-baseline gap-1">
          <span class="text-lg font-bold font-mono" :class="{
            'text-success-600': yield_ >= 95,
            'text-warning-600': yield_ >= 85,
            'text-error-600': yield_ < 85,
          }">{{ yield_ }}%</span>
        </div>
        <p class="text-xs text-muted mt-1">Good / Total Processed</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Status</p>
        <UBadge 
          :label="wo.status.replace('_', ' ')"
          :color="wo.status === 'Completed' ? 'success' : wo.status === 'In_Progress' ? 'warning' : 'neutral'"
          variant="soft"
          class="w-fit"
        />
        <p class="text-xs text-muted mt-1">
          {{ 
            wo.status === 'Released' ? 'Ready to start' :
            wo.status === 'In_Progress' ? 'Running' :
            wo.status === 'Completed' ? 'Finished' :
            'Unknown'
          }}
        </p>
      </div>
    </div>
  </div>
</template>