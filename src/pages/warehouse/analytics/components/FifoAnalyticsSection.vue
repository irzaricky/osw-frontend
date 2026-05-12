<script setup lang="ts">
defineProps<{
  fifoCompliance: {
    fifo_compliant: number
    fifo_override: number
    total_takeout: number
    fifo_compliance_rate: number
  }
  agingChartOptions: any
  agingChartSeries: number[]
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <UCard>
      <p class="text-sm text-muted">
        FIFO Compliance
      </p>

      <p class="text-3xl font-bold mt-2 text-success">
        {{ fifoCompliance.fifo_compliance_rate }}%
      </p>

      <UProgress
        :model-value="fifoCompliance.fifo_compliance_rate"
        color="success"
        class="mt-4"
      />

      <p class="text-xs text-muted mt-2">
        {{ fifoCompliance.fifo_compliant }}
        of
        {{ fifoCompliance.total_takeout }}
        take out transactions followed FIFO.
      </p>
    </UCard>

    <UCard>
      <p class="text-sm text-muted">
        FIFO Violations
      </p>

      <p class="text-3xl font-bold mt-2 text-error">
        {{ fifoCompliance.fifo_override }}
      </p>

      <p class="text-xs text-muted mt-4">
        Take out transactions not following FIFO recommendation.
      </p>
    </UCard>

    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Aging Distribution
          </h3>

          <p class="text-xs text-muted">
            Active stock aging composition.
          </p>
        </div>
      </template>

      <apexchart
        height="250"
        type="donut"
        :options="agingChartOptions"
        :series="agingChartSeries"
      />
    </UCard>
  </div>
</template>