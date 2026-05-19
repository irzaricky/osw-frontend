<script setup lang="ts">
import type { LocalDetail } from '../composables/useBomForm'

interface Props {
  localDetails:    LocalDetail[]
  loading:         boolean
  saving:          boolean
  isDirty:         boolean
  isCreate:        boolean
  isEditable:      boolean
  currentBom?:     any
  resolveUomCode:  (d: LocalDetail) => string
}

const props = defineProps<Props>()
const emit  = defineEmits<{
  addDetail:      []
  editDetail:     [d: LocalDetail]
  deleteDetail:   [d: LocalDetail]
  save:           [andSubmit: boolean]
  discard:        []
}>()

const sortedDetails = computed(() =>
  props.localDetails.slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
)

import { computed } from 'vue'
</script>

<template>
  <div class="border-t border-default">
    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3 px-5 py-4">
      <h2 class="font-semibold text-sm flex items-center gap-2">
        <UIcon name="i-lucide-layers" class="w-4 h-4 text-primary" />
        Components
        <UBadge
          v-if="localDetails.length"
          :label="String(localDetails.length)"
          color="neutral"
          variant="soft"
          size="sm"
        />
      </h2>
      <UButton
        v-if="isEditable || isCreate"
        icon="i-lucide-plus"
        color="primary"
        variant="soft"
        size="sm"
        label="Add Component"
        @click="emit('addDetail')"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading && !isCreate" class="flex justify-center items-center py-12">
      <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-muted" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!localDetails.length"
      class="flex flex-col items-center justify-center py-12 gap-3 text-muted"
    >
      <UIcon name="i-lucide-package-open" class="w-10 h-10" />
      <p class="text-sm">No components yet. Add the first component to this BOM.</p>
      <UButton
        v-if="isEditable || isCreate"
        icon="i-lucide-plus"
        color="primary"
        variant="soft"
        size="sm"
        label="Add Component"
        @click="emit('addDetail')"
      />
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm min-w-[900px]">
        <thead class="bg-elevated border-y border-default">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide w-14">#</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Part Number</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Part Name</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide w-16">Lvl</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide w-28">Type</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Qty</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide w-20">UOM</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide w-24">Scrap %</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Child BOM</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Notes</th>
            <th v-if="isEditable || isCreate" class="px-4 py-3 w-20" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="(d, idx) in sortedDetails"
            :key="d.temp_id"
            class="hover:bg-elevated/50 transition-colors group"
          >
            <td class="px-4 py-3 font-mono text-xs text-muted">{{ idx + 1 }}</td>
            <td class="px-4 py-3">
              <span class="font-mono text-xs font-semibold">
                {{ d._part?.part_number ?? `#${d.part_id}` }}
              </span>
            </td>
            <td class="px-4 py-3 font-medium">{{ d._part?.part_name ?? '—' }}</td>
            <td class="px-4 py-3 text-center">
              <UBadge v-if="d.level != null" :label="`L${d.level}`" color="neutral" variant="soft" size="sm" />
              <span v-else class="text-muted">—</span>
            </td>
            <td class="px-4 py-3">
              <UBadge
                v-if="d.type"
                :label="d.type"
                :color="
                  d.type === 'material'   ? 'info'    :
                  d.type === 'phantom'    ? 'warning' :
                  d.type === 'byproduct'  ? 'neutral' :
                  d.type === 'co-product' ? 'success' : 'neutral'
                "
                variant="subtle"
                size="sm"
              />
              <span v-else class="text-muted text-xs">—</span>
            </td>
            <td class="px-4 py-3 text-right font-mono">
              {{ Number(d.qty_required).toLocaleString('en-US', { maximumFractionDigits: 4 }) }}
            </td>
            <td class="px-4 py-3">
              <span class="font-mono text-xs uppercase">{{ resolveUomCode(d) }}</span>
            </td>
            <td class="px-4 py-3 text-right font-mono text-muted">
              {{ Number(d.scrap_percentage) > 0 ? `${d.scrap_percentage}%` : '—' }}
            </td>
            <td class="px-4 py-3 text-xs font-mono text-muted">
              <span v-if="d._child_bom">
                {{ d._child_bom.bom_number }}
                <span class="opacity-60">v{{ d._child_bom.bom_version }}</span>
              </span>
              <span v-else>—</span>
            </td>
            <td class="px-4 py-3 text-xs text-muted max-w-40 truncate">{{ d.notes ?? '—' }}</td>
            <td v-if="isEditable || isCreate" class="px-4 py-3">
              <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <UButton icon="i-lucide-pencil"  color="neutral" variant="ghost" size="xs" @click="emit('editDetail', d)" />
                <UButton icon="i-lucide-trash-2" color="error"   variant="ghost" size="xs" @click="emit('deleteDetail', d)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer: Save actions -->
    <div
      v-if="isEditable || isCreate"
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-t border-default bg-elevated/40"
    >
      <!-- Status hint -->
      <p class="text-xs text-muted">
        <template v-if="isCreate">
          <span class="font-medium">{{ localDetails.length }}</span> component(s) added.
          Save as Draft to keep editing later, or Submit directly for approval.
        </template>
        <template v-else-if="isDirty">
          <span class="text-warning-600 dark:text-warning-400 font-medium">
            <UIcon name="i-lucide-alert-triangle" class="w-3 h-3 inline-block mr-1" />
            Unsaved changes
          </span>
          — save to apply all changes at once.
        </template>
        <template v-else>
          <span class="text-success-600 dark:text-success-400">
            <UIcon name="i-lucide-check" class="w-3 h-3 inline-block mr-1" />
            All changes saved.
          </span>
        </template>
      </p>

      <!-- Action buttons -->
      <div class="flex items-center gap-2 flex-wrap">
        <UButton
          v-if="!isCreate && isDirty"
          label="Discard"
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="saving"
          @click="emit('discard')"
        />
        <UButton
          :label="isCreate ? 'Save as Draft' : 'Save Changes'"
          icon="i-lucide-save"
          color="neutral"
          variant="soft"
          size="sm"
          :loading="saving"
          :disabled="!isDirty && !isCreate"
          @click="emit('save', false)"
        />
        <UButton
          v-if="isCreate || currentBom?.doc_status?.code === 'DRAFT' || currentBom?.doc_status?.code === 'REJECTED'"
          label="Submit for Approval"
          icon="i-lucide-send"
          color="primary"
          size="sm"
          :loading="saving"
          :disabled="!localDetails.length"
          @click="emit('save', true)"
        />
      </div>
    </div>
  </div>
</template>