<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import { format } from 'date-fns'
import { CalendarDate } from '@internationalized/date'
import { useSpoStore } from '../../../../stores/sales/spo.store'
import type { SprDropdownItem } from '../../../../types/sales/spo'
import LocationPicker from '../../../../components/LocationPicker.vue'

const store = useSpoStore()

const props = defineProps<{
  open: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: FormData]
}>()

// ─── State ────────────────────────────────────────────────────────────────────
const state = reactive({
  spr_id: undefined as number | undefined,
  customer_id: undefined as number | undefined,
  shipping_address: '',
  spo_date: format(new Date(), 'yyyy-MM-dd'),
  delivery_due_date: ''
})

const poFile = ref<File | null>(null)
const fileInputKey = ref(0)

const isMapOpen = ref(false)

// ─── SPR Selection ────────────────────────────────────────────────────────────
const selectedSpr = ref<SprDropdownItem | null>(null)

const sprItems = computed(() =>
  store.sprDropdown.map(s => ({
    label: `${s.spr_number} — ${s.spr_name}`,
    value: s.id
  }))
)

const selectedSprLabel = computed({
  get: () => {
    if (!state.spr_id) return undefined
    return sprItems.value.find(s => s.value === state.spr_id)?.label
  },
  set: (label: string | undefined) => {
    if (!label) {
      state.spr_id = undefined
      selectedSpr.value = null
      state.customer_id = undefined
      previewDetails.value = []
      return
    }
    const item = sprItems.value.find(s => s.label === label)
    if (item) {
      state.spr_id = item.value
      const sprData = store.sprDropdown.find(s => s.id === item.value) ?? null
      selectedSpr.value = sprData
      // Reactive fill details
      previewDetails.value = sprData?.details?.map(d => ({
        part_number: d.part?.part_number ?? '-',
        part_name: d.part?.part_name ?? '-',
        qty: d.qty
      })) ?? []
      // Handle customer auto-fill for Automatic SPR
      if (sprData?.source === 'Automatic' && sprData.forecast?.customer_id) {
        state.customer_id = sprData.forecast.customer_id
      } else {
        state.customer_id = undefined
      }
      // Populate dates from SPR
      if (sprData?.required_date) {
        state.spo_date = sprData.required_date.substring(0, 10)
      }
      if (sprData?.request_date) {
        state.delivery_due_date = sprData.request_date.substring(0, 10)
      }
    }
  }
})

const isAutomaticSpr = computed(() => selectedSpr.value?.source === 'Automatic')

// ─── Customer Dropdown ────────────────────────────────────────────────────────
const customerItems = computed(() =>
  store.customersDropdown.map(c => ({
    label: `${c.name} (${c.customer_code})`,
    value: c.id
  }))
)

const selectedCustomerLabel = computed({
  get: () => {
    if (!state.customer_id) return undefined
    return customerItems.value.find(c => c.value === state.customer_id)?.label
  },
  set: (label: string | undefined) => {
    if (!label) { state.customer_id = undefined; return }
    const item = customerItems.value.find(c => c.label === label)
    if (item) state.customer_id = item.value
  }
})

// ─── Preview Details ──────────────────────────────────────────────────────────
const previewDetails = ref<{ part_number: string; part_name: string; qty: number }[]>([])

const dueDatePickerModel = computed({
  get() {
    if (!state.delivery_due_date) return null
    const [y, m, d] = state.delivery_due_date.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) {
      state.delivery_due_date = ''
      return
    }
    const yyyy = val.year
    const mm = String(val.month).padStart(2, '0')
    const dd = String(val.day).padStart(2, '0')
    state.delivery_due_date = `${yyyy}-${mm}-${dd}`
  }
})

const monthNames = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember']

function formatDateIndo(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = monthNames[d.getMonth()]
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

// ─── Reset on open ────────────────────────────────────────────────────────────
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    state.spr_id = undefined
    state.customer_id = undefined
    state.shipping_address = ''
    state.spo_date = format(new Date(), 'yyyy-MM-dd')
    state.delivery_due_date = ''
    selectedSpr.value = null
    previewDetails.value = []
    poFile.value = null
    fileInputKey.value++
    store.fetchSprDropdown()
    store.fetchDropdownCustomers()
  }
})

// ─── Submit ───────────────────────────────────────────────────────────────────
const formError = ref('')

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      formError.value = 'Please select a valid PDF file.'
      poFile.value = null
      fileInputKey.value++
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      formError.value = 'File size exceeds the 5MB limit.'
      poFile.value = null
      fileInputKey.value++
      return
    }
    poFile.value = file
    formError.value = ''
  }
}

function submit() {
  formError.value = ''
  if (!state.spr_id) { formError.value = 'Please select an SPR.'; return }
  if (!state.customer_id) { formError.value = 'Please select a customer.'; return }
  if (!state.shipping_address.trim()) { formError.value = 'Shipping address is required.'; return }
  if (!state.spo_date) { formError.value = 'SPO date is required.'; return }
  if (!state.delivery_due_date) { formError.value = 'Due date is required.'; return }
  if (!poFile.value) { formError.value = 'Customer PO Document is required.'; return }

  const spoDate = new Date(state.spo_date);
  const dueDate = new Date(state.delivery_due_date);
  if (dueDate >= spoDate) {
    formError.value = 'Delivery due date must be before SPO date.';
    return;
  }

  const formData = new FormData()
  formData.append('spr_id', String(state.spr_id))
  formData.append('customer_id', String(state.customer_id))
  formData.append('shipping_address', state.shipping_address)
  formData.append('spo_date', state.spo_date)
  formData.append('delivery_due_date', state.delivery_due_date)
  formData.append('po_document', poFile.value)

  emit('save', formData)
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Generate SPO"
    description="Create a Sales Purchase Order from an Approved SPR."
    class="sm:max-w-2xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-5">
        <!-- Alert Error -->
        <div v-if="formError" class="flex items-center gap-2 p-3 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 text-sm">
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
          {{ formError }}
        </div>

        <!-- SPR Selection -->
        <UFormField label="SPR Reference" required>
          <USelectMenu
            v-model="selectedSprLabel"
            :items="sprItems.map(s => s.label)"
            placeholder="Select an Approved SPR..."
            searchable
            clear
            class="w-full"
          />
          <template v-if="selectedSpr" #help>
            <span class="text-xs text-muted">
              Source: <span :class="selectedSpr.source === 'Automatic' ? 'text-info-600 dark:text-info-400' : 'text-neutral-500'">{{ selectedSpr.source }}</span>
            </span>
          </template>
        </UFormField>

        <!-- Customer -->
        <UFormField label="Customer" required>
          <!-- Automatic SPR: readonly display -->
          <div v-if="isAutomaticSpr && state.customer_id" class="flex items-center gap-2 px-3 py-2 rounded-lg border border-default bg-elevated/40 text-sm">
            <UIcon name="i-lucide-lock" class="w-3.5 h-3.5 text-muted shrink-0" />
            <span class="font-medium">
              {{ customerItems.find(c => c.value === state.customer_id)?.label || `Customer #${state.customer_id}` }}
            </span>
            <UBadge
              color="info"
              variant="subtle"
              size="xs"
              class="ml-auto"
            >
              Auto-filled
            </UBadge>
          </div>
          <!-- Manual SPR: dropdown -->
          <USelectMenu
            v-else
            v-model="selectedCustomerLabel"
            :items="customerItems.map(c => c.label)"
            placeholder="Select customer..."
            searchable
            clear
            class="w-full"
          />
        </UFormField>

        <!-- Customer PO Document -->
        <UFormField label="Customer PO Document" required help="Accepted format: PDF (Max size: 5MB)">
          <input
            :key="fileInputKey"
            type="file"
            accept="application/pdf"
            required
            class="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/95 cursor-pointer"
            @change="handleFileChange($event)"
          >
        </UFormField>

        <!-- Shipping Address -->
        <UFormField label="Shipping Address" required>
          <div class="space-y-2">
            <UTextarea
              v-model="state.shipping_address"
              placeholder="Enter delivery address..."
              class="w-full"
              :rows="2"
            />
            <UButton
              icon="i-lucide-map"
              label="Pick Location"
              color="neutral"
              variant="subtle"
              size="xs"
              @click="isMapOpen = true"
            />
          </div>
        </UFormField>

        <!-- Map Picker Modal -->
        <LocationPicker
          v-model="state.shipping_address"
          v-model:open="isMapOpen"
        />

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="SPO Date" required>
            <div class="flex items-center gap-2 px-3 py-2 rounded-lg border border-default bg-elevated/40 text-sm">
              <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-muted shrink-0" />
              <span class="font-medium">{{ formatDateIndo(state.spo_date) }}</span>
            </div>
          </UFormField>
          <UFormField label="Delivery Due Date" required>
            <UInputDate v-model="dueDatePickerModel">
              <template #trailing>
                <UPopover>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-calendar"
                    class="px-0"
                  />
                  <template #content>
                    <UCalendar
                      v-model="dueDatePickerModel"
                      class="p-2"
                    />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>
        </div>

        <!-- Items Preview Table -->
        <div v-if="previewDetails.length > 0" class="space-y-2">
          <label class="text-sm font-medium flex items-center gap-1.5">
            <UIcon name="i-lucide-package" class="w-3.5 h-3.5 text-primary" />
            Items from SPR
            <UBadge color="neutral" variant="subtle" size="xs">{{ previewDetails.length }}</UBadge>
          </label>
          <div class="overflow-hidden border border-default rounded-lg">
            <table class="w-full text-sm">
              <thead class="bg-elevated/50 border-b border-default">
                <tr>
                  <th class="p-2.5 text-left font-medium">
                    #
                  </th>
                  <th class="p-2.5 text-left font-medium">
                    Product Number
                  </th>
                  <th class="p-2.5 text-left font-medium">
                    Part Name
                  </th>
                  <th class="p-2.5 text-center font-medium w-24">
                    Qty
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, idx) in previewDetails"
                  :key="idx"
                  class="border-b border-default last:border-b-0"
                >
                  <td class="p-2.5 text-muted text-xs">
                    {{ idx + 1 }}
                  </td>
                  <td class="p-2.5 font-mono text-xs font-medium">
                    {{ item.part_number }}
                  </td>
                  <td class="p-2.5 text-sm">
                    {{ item.part_name }}
                  </td>
                  <td class="p-2.5 text-center font-semibold font-mono">
                    {{ item.qty.toLocaleString() }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="state.spr_id" class="flex items-center gap-2 p-3 rounded-lg bg-elevated/30 border border-default text-sm text-muted">
          <UIcon name="i-lucide-package-open" class="w-4 h-4 shrink-0" />
          No items found in this SPR.
        </div>
      </div>
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
          icon="i-lucide-file-plus"
          label="Generate SPO"
          :loading="props.loading"
          @click="submit"
        />
      </div>
    </template>
  </UModal>
</template>
