<script setup lang="ts">
import { computed } from 'vue'
import type { WarehouseBin } from '../../../../services/master-data/warehouse-bin.service'

const props = defineProps<{
  totalCols: number
  totalRows: number
  bins: WarehouseBin[]
  loading: boolean
}>()

const emit = defineEmits<{
  clickBin: [bin: WarehouseBin]
}>()

const binMap = computed(() => {
  const m = new Map<string, WarehouseBin>()
  for (const b of props.bins || []) m.set(`${b.row_index}-${b.col_index}`, b)
  return m
})

function getBin(r: number, c: number) {
  return binMap.value.get(`${r}-${c}`)
}
</script>

<template>
  <div class="overflow-auto border border-default rounded-lg">
    <table class="min-w-full text-sm">
      <thead>
        <tr class="bg-elevated/50">
          <th class="p-2 border-b border-default w-12"></th>
          <th v-for="c in props.totalCols" :key="c" class="p-2 border-b border-default text-center min-w-36">
            {{ c }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="r in props.totalRows" :key="r">
          <td class="p-2 border-b border-default text-center bg-elevated/50 font-medium w-12">
            {{ r }}
          </td>

          <td
            v-for="c in props.totalCols"
            :key="`${r}-${c}`"
            class="p-2 border-b border-default align-top"
          >
            <div
              class="rounded-md border border-default p-2 min-h-16 cursor-pointer hover:bg-elevated/40"
              :class="getBin(r, c)?.is_dedicated ? 'bg-primary-50/30 dark:bg-primary-950/30' : ''"
              @click="getBin(r, c) && emit('clickBin', getBin(r, c)!)"
            >
              <div class="font-semibold">
                {{ getBin(r, c)?.bin_code || 'No Bin' }}
              </div>

              <div class="text-xs text-muted mt-1">
                <template v-if="getBin(r, c)?.is_dedicated">
                  {{ getBin(r, c)?.dedicated_part_number || 'No Part' }}
                  <span v-if="getBin(r, c)?.capacity != null"> • Cap: {{ getBin(r, c)?.capacity }}</span>
                </template>
                <template v-else>
                  No Assigned Part
                </template>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="props.loading" class="p-4 text-center text-sm text-muted">
      Loading bins...
    </div>
  </div>
</template>