<script setup lang="ts">
defineProps<{
  workOrderStatusChartOptions: any
  workOrderStatusChartSeries: any[]
  onTimeDeliveryChartOptions: any
  onTimeDeliveryChartSeries: any[]
  onTimeDelivery: {
    on_time: number
    late: number
    not_completed: number
  }
}>()
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Work Order Status
          </h3>
          <p class="text-xs text-muted">
            Distribution of work orders by current status.
          </p>
        </div>
      </template>

      <apexchart
        height="280"
        type="donut"
        :options="workOrderStatusChartOptions"
        :series="workOrderStatusChartSeries"
      />
    </UCard>

    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Production Order Completion Timeliness
          </h3>
          <p class="text-xs text-muted">
            Completed date compared with planned production end date.
          </p>
        </div>
      </template>

      <apexchart
        height="280"
        type="donut"
        :options="onTimeDeliveryChartOptions"
        :series="onTimeDeliveryChartSeries"
      />

      <div class="grid grid-cols-3 gap-2 mt-4 text-center">
        <div>
          <p class="text-xs text-muted">
            On Time
          </p>
          <p class="text-lg font-bold text-success">
            {{ onTimeDelivery.on_time || 0 }}
          </p>
        </div>

        <div>
          <p class="text-xs text-muted">
            Late
          </p>
          <p class="text-lg font-bold text-error">
            {{ onTimeDelivery.late || 0 }}
          </p>
        </div>

        <div>
          <p class="text-xs text-muted">
            Not Completed
          </p>
          <p class="text-lg font-bold text-warning">
            {{ onTimeDelivery.not_completed || 0 }}
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
