<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  open: boolean
  oldData: Record<string, any> | null
  newData: Record<string, any> | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const columns = [
  { key: 'field', label: 'Field', accessorKey: 'field' },
  { key: 'oldValue', label: 'Old Value', accessorKey: 'oldValue' },
  { key: 'newValue', label: 'New Value', accessorKey: 'newValue' }
].map(c => ({ ...c, id: c.key }))

function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, any> {
  return Object.keys(obj).reduce((acc: Record<string, any>, k) => {
    const pre = prefix.length ? prefix + '.' : ''
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k))
    } else {
      acc[pre + k] = obj[k]
    }
    return acc
  }, {})
}

const comparisonRows = computed(() => {
  const oldDataFlat = props.oldData ? flattenObject(props.oldData) : {}
  const newDataFlat = props.newData ? flattenObject(props.newData) : {}

  const oldKeys = Object.keys(oldDataFlat)
  const newKeys = Object.keys(newDataFlat)
  const allKeys = Array.from(new Set([...oldKeys, ...newKeys])).sort()

  return allKeys.map(key => {
    const oldValue = oldDataFlat[key]
    const newValue = newDataFlat[key]
    const isChanged = oldValue !== newValue

    return {
      field: key,
      oldValue: oldValue ?? '-',
      newValue: newValue ?? '-',
      isChanged,
      class: isChanged ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
    }
  })
})
</script>

<template>
  <UModal 
    :open="isOpen"
    title="Log Detail Comparison"
    description="View details of the changes made"
    @update:open="isOpen = $event"
    :ui="{ body: 'p-0 sm:p-0', content: 'sm:max-w-5xl' }"
  >
    <template #body>
      <div class="max-h-96 overflow-y-auto">
        <UTable 
          :columns="columns" 
          :data="comparisonRows"
          class="w-full"
        >
          <template #oldValue-cell="{ row }">
            <span :class="{ 'text-red-500': row.original.isChanged }">
              {{ row.original.oldValue }}
            </span>
          </template>
          <template #newValue-cell="{ row }">
            <span :class="{ 'text-green-500': row.original.isChanged }">
              {{ row.original.newValue }}
            </span>
          </template>
        </UTable>
        
        <div v-if="comparisonRows.length === 0" class="p-4 text-center text-sm text-gray-500">
          No data changes recorded
        </div>
      </div>
    </template>
    
    <template #footer>
      <div class="flex justify-end w-full">
           <UButton label="Close" @click="isOpen = false" />
      </div>
    </template>
  </UModal>
</template>
