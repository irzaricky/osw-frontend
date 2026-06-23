<script setup lang="ts">
import { ref } from 'vue'
import { useWorkOrderStationStore }  from '../../../../stores/production-plan/work-order-station.store'
import { useAppToast }               from '../../../../composables/useAppToast'
import type { WorkOrderMaterial, StationStatus } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  materials:     WorkOrderMaterial[]
  stationStatus: StationStatus
  woId:          number
  stationId:     number
  saving:        boolean
}>()

const store = useWorkOrderStationStore()
const { toastSuccess, toastError } = useAppToast()

const editingId    = ref<number | null>(null)
const editingValue = ref<number>(0)

const canEdit = props.stationStatus === 'In_Progress'

function startEdit(material: WorkOrderMaterial) {
  if (!canEdit) return
  editingId.value    = material.id
  editingValue.value = Number(material.actual_quantity ?? 0)
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(materialId: number) {
  try {
    await store.updateMaterialActual(props.woId, props.stationId, materialId, {
      actual_quantity: editingValue.value,
    })
    toastSuccess('Material updated')
    editingId.value = null
  } catch (e) { toastError(e) }
}

function sufficiencyColor(m: WorkOrderMaterial): string {
  const actual = Number(m.actual_quantity ?? 0)
  if (actual >= m.planned_quantity) return 'text-success-600'
  if (actual > 0)                   return 'text-warning-600'
  return 'text-muted'
}
</script>

<template>
  <div class="mt-4">
    <div v-if="materials.length === 0" class="flex flex-col items-center justify-center py-12 text-muted gap-2">
      <UIcon name="i-lucide-package" class="w-8 h-8" />
      <p class="text-sm">No materials assigned to this station.</p>
    </div>

    <div v-else class="rounded-lg border border-default overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-elevated border-b border-default">
          <tr>
            <th class="text-left px-4 py-3 text-xs text-muted font-semibold uppercase tracking-wide">Part</th>
            <th class="text-right px-4 py-3 text-xs text-muted font-semibold uppercase tracking-wide">Planned</th>
            <th class="text-right px-4 py-3 text-xs text-muted font-semibold uppercase tracking-wide">Actual</th>
            <th class="text-center px-4 py-3 text-xs text-muted font-semibold uppercase tracking-wide">UOM</th>
            <th v-if="canEdit" class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="m in materials" :key="m.id" class="hover:bg-elevated/50">
            <td class="px-4 py-3">
              <p class="font-medium">{{ m.material_part?.part_name ?? '-' }}</p>
              <p class="text-xs text-muted font-mono">{{ m.material_part?.part_number }}</p>
            </td>
            <td class="px-4 py-3 text-right font-mono">
              {{ Number(m.planned_quantity).toLocaleString() }}
            </td>
            <td class="px-4 py-3 text-right font-mono">
              <!-- Inline edit mode -->
              <div v-if="editingId === m.id" class="flex items-center justify-end gap-1">
                <UInput
                  v-model.number="editingValue"
                  type="number"
                  :min="0"
                  size="xs"
                  class="w-24 text-right"
                  @keyup.enter="saveEdit(m.id)"
                  @keyup.escape="cancelEdit"
                />
              </div>
              <span v-else :class="sufficiencyColor(m)">
                {{ Number(m.actual_quantity ?? 0).toLocaleString() }}
              </span>
            </td>
            <td class="px-4 py-3 text-center text-muted">{{ m.uom ?? '-' }}</td>
            <td v-if="canEdit" class="px-4 py-3 text-right">
              <div v-if="editingId === m.id" class="flex items-center gap-1 justify-end">
                <UButton
                  icon="i-lucide-check"
                  color="success"
                  variant="ghost"
                  size="xs"
                  :loading="saving"
                  @click="saveEdit(m.id)"
                />
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="cancelEdit"
                />
              </div>
              <UButton
                v-else
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="startEdit(m)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="!canEdit && stationStatus !== 'Completed'" class="text-xs text-muted mt-3">
      Material actuals can only be edited while the station is In Progress.
    </p>
  </div>
</template>