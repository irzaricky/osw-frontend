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
                <div class="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-elevated/50 border-b border-default">
                    <div class="space-y-1">
                        <h4 class="font-semibold text-sm text-highlighted">
                            Transaction Info
                        </h4>

                        <p class="text-sm">
                            <span class="text-muted">Status:</span>
                            {{ row.original.transaction_type || '-' }}
                        </p>

                        <p class="text-sm">
                            <span class="text-muted">Date:</span>
                            {{ formatDateTime(row.original.created_at) }}
                        </p>

                        <p class="text-sm">
                            <span class="text-muted">User:</span>
                            {{ row.original.user_email || '-' }}
                        </p>
                    </div>

                    <div class="space-y-1">
                        <h4 class="font-semibold text-sm text-highlighted">
                            Station & Material
                        </h4>

                        <p class="text-sm">
                            <span class="text-muted">Station:</span>
                            {{ row.original.station_name || '-' }}
                        </p>

                        <p class="text-sm">
                            <span class="text-muted">Material:</span>
                            {{ row.original.part_number }} - {{ row.original.part_name }}
                        </p>
                    </div>

                    <div class="space-y-1">
                        <h4 class="font-semibold text-sm text-highlighted">
                            Quantity
                        </h4>

                        <p class="text-sm">
                            <span class="text-muted">Qty Kanban:</span>
                            {{ row.original.qty_kanban || 0 }}
                        </p>

                        <p class="text-sm">
                            <span class="text-muted">Qty PCS:</span>
                            {{ row.original.qty_pcs || 0 }} PCS
                        </p>

                        <p class="text-sm">
                            <span class="text-muted">Reference:</span>
                            {{ row.original.reference_type || '-' }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <h4 class="font-semibold text-sm text-highlighted">
                            Label Number
                        </h4>

                        <div v-if="row.original.labels?.length" class="max-h-56 overflow-y-auto space-y-1">
                            <div v-for="label in row.original.labels" :key="label.id"
                                class="flex items-center justify-between rounded-md border border-default px-3 py-2">
                                <span class="text-sm font-medium">
                                    {{ label.pcs_label_number }}
                                </span>

                                <UBadge :color="getTransactionColor(row.original.transaction_type)" variant="soft">
                                    {{ row.original.transaction_type }}
                                </UBadge>
                            </div>
                        </div>

                        <p v-else class="text-sm text-muted">
                            No label detail found.
                        </p>
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