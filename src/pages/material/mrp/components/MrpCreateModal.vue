<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useMrpStore } from '../../../../stores/material/mrp.store'
import type { Mrp, SalesPlanLoadData } from '../../../../types/material/mrp'

const formRef = ref()
const store = useMrpStore()

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  mrp: Partial<Mrp>
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: any]
}>()

// ─── Schema ──────────────────────────────────────────────────────────────────
const addSchema = z.object({
  description: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().optional()
})

const editSchema = z.object({
  description: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().optional()
})

const schema = computed(() => props.mode === 'add' ? addSchema : editSchema)

// ─── State ────────────────────────────────────────────────────────────────────
const state = reactive<{
  spr_id: number | undefined
  description: string
  priority: string
  notes: string
  save_as_draft: boolean
}>({
  spr_id: undefined,
  description: '',
  priority: '',
  notes: '',
  save_as_draft: true
})

// Detail items state (for add mode)
const detailItems = ref<{
  part_id: number
  qty: number
  bom_id?: number
  notes?: string
  part_number?: string
  part_name?: string
  uom_code?: string
  stock_on_hand?: number
  current_safety_stock?: number
  target_safety_stock?: number
  gross_requirement?: number
  net_requirement?: number
}[]>([])

const loadedSalesPlanData = ref<SalesPlanLoadData | null>(null)
const isLoadingSalesPlan = ref(false)
const selectedBomInfo = ref<{ display_label: string } | null>(null)

// ─── Sync edit data ───────────────────────────────────────────────────────────
watch(
  () => props.mrp,
  (val) => {
    state.spr_id = val.spr_id ?? undefined
    state.description = val.description ?? ''
    state.priority = val.priority ?? ''
    state.notes = val.notes ?? ''
    state.save_as_draft = true
  },
  { immediate: true, deep: true }
)

// ─── Reset on add open ────────────────────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.mode === 'add') {
      state.spr_id = undefined
      state.description = ''
      state.priority = ''
      state.notes = ''
      state.save_as_draft = true
      detailItems.value = []
      loadedSalesPlanData.value = null
      selectedBomInfo.value = null
    }
  }
)

// ─── Dropdowns ───────────────────────────────────────────────────────────────
const salesPlanItems = computed(() => store.salesPlansDropdown.map(s => s.spr_number))
const selectedSalesPlan = computed({
  get: () => store.salesPlansDropdown.find(s => s.id === state.spr_id)?.spr_number,
  set: async (val) => {
    const found = store.salesPlansDropdown.find(s => s.spr_number === val)
    state.spr_id = found?.id
    if (found?.id) {
      await loadSalesPlanData(found.id)
    } else {
      detailItems.value = []
      loadedSalesPlanData.value = null
    }
  }
})

const priorityItems = computed(() => store.priorityDropdown)

// Parts dropdown for manual add
const partsItems = computed(() => store.partsDropdown.map(p => p.part_name))

// ─── Load Sales Plan Data ─────────────────────────────────────────────────────
async function loadSalesPlanData(sprId: number) {
  isLoadingSalesPlan.value = true
  try {
    const data = await store.loadSalesPlan(sprId)
    loadedSalesPlanData.value = data

    // Simpan info BOM utama untuk field disabled di form
    selectedBomInfo.value = data?.primary_bom ?? null

    if (data?.suggestedDetails && data.suggestedDetails.length > 0) {
      detailItems.value = data.suggestedDetails.map(d => ({
        part_id: d.part_id,
        qty: d.net_requirement ?? d.qty,
        bom_id: d.bom_id,
        part_number: d.part?.part_number,
        part_name: d.part?.part_name,
        uom_code: d.part?.uom?.code,
        stock_on_hand: d.stock_on_hand ?? 0,
        current_safety_stock: d.current_safety_stock ?? 0,
        target_safety_stock: d.target_safety_stock ?? 50,
        gross_requirement: d.gross_requirement ?? d.qty,
        net_requirement: d.net_requirement ?? d.qty,
      }))
    } else {
      // suggestedDetails kosong — BOM tidak ditemukan atau tidak ada komponen RAW di semua level
      detailItems.value = []
      console.warn('[MRP] loadSalesPlanData: suggestedDetails kosong setelah BOM explosion. Cek apakah BOM sudah di-approve dan mengandung part RAW di level manapun.')
    }
  } catch (err) {
    console.error('[MRP] loadSalesPlanData error:', err)
    detailItems.value = []
    loadedSalesPlanData.value = null
  } finally {
    isLoadingSalesPlan.value = false
  }
}

// ─── Manual Part Add ─────────────────────────────────────────────────────────
const newPartName = ref('')
const newPartQty = ref(0)

function addManualPart() {
  const found = store.partsDropdown.find(p => p.part_name === newPartName.value)
  if (!found) return
  if (detailItems.value.find(d => d.part_id === found.id)) return

  detailItems.value.push({
    part_id: found.id,
    qty: newPartQty.value || 1,
    part_number: found.part_number,
    part_name: found.part_name,
    uom_code: found.uom?.code
  })
  newPartName.value = ''
  newPartQty.value = 0
}

function removeDetailItem(partId: number) {
  detailItems.value = detailItems.value.filter(d => d.part_id !== partId)
}

// ─── Submit ───────────────────────────────────────────────────────────────────
function submitForm() {
  formRef.value?.submit()
}

function onSubmit(event: FormSubmitEvent<any>) {
  if (props.mode === 'add') {
    // 1. Filter detail: HANYA ambil yang Qty-nya lebih dari 0
    const validDetails = detailItems.value
      .filter(d => (d.qty || 0) > 0)
      .map(d => ({
        part_id: d.part_id,
        qty: d.qty,
        bom_id: d.bom_id,
        notes: d.notes
      }))

    // 2. Cegah submit kalau ternyata kosong (stok aman semua)
    if (validDetails.length === 0) {
      alert('Cannot save! All materials have sufficient stock (Net Req = 0).')
      return 
    }

    emit('save', {
      spr_id: state.spr_id,
      description: event.data.description,
      priority: state.priority || undefined,
      notes: state.notes || undefined,
      save_as_draft: state.save_as_draft,
      // 3. Kirim payload yang sudah bersih dari Qty 0
      details: validDetails
    })
  } else {
    emit('save', {
      description: event.data.description,
      priority: state.priority || undefined,
      notes: state.notes || undefined,
      save_as_draft: state.save_as_draft
    })
  }
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="props.mode === 'add' ? 'Create MRP' : 'Edit MRP'"
    :description="props.mode === 'add'
      ? 'Create a new Material Requirements Planning document.'
      : 'Update MRP header information.'"
    class="sm:max-w-3xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <!-- Sales Plan (Add only) -->
        <template v-if="mode === 'add'">
          <UFormField label="Sales Plan" name="spr_id" required>
            <div class="flex gap-2">
              <USelectMenu
                v-model="selectedSalesPlan"
                :items="salesPlanItems"
                class="flex-1"
                placeholder="Select approved sales plan"
                searchable
                clear
              />
              <UButton
                v-if="state.spr_id && !isLoadingSalesPlan"
                icon="i-lucide-refresh-cw"
                color="neutral"
                variant="ghost"
                size="sm"
                @click="loadSalesPlanData(state.spr_id!)"
              />
            </div>
          </UFormField>

          <!-- Loading indicator -->
          <div v-if="isLoadingSalesPlan" class="flex items-center gap-2 text-sm text-muted">
            <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
            Loading sales plan data...
          </div>

          <!-- BOM utama (read-only) — muncul setelah SPR dipilih dan data berhasil dimuat -->
          <UFormField
            v-if="selectedBomInfo"
            label="BOM"
            name="bom_display"
            hint="Auto-filled from selected sales plan"
          >
            <UInput
              :model-value="selectedBomInfo.display_label"
              class="w-full"
              disabled
              :ui="{ base: 'cursor-not-allowed opacity-70' }"
            />
          </UFormField>

          <!-- Loaded Sales Plan Info -->
          <div
            v-if="loadedSalesPlanData && !isLoadingSalesPlan"
          >
            <!-- Sukses: ada material ditemukan -->
            <div
              v-if="detailItems.length > 0"
              class="flex items-start gap-3 p-3 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20"
            >
              <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div class="text-sm">
                <p class="font-medium text-primary-700 dark:text-primary-300">
                  Sales plan loaded — {{ detailItems.length }} material(s) suggested from BOM
                </p>
                <p class="text-primary-600 dark:text-primary-400 mt-0.5 text-xs">
                  You can adjust quantities or add/remove materials below.
                </p>
              </div>
            </div>
            <!-- Warning: BOM tidak menghasilkan RAW material -->
            <div
              v-else
              class="flex items-start gap-3 p-3 rounded-lg border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20"
            >
              <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-warning-500 mt-0.5 shrink-0" />
              <div class="text-sm">
                <p class="font-medium text-warning-700 dark:text-warning-300">
                  No RAW materials found from BOM
                </p>
                <p class="text-warning-600 dark:text-warning-400 mt-0.5 text-xs">
                  The selected sales plan's products may not have an approved BOM, or the BOM does not contain any RAW type components. Please add materials manually.
                </p>
              </div>
            </div>
          </div>
        </template>

        <!-- Description -->
        <UFormField label="Description" name="description">
          <UInput
            v-model="state.description"
            placeholder="Enter MRP description..."
            class="w-full"
          />
        </UFormField>

        <!-- Priority & Notes -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Priority" name="priority">
            <USelectMenu
              v-model="state.priority"
              :items="priorityItems"
              class="w-full"
              placeholder="Select priority"
              clear
            />
          </UFormField>
          <UFormField label="Notes" name="notes">
            <UInput
              v-model="state.notes"
              placeholder="Additional notes..."
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Detail Items (Add Mode) -->
        <template v-if="mode === 'add'">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold">
                Material Details
              </p>
              <UBadge color="neutral" variant="subtle" size="xs">
                {{ detailItems.length }} item(s)
              </UBadge>
            </div>

            <!-- Detail table -->
            <div class="border border-default rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-elevated/50">
                  <tr>
                    <th class="text-left p-2.5 font-medium text-muted text-xs">
                      Part
                    </th>
                    <th class="text-center p-2.5 font-medium text-muted text-xs w-24">
                      Gross Req.
                    </th>
                    <th class="text-center p-2.5 font-medium text-muted text-xs w-24">
                      On-Hand
                    </th>
                    <th class="text-center p-2.5 font-medium text-muted text-xs w-24">
                      Safety Stk
                    </th>
                    <th class="text-center p-2.5 font-medium text-muted text-xs w-24">
                      Target Safety
                    </th>
                    <th class="text-center p-2.5 font-medium text-muted text-xs w-28">
                      Net Req. (Order Qty)
                    </th>
                    <th class="text-center p-2.5 font-medium text-muted text-xs w-10" />
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="detailItems.length === 0">
                    <td colspan="7" class="p-6 text-center text-muted text-xs">
                      No materials added yet. Select a sales plan or add manually below.
                    </td>
                  </tr>
                  <tr
                    v-for="item in detailItems"
                    :key="item.part_id"
                    class="border-t border-default hover:bg-elevated/20"
                  >
                    <!-- Part info -->
                    <td class="p-2.5">
                      <div class="font-medium">
                        {{ item.part_number }}
                      </div>
                      <div class="text-xs text-muted">
                        {{ item.part_name }}
                      </div>
                    </td>
                    <!-- Gross Requirement -->
                    <td class="p-2.5 text-center text-xs text-muted">
                      {{ item.gross_requirement ?? '—' }}
                    </td>
                    <!-- On-Hand Stock (dari inventori) -->
                    <td class="p-2.5 text-center text-xs">
                      <span :class="(item.stock_on_hand ?? 0) === 0 ? 'text-error-500 font-medium' : 'text-success-600 dark:text-success-400'">
                        {{ item.stock_on_hand ?? 0 }}
                      </span>
                    </td>
                    <!-- Current Safety Stock (dari s_parts) -->
                    <td class="p-2.5 text-center text-xs text-muted">
                      {{ item.current_safety_stock ?? 0 }}
                    </td>
                    <!-- Target Safety Stock (hardcoded 50) -->
                    <td class="p-2.5 text-center text-xs text-muted">
                      {{ item.target_safety_stock ?? 50 }}
                    </td>
                    <!-- Net Requirement — editable, default = net_requirement -->
                    <td class="p-2 text-center">
                      <UTooltip
                        :text="`${item.gross_requirement} + ${item.target_safety_stock} − (${item.stock_on_hand} + ${item.current_safety_stock})`"
                        :delay-duration="300"
                      >
                        <UInput
                          v-model.number="item.qty"
                          type="number"
                          size="sm"
                          min="0"
                          class="max-w-[90px] mx-auto"
                          :color="item.qty === item.net_requirement ? 'primary' : 'neutral'"
                        />
                      </UTooltip>
                    </td>
                    <td class="p-2 text-center">
                      <UButton
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="ghost"
                        size="xs"
                        @click="removeDetailItem(item.part_id)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Formula legend -->
            <p class="text-xs text-muted mt-1">
              <span class="font-medium">Net Req.</span> = Gross Req. + Target Safety (50) − (On-Hand + Safety Stk).
              Hover over Order Qty to see the calculation details.
            </p>

            <!-- Manual part add row -->
            <div class="flex gap-2 items-end">
              <UFormField label="Add Part Manually" class="flex-1">
                <USelectMenu
                  v-model="newPartName"
                  :items="partsItems"
                  placeholder="Search part..."
                  searchable
                  clear
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Qty" class="w-24">
                <UInput
                  v-model.number="newPartQty"
                  type="number"
                  min="1"
                  placeholder="Qty"
                />
              </UFormField>
              <UButton
                icon="i-lucide-plus"
                color="neutral"
                variant="outline"
                :disabled="!newPartName"
                @click="addManualPart"
              >
                Add
              </UButton>
            </div>
          </div>
        </template>

        <!-- Save mode toggle -->
        <div class="flex items-center gap-3 pt-1">
          <UCheckbox v-model="state.save_as_draft" />
          <div>
            <p class="text-sm font-medium">
              Save as Draft
            </p>
            <p class="text-xs text-muted">
              Uncheck to directly submit to Supervisor for review.
            </p>
          </div>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="close"
        />
        <UButton
          color="primary"
          :label="state.save_as_draft ? 'Save as Draft' : 'Submit'"
          :icon="state.save_as_draft ? 'i-lucide-save' : 'i-lucide-send'"
          :loading="props.loading"
          @click="submitForm"
        />
      </div>
    </template>
  </UModal>
</template>