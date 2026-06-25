<script setup lang="ts">
import { h, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
    data: any[]
    loading?: boolean
    page: number
    limit: number
    total: number
}>()
const emit = defineEmits<{
    'update:page': [value: number]
}>()
const expanded = ref({})
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

function formatDateTime(value?: string | null) {
    if (!value) return '-'
    return new Date(value).toLocaleString('id-ID')
}

function getTransactionColor(type?: string) {
    if (type === 'IN') return 'success'
    if (type === 'OUT') return 'warning'
    if (type === 'SCRAP') return 'error'
    return 'neutral'
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
        accessorKey: 'transaction_type',
        header: 'Status',
        cell: ({ row }) =>
            h(
                UBadge,
                {
                    color: getTransactionColor(row.original.transaction_type),
                    variant: 'soft'
                },
                () => row.original.transaction_type || '-'
            )
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
        accessorKey: 'qty_pcs',
        header: 'Qty',
        cell: ({ row }) => `${row.original.qty_pcs || 0} PCS`
    },
    {
        accessorKey: 'user_email',
        header: 'User',
        cell: ({ row }) => row.original.user_email || '-'
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
        <template #header>
            <div>
                <h3 class="font-semibold">
                    Buffer Transaction History
                </h3>
                <p class="text-sm text-muted">
                    Track buffer supply, usage, label number, user, and transaction time.
                </p>
            </div>
        </template>

        <UTable v-model:expanded="expanded" :data="loading ? [] : data" :columns="columns" :loading="loading"
            class="w-full">
            <template #expanded="{ row }">
  <div class="px-4 pb-5">
    <div class="rounded-xl border border-default bg-elevated/40 p-5">
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <!-- Transaction Info -->
        <div class="min-w-0 space-y-4">
          <div class="flex items-center gap-2 border-b border-default pb-3">
            <UIcon name="i-lucide-info" class="size-5 text-primary" />
            <h4 class="text-sm font-semibold text-highlighted">
              Transaction Info
            </h4>
          </div>

          <div class="space-y-3 text-sm">
            <div class="grid grid-cols-[80px_10px_minmax(0,1fr)] gap-2">
              <span class="text-muted">Status</span>
              <span class="text-muted">:</span>
              <UBadge
                :color="getTransactionColor(row.original.transaction_type)"
                variant="soft"
                class="w-fit"
              >
                {{ row.original.transaction_type || '-' }}
              </UBadge>
            </div>

            <div class="grid grid-cols-[80px_10px_minmax(0,1fr)] gap-2">
              <span class="text-muted">Date</span>
              <span class="text-muted">:</span>
              <span class="wrap-break-word font-semibold text-highlighted">
                {{ formatDateTime(row.original.created_at) }}
              </span>
            </div>

            <div class="grid grid-cols-[80px_10px_minmax(0,1fr)] gap-2">
              <span class="text-muted">User</span>
              <span class="text-muted">:</span>
              <span class="truncate font-semibold text-highlighted">
                {{ row.original.user_email || '-' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Station & Material -->
        <div class="min-w-0 space-y-4">
          <div class="flex items-center gap-2 border-b border-default pb-3">
            <UIcon name="i-lucide-warehouse" class="size-5 text-primary" />
            <h4 class="text-sm font-semibold text-highlighted">
              Station & Material
            </h4>
          </div>

          <div class="space-y-3 text-sm">
            <div class="grid grid-cols-[80px_10px_minmax(0,1fr)] gap-2">
              <span class="text-muted">Station</span>
              <span class="text-muted">:</span>
              <span class="wrap-break-word font-semibold text-highlighted">
                {{ row.original.station_name || '-' }}
              </span>
            </div>

            <div class="grid grid-cols-[80px_10px_minmax(0,1fr)] gap-2">
              <span class="text-muted">Material</span>
              <span class="text-muted">:</span>
              <div class="min-w-0">
                <p class="break-all font-semibold text-highlighted">
                  {{ row.original.part_number || '-' }}
                </p>
                <p class="mt-1 wrap-break-word text-xs text-muted">
                  {{ row.original.part_name || '-' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quantity -->
        <div class="min-w-0 space-y-4">
          <div class="flex items-center gap-2 border-b border-default pb-3">
            <UIcon name="i-lucide-box" class="size-5 text-primary" />
            <h4 class="text-sm font-semibold text-highlighted">
              Quantity
            </h4>
          </div>

          <div class="space-y-3 text-sm">
            <div class="grid grid-cols-[90px_10px_minmax(0,1fr)] gap-2">
              <span class="text-muted">Qty Kanban</span>
              <span class="text-muted">:</span>
              <span class="font-semibold text-highlighted">
                {{ row.original.qty_kanban || 0 }}
              </span>
            </div>

            <div class="grid grid-cols-[90px_10px_minmax(0,1fr)] gap-2">
              <span class="text-muted">Qty PCS</span>
              <span class="text-muted">:</span>
              <span class="font-semibold text-highlighted">
                {{ row.original.qty_pcs || 0 }} PCS
              </span>
            </div>

            <div class="grid grid-cols-[90px_10px_minmax(0,1fr)] gap-2">
              <span class="text-muted">Reference</span>
              <span class="text-muted">:</span>
              <span class="break-all font-semibold text-highlighted">
                {{ row.original.reference_type || '-' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Label Number pindah baris bawah -->
      <div class="mt-6 border-t border-default pt-5">
        <div class="mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-tag" class="size-5 text-primary" />
          <h4 class="text-sm font-semibold text-highlighted">
            Label Number
          </h4>
        </div>

        <div
          v-if="row.original.labels?.length"
          class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          <div
            v-for="label in row.original.labels"
            :key="label.id"
            class="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-default bg-default/30 px-3 py-2"
          >
            <span class="min-w-0 truncate text-sm font-medium text-highlighted">
              {{ label.pcs_label_number }}
            </span>

            <UBadge
              :color="getTransactionColor(row.original.transaction_type)"
              variant="soft"
              class="shrink-0"
            >
              {{ row.original.transaction_type }}
            </UBadge>
          </div>
        </div>

        <p v-else class="text-sm text-muted">
          No label detail found.
        </p>
      </div>
    </div>
  </div>
</template>
        </UTable>
        <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-4">
            <div class="text-sm text-muted">
                Total {{ total }} buffer transaction(s)
            </div>

            <UPagination :page="page" :total="total" :items-per-page="limit"
                @update:page="emit('update:page', $event)" />
        </div>
    </UCard>
</template>