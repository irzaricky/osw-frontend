<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

type StationOption = {
    id: number
    name: string
}

type PartOption = {
    id: number
    part_number?: string
    part_name?: string
    name?: string
    capacity_per_kanban?: number
    capacity?: number
}

const props = defineProps<{
    open: boolean
    loading?: boolean
    stations: StationOption[]
    parts: PartOption[]
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    submit: [data: {
        station_id: number
        part_id: number
        qty_kanban: number
        qty_pcs: number
        remarks?: string
    }]
}>()

const form = reactive({
    station_id: undefined as number | undefined,
    part_id: undefined as number | undefined,
    qty_kanban: 1,
    qty_pcs: 1,
    remarks: ''
})

const stationItems = computed(() =>
    props.stations.map(station => station.name)
)

const partItems = computed(() =>
    props.parts.map(part =>
        `${part.part_number || ''} - ${part.part_name || part.name || ''}`
    )
)

const selectedStation = computed<string | undefined>({
    get() {
        const found = props.stations.find(item => item.id === form.station_id)
        return found?.name
    },
    set(value) {
        const found = props.stations.find(item => item.name === value)
        form.station_id = found?.id
    }
})

const selectedPart = computed<string | undefined>({
    get() {
        const found = props.parts.find(item => item.id === form.part_id)

        if (!found) return undefined

        return `${found.part_number || ''} - ${found.part_name || found.name || ''}`
    },
    set(value) {
        const found = props.parts.find(item =>
            `${item.part_number || ''} - ${item.part_name || item.name || ''}` === value
        )

        form.part_id = found?.id
    }
})

const selectedPartData = computed(() =>
    props.parts.find(item => item.id === form.part_id)
)

const calculatedQtyPcs = computed(() => {
    return Number(form.qty_kanban || 0) * Number(selectedPartData.value?.capacity_per_kanban || 1)
})

watch(
    () => props.open,
    (isOpen) => {
        if (isOpen) {
            form.station_id = undefined
            form.part_id = undefined
            form.qty_kanban = 1
            form.qty_pcs = 1
            form.remarks = ''
        }
    }
)

function close() {
    emit('update:open', false)
}

function submit() {
    if (!form.station_id) return
    if (!form.part_id) return
    if (!form.qty_kanban) return
    if (!form.qty_pcs) return

    emit('submit', {
        station_id: form.station_id,
        part_id: form.part_id,
        qty_kanban: Number(form.qty_kanban),
        qty_pcs: calculatedQtyPcs.value,
        remarks: form.remarks
    })
}
</script>

<template>
    <UModal :open="props.open" title="Add Buffer Stock" description="Add material stock into production station buffer."
        @update:open="emit('update:open', $event)">
        <template #body>
            <form class="space-y-4" @submit.prevent="submit">
                <UFormField label="Station" name="station_id" required>
                    <USelectMenu v-model="selectedStation" :items="stationItems" placeholder="Select station" searchable
                        clear class="w-full" />
                </UFormField>

                <UFormField label="Part" name="part_id" required>
                    <USelectMenu v-model="selectedPart" :items="partItems" placeholder="Select part" searchable clear
                        class="w-full" />
                </UFormField>

                <div class="grid grid-cols-2 gap-3">
                    <UFormField label="Qty Kanban" name="qty_kanban" required>
                        <UInput v-model.number="form.qty_kanban" type="number" min="1" class="w-full" />
                    </UFormField>

                    <UFormField label="Qty PCS" name="qty_pcs" required>
                        <UInput :model-value="calculatedQtyPcs" type="number" readonly class="w-full" />
                    </UFormField>
                </div>

                <UFormField label="Remarks" name="remarks">
                    <UTextarea v-model="form.remarks" placeholder="Optional remarks" class="w-full" />
                </UFormField>
            </form>
        </template>

        <template #footer>
            <div class="flex gap-2 justify-end w-full">
                <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />

                <UButton color="primary" label="Create" :loading="loading" @click="submit" />
            </div>
        </template>
    </UModal>
</template>