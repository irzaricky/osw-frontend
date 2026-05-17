<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  conflict: {
    message: string
    conflicting_plan?: string
  } | null
}>()

const show = computed(() => !!props.conflict)
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="show && props.conflict"
      class="bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 dark:border-rose-500/30 rounded-xl p-4 shadow-sm flex items-start gap-4 relative overflow-hidden"
    >
      <!-- Premium Background Glow -->
      <div class="absolute -right-10 -top-10 w-24 h-24 bg-rose-500/10 rounded-full blur-xl" />
      
      <!-- Icon Wrapper -->
      <div class="p-2.5 bg-rose-500/20 dark:bg-rose-500/30 rounded-lg text-rose-600 dark:text-rose-400 shrink-0 shadow-inner">
        <UIcon name="i-lucide-shield-alert" class="w-5 h-5 animate-bounce" />
      </div>

      <!-- Warning Message -->
      <div class="space-y-1">
        <h4 class="font-bold text-sm text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
          <span>Loading Dock Booking Conflict</span>
          <UBadge
            color="error"
            variant="subtle"
            size="xs"
            class="rounded-full"
          >
            Blocked
          </UBadge>
        </h4>
        <p class="text-xs text-rose-700/90 dark:text-rose-400/90 leading-relaxed font-medium">
          {{ props.conflict.message }}
        </p>
        <p class="text-[10px] text-rose-600/70 dark:text-rose-500/80 mt-2">
          Conflict detected automatically by slot validation engine. Please select a different time slot, dock, or date to release the submit lock.
        </p>
      </div>
    </div>
  </Transition>
</template>
