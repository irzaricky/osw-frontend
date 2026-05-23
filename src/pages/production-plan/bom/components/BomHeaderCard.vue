<script setup lang="ts">
import type { PartDropdown } from '../../../../types/master-data/parts'

interface Props {
  isCreate:             boolean
  createStep:           1 | 2
  isEditable:           boolean
  saving:               boolean
  currentBom?:          any
  headerForm:           { description: string; uom_id?: number; notes: string }
  selectedParentPart:   PartDropdown | null
  partSearch:           string
  filteredParentParts:  PartDropdown[]
  uomItems:             { label: string; value: number }[]
  selectedUomId?:       number
}

const props = defineProps<Props>()
const emit  = defineEmits<{
  'update:headerForm':          [v: Props['headerForm']]
  'update:selectedParentPart':  [v: PartDropdown | null]
  'update:partSearch':          [v: string]
  'update:selectedUomId':       [v: number | null]
  proceedToDetails:             []
}>()

function setDesc(v: string)    { emit('update:headerForm', { ...props.headerForm, description: v }) }
function setNotes(v: string)   { emit('update:headerForm', { ...props.headerForm, notes: v }) }
function setUomId(v: number | null) { emit('update:selectedUomId', v) }
</script>

<template>
  <div class="bg-default border border-default rounded-xl overflow-hidden">
    <!-- Card header -->
    <div class="flex items-center gap-2 px-5 py-4 border-b border-default">
      <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary" />
      <h2 class="font-semibold text-sm">
        BOM Information
      </h2>

      <!-- Create: step indicator -->
      <!-- <div v-if="isCreate" class="ml-auto flex items-center gap-2 text-xs text-muted">
        <span
          :class="[
            'flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
            createStep >= 1 ? 'bg-primary text-white' : 'bg-elevated',
          ]"
        >1</span>
        <span>Header</span>
        <UIcon name="i-lucide-chevron-right" class="w-3 h-3" />
        <span
          :class="[
            'flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
            createStep >= 2 ? 'bg-primary text-white' : 'bg-elevated text-muted',
          ]"
        >2</span>
        <span :class="createStep >= 2 ? '' : 'text-muted/60'">Components</span>
      </div> -->
    </div>

    <div class="p-5 space-y-5">
      <!-- Parent part selector (create only) -->
      <UFormField v-if="isCreate" label="Parent Part" required>
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
              v-if="createStep === 1"
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              type="button"
              @click="emit('update:selectedParentPart', null); emit('update:partSearch', '')"
            />
          </div>

          <template v-if="!selectedParentPart && createStep === 1">
            <UInput
              :model-value="partSearch"
              icon="i-lucide-search"
              placeholder="Search part number or name..."
              class="w-full sm:w-96"
              :disabled="saving"
              @update:model-value="emit('update:partSearch', $event)"
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
                @click="emit('update:selectedParentPart', part); emit('update:partSearch', '')"
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
        class="rounded-lg border border-default bg-elevated px-3 py-2.5"
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

      <!-- Editable fields -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            :model-value="selectedUomId"
            :items="uomItems"
            value-key="value"
            label-key="label"
            placeholder="Select UOM..."
            class="w-full"
            clearable
            :disabled="true"
            @update:model-value="setUomId"
          />
        </UFormField>
        <UFormField label="Notes" class="sm:col-span-2">
          <UTextarea
            :model-value="headerForm.notes"
            placeholder="Optional notes..."
            class="w-full"
            :rows="2"
            :disabled="!isEditable || saving"
            @update:model-value="setNotes"
          />
        </UFormField>
      </div>

      <!-- Create step 1: proceed button -->
      <div v-if="isCreate && createStep === 1" class="flex justify-end pt-1">
        <UButton
          label="Create BOM"
          icon-position="trailing"
          color="primary"
          size="sm"
          :disabled="!selectedParentPart"
          @click="emit('proceedToDetails')"
        />
      </div>
    </div>

    <!-- Slot untuk BomComponentsSection -->
    <slot />
  </div>
</template>