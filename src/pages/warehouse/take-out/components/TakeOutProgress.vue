<script setup lang="ts">
defineProps<{
  total: number
  scanned: number
  progress: number
  totalPcs?: number
  scannedPcs?: number
}>()
</script>

<template>
  <div class="space-y-2">
    <div class="flex justify-between text-sm">
      <span class="text-muted">Kanban Progress</span>
      <span class="font-semibold">{{ scanned }}/{{ total }}</span>
    </div>

    <UProgress :model-value="progress" />

    <div
      v-if="totalPcs !== undefined && scannedPcs !== undefined"
      class="flex justify-between text-xs text-muted"
    >
      <span>PCS Progress</span>
      <span>{{ scannedPcs }}/{{ totalPcs }} pcs</span>
    </div>
  </div>
</template>