<script setup lang="ts">
const props = defineProps<{
  open: boolean
  data?: any
}>()
</script>

<template>
  <UModal :model-value="open">
    <div v-if="data" class="p-4">
      <h3 class="text-lg font-bold">
        {{ data.warehouse_code }}
      </h3>
    </div>
  </UModal>
</template>