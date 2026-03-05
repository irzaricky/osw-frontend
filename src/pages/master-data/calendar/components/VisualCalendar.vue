<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '../../../../types/master-data/calendar'

const props = defineProps<{
  month: number // 1-12
  year: number
  events: CalendarEvent[]
}>()

const emit = defineEmits<{
  (e: 'date-click', dateStr: string): void
  (e: 'event-click', event: CalendarEvent): void
}>()

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Generate calendar cells (padding empty days at start/end)
const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(props.year, props.month - 1, 1)
  const lastDay = new Date(props.year, props.month, 0)
  
  const startPadding = firstDay.getDay()
  const totalDays = lastDay.getDate()
  
  for (let i = 0; i < startPadding; i++) {
    days.push({ day: null, dateStr: '', event: null })
  }
  
  for (let d = 1; d <= totalDays; d++) {
    const mm = props.month.toString().padStart(2, '0')
    const dd = d.toString().padStart(2, '0')
    const dateStr = `${props.year}-${mm}-${dd}`
    
    // Find if event exists
    const event = props.events.find(e => e.date === dateStr)
    
    days.push({
      day: d,
      dateStr,
      event
    })
  }
  
  return days
})

function getEventClasses(event: CalendarEvent) {
  if (!event) return ''
  const code = event.type_calendar?.code || ''
  
  if (event.type_calendar?.is_holiday || code.includes('HOLIDAY')) {
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
  }
  if (code.includes('WEEKEND')) {
    return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
  }
  
  return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
}

function handleDateClick(dayObj: any) {
  if (!dayObj.dateStr) return
  if (dayObj.event) {
    emit('event-click', dayObj.event)
  } else {
    emit('date-click', dayObj.dateStr)
  }
}
</script>

<template>
  <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
    <!-- Header row -->
    <div class="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
      <div
        v-for="day in daysOfWeek"
        :key="day"
        class="py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-r last:border-r-0 border-gray-200 dark:border-gray-800"
      >
        {{ day }}
      </div>
    </div>
    
    <!-- Calendar Grid -->
    <div class="grid grid-cols-7">
      <div
        v-for="(dayObj, idx) in calendarDays"
        :key="idx"
        class="min-h-[140px] p-2 border-r border-b border-gray-100 dark:border-gray-800 relative transition-colors"
        :class="[
          !dayObj.day ? 'bg-gray-50/50 dark:bg-gray-800/20 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer',
          idx % 7 === 6 ? 'border-r-0' : ''
        ]"
        @click="handleDateClick(dayObj)"
      >
        <template v-if="dayObj.day">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ dayObj.day }}
          </span>
          
          <div v-if="dayObj.event" class="absolute inset-x-1 top-8 bottom-1">
            <div 
              class="h-full rounded-md border p-1.5 flex flex-col justify-between overflow-hidden text-xs shadow-sm transition-transform hover:scale-[1.02]"
              :class="getEventClasses(dayObj.event)"
            >
              <div class="font-bold truncate" :title="dayObj.event.type_calendar?.name">
                {{ dayObj.event.type_calendar?.name || 'Event' }}
              </div>
              <div v-if="dayObj.event.description" class="text-[10px] opacity-90 line-clamp-2 leading-tight mt-1" :title="dayObj.event.description">
                {{ dayObj.event.description }}
              </div>
            </div>
          </div>
          
          <!-- Hover quick add hint for empty days -->
          <div v-else class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">Click to add</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
