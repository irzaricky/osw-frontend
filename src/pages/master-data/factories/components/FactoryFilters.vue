<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

const props = defineProps<{
  search: string
}>()

const emit = defineEmits<{
  (e: 'update:search', value: string): void
}>()

const localSearch = ref(props.search)

const debouncedEmitSearch = useDebounceFn((value: string) => {
  emit('update:search', value)
}, 300)

watch(localSearch, (newValue) => {
  debouncedEmitSearch(newValue)
})

watch(() => props.search, (newValue) => {
  if (newValue !== localSearch.value) {
    localSearch.value = newValue
  }
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <UInput
      v-model="localSearch"
      icon="i-lucide-search"
      placeholder="Search factories..."
      class="w-full md:w-64 ml-auto"
    />
  </div>
</template>