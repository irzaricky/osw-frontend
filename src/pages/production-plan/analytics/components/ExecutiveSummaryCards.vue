<script setup lang="ts">
defineProps<{
  executiveSummary: any
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <UCard>
      <p class="text-sm text-muted">
        Total Work Orders
      </p>

      <p class="text-3xl font-bold mt-2">
        {{ executiveSummary.total_work_orders || 0 }}
      </p>

      <p class="text-xs text-muted mt-2">
        Across {{ executiveSummary.total_production_orders || 0 }} production order(s)
      </p>
    </UCard>

    <UCard>
      <p class="text-sm text-muted">
        Achievement Rate
      </p>

      <p class="text-3xl font-bold mt-2 text-success">
        {{ executiveSummary.achievement_rate || 0 }}%
      </p>

      <UProgress :model-value="Number(executiveSummary.achievement_rate || 0)" color="success" class="mt-3" />

      <p class="text-xs text-muted mt-2">
        {{ executiveSummary.total_actual_qty || 0 }} of {{ executiveSummary.total_planned_qty || 0 }} pcs realized
      </p>
    </UCard>

    <UCard>
      <p class="text-sm text-muted">
        Defect Rate
      </p>

      <p class="text-3xl font-bold mt-2 text-error">
        {{ executiveSummary.defect_rate || 0 }}%
      </p>

      <p class="text-xs text-muted mt-2">
        {{ executiveSummary.total_good_qty || 0 }} good /
        {{ executiveSummary.total_reject_qty || 0 }} reject /
        {{ executiveSummary.total_scrap_qty || 0 }} scrap
      </p>
    </UCard>

    <UCard>
      <p class="text-sm text-muted">
        Avg Capacity Utilization
      </p>

      <p class="text-3xl font-bold mt-2">
        {{ executiveSummary.avg_capacity_utilization || 0 }}%
      </p>

      <p class="text-xs text-muted mt-2">
        {{ executiveSummary.total_downtime_minutes || 0 }} downtime minute(s)
        from {{ executiveSummary.total_issues || 0 }} issue(s)
      </p>
    </UCard>
  </div>
</template>
