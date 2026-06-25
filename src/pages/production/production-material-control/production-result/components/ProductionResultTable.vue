<script setup lang="ts">
import { h, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
  data: any[]
  loading?: boolean
  page: number
  limit: number
}>()

const expanded = ref({})
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID')
}

function number(value: any) {
  return Number(value || 0).toLocaleString('id-ID')
}

const columns: TableColumn<any>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => (props.page - 1) * props.limit + row.index + 1
  },
  {
    accessorKey: 'wo_number',
    header: 'WO',
    cell: ({ row }) => row.original.wo_number || '-'
  },
  {
    accessorKey: 'production_date',
    header: 'Date',
    cell: ({ row }) => formatDate(row.original.production_date)
  },
  {
    accessorKey: 'shift_name',
    header: 'Shift',
    cell: ({ row }) => row.original.shift_name || '-'
  },
  {
    accessorKey: 'station_name',
    header: 'Station',
    cell: ({ row }) => row.original.station_name || '-'
  },
  {
    accessorKey: 'product_part_number',
    header: 'Product',
    cell: ({ row }) => row.original.product_part_number || '-'
  },
  {
    accessorKey: 'planning_qty',
    header: 'Planning'
  },
  {
    accessorKey: 'actual_qty',
    header: 'Actual'
  },
  {
    accessorKey: 'total_ok',
    header: 'OK',
    cell: ({ row }) =>
      h(UBadge, { color: 'success', variant: 'soft' }, () => row.original.total_ok)
  },
  {
    accessorKey: 'total_ng',
    header: 'NG',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: Number(row.original.total_ng || 0) > 0 ? 'error' : 'neutral',
          variant: 'soft'
        },
        () => row.original.total_ng
      )
  },
  {
    id: 'expand',
    cell: ({ row }) =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
        onClick: () => row.toggleExpanded()
      })
  }
]
</script>

<template>
  <UCard>
    <UTable v-model:expanded="expanded" :data="loading ? [] : data" :columns="columns" :loading="loading"
      class="w-full">
      <template #expanded="{ row }">
        <div class="border-b border-default p-4">
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">

            <!-- Production Info -->
            <UCard variant="subtle">
              <div class="space-y-4">
                <div>
                  <p class="text-sm font-semibold">Production Info</p>
                  <p class="text-xs text-muted">
                    Main production result information based on Production WO.
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p class="text-xs text-muted">WO Number</p>
                    <p class="font-medium">{{ row.original.wo_number }}</p>
                  </div>

                  <div>
                    <p class="text-xs text-muted">Date</p>
                    <p class="font-medium">{{ formatDate(row.original.production_date) }}</p>
                  </div>

                  <div>
                    <p class="text-xs text-muted">Shift</p>
                    <p class="font-medium">{{ row.original.shift_name }}</p>
                  </div>

                  <div>
                    <p class="text-xs text-muted">Station</p>
                    <p class="font-medium">{{ row.original.station_name }}</p>
                  </div>

                  <div class="col-span-2">
                    <p class="text-xs text-muted">Product</p>
                    <p class="font-medium">
                      {{ row.original.product_part_number }}
                      <span v-if="row.original.product_part_name">
                        - {{ row.original.product_part_name }}
                      </span>
                    </p>
                  </div>
                </div>

                <div class="rounded-lg border border-default p-3">
                  <p class="text-xs text-muted">Remarks</p>
                  <p class="text-sm mt-1">
                    {{ row.original.remarks || '-' }}
                  </p>
                </div>
              </div>
            </UCard>

            <!-- Result Summary -->
            <UCard variant="subtle">
              <div class="space-y-4">
                <div>
                  <p class="text-sm font-semibold">Result Summary</p>
                  <p class="text-xs text-muted">
                    Planning, Actual, OK and NG.
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-lg border border-default p-3">
                    <p class="text-xs text-muted">Planning</p>
                    <p class="text-xl font-bold">
                      {{ number(row.original.planning_qty) }}
                    </p>
                  </div>

                  <div class="rounded-lg border border-default p-3">
                    <p class="text-xs text-muted">Actual</p>
                    <p class="text-xl font-bold">
                      {{ number(row.original.actual_qty) }}
                    </p>
                  </div>

                  <div class="rounded-lg border border-success p-3">
                    <p class="text-xs text-muted">OK</p>
                    <p class="text-xl font-bold text-success">
                      {{ number(row.original.total_ok) }}
                    </p>
                  </div>

                  <div class="rounded-lg border border-error p-3">
                    <p class="text-xs text-muted">NG</p>
                    <p class="text-xl font-bold text-error">
                      {{ number(row.original.total_ng) }}
                    </p>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Used Materials -->
            <UCard variant="subtle">
              <div class="space-y-4">
                <div class="flex justify-between">
                  <div>
                    <p class="text-sm font-semibold">
                      Used Materials
                    </p>

                    <p class="text-xs text-muted">
                      Material labels used in this station.
                    </p>
                  </div>

                  <UBadge color="primary" variant="soft">
                    {{ row.original.used_materials?.length || 0 }}
                  </UBadge>
                </div>

                <div v-if="!(row.original.used_materials || []).length"
                  class="rounded-lg border border-default p-4 text-sm text-muted">
                  No material found.
                </div>

                <div v-else class="space-y-3 max-h-72 overflow-auto">
                  <div v-for="material in row.original.used_materials" :key="material.material_part_id"
                    class="rounded-lg border border-default p-3">
                    <p class="font-medium">
                      {{ material.material_part_number }}
                      -
                      {{ material.material_part_name }}
                    </p>

                    <div class="mt-2 flex flex-wrap gap-2">
                      <UBadge v-for="label in material.labels" :key="label.label_id" color="primary" variant="soft">
                        {{ label.label_number }}
                      </UBadge>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- NG Materials -->
            <UCard variant="subtle">
              <div class="space-y-4">
                <div class="flex justify-between">
                  <div>
                    <p class="text-sm font-semibold">
                      NG Materials
                    </p>

                    <p class="text-xs text-muted">
                      Material recorded as NG.
                    </p>
                  </div>

                  <UBadge color="error" variant="soft">
                    {{ number(row.original.total_ng) }} PCS
                  </UBadge>
                </div>

                <div v-if="!(row.original.ng_materials || []).length"
                  class="rounded-lg border border-default p-4 text-sm text-muted">
                  No NG material recorded.
                </div>

                <div v-else class="space-y-3">
                  <div v-for="material in row.original.ng_materials" :key="material.id"
                    class="rounded-lg border border-default p-3">
                    <div class="flex justify-between">
                      <div>
                        <p class="font-medium">
                          {{ material.material_part_number }}
                          -
                          {{ material.material_part_name }}
                        </p>

                        <p class="text-xs text-muted mt-1">
                          NG Label :
                          <b>{{ material.source_label_number }}</b>
                        </p>

                        <p class="text-xs text-muted">
                          {{ material.remarks || 'No remarks' }}
                        </p>
                      </div>

                      <UBadge color="error" variant="soft">
                        {{ material.qty_ng }} PCS
                      </UBadge>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

          </div>
        </div>
      </template>
    </UTable>

    <div v-if="!loading && !data.length" class="py-10 text-center text-muted">
      No production result found.
    </div>
  </UCard>
</template>