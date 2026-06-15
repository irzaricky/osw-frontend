<script setup lang="ts">
import { h, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import productionMaterialControlService from '../../../../../services/production/production-material-control.service'

const props = defineProps<{
    data: any[]
    loading?: boolean
    page: number
    limit: number
}>()

const expanded = ref({})
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const bomMaterialsMap = ref<Record<number, any[]>>({})
const bomLoadingMap = ref<Record<number, boolean>>({})

function formatDate(value?: string | null) {
    if (!value) return '-'
    return new Date(value).toLocaleDateString('id-ID')
}
async function loadBomMaterials(row: any) {
    const productPartId = row.original.part_id

    if (!productPartId) return
    if (bomMaterialsMap.value[productPartId]) return

    bomLoadingMap.value[productPartId] = true

    try {
        const res = await productionMaterialControlService.getBomMaterials(productPartId)
        bomMaterialsMap.value[productPartId] = res.data.data || []
    } finally {
        bomLoadingMap.value[productPartId] = false
    }
}

const columns: TableColumn<any>[] = [
    {
        id: 'no',
        header: 'No',
        cell: ({ row }) => (props.page - 1) * props.limit + row.index + 1
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
            h(UBadge, { color: row.original.total_ng > 0 ? 'error' : 'neutral', variant: 'soft' }, () => row.original.total_ng)
    },
    {
        id: 'expand',
        cell: ({ row }) =>
            h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
                onClick: async () => {
                    row.toggleExpanded()
                    await loadBomMaterials(row)
                }
            })
    }
]
</script>

<template>
    <UCard>
        <UTable v-model:expanded="expanded" :data="loading ? [] : data" :columns="columns" :loading="loading"
            class="w-full">
            <template #expanded="{ row }">
                <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-elevated/50 border-b border-default">
                    <div class="space-y-1">
                        <h4 class="font-semibold text-sm text-highlighted">
                            Production Info
                        </h4>
                        <p class="text-sm">
                            <span class="text-muted">Date:</span> {{ formatDate(row.original.production_date) }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">Shift:</span> {{ row.original.shift_name || '-' }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">Station:</span> {{ row.original.station_name || '-' }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <h4 class="font-semibold text-sm text-highlighted">
                            BOM Materials
                        </h4>

                        <div v-if="bomLoadingMap[row.original.part_id]" class="text-sm text-muted">
                            Loading BOM materials...
                        </div>

                        <div v-else-if="!(bomMaterialsMap[row.original.part_id] || []).length"
                            class="text-sm text-muted">
                            No BOM materials found.
                        </div>

                        <div v-else class="space-y-2">
                            <div v-for="material in bomMaterialsMap[row.original.part_id]" :key="material.bom_detail_id"
                                class="rounded-md border border-default p-2">
                                <p class="text-sm font-medium">
                                    {{ material.part_number }} - {{ material.part_name }}
                                </p>

                                <p class="text-xs text-muted">
                                    Qty / Unit:
                                    {{ Number(material.qty_required || 0).toFixed(2) }}
                                    {{ material.uom_name || 'PCS' }}
                                </p>

                                <p class="text-xs text-muted">
                                    Expected Usage:
                                    {{
                                        (
                                            Number(material.qty_required || 0) *
                                    Number(row.original.actual_qty || 0)
                                    ).toFixed(2)
                                    }}
                                    {{ material.uom_name || 'PCS' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <h4 class="font-semibold text-sm text-highlighted">
                            Result
                        </h4>
                        <p class="text-sm">
                            <span class="text-muted">Planning:</span> {{ row.original.planning_qty }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">Actual:</span> {{ row.original.actual_qty }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">OK:</span> {{ row.original.total_ok }}
                        </p>
                        <p class="text-sm">
                            <span class="text-muted">NG:</span> {{ row.original.total_ng }}
                        </p>
                    </div>
                </div>
            </template>
        </UTable>

        <div v-if="!loading && !data.length" class="py-10 text-center text-muted">
            No production result found.
        </div>
    </UCard>
</template>