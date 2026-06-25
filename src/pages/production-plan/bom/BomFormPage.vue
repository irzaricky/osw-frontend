<script setup lang="ts">
import { computed } from 'vue'
import { useBomForm } from './composables/useBomForm'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import BomPageHeader from './components/BomPageHeader.vue'
import BomInfoBar from './components/BomInfoBar.vue'
import BomComponentsSection from './components/BomComponentsSection.vue'
import BomWorkflowModal from './components/BomWorkflowModal.vue'
import BomDeleteConfirmModal from './components/BomDeleteConfirmModal.vue'
import BomDetailModal from './components/BomAddDetailModal.vue'

const {
  // route
  router, isCreate, bomId,
  // store refs
  currentBom, loading, saving,
  partDropdown, uomDropdown, bomDropdown,
  // status helpers
  docStatusColor, isEditable, fmtDate,
  // header form
  headerForm, partSearch, selectedParentPart,
  filteredParentParts, uomItems, selectedUomId,
  // details
  localDetails, isDirty, canAddDetail, nextSequence,
  discardChanges, resolveDetailUomCode,
  // detail modal
  isDetailModalOpen, detailModalMode, editingDetail,
  openAddDetail, openEditDetail, handleDetailSave,
  // delete confirm
  deleteConfirm, confirmDeleteDetail, executeDeleteDetail,
  // actions
  handleSave,
  // workflow
  wfModal, openApproveConfirm, openRejectConfirm,
  openActivationConfirm, handleNewVersion,
} = useBomForm()

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Bill of Materials', to: '/production-plan/bom' },
  {
    label: isCreate.value
      ? 'New BOM'
      : currentBom.value?.bom_number ?? `BOM #${bomId.value}`,
  },
])

function setDesc(v: string) { headerForm.description = v }
function setNotes(v: string) { headerForm.notes = v }
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- Page header -->
    <BomPageHeader
      :is-create="isCreate"
      :current-bom="currentBom"
      :saving="saving"
      :doc-status-color="docStatusColor"
      @approve="openApproveConfirm"
      @reject="openRejectConfirm"
      @activate="openActivationConfirm"
      @new-version="handleNewVersion"
    />

    <!-- Info bar (edit mode) -->
    <BomInfoBar
      v-if="!isCreate && currentBom"
      :current-bom="currentBom"
      :detail-count="localDetails.length"
      :fmt-date="fmtDate"
    />

    <!-- Alerts -->
    <UAlert
      v-if="!isCreate && currentBom?.doc_status === 'Rejected' && currentBom.reject_reason"
      color="error"
      variant="soft"
      icon="i-lucide-x-circle"
      title="BOM Rejected"
      :description="currentBom.reject_reason"
    />

    <!-- Header fields (flat, no card wrapper — matches WO Storing form style) -->
    <UForm :state="headerForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Parent part selector (create only) -->
      <UFormField v-if="isCreate" label="Parent Part" required class="md:col-span-2">
        <div class="space-y-2">
          <div
            v-if="selectedParentPart"
            class="flex items-center justify-between gap-2 rounded-lg border border-default bg-elevated px-3 py-2.5"
          >
            <div class="text-sm">
              <span class="font-mono font-semibold">{{ selectedParentPart.part_number }}</span>
              <span class="mx-2 text-muted">·</span>
              <span>{{ selectedParentPart.part_name }}</span>
              <span v-if="selectedParentPart.uom" class="ml-2 text-xs text-muted">
                ({{ selectedParentPart.uom.code }})
              </span>
            </div>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              type="button"
              :disabled="saving"
              @click="selectedParentPart = null; partSearch = ''"
            />
          </div>

          <template v-else>
            <UInput
              v-model="partSearch"
              icon="i-lucide-search"
              placeholder="Search part number or name..."
              class="w-full sm:w-96"
              :disabled="saving"
            />
            <div
              v-if="filteredParentParts.length > 0"
              class="max-h-44 overflow-y-auto rounded-lg border border-default divide-y divide-default"
            >
              <button
                v-for="part in filteredParentParts.slice(0, 30)"
                :key="part.id"
                type="button"
                class="w-full text-left px-3 py-2.5 hover:bg-elevated transition-colors text-sm"
                @click="selectedParentPart = part; partSearch = ''"
              >
                <span class="font-mono font-semibold text-xs">{{ part.part_number }}</span>
                <span class="mx-2 text-muted">·</span>
                <span>{{ part.part_name }}</span>
                <span v-if="part.uom" class="ml-2 text-xs text-muted">({{ part.uom.code }})</span>
              </button>
            </div>
            <p v-else-if="partSearch" class="text-xs text-muted px-1">
              No parts found.
            </p>
          </template>
        </div>
      </UFormField>

      <!-- Parent part display (edit — read-only) -->
      <div
        v-if="!isCreate && currentBom?.parent_part"
        class="md:col-span-2 rounded-lg border border-default bg-elevated px-3 py-2.5"
      >
        <p class="text-xs text-muted mb-0.5">
          Parent Part <span class="opacity-50">(cannot be changed)</span>
        </p>
        <p class="text-sm font-medium">
          <span class="font-mono font-semibold">{{ currentBom.parent_part.part_number }}</span>
          <span class="mx-2 text-muted">·</span>
          {{ currentBom.parent_part.part_name }}
        </p>
      </div>

      <UFormField label="Description">
        <UInput
          :model-value="headerForm.description"
          placeholder="e.g. Main assembly BOM rev1"
          class="w-full"
          :disabled="!isEditable || saving"
          @update:model-value="setDesc"
        />
      </UFormField>

      <UFormField label="UOM">
        <USelectMenu
          v-model="selectedUomId"
          :items="uomItems"
          value-key="value"
          label-key="label"
          placeholder="Select UOM..."
          class="w-full"
          :disabled="true"
        />
      </UFormField>

      <UFormField label="Notes" class="md:col-span-2">
        <UTextarea
          :model-value="headerForm.notes"
          placeholder="Optional notes..."
          class="w-full"
          :rows="2"
          :disabled="!isEditable || saving"
          @update:model-value="setNotes"
        />
      </UFormField>
    </UForm>

    <!-- Components section — always visible, no wizard step gate -->
    <BomComponentsSection
      :local-details="localDetails"
      :loading="loading"
      :saving="saving"
      :is-dirty="isDirty"
      :is-create="isCreate"
      :is-editable="isEditable"
      :current-bom="currentBom"
      :can-add-detail="canAddDetail"
      :resolve-uom-code="resolveDetailUomCode"
      @add-detail="openAddDetail"
      @edit-detail="openEditDetail"
      @delete-detail="confirmDeleteDetail"
      @save="handleSave"
      @discard="discardChanges"
    />

    <!-- Delete component confirm modal -->
    <BomDeleteConfirmModal
      v-model:open="deleteConfirm.open"
      :description="deleteConfirm.description"
      @confirm="executeDeleteDetail"
    />

    <!-- Workflow modal (approve / reject / activate) -->
    <BomWorkflowModal
      :modal="wfModal"
      @update:modal="Object.assign(wfModal, $event)"
      @close="wfModal.open = false"
    />

    <!-- Add / Edit component modal -->
    <BomDetailModal
      v-model:open="isDetailModalOpen"
      :mode="detailModalMode"
      :detail="editingDetail"
      :part-dropdown="partDropdown"
      :uom-dropdown="uomDropdown"
      :bom-dropdown="bomDropdown"
      :next-sequence="nextSequence"
      :loading="saving"
      @save="handleDetailSave"
    />
  </div>
</template>