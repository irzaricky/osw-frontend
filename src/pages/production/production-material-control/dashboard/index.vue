<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import Breadcrumbs from '../../../../components/Breadcrumbs.vue'
import { useProductionMaterialDashboardStore } from '../../../../stores/production/production-material-dashboard.store'

const store = useProductionMaterialDashboardStore()
const { summary, loading } = storeToRefs(store)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production' },
  { label: 'Production Material Control' },
  { label: 'Dashboard' }
]

const okRate = computed(() => {
  const actual = Number(summary.value?.total_actual_qty || 0)
  const ok = Number(summary.value?.total_ok_qty || 0)

  return actual ? ((ok / actual) * 100).toFixed(1) : '0.0'
})

const ngRate = computed(() => {
  const actual = Number(summary.value?.total_actual_qty || 0)
  const ng = Number(summary.value?.total_ng_qty || 0)

  return actual ? ((ng / actual) * 100).toFixed(1) : '0.0'
})

const scrapRate = computed(() => {
  const replacement = Number(summary.value?.total_replacement_pcs || 0)
  const scrap = Number(summary.value?.total_scrap_pcs || 0)

  return replacement ? ((scrap / replacement) * 100).toFixed(1) : '0.0'
})

const bufferHealth = computed(() => {
  const total = Number(summary.value?.total_buffer_items || 0)
  const safe = Number(summary.value?.safe_buffer_items || 0)

  return total ? ((safe / total) * 100).toFixed(1) : '0.0'
})

const dashboardStatus = computed(() => {
  const needReplenishment = Number(summary.value?.need_replenishment_items || 0)
  const ng = Number(summary.value?.total_ng_qty || 0)

  if (needReplenishment > 0) {
    return {
      label: 'Need Attention',
      color: 'warning' as const,
      description: `${needReplenishment} buffer item(s) are below standard stock.`
    }
  }

  if (ng > 0) {
    return {
      label: 'Production Has NG',
      color: 'error' as const,
      description: `${ng} NG item(s) recorded in production result.`
    }
  }

  return {
    label: 'Healthy',
    color: 'success' as const,
    description: 'Production and buffer stock condition looks good.'
  }
})

onMounted(() => {
  store.fetchDashboard()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">
          Production Material Control
        </h1>
        <p class="text-sm text-muted">
          Overview of production result, buffer usage, replacement, and scrap crusher.
        </p>
      </div>

      <UButton
        icon="i-lucide-refresh-cw"
        label="Refresh"
        color="neutral"
        variant="outline"
        :loading="loading"
        @click="store.fetchDashboard()"
      />
    </div>

    <UCard>
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p class="text-sm text-muted">
            Current Status
          </p>
          <div class="flex items-center gap-2 mt-2">
            <h2 class="text-xl font-bold">
              {{ dashboardStatus.label }}
            </h2>

            <UBadge
              :color="dashboardStatus.color"
              variant="soft"
            >
              {{ dashboardStatus.label }}
            </UBadge>
          </div>

          <p class="text-sm text-muted mt-2">
            {{ dashboardStatus.description }}
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div>
            <p class="text-xs text-muted">
              OK Rate
            </p>
            <p class="text-lg font-bold text-success">
              {{ okRate }}%
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">
              NG Rate
            </p>
            <p class="text-lg font-bold text-error">
              {{ ngRate }}%
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">
              Scrap Rate
            </p>
            <p class="text-lg font-bold text-warning">
              {{ scrapRate }}%
            </p>
          </div>

          <div>
            <p class="text-xs text-muted">
              Buffer Health
            </p>
            <p class="text-lg font-bold text-success">
              {{ bufferHealth }}%
            </p>
          </div>
        </div>
      </div>
    </UCard>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted">
              Production Result
            </p>
            <p class="text-2xl font-bold mt-2">
              {{ summary?.total_production_result || 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Total production records.
            </p>
          </div>

          <UIcon name="i-lucide-factory" class="size-5 text-muted" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted">
              Actual Qty
            </p>
            <p class="text-2xl font-bold mt-2">
              {{ summary?.total_actual_qty || 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Total actual production output.
            </p>
          </div>

          <UIcon name="i-lucide-package-check" class="size-5 text-muted" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted">
              Total OK
            </p>
            <p class="text-2xl font-bold mt-2 text-success">
              {{ summary?.total_ok_qty || 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Good production output.
            </p>
          </div>

          <UIcon name="i-lucide-circle-check" class="size-5 text-success" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted">
              Total NG
            </p>
            <p class="text-2xl font-bold mt-2 text-error">
              {{ summary?.total_ng_qty || 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Recorded NG material/product.
            </p>
          </div>

          <UIcon name="i-lucide-circle-x" class="size-5 text-error" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted">
              Replacement PCS
            </p>
            <p class="text-2xl font-bold mt-2">
              {{ summary?.total_replacement_pcs || 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Material taken from buffer.
            </p>
          </div>

          <UIcon name="i-lucide-refresh-ccw" class="size-5 text-muted" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted">
              Scrap PCS
            </p>
            <p class="text-2xl font-bold mt-2 text-error">
              {{ summary?.total_scrap_pcs || 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Damaged material sent to crusher.
            </p>
          </div>

          <UIcon name="i-lucide-trash-2" class="size-5 text-error" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted">
              Scrap Weight
            </p>
            <p class="text-2xl font-bold mt-2 text-warning">
              {{ Number(summary?.total_scrap_weight || 0).toFixed(2) }} kg
            </p>
            <p class="text-xs text-muted mt-2">
              Total crusher material weight.
            </p>
          </div>

          <UIcon name="i-lucide-weight" class="size-5 text-warning" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-muted">
              Buffer Items
            </p>
            <p class="text-2xl font-bold mt-2">
              {{ summary?.total_buffer_items || 0 }}
            </p>
            <p class="text-xs text-muted mt-2">
              Total station buffer items.
            </p>
          </div>

          <UIcon name="i-lucide-boxes" class="size-5 text-muted" />
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <UCard>
        <p class="text-sm text-muted">
          OK Rate
        </p>
        <p class="text-2xl font-bold mt-2 text-success">
          {{ okRate }}%
        </p>
        <p class="text-xs text-muted mt-2">
          OK compared to actual production.
        </p>
      </UCard>

      <UCard>
        <p class="text-sm text-muted">
          NG Rate
        </p>
        <p class="text-2xl font-bold mt-2 text-error">
          {{ ngRate }}%
        </p>
        <p class="text-xs text-muted mt-2">
          NG compared to actual production.
        </p>
      </UCard>

      <UCard>
        <p class="text-sm text-muted">
          Scrap Rate
        </p>
        <p class="text-2xl font-bold mt-2 text-warning">
          {{ scrapRate }}%
        </p>
        <p class="text-xs text-muted mt-2">
          Scrap compared to replacement material.
        </p>
      </UCard>

      <UCard>
        <p class="text-sm text-muted">
          Buffer Health
        </p>
        <p class="text-2xl font-bold mt-2 text-success">
          {{ bufferHealth }}%
        </p>
        <p class="text-xs text-muted mt-2">
          Safe buffer compared to total buffer.
        </p>
      </UCard>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard>
        <p class="font-semibold">
          Buffer Stock Status
        </p>

        <div class="space-y-4 mt-4">
          <div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Safe Buffer</span>
              <span class="font-medium">
                {{ summary?.safe_buffer_items || 0 }}
              </span>
            </div>
            <UProgress
              :model-value="Number(bufferHealth)"
              color="success"
              class="mt-2"
            />
          </div>

          <div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Need Replenishment</span>
              <span class="font-medium text-warning">
                {{ summary?.need_replenishment_items || 0 }}
              </span>
            </div>
            <UProgress
              :model-value="
                summary?.total_buffer_items
                  ? (Number(summary?.need_replenishment_items || 0) / Number(summary?.total_buffer_items || 1)) * 100
                  : 0
              "
              color="warning"
              class="mt-2"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <p class="font-semibold">
          Production Quality
        </p>

        <div class="space-y-4 mt-4">
          <div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">OK Rate</span>
              <span class="font-medium text-success">
                {{ okRate }}%
              </span>
            </div>
            <UProgress
              :model-value="Number(okRate)"
              color="success"
              class="mt-2"
            />
          </div>

          <div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">NG Rate</span>
              <span class="font-medium text-error">
                {{ ngRate }}%
              </span>
            </div>
            <UProgress
              :model-value="Number(ngRate)"
              color="error"
              class="mt-2"
            />
          </div>
        </div>
      </UCard>
    </div>

    <UAlert
      v-if="!loading && summary?.need_replenishment_items > 0"
      color="warning"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="Need Replenishment"
      :description="`${summary.need_replenishment_items} buffer item(s) are below standard buffer stock.`"
    />
  </div>
</template>