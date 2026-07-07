<script setup lang="ts">
import { computed } from 'vue'
import type { WorkOrder } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  wo: WorkOrder
}>()

/**
 * ✅ NEW COMPONENT: Quality Metrics
 * 
 * Tujuan: Show upstream quality issues dan total loss
 * 
 * CONTEXT:
 * - Final Output dari Station 15 (good, reject, scrap)
 * - Upstream Issues dari Station 1-14 (berapa defect/scrap di proses)
 * - Total Loss = semua defect + scrap across production
 */

// Final output metrics (dari station terakhir)
const finalGood = computed(() => props.wo.actual_quantity ?? props.wo.cumulative_qty_good ?? 0)
const finalReject = computed(() => props.wo.cumulative_qty_reject ?? 0)
const finalScrap = computed(() => props.wo.cumulative_qty_scrap ?? 0)

// Upstream quality (stations 1-14)
const upstreamReject = computed(() => props.wo.upstream_total_reject ?? 0)
const upstreamScrap = computed(() => props.wo.upstream_total_scrap ?? 0)
const upstreamStationCount = computed(() => props.wo.upstream_station_count ?? 0)

// Total quality loss across entire production
const totalQualityLoss = computed(() => props.wo.total_quality_loss ?? 0)

// Overall metrics
const totalProcessed = computed(() => 
  finalGood.value + finalReject.value + finalScrap.value + upstreamReject.value + upstreamScrap.value
)

const overallYield = computed(() => {
  if (totalProcessed.value === 0) return 100
  return Math.round((finalGood.value / totalProcessed.value) * 100)
})

// Planned quantity
const plannedQty = computed(() => props.wo.planned_quantity ?? 0)

// Show/hide upstream details
const showUpstreamDetails = computed(() => upstreamReject.value > 0 || upstreamScrap.value > 0)
</script>

<template>
  <div class="space-y-3">
    <!-- 
      ✅ Quality Metrics Summary Bar
      Menampilkan:
      1. Upstream defect/scrap (dari station 1-14)
      2. Final stage defect/scrap (dari station 15)
      3. Total loss
      4. Overall yield (across entire production)
    -->
    <div class="bg-default border border-default rounded-xl overflow-hidden">
      
      <div class="px-5 py-3 border-b border-default">
        <h3 class="font-semibold text-sm flex items-center gap-2">
          <UIcon name="i-lucide-activity" class="w-4 h-4 text-primary" />
          Quality & Production Metrics
        </h3>
      </div>

      <!-- Upstream issues (jika ada) -->
      <div v-if="showUpstreamDetails" class="px-5 py-3 border-b border-default bg-orange-50/50 dark:bg-orange-950/20">
        <div class="space-y-2">
          <p class="text-xs text-muted font-semibold uppercase tracking-wide">
            Upstream Process Issues (Stations 1-{{ upstreamStationCount }})
          </p>
          <div class="grid grid-cols-2 gap-4">
            <div v-if="upstreamReject > 0" class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center flex-shrink-0">
                <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p class="text-2xl font-bold font-mono text-warning-600">{{ upstreamReject }}</p>
                <p class="text-xs text-muted">Rework/Rework</p>
              </div>
            </div>
            <div v-if="upstreamScrap > 0" class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-error-100 dark:bg-error-900/30 flex items-center justify-center flex-shrink-0">
                <UIcon name="i-lucide-trash-2" class="w-5 h-5 text-error-600" />
              </div>
              <div>
                <p class="text-2xl font-bold font-mono text-error-600">{{ upstreamScrap }}</p>
                <p class="text-xs text-muted">Scrap Lost</p>
              </div>
            </div>
          </div>
          <p class="text-xs text-orange-700 dark:text-orange-400 mt-2">
            <UIcon name="i-lucide-info" class="w-3 h-3 inline mr-1" />
            Issues resolved or discarded during production process
          </p>
        </div>
      </div>

      <!-- Main quality metrics grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-default border-t border-default">
        
        <!-- Total Loss -->
        <div class="px-4 py-3 space-y-0.5">
          <p class="text-xs text-muted">Total Quality Loss</p>
          <p 
            class="text-lg font-bold font-mono"
            :class="{
              'text-success-600': totalQualityLoss === 0,
              'text-warning-600': totalQualityLoss > 0 && totalQualityLoss <= plannedQty * 0.1,
              'text-error-600': totalQualityLoss > plannedQty * 0.1,
            }"
          >
            {{ totalQualityLoss }}
          </p>
          <p class="text-xs text-muted mt-1">
            ({{ totalQualityLoss > 0 ? ((totalQualityLoss / plannedQty) * 100).toFixed(1) : '0' }}% of planned)
          </p>
        </div>

        <!-- Overall Yield -->
        <div class="px-4 py-3 space-y-0.5">
          <p class="text-xs text-muted">Overall Yield</p>
          <p 
            class="text-lg font-bold font-mono"
            :class="{
              'text-success-600': overallYield >= 95,
              'text-warning-600': overallYield >= 85,
              'text-error-600': overallYield < 85,
            }"
          >
            {{ overallYield }}%
          </p>
          <p class="text-xs text-muted mt-1">
            Good / Total Produced
          </p>
        </div>

        <!-- Final Good Output -->
        <div class="px-4 py-3 space-y-0.5">
          <p class="text-xs text-muted">Final Good Output</p>
          <p class="text-lg font-bold font-mono text-success-600">
            {{ finalGood }}
          </p>
          <p class="text-xs text-muted mt-1">
            Ready to ship
          </p>
        </div>

        <!-- Planned vs Actual -->
        <div class="px-4 py-3 space-y-0.5">
          <p class="text-xs text-muted">Fulfillment</p>
          <p 
            class="text-lg font-bold font-mono"
            :class="{
              'text-success-600': finalGood >= plannedQty,
              'text-warning-600': finalGood > 0,
              'text-muted': finalGood === 0,
            }"
          >
            {{ finalGood }} / {{ plannedQty }}
          </p>
          <p class="text-xs text-muted mt-1">
            {{ finalGood > 0 ? `${((finalGood / plannedQty) * 100).toFixed(0)}%` : '0%' }}
          </p>
        </div>

      </div>

      <!-- Alert: if quality loss is high -->
      <div v-if="totalQualityLoss > plannedQty * 0.1" class="px-5 py-3 bg-error-50/50 dark:bg-error-950/20 border-t border-error-200 dark:border-error-800">
        <div class="flex items-start gap-2">
          <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-error-600 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-semibold text-error-700 dark:text-error-400">
              High Quality Loss Detected
            </p>
            <p class="text-xs text-error-700 dark:text-error-400 mt-0.5">
              {{ ((totalQualityLoss / plannedQty) * 100).toFixed(1) }}% of planned quantity is lost to defects/scrap.
              Review production process to identify root causes.
            </p>
          </div>
        </div>
      </div>

      <!-- Alert: if not fulfilling planned qty -->
      <div v-if="finalGood < plannedQty && finalGood > 0" class="px-5 py-3 bg-warning-50/50 dark:bg-warning-950/20 border-t border-warning-200 dark:border-warning-800">
        <div class="flex items-start gap-2">
          <UIcon name="i-lucide-info" class="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-semibold text-warning-700 dark:text-warning-400">
              Under-Production
            </p>
            <p class="text-xs text-warning-700 dark:text-warning-400 mt-0.5">
              Only {{ finalGood }} of {{ plannedQty }} units completed. 
              {{ plannedQty - finalGood }} remaining.
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>