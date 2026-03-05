<script setup lang="ts">
import { ref, watch, unref } from 'vue'

const props = defineProps<{
  month: number
  year: number
}>()

const emit = defineEmits<{
  (e: 'update', filter: { month: number; year: number }): void
}>()

const localMonth = ref(props.month)
const localYear = ref(props.year)

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const currentYearInstance = new Date().getFullYear()

// 5 tahun ke belakang s/d 5 tahun ke depan
const minYear = currentYearInstance - 5
const maxYear = currentYearInstance + 5

const years = Array.from({ length: 11 }, (_, i) => ({
  value: minYear + i,
  label: (minYear + i).toString()
}))

watch([localMonth, localYear], () => {
  emit('update', { month: unref(localMonth), year: unref(localYear) })
})

function prevMonth() {
  if (localMonth.value === 1) {
    if (localYear.value > minYear) {
      localMonth.value = 12
      localYear.value--
    }
  } else {
    localMonth.value--
  }
}

function nextMonth() {
  if (localMonth.value === 12) {
    if (localYear.value < maxYear) {
      localMonth.value = 1
      localYear.value++
    }
  } else {
    localMonth.value++
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <UButton
      icon="i-lucide-chevron-left"
      color="neutral"
      variant="ghost"
      @click="prevMonth"
    />
    <div class="flex items-center gap-2">
      <USelect
        v-model="localMonth"
        :items="months"
        value-key="value"
        label-key="label"
        class="w-36"
      />
      <USelect
        v-model="localYear"
        :items="years"
        value-key="value"
        label-key="label"
        class="w-28"
      />
    </div>
    <UButton
      icon="i-lucide-chevron-right"
      color="neutral"
      variant="ghost"
      @click="nextMonth"
    />
  </div>
</template>
