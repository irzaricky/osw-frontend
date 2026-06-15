<script setup lang="ts">
import { computed, type Ref } from 'vue'
import {
  DateFormatter,
  getLocalTimeZone,
  CalendarDate,
  DateValue
} from '@internationalized/date'

const props = defineProps<{
  clear?: boolean
  placeholder?: string
  isDateDisabled?: (date: DateValue) => boolean
}>()

const df = new DateFormatter('en-US', {
  dateStyle: 'medium'
})

const selected = defineModel<Date | undefined>() as Ref<Date | undefined>

const toCalendarDate = (date: Date) => {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
}

const calendarDate = computed({
  get: () => {
    return selected.value ? toCalendarDate(selected.value) : undefined
  },

  set: (value: CalendarDate | undefined) => {
    selected.value = value
      ? value.toDate(getLocalTimeZone())
      : undefined
  }
})

function clearSelection() {
  selected.value = undefined
}
</script>

<template>
  <UPopover :content="{ align: 'start' }" :modal="true">
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-calendar"
      class="group w-full h-8 justify-between rounded-md font-normal text-sm"
    >
      <span class="truncate">
        <template v-if="selected">
          {{ df.format(selected) }}
        </template>

        <template v-else>
          {{ placeholder || 'Select date' }}
        </template>
      </span>

      <template #trailing>
        <div class="flex items-center gap-2">
          <UIcon
            v-if="props.clear && selected"
            name="i-lucide-x"
            class="cursor-pointer text-dimmed size-4 hover:text-muted"
            @click.stop.prevent="clearSelection"
          />

          <UIcon
            name="i-lucide-chevron-down"
            class="shrink-0 text-dimmed size-5 group-data-[state=open]:rotate-180 transition-transform duration-200"
          />
        </div>
      </template>
    </UButton>

    <template #content>
      <UCalendar
        v-model="calendarDate"
        class="p-2"
        :is-date-disabled="props.isDateDisabled"
      />
    </template>
  </UPopover>
</template>