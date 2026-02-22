<script setup lang="ts">
import { computed } from 'vue'
import type { WarehouseArea } from '../../../../types'

type BinCell = {
  name?: string
  assigned_part?: string
}

const props = defineProps<{
  area: WarehouseArea
  bins?: Record<string, BinCell>
}>()

const cols = computed(() => Number(props.area.total_cols || 0))
const rows = computed(() => Number(props.area.total_rows || 0))

function keyOf(r: number, c: number) {
  return `r${r}c${c}`
}

function cell(r: number, c: number): BinCell {
  return props.bins?.[keyOf(r, c)] ?? {}
}
</script>

<template>
  <div class="space-y-3">
    <div
      class="grid gap-0"
      :style="{ gridTemplateColumns: `48px repeat(${cols}, minmax(120px, 1fr))` }"
    >
      <div class="bg-slate-50 dark:bg-slate-900 border p-2 text-center text-sm font-semibold"></div>

      <div
        v-for="c in cols"
        :key="c"
        class="bg-slate-50 dark:bg-slate-900 border p-2 text-center text-sm font-semibold"
      >
        {{ c }}
      </div>
    </div>

    <
    <div class="space-y-0">
      <div
        v-for="r in rows"
        :key="r"
        class="grid gap-0"
        :style="{ gridTemplateColumns: `48px repeat(${cols}, minmax(120px, 1fr))` }"
      >
        
        <div class="bg-slate-50 dark:bg-slate-900 border p-2 text-center text-sm font-semibold">
          {{ r }}
        </div>

        
        <div
          v-for="c in cols"
          :key="`${r}-${c}`"
          class="border p-3 min-h-18 bg-amber-50/50 dark:bg-amber-950/20"
        >
          <div class="text-sm font-medium">
            {{ cell(r, c).name || 'No Name' }}
          </div>
          <div class="text-xs text-muted-foreground mt-1">
            {{ cell(r, c).assigned_part || 'No Assigned Part' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>