<script setup lang="ts">
defineProps<{
  total: number
  placed: number
  progress: number
}>()
</script>

<template>
  <div class="space-y-2">
    <div class="flex justify-between text-sm">
      <span class="text-muted">Placed Area</span>
      <span class="font-semibold">{{ placed }}/{{ total }}</span>
    </div>

    <UProgress :model-value="progress" />
  </div>
</template>