<script setup lang="ts">
import { computed } from 'vue'
import { useBomForm } from './composables/useBomForm'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import BomPageHeader from './components/BomPageHeader.vue'
import BomInfoBar from './components/BomInfoBar.vue'
import BomHeaderCard from './components/BomHeaderCard.vue'
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
  // step
  createStep,
  // status helpers
  docStatusColor, isEditable, fmtDate,
  // header form
  headerForm, partSearch, selectedParentPart,
  filteredParentParts, uomItems, selectedUomId,
  // details
  localDetails, isDirty, nextSequence,
  discardChanges, resolveDetailUomCode,
  // detail modal
  isDetailModalOpen, detailModalMode, editingDetail,
  openAddDetail, openEditDetail, handleDetailSave,
  // delete confirm
  deleteConfirm, confirmDeleteDetail, executeDeleteDetail,
  // actions
  handleProceedToDetails, handleSave,
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

// Show components section when: create step 2, or edit mode (regardless of editable)
const showComponents = computed(
  () => (isCreate.value && createStep.value === 2) || (!isCreate.value && !!currentBom.value),
)
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
    <UAlert
      v-if="!isCreate && currentBom?.doc_status === 'Approved' && currentBom.approver"
      color="success"
      variant="soft"
      icon="i-lucide-check-circle-2"
      :title="`Approved by ${currentBom.approver.email}`"
      :description="fmtDate(currentBom.approved_at)"
    />

    <!-- Header card + components section -->
    <BomHeaderCard
      :is-create="isCreate"
      :create-step="createStep"
      :is-editable="isEditable"
      :saving="saving"
      :current-bom="currentBom"
      :header-form="headerForm"
      :selected-parent-part="selectedParentPart"
      :part-search="partSearch"
      :filtered-parent-parts="filteredParentParts"
      :uom-items="uomItems"
      :selected-uom-id="selectedUomId"
      @update:header-form="Object.assign(headerForm, $event)"
      @update:selected-parent-part="selectedParentPart = $event"
      @update:part-search="partSearch = $event"
      @update:selected-uom-id="selectedUomId = $event"
      @proceed-to-details="handleProceedToDetails"
    >
      <!-- Components section is slotted into the card -->
      <BomComponentsSection
        v-if="showComponents"
        :local-details="localDetails"
        :loading="loading"
        :saving="saving"
        :is-dirty="isDirty"
        :is-create="isCreate"
        :is-editable="isEditable"
        :current-bom="currentBom"
        :resolve-uom-code="resolveDetailUomCode"
        @add-detail="openAddDetail"
        @edit-detail="openEditDetail"
        @delete-detail="confirmDeleteDetail"
        @save="handleSave"
        @discard="discardChanges"
      />
    </BomHeaderCard>

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