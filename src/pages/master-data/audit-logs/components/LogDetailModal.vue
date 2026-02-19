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

const allKeys = computed(() => {
  const oldKeys = props.oldData ? Object.keys(props.oldData) : []
  const newKeys = props.newData ? Object.keys(props.newData) : []
  return Array.from(new Set([...oldKeys, ...newKeys]))
})
</script>

<template>
  <UModal 
    :open="isOpen"
    title="Log Detail Comparison"
    description="View details of the changes made"
    @update:open="isOpen = $event"
  >
    <template #body>
      <div class="max-h-96 overflow-y-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" class="px-3 py-2">Field</th>
              <th scope="col" class="px-3 py-2">Old Value</th>
              <th scope="col" class="px-3 py-2">New Value</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="key in allKeys" 
              :key="key" 
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              :class="{ 'bg-yellow-50 dark:bg-yellow-900/10': props.oldData?.[key] !== props.newData?.[key] }"
            >
              <td class="px-3 py-2 font-medium">{{ key }}</td>
              <td class="px-3 py-2" :class="{'text-red-500': props.oldData?.[key] !== props.newData?.[key]}">
                {{ props.oldData?.[key] ?? '-' }}
              </td>
              <td class="px-3 py-2" :class="{'text-green-500': props.oldData?.[key] !== props.newData?.[key]}">
                {{ props.newData?.[key] ?? '-' }}
              </td>
            </tr>
             <tr v-if="allKeys.length === 0">
                <td colspan="3" class="px-3 py-2 text-center text-gray-500">No data changes recorded</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    
    <template #footer>
      <div class="flex justify-end w-full">
           <UButton label="Close" @click="isOpen = false" />
      </div>
    </template>
  </UModal>
</template>
