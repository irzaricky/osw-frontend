<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useWorkOrderStore } from '../../../../stores/production-plan/work-order.store'
import { storeToRefs }       from 'pinia'
import { useAppToast }       from '../../../../composables/useAppToast'
import type { WorkOrderStatus } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  woId:     number
  woStatus: WorkOrderStatus
  saving:   boolean
}>()

const store  = useWorkOrderStore()
const { materials, loading } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

const editingId  = ref<number | null>(null)
const editingQty = ref<number>(0)

// ── Client-side pagination ────────────────────────────────────────────────────
const PAGE_SIZE   = 10
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(materials.value.length / PAGE_SIZE))

const pagedMaterials = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return materials.value.slice(start, start + PAGE_SIZE)
})

// Reset to page 1 whenever materials reload
watch(() => materials.value.length, () => { currentPage.value = 1 })

// ── Edit helpers ──────────────────────────────────────────────────────────────

async function load() {
  await store.fetchMaterials(props.woId)
}

function startEdit(id: number, current: number | null) {
  editingId.value  = id
  editingQty.value = current ?? 0
}

function cancelEdit() {
  editingId.value  = null
  editingQty.value = 0
}

async function saveEdit(materialId: number) {
  try {
    const res = await store.updateMaterialActual(props.woId, materialId, { actual_quantity: editingQty.value })
    toastSuccess(res?.message || 'Material quantity updated')
    editingId.value = null
  } catch (e) {
    toastError(e)
  }
}

const canEdit = props.woStatus === 'In_Progress'

onMounted(load)
</script>

<template>
  <div class="mt-4 bg-default border border-default rounded-xl overflow-hidden">

    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-default">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <UIcon name="i-lucide-package" class="w-4 h-4 text-primary" />
        Materials
      </h3>
      <UBadge
        :label="`${materials.length} item${materials.length !== 1 ? 's' : ''}`"
        color="neutral"
        variant="soft"
        size="sm"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-10">
      <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-muted" />
    </div>

    <!-- Empty -->
    <div v-else-if="materials.length === 0" class="flex flex-col items-center justify-center py-10 text-center text-muted gap-2">
      <UIcon name="i-lucide-inbox" class="w-7 h-7" />
      <p class="text-sm">No materials listed for this Work Order.</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-elevated border-b border-default">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">No</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Part</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">UOM</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Planned</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Actual</th>
            <th v-if="canEdit" class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="(m, idx) in pagedMaterials"
            :key="m.id"
            class="hover:bg-elevated/50 transition-colors"
          >
            <td class="px-4 py-3 text-muted text-xs font-mono">
              {{ (currentPage - 1) * PAGE_SIZE + idx + 1 }}
            </td>
            <td class="px-4 py-3">
              <div class="font-medium">{{ m.material_part?.part_name ?? '-' }}</div>
              <div class="text-xs text-muted font-mono">{{ m.material_part?.part_number }}</div>
            </td>
            <td class="px-4 py-3 text-right text-muted text-xs">{{ m.uom ?? '-' }}</td>
            <td class="px-4 py-3 text-right font-mono">{{ Number(m.planned_quantity).toLocaleString() }}</td>
            <td class="px-4 py-3 text-right font-mono">
              <template v-if="editingId === m.id">
                <UInput
                  v-model.number="editingQty"
                  type="number"
                  min="0"
                  size="xs"
                  class="w-28 font-mono text-right"
                  @keyup.enter="saveEdit(m.id)"
                  @keyup.escape="cancelEdit"
                />
              </template>
              <template v-else>
                <span
                  :class="{
                    'text-success-600': m.actual_quantity != null && Number(m.actual_quantity) <= Number(m.planned_quantity),
                    'text-warning-600': m.actual_quantity != null && Number(m.actual_quantity) > Number(m.planned_quantity),
                    'text-muted':       m.actual_quantity == null,
                  }"
                >
                  {{ m.actual_quantity != null ? Number(m.actual_quantity).toLocaleString() : '—' }}
                </span>
              </template>
            </td>
            <td v-if="canEdit" class="px-4 py-3 text-right">
              <template v-if="editingId === m.id">
                <div class="flex items-center justify-end gap-1">
                  <UButton icon="i-lucide-check" color="success" variant="ghost" size="xs" :loading="saving" @click="saveEdit(m.id)" />
                  <UButton icon="i-lucide-x"     color="neutral" variant="ghost" size="xs"                   @click="cancelEdit" />
                </div>
              </template>
              <template v-else>
                <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" @click="startEdit(m.id, m.actual_quantity)" />
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="materials.length > PAGE_SIZE"
      class="flex items-center justify-between px-5 py-3 border-t border-default"
    >
      <p class="text-sm text-muted">
        {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, materials.length) }}
        of {{ materials.length }} items
      </p>
      <UPagination
        v-model:page="currentPage"
        :total="materials.length"
        :items-per-page="PAGE_SIZE"
      />
    </div>

  </div>
</template>