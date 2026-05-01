<script setup lang="ts">
import { h, resolveComponent, ref } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { TransactionActivity } from '../../../../types/warehouse/transaction-activity'

const props = defineProps<{
    data: TransactionActivity[]
    loading?: boolean
    page: number
    limit: number
}>()

const expanded = ref({})

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

function formatDateTime(value?: string | null) {
    if (!value) return '-'
    return new Date(value).toLocaleString()
}

function getActivityColor(type?: string) {
    return type === 'IN' ? 'success' : 'warning'
}

const columns: TableColumn<TransactionActivity>[] = [

    {
        id: 'no',
        header: 'No',
        cell: ({ row }) => {
            return (props.page - 1) * props.limit + row.index + 1
        }
    },
    {
        accessorKey: 'activity_type',
        header: 'Activity',
        cell: ({ row }) =>
            h(
                UBadge,
                {
                    color: getActivityColor(row.original.activity_type),
                    variant: 'soft'
                },
                () => row.original.activity_type
            )
    },
    {
        accessorKey: 'timestamp_activity',
        header: 'Timestamp',
        cell: ({ row }) => formatDateTime(row.original.timestamp_activity)
    },
    {
        accessorKey: 'wo_number',
        header: 'WO Number',
        cell: ({ row }) => row.original.wo_number || '-'
    },
    {
        accessorKey: 'part_number',
        header: 'Part Number',
        cell: ({ row }) => row.original.part_number || '-'
    },
    {
        accessorKey: 'label_number',
        header: 'Label Number',
        cell: ({ row }) => row.original.label_number || '-'
    },
    {
        accessorKey: 'bin_code',
        header: 'Bin',
        cell: ({ row }) => row.original.bin_code || '-'
    },
    {
        accessorKey: 'user',
        header: 'User',
        cell: ({ row }) => row.original.user || '-'
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
    },
]
</script>

<template>
    <UCard>
        <UTable v-model:expanded="expanded" :data="loading ? [] : data" :columns="columns" :loading="loading"
            class="w-full">
            <template #expanded="{ row }">
                <div
                    class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-elevated/50 border-b border-default">
                    <div class="space-y-1">
                        <h4 class="font-semibold text-sm text-highlighted">
                            Work Order
                        </h4>
                        <p class="text-sm">
                            <span class="text-muted">WO Number:</span> {{ row.original.wo_number || '-' }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">WO Date:</span> {{ row.original.wo_date || '-' }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">WO Type:</span> {{ row.original.wo_type || '-' }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">WO Category:</span> {{ row.original.wo_category || '-' }}
                        </p>
                    </div>

                    <div class="space-y-1">
                        <h4 class="font-semibold text-sm text-highlighted">
                            Part & Label
                        </h4>
                        <p class="text-sm">
                            <span class="text-muted">Part Number:</span> {{ row.original.part_number || '-' }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">Part Name:</span> {{ row.original.part_name || '-' }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">Part Category:</span> {{ row.original.part_category || '-' }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">Label:</span> {{ row.original.label_number || '-' }}
                        </p>
                    </div>

                    <div class="space-y-1">
                        <h4 class="font-semibold text-sm text-highlighted">
                            Movement
                        </h4>
                        <p class="text-sm">
                            <span class="text-muted">Kanban:</span> {{ row.original.kanban }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">Qty per Kanban:</span> {{ row.original.qty_per_kanban }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">Origin:</span> {{ row.original.storage_bin_origin || '-' }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">Destination:</span> {{ row.original.storage_bin_destination || '-'
                            }}
                        </p>
                    </div>

                    <div class="space-y-1">
                        <h4 class="font-semibold text-sm text-highlighted">
                            System Info
                        </h4>
                        <p class="text-sm">
                            <span class="text-muted">Warehouse Area:</span> {{ row.original.warehouse_area || '-' }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">QR Part:</span> {{ row.original.qr_part || '-' }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">QR Bin:</span> {{ row.original.qr_bin || '-' }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">User:</span> {{ row.original.user || '-' }}
                        </p>
                    </div>
                </div>
            </template>
        </UTable>

        <div v-if="!loading && !data.length" class="py-10 text-center text-muted">
            No transaction activity found.
        </div>
    </UCard>
</template>