<script setup lang="ts">
import { computed } from 'vue'
import type { GoodReceiptPart } from '../../../../types/warehouse/good-receipt'

const props = defineProps<{
  modelValue: GoodReceiptPart | undefined
  parts: GoodReceiptPart[]
}>()

const emit = defineEmits<{
  'update:modelValue': [ value: GoodReceiptPart | undefined ]
}>()

const selectedPartLabel = computed({
  get() {
    return props.modelValue
      ? getPartLabel(props.modelValue)
      : undefined
  },

  set(value: string | undefined) {
    const part = props.parts.find(
      part => getPartLabel(part) === value
    )
    emit('update:modelValue', part)
  }
})

function getPartLabel(
  part: GoodReceiptPart
) {
  return `${part.part_number || '-'} - ${part.part_name || '-'}`
}
</script>

<template>
  <UCard>
    <div class="space-y-2">
      <div>
        <div class="font-medium">
          Select Part
        </div>

        <div class="text-sm text-muted">
          Choose a part to view quantity and quality inspection details.
        </div>
      </div>

      <USelectMenu
        v-model="selectedPartLabel"
        :items="props.parts.map(getPartLabel)"
        class="w-full md:w-[420px]"
      >
        <template
          #item="{
            item
          }"
        >
          {{ item }}
        </template>
      </USelectMenu>
    </div>
  </UCard>
</template>