<script setup lang="ts">
import { computed } from 'vue'

type Option = { label: string; value: number | undefined }

const props = defineProps<{
  warehouseItems: Option[]
  areaItems: Option[]
  selectedWarehouse: Option | undefined
  selectedArea: Option | undefined
  warehouseCategoryName: string
}>()

const emit = defineEmits<{
  'update:warehouse': [value: Option | undefined]
  'update:area': [value: Option | undefined]
}>()

const categoryText = computed(() => props.warehouseCategoryName || '-')
</script>

<template>
  <div class="flex flex-col gap-3 md:flex-row md:items-end">
    <div class="w-full md:w-72">
      <UFormField label="Warehouse">
        <USelectMenu
          :model-value="props.selectedWarehouse"
          :items="props.warehouseItems"
          placeholder="Select Warehouse"
          class="w-full"
          searchable
          clear
          @update:model-value="emit('update:warehouse', $event)"
        />
      </UFormField>
    </div>

    <div class="w-full md:w-72">
      <UFormField label="Warehouse Category">
        <UInput :model-value="categoryText" disabled class="w-full" />
      </UFormField>
    </div>

    <div class="w-full md:w-72">
      <UFormField label="Warehouse Area">
        <USelectMenu
          :model-value="props.selectedArea"
          :items="props.areaItems"
          placeholder="Select Area"
          class="w-full"
          searchable
          clear
          @update:model-value="emit('update:area', $event)"
        />
      </UFormField>
    </div>
  </div>
</template>