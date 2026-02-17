<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  to?: string
  icon?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <UBreadcrumb :items="items" class="mb-4" />
</template>
