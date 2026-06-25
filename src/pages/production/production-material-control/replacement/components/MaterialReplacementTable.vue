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

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID')
}

const columns: TableColumn<any>[] = [
  {
    id: 'no',
    header: 'No',
    cell: ({ row }) => (props.page - 1) * props.limit + row.index + 1
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => formatDateTime(row.original.created_at)
  },
  {
    accessorKey: 'station_name',
    header: 'Station',
    cell: ({ row }) => row.original.station_name || '-'
  },
  {
    accessorKey: 'part_number',
    header: 'Material',
    cell: ({ row }) => row.original.part_number || '-'
  },
  {
    accessorKey: 'part_name',
    header: 'Material Name',
    cell: ({ row }) => row.original.part_name || '-'
  },
  {
    accessorKey: 'qty_replacement',
    header: 'Qty Replacement',
    cell: ({ row }) =>
      h(UBadge, { color: 'warning', variant: 'soft' }, () => `${row.original.qty_replacement} PCS`)
  },
  {
    accessorKey: 'replacement_reason',
    header: 'Reason',
    cell: ({ row }) => row.original.replacement_reason || '-'
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
  <div class="px-4 pb-5">
    <div class="rounded-xl border border-default bg-elevated/40 p-5">
      <!-- ===== Row 1 ===== -->
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <!-- Replacement Info -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 border-b border-default pb-3">
            <UIcon name="i-lucide-info" class="size-5 text-primary" />
            <h4 class="text-sm font-semibold">Replacement Info</h4>
          </div>

          <div class="space-y-3 text-sm">
            <div class="grid grid-cols-[140px_10px_1fr] gap-2">
              <span class="text-muted">Production Result ID</span>
              <span>:</span>
              <span>{{ row.original.production_result_id }}</span>
            </div>

            <div class="grid grid-cols-[140px_10px_1fr] gap-2">
              <span class="text-muted">Date</span>
              <span>:</span>
              <span>{{ formatDateTime(row.original.created_at) }}</span>
            </div>

            <div class="grid grid-cols-[140px_10px_1fr] gap-2">
              <span class="text-muted">Created By</span>
              <span>:</span>
              <span class="break-all">
                {{ row.original.created_by_email || '-' }}
              </span>
            </div>
          </div>
        </div>

        <!-- NG Material -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 border-b border-default pb-3">
            <UIcon name="i-lucide-triangle-alert" class="size-5 text-warning" />
            <h4 class="text-sm font-semibold">NG Material</h4>
          </div>

          <div class="space-y-3 text-sm">
            <div class="grid grid-cols-[90px_10px_1fr] gap-2">
              <span class="text-muted">Material</span>
              <span>:</span>
              <div>
                <p class="font-semibold">
                  {{ row.original.part_number }}
                </p>
                <p class="text-xs text-muted">
                  {{ row.original.part_name }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-[90px_10px_1fr] gap-2">
              <span class="text-muted">NG Label</span>
              <span>:</span>
              <span class="break-all">
                {{ row.original.ng_source_label_number || row.original.source_label_number || '-' }}
              </span>
            </div>

            <div class="grid grid-cols-[90px_10px_1fr] gap-2">
              <span class="text-muted">NG Qty</span>
              <span>:</span>
              <span>{{ row.original.qty_replacement }} PCS</span>
            </div>
          </div>
        </div>

        <!-- Usage -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 border-b border-default pb-3">
            <UIcon name="i-lucide-warehouse" class="size-5 text-primary" />
            <h4 class="text-sm font-semibold">Usage</h4>
          </div>

          <div class="space-y-3 text-sm">
            <div class="grid grid-cols-[80px_10px_1fr] gap-2">
              <span class="text-muted">Station</span>
              <span>:</span>
              <span>{{ row.original.station_name }}</span>
            </div>

            <div class="grid grid-cols-[80px_10px_1fr] gap-2">
              <span class="text-muted">Reason</span>
              <span>:</span>
              <span class="break-words">
                {{ row.original.replacement_reason || '-' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== Row 2 ===== -->
      <div class="mt-6 border-t border-default pt-5">
        <div class="mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-tags" class="size-5 text-primary" />
          <h4 class="text-sm font-semibold">Replacement Material</h4>
        </div>

        <div class="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="rounded-lg border border-default bg-default/30 p-4">
            <p class="text-xs text-muted">Material</p>
            <p class="mt-1 break-all font-semibold">
              {{ row.original.part_number }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ row.original.part_name }}
            </p>
          </div>

          <div class="rounded-lg border border-default bg-default/30 p-4">
            <p class="text-xs text-muted">Qty Replacement</p>
            <p class="mt-1 font-semibold">
              {{ row.original.qty_replacement }} PCS
            </p>
          </div>
        </div>

        <div
          v-if="row.original.used_buffer_details?.length"
          class="grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          <div
            v-for="label in row.original.used_buffer_details"
            :key="label.id"
            class="flex items-start justify-between gap-4 rounded-lg border border-default bg-default/30 p-4"
          >
            <div class="flex-1">
              <p class="break-all text-sm font-semibold">
                {{ label.pcs_label_number }}
              </p>

              <p class="mt-2 break-all text-xs text-muted">
                Supplied by: {{ label.supplied_by_email || '-' }}
              </p>
            </div>

            <UBadge
              color="success"
              variant="soft"
              class="shrink-0"
            >
              Replacement
            </UBadge>
          </div>
        </div>

        <p
          v-else
          class="text-sm text-muted"
        >
          No replacement label found.
        </p>
      </div>
    </div>
  </div>
</template>
    </UTable>

    <div v-if="!loading && !data.length" class="py-10 text-center text-muted">
      No material replacement found.
    </div>
  </UCard>
</template>