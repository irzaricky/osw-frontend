<script setup lang="ts">
import { h, onMounted, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import stationBufferService from '../../../services/warehouse/station-buffer.service'
import ManualInModal from './components/ManualInModal.vue'
import BufferActionModal from './components/BufferActionModal.vue'

const UBadge = resolveComponent('UBadge')

const loading = ref(false)
const submitLoading = ref(false)
const showManualModal = ref(false)

const summary = ref<any>(null)
const buffers = ref<any[]>([])
const logs = ref<any[]>([])
const stations = ref<any[]>([])
const parts = ref<any[]>([])
const showActionModal = ref(false)
const actionMode = ref<'use' | 'scrap'>('use')
const selectedBuffer = ref<any | null>(null)

function formatDate(value?: string | null) {
    if (!value) return '-'
    return new Date(value).toLocaleString('id-ID')
}

function getStatusColor(needReplenishment: boolean) {
    return needReplenishment ? 'warning' : 'success'
}

function getAgingBadge(row: any) {
    const aging = Number(row.aging_days || 0)

    if (aging >= 30) {
        return h(UBadge, { color: 'error', variant: 'soft', size: 'sm' }, () => '> 30 Days')
    }

    if (aging >= 7) {
        return h(UBadge, { color: 'warning', variant: 'soft', size: 'sm' }, () => '> 7 Days')
    }

    return h(UBadge, { color: 'success', variant: 'soft', size: 'sm' }, () => 'Fresh')
}
function openActionModal(mode: 'use' | 'scrap', item: any) {
    actionMode.value = mode
    selectedBuffer.value = item
    showActionModal.value = true
}

async function handleBufferAction(data: any) {
    submitLoading.value = true

    try {
        if (actionMode.value === 'use') {
            await stationBufferService.useBuffer(data)
        } else {
            await stationBufferService.scrapBuffer(data)
        }

        showActionModal.value = false
        selectedBuffer.value = null
        await loadData()
    } finally {
        submitLoading.value = false
    }
}

const bufferColumns: TableColumn<any>[] = [
    { accessorKey: 'station_name', header: 'Station' },
    { accessorKey: 'part_number', header: 'Part Number' },
    { accessorKey: 'part_name', header: 'Part Name' },
    {
        accessorKey: 'qty_kanban',
        header: 'Current Buffer',
        cell: ({ row }) => `${row.original.qty_kanban || 0} Kanban`
    },
    {
        accessorKey: 'standard_buffer_stock',
        header: 'Standard Buffer',
        cell: ({ row }) => `${row.original.standard_buffer_stock || 0} Kanban`
    },
    {
        accessorKey: 'shortage_kanban',
        header: 'Shortage',
        cell: ({ row }) => `${row.original.shortage_kanban || 0} Kanban`
    },
    {
        accessorKey: 'aging_days',
        header: 'Aging',
        cell: ({ row }) =>
            h('div', { class: 'flex items-center gap-2' }, [
                h('span', `${row.original.aging_days || 0} day(s)`),
                getAgingBadge(row.original)
            ])
    },
    {
        accessorKey: 'need_replenishment',
        header: 'Status',
        cell: ({ row }) =>
            h(
                UBadge,
                {
                    color: getStatusColor(row.original.need_replenishment),
                    variant: 'soft',
                    size: 'sm'
                },
                () => row.original.need_replenishment ? 'Need Replenishment' : 'Safe'
            )
    },
    {
        id: 'action',
        header: 'Action',
        cell: ({ row }) =>
            h('div', { class: 'flex items-center gap-2' }, [
                h(
                    resolveComponent('UButton'),
                    {
                        size: 'xs',
                        color: 'primary',
                        variant: 'soft',
                        label: 'Use',
                        onClick: () => openActionModal('use', row.original)
                    }
                ),
                h(
                    resolveComponent('UButton'),
                    {
                        size: 'xs',
                        color: 'error',
                        variant: 'soft',
                        label: 'Scrap',
                        onClick: () => openActionModal('scrap', row.original)
                    }
                )
            ])
    }
]

const logColumns: TableColumn<any>[] = [
    {
        accessorKey: 'transaction_type',
        header: 'Type',
        cell: ({ row }) => {
            const type = row.original.transaction_type
            const color = type === 'IN' ? 'success' : type === 'OUT' ? 'primary' : 'error'
            return h(UBadge, { color, variant: 'soft', size: 'sm' }, () => type)
        }
    },
    { accessorKey: 'station_name', header: 'Station' },
    { accessorKey: 'part_number', header: 'Part Number' },
    { accessorKey: 'part_name', header: 'Part Name' },
    { accessorKey: 'qty_kanban', header: 'Kanban' },
    { accessorKey: 'qty_pcs', header: 'PCS' },
    {
        accessorKey: 'remarks',
        header: 'Remarks',
        cell: ({ row }) => row.original.remarks || '-'
    },
    {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.created_at)
    }
]

async function loadData() {
    loading.value = true

    try {
        const results = await Promise.allSettled([
            stationBufferService.getSummary(),
            stationBufferService.getList(),
            stationBufferService.getLogs(),
            stationBufferService.getStationDropdown(),
            stationBufferService.getPartDropdown()
        ])

        console.log('Station Buffer Results:', results)

        if (results[0].status === 'fulfilled') {
            summary.value = results[0].value.data.data || null
        }

        if (results[1].status === 'fulfilled') {
            buffers.value = results[1].value.data.data || []
        }

        if (results[2].status === 'fulfilled') {
            logs.value = results[2].value.data.data || []
        }

        if (results[3].status === 'fulfilled') {
            stations.value = results[3].value.data.data || []
        }

        if (results[4].status === 'fulfilled') {
            parts.value = results[4].value.data.data || []
        }
    } finally {
        loading.value = false
    }
}

async function handleManualIn(data: any) {
    submitLoading.value = true

    try {
        await stationBufferService.manualIn(data)
        showManualModal.value = false
        await loadData()
    } finally {
        submitLoading.value = false
    }
}

onMounted(loadData)
</script>

<template>
    <UDashboardPanel id="station-buffer">
        <template #header>
            <UDashboardNavbar title="Station Buffer">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="p-6 space-y-6">
                <div class="flex items-center justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-bold">
                            Station Buffer Stock
                        </h1>
                        <p class="text-sm text-muted mt-1">
                            Monitoring buffer stock at production stations, aging, and replenishment needs.
                        </p>
                    </div>

                    <UButton icon="i-lucide-plus" label="Add Manual" color="primary" @click="showManualModal = true" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <UCard>
                        <p class="text-sm text-muted">
                            Total Buffer Kanban
                        </p>
                        <p class="text-2xl font-bold mt-2">
                            {{ summary?.total_buffer_kanban || 0 }}
                        </p>
                        <p class="text-xs text-muted mt-2">
                            Current buffer stock across stations.
                        </p>
                    </UCard>

                    <UCard>
                        <p class="text-sm text-muted">
                            Need Replenishment
                        </p>
                        <p class="text-2xl font-bold mt-2 text-warning">
                            {{ summary?.need_replenishment_items || 0 }}
                        </p>
                        <p class="text-xs text-muted mt-2">
                            Buffer below standard minimum.
                        </p>
                    </UCard>

                    <UCard>
                        <p class="text-sm text-muted">
                            Aging &gt; 7 Days
                        </p>
                        <p class="text-2xl font-bold mt-2">
                            {{ summary?.aging_7_days || 0 }}
                        </p>
                        <p class="text-xs text-muted mt-2">
                            Buffer stored more than 7 days.
                        </p>
                    </UCard>

                    <UCard>
                        <p class="text-sm text-muted">
                            Scrap PCS
                        </p>
                        <p class="text-2xl font-bold mt-2 text-error">
                            {{ summary?.total_scrap_pcs || 0 }}
                        </p>
                        <p class="text-xs text-muted mt-2">
                            Damaged buffer material.
                        </p>
                    </UCard>
                </div>

                <UCard>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <div>
                                <h2 class="font-semibold">
                                    Buffer Stock List
                                </h2>
                                <p class="text-xs text-muted">
                                    Current stock at each production station.
                                </p>
                            </div>

                            <UButton icon="i-lucide-refresh-cw" variant="soft" color="neutral" :loading="loading"
                                @click="loadData" />
                        </div>
                    </template>

                    <UTable :data="buffers" :columns="bufferColumns" :loading="loading" />
                </UCard>

                <UCard>
                    <template #header>
                        <div>
                            <h2 class="font-semibold">
                                Recent Buffer Transactions
                            </h2>
                            <p class="text-xs text-muted">
                                IN, OUT, and SCRAP movement history.
                            </p>
                        </div>
                    </template>

                    <UTable :data="logs" :columns="logColumns" :loading="loading" />
                </UCard>

                <ManualInModal v-model:open="showManualModal" :loading="submitLoading" :stations="stations"
                    :parts="parts" @submit="handleManualIn" />

                <BufferActionModal v-model:open="showActionModal" :loading="submitLoading" :mode="actionMode"
                    :item="selectedBuffer" @submit="handleBufferAction" />
            </div>
        </template>
    </UDashboardPanel>
</template>