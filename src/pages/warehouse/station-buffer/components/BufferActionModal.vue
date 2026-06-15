<script setup lang="ts">
import { reactive, watch, computed } from 'vue'

const props = defineProps<{
    open: boolean
    loading?: boolean
    mode: 'use' | 'scrap'
    item: any | null
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
    qty_kanban: 1,
    qty_pcs: 1,
    remarks: ''
})

const title = computed(() =>
    props.mode === 'use' ? 'Use Buffer Stock' : 'Scrap Buffer Stock'
)

const description = computed(() =>
    props.mode === 'use'
        ? 'Record buffer material usage for production.'
        : 'Record damaged buffer material as scrap.'
)

const calculatedQtyPcs = computed(() => {
    return Number(form.qty_kanban || 0) * Number(props.item?.capacity_per_kanban || 1)
})

watch(
    () => props.open,
    (isOpen) => {
        if (isOpen) {
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
    if (!props.item) return

    emit('submit', {
        station_id: props.item.station_id,
        part_id: props.item.part_id,
        qty_kanban: Number(form.qty_kanban),
        qty_pcs: calculatedQtyPcs.value,
        remarks: form.remarks
    })
}
</script>

<template>
    <UModal :open="props.open" :title="title" :description="description" @update:open="emit('update:open', $event)">
        <template #body>
            <div v-if="item" class="space-y-4">
                <div class="rounded-lg border border-default p-3 text-sm">
                    <p>
                        <span class="text-muted">Station:</span>
                        {{ item.station_name }}
                    </p>
                    <p>
                        <span class="text-muted">Part:</span>
                        {{ item.part_number }} - {{ item.part_name }}
                    </p>
                    <p>
                        <span class="text-muted">Available:</span>
                        {{ item.qty_kanban }} Kanban / {{ item.qty_pcs }} PCS
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <UFormField label="Qty Kanban" name="qty_kanban" required>
                        <UInput :model-value="calculatedQtyPcs" type="number" readonly class="w-full" />
                    </UFormField>

                    <UFormField label="Qty PCS" name="qty_pcs" required>
                        <UInput v-model.number="form.qty_pcs" type="number" min="1" :max="item.qty_pcs"
                            class="w-full" />
                    </UFormField>
                </div>

                <UFormField label="Remarks" name="remarks">
                    <UTextarea v-model="form.remarks" placeholder="Optional remarks" class="w-full" />
                </UFormField>
            </div>
        </template>

        <template #footer>
            <div class="flex gap-2 justify-end w-full">
                <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />

                <UButton :color="mode === 'scrap' ? 'error' : 'primary'" :label="mode === 'scrap' ? 'Scrap' : 'Use'"
                    :loading="loading" @click="submit" />
            </div>
        </template>
    </UModal>
</template>