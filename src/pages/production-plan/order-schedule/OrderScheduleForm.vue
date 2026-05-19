<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useOrderScheduleStore } from '../../../stores/production-plan/order-schedule.store'
import { useProductionPlanStore } from '../../../stores/production-plan/plan.store'
import { useAppToast } from '../../../composables/useAppToast'
import { poStatusLabel, poStatusColor, priorityColor } from './composables/useOrderScheduleColumns'
import type {
  POStatus,
  POPriority,
  POProduct,
  POSchedule,
  AddSchedulePayload,
  UpdateSchedulePayload,
  CreatePOPayload,
} from '../../../types/production-plan/order-schedule'
import type { PlanDetail } from '../../../types/production-plan/plan'

import Breadcrumbs    from '../../../components/Breadcrumbs.vue'
import ConfirmDialog  from '../../../components/ConfirmDialog.vue'
import RejectDialog   from '../../../components/RejectDialog.vue'
import OrderInfoCard  from './components/OrderInfoCard.vue'
import OrderTabsSection from './components/OrderTabsSection.vue'
import ScheduleModal  from './components/ScheduleModal.vue'
import RescheduleModal from './components/RescheduleModal.vue'

// ── Router & Stores ───────────────────────────────────────────────────────────

const router     = useRouter()
const route      = useRoute()
const orderStore = useOrderScheduleStore()
const planStore  = useProductionPlanStore()
const { currentOrder, loading, saving } = storeToRefs(orderStore)
const { dropdown: planDropdown }        = storeToRefs(planStore)
const { toastSuccess, toastError }      = useAppToast()

// ── Mode ──────────────────────────────────────────────────────────────────────

const isCreate = computed(() => route.name === 'order-schedule-create')
const orderId  = computed(() => route.params.id ? Number(route.params.id) : null)

const isEditable = computed(() =>
  !isCreate.value &&
  (currentOrder.value?.status === 'Draft' || currentOrder.value?.status === 'Rejected'),
)

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Production Order', to: '/production-plan/order-schedule' },
  { label: isCreate.value ? 'Create New Order' : 'Order Details' },
])

// ── Create Form ───────────────────────────────────────────────────────────────

const createForm = reactive({
  plan_id:               null as number | null,
  production_start_date: '',
  production_end_date:   '',
  priority:              'Medium' as POPriority,
  po_description:        '',
  notes:                 '',
})

// Plan details loaded when plan is selected in create mode
const planDetails      = ref<PlanDetail[]>([])
const loadingPlanData  = ref(false)
const selectedPlan     = ref<any>(null)

async function loadPlanDetails() {
  if (!createForm.plan_id) { planDetails.value = []; return }
  loadingPlanData.value = true
  try {
    const res = await planStore.fetchPlan(createForm.plan_id)
    if (res?.data) {
      selectedPlan.value  = res.data
      planDetails.value   = res.data.details ?? []
    }
  } catch (e) {
    toastError(e)
  } finally {
    loadingPlanData.value = false
  }
}

watch(() => createForm.plan_id, () => loadPlanDetails())

// Selected product lines for PO creation (from plan details)
// Each entry maps plan_detail_id → { line_id }
const selectedLineMap = reactive<Record<number, number | null>>({})

const createProducts = computed((): CreatePOPayload['products'] => {
  return planDetails.value
    .filter((d) => selectedLineMap[d.id] != null)
    .map((d) => ({
      plan_detail_id: d.id,
      customer_id:    d.customer_id,
      part_id:        d.part_id,
      line_id:        selectedLineMap[d.id]!,
      delivery_date:  d.delivery_date,
      planned_qty:    d.qty_request,
    }))
})

const priorityItems: POPriority[] = ['Low', 'Medium', 'High', 'Critical']

// Shifts: ideally fetched from master data. Placeholder for now.
const shifts = ref<{ id: number; name: string; start_time: string; end_time: string }[]>([])

// ── Schedule Modal ────────────────────────────────────────────────────────────

const scheduleModal = reactive({
  open:      false,
  product:   null as POProduct | null,
  schedule:  null as POSchedule | null,
})

function openAddSchedule(product: POProduct) {
  scheduleModal.product  = product
  scheduleModal.schedule = null
  scheduleModal.open     = true
}

function openEditSchedule(product: POProduct, schedule: POSchedule) {
  scheduleModal.product  = product
  scheduleModal.schedule = schedule
  scheduleModal.open     = true
}

async function handleSaveSchedule(payload: AddSchedulePayload | UpdateSchedulePayload) {
  if (!orderId.value || !scheduleModal.product) return
  try {
    if (scheduleModal.schedule) {
      // Edit
      const res = await orderStore.updateSchedule(
        orderId.value,
        scheduleModal.product.id,
        scheduleModal.schedule.id,
        payload as UpdateSchedulePayload,
      )
      toastSuccess(res.message || 'Schedule updated')
    } else {
      // Add
      const res = await orderStore.addSchedule(
        orderId.value,
        scheduleModal.product.id,
        payload as AddSchedulePayload,
      )
      toastSuccess(res.message || 'Schedule added')
    }
    scheduleModal.open = false
    await orderStore.fetchOrder(orderId.value)
  } catch (e) {
    toastError(e)
  }
}

// ── Reschedule Modal ──────────────────────────────────────────────────────────

const rescheduleModal = ref(false)

async function handleReschedule(payload: any) {
  if (!orderId.value) return
  try {
    const res = await orderStore.reschedule(orderId.value, payload)
    toastSuccess(res.message || 'Rescheduled successfully')
    rescheduleModal.value = false
    await orderStore.fetchOrder(orderId.value)
  } catch (e) {
    toastError(e)
  }
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

const confirm = reactive({
  open:         false,
  title:        '',
  description:  '',
  confirmLabel: 'Confirm',
  confirmColor: 'primary' as 'primary' | 'error' | 'warning' | 'success',
  action:       null as (() => Promise<void>) | null,
})

const rejectDialog = reactive({
  open:        false,
  title:       'Reject Production Order',
  description: 'Please provide the reason for rejection.',
})

function openConfirm(opts: {
  title: string
  description: string
  confirmLabel?: string
  confirmColor?: typeof confirm.confirmColor
  action: () => Promise<void>
}) {
  confirm.title        = opts.title
  confirm.description  = opts.description
  confirm.confirmLabel = opts.confirmLabel ?? 'Confirm'
  confirm.confirmColor = opts.confirmColor ?? 'primary'
  confirm.action       = opts.action
  confirm.open         = true
}

// ── Formatting Helpers ────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtNum(n?: number | null) {
  if (n == null) return '-'
  return n.toLocaleString('en-US')
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function handleCreate() {
  if (!createForm.plan_id || createProducts.value.length === 0) {
    toastError('Select a plan and at least one product.')
    return
  }
  try {
    const res = await orderStore.createOrder({
      plan_id:               createForm.plan_id!,
      production_start_date: createForm.production_start_date,
      production_end_date:   createForm.production_end_date,
      priority:              createForm.priority,
      po_description:        createForm.po_description || null,
      notes:                 createForm.notes || null,
      products:              createProducts.value,
    })
    toastSuccess(res.message || 'Production Order created')
    await nextTick()
    router.push({ name: 'order-schedule-detail', params: { id: res.data.id } })
  } catch (e) {
    toastError(e)
  }
}

async function handleUpdateHeader() {
  if (!orderId.value) return
  try {
    await orderStore.updateOrder(orderId.value, {
      priority:        createForm.priority,
      po_description:  createForm.po_description || null,
      notes:           createForm.notes || null,
    })
    confirm.open = false
    toastSuccess('Production Order updated')
  } catch (e) {
    toastError(e)
  }
}

async function handleRelease() {
  if (!orderId.value) return
  try {
    const res = await orderStore.release(orderId.value)
    toastSuccess(res.message || 'Production Order released')
    confirm.open = false
    await orderStore.fetchOrder(orderId.value)
  } catch (e) {
    toastError(e)
    confirm.open = false
  }
}

async function handleReject(reason: string) {
  if (!orderId.value) return
  try {
    const res = await orderStore.reject(orderId.value, { reason })
    toastSuccess(res.message || 'Production Order rejected')
    rejectDialog.open = false
    await orderStore.fetchOrder(orderId.value)
  } catch (e) {
    toastError(e)
  }
}

async function handleCancel(reason: string) {
  if (!orderId.value) return
  try {
    const res = await orderStore.cancel(orderId.value, { reason })
    toastSuccess(res.message || 'Production Order cancelled')
    confirm.open = false
    await orderStore.fetchOrder(orderId.value)
  } catch (e) {
    toastError(e)
    confirm.open = false
  }
}

async function handleDeleteProduct(product: POProduct) {
  if (!orderId.value) return
  openConfirm({
    title:        'Delete Product Line',
    description:  `Remove "${product.part?.part_name}" from this Production Order?`,
    confirmLabel: 'Delete',
    confirmColor: 'error',
    action: async () => {
      try {
        await orderStore.deleteProduct(orderId.value!, product.id)
        toastSuccess('Product line removed')
        confirm.open = false
        await orderStore.fetchOrder(orderId.value!)
      } catch (e) {
        toastError(e)
        confirm.open = false
      }
    },
  })
}

async function handleDeleteSchedule(product: POProduct, schedule: POSchedule) {
  if (!orderId.value) return
  openConfirm({
    title:        'Delete Schedule Entry',
    description:  `Remove the schedule for ${fmtDate(schedule.production_date)}?`,
    confirmLabel: 'Delete',
    confirmColor: 'error',
    action: async () => {
      try {
        await orderStore.deleteSchedule(orderId.value!, product.id, schedule.id)
        toastSuccess('Schedule entry removed')
        confirm.open = false
        await orderStore.fetchOrder(orderId.value!)
      } catch (e) {
        toastError(e)
        confirm.open = false
      }
    },
  })
}

// ── Status helpers ────────────────────────────────────────────────────────────

const canRelease = computed(() =>
  currentOrder.value?.status === 'Draft' || currentOrder.value?.status === 'Rejected',
)
const canReject = computed(() => currentOrder.value?.status === 'Released')
const canCancel = computed(() =>
  ['Draft', 'Released', 'In_Progress'].includes(currentOrder.value?.status ?? ''),
)
const canComplete = computed(() => currentOrder.value?.status === 'In_Progress')
const canClose    = computed(() => currentOrder.value?.status === 'Completed')

// ── Init ──────────────────────────────────────────────────────────────────────

watch(
  () => route.params.id,
  async (id) => {
    if (!isCreate.value && id) {
      await orderStore.fetchOrder(Number(id))
      if (currentOrder.value) {
        createForm.priority       = currentOrder.value.priority
        createForm.po_description = currentOrder.value.po_description ?? ''
        createForm.notes          = currentOrder.value.notes ?? ''
        createForm.production_start_date = currentOrder.value.production_start_date
        createForm.production_end_date   = currentOrder.value.production_end_date
      }
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await planStore.fetchDropdown()
})
</script>

<template>
  <UDashboardPanel id="order-schedule-form">
    <template #header>
      <UDashboardNavbar title="Production Order">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <Breadcrumbs :items="breadcrumbItems" />

        <!-- PAGE HEADER -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="router.push('/production-plan/order-schedule')"
            />
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-2xl font-bold">
                  {{ isCreate ? 'Create Production Order' : currentOrder?.po_number ?? '—' }}
                </h1>
                <UBadge
                  v-if="!isCreate && currentOrder?.status"
                  :label="poStatusLabel[currentOrder.status]"
                  :color="poStatusColor[currentOrder.status]"
                  variant="subtle"
                />
                <UBadge
                  v-if="!isCreate && currentOrder?.priority"
                  :label="currentOrder.priority"
                  :color="priorityColor[currentOrder.priority]"
                  variant="soft"
                />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Create mode -->
            <template v-if="isCreate">
              <UButton
                label="Create Order"
                icon="i-lucide-save"
                color="primary"
                :loading="saving"
                :disabled="!createForm.plan_id || !createForm.production_start_date || !createForm.production_end_date || createProducts.length === 0"
                @click="handleCreate"
              />
            </template>

            <!-- Draft / Rejected — editable -->
            <template v-else-if="isEditable">
              <UButton
                label="Save"
                icon="i-lucide-save"
                color="neutral"
                variant="soft"
                :loading="saving"
                @click="openConfirm({
                  title:       'Save Changes',
                  description: 'Save the changes to this Production Order?',
                  action:      handleUpdateHeader,
                })"
              />
              <UButton
                label="Release"
                icon="i-lucide-send"
                color="primary"
                :loading="saving"
                @click="openConfirm({
                  title:       'Release Production Order',
                  description: 'This will lock the PO and notify production. All product lines must have at least one schedule. Continue?',
                  confirmLabel: 'Release',
                  action:      handleRelease,
                })"
              />
            </template>

            <!-- Other statuses — supervisor actions -->
            <template v-else-if="!isCreate">
              <UButton
                v-if="canRelease"
                label="Release"
                icon="i-lucide-check-circle"
                color="primary"
                :loading="saving"
                @click="openConfirm({
                  title:       'Release Production Order',
                  description: 'Releasing will lock the PO and trigger Work Order creation. Continue?',
                  confirmLabel: 'Release',
                  action:      handleRelease,
                })"
              />
              <UButton
                v-if="canReject"
                label="Reject"
                icon="i-lucide-x-circle"
                color="error"
                variant="soft"
                :loading="saving"
                @click="rejectDialog.open = true"
              />
              <UButton
                v-if="canComplete"
                label="Complete"
                icon="i-lucide-check-check"
                color="success"
                :loading="saving"
                @click="openConfirm({
                  title:       'Complete Production Order',
                  description: 'Mark this PO as Completed? Ensure all Work Orders are done.',
                  confirmLabel: 'Complete',
                  action:      async () => { await orderStore.complete(orderId!); confirm.open = false; await orderStore.fetchOrder(orderId!) },
                })"
              />
              <UButton
                v-if="canClose"
                label="Close"
                icon="i-lucide-archive"
                color="neutral"
                variant="soft"
                :loading="saving"
                @click="openConfirm({
                  title:       'Close Production Order',
                  description: 'Close this Production Order? This cannot be undone.',
                  confirmLabel: 'Close',
                  action:      async () => { await orderStore.close(orderId!); confirm.open = false; await orderStore.fetchOrder(orderId!) },
                })"
              />
            </template>

            <!-- Cancel (always shown if applicable) -->
            <UButton
              v-if="!isCreate && canCancel"
              label="Cancel Order"
              icon="i-lucide-ban"
              color="error"
              variant="ghost"
              :loading="saving"
              @click="openConfirm({
                title:       'Cancel Production Order',
                description: 'This will cancel the PO and all non-completed Work Orders. This cannot be undone.',
                confirmLabel: 'Cancel Order',
                confirmColor: 'error',
                action:      async () => handleCancel('Manually cancelled'),
              })"
            />
          </div>
        </div>

        <!-- ALERTS -->
        <UAlert
          v-if="!isCreate && currentOrder?.status === 'Rejected' && currentOrder.notes"
          color="error"
          variant="soft"
          icon="i-lucide-x-circle"
          title="Production Order Rejected"
          :description="currentOrder.notes"
        />

        <!-- ─── CREATE MODE ──────────────────────────────────────────────────── -->
        <template v-if="isCreate">
          <!-- Section 1: Select Plan -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-clipboard-list" class="w-5 h-5 text-primary" />
                <span class="font-semibold">Section 1 — Select Production Plan</span>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Production Plan" required>
                <USelectMenu
                  v-model="createForm.plan_id"
                  :items="planDropdown"
                  value-key="id"
                  option-attribute="plan_number"
                  placeholder="Select an Approved plan..."
                  class="w-full"
                />
              </UFormField>
              <div v-if="selectedPlan" class="text-sm text-muted self-end pb-1">
                {{ selectedPlan.plan_description || '—' }} · {{ selectedPlan.details?.length ?? 0 }} products
              </div>
            </div>
          </UCard>

          <!-- Section 2: PO Header -->
          <UCard v-if="createForm.plan_id">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-settings-2" class="w-5 h-5 text-primary" />
                <span class="font-semibold">Section 2 — PO Parameters</span>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <UFormField label="Production Start Date" required>
                <UInput v-model="createForm.production_start_date" type="date" class="w-full" />
              </UFormField>
              <UFormField label="Production End Date" required>
                <UInput
                  v-model="createForm.production_end_date"
                  type="date"
                  :min="createForm.production_start_date"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Priority">
                <USelectMenu
                  v-model="createForm.priority"
                  :items="priorityItems"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Description" class="md:col-span-2">
                <UInput
                  v-model="createForm.po_description"
                  placeholder="Optional description..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Notes" class="md:col-span-2 lg:col-span-3">
                <UTextarea
                  v-model="createForm.notes"
                  placeholder="Optional notes..."
                  :rows="2"
                  class="w-full"
                />
              </UFormField>
            </div>
          </UCard>

          <!-- Section 3: Product List (read-only from plan) -->
          <UCard v-if="planDetails.length">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-package" class="w-5 h-5 text-primary" />
                <span class="font-semibold">Section 3 — Products from Plan</span>
                <UBadge :label="`${planDetails.length} items`" color="neutral" variant="soft" size="xs" />
              </div>
              <p class="text-sm text-muted mt-0.5">Select products to include and assign a production line to each.</p>
            </template>

            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-muted text-xs border-b border-default">
                  <tr>
                    <th class="text-left px-3 py-2 font-medium">Include</th>
                    <th class="text-left px-3 py-2 font-medium">Customer</th>
                    <th class="text-left px-3 py-2 font-medium">Part</th>
                    <th class="text-right px-3 py-2 font-medium">Qty</th>
                    <th class="text-left px-3 py-2 font-medium">Delivery</th>
                    <th class="text-left px-3 py-2 font-medium w-36">Line ID</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-default">
                  <tr
                    v-for="detail in planDetails"
                    :key="detail.id"
                    :class="selectedLineMap[detail.id] ? 'bg-primary/5' : ''"
                  >
                    <td class="px-3 py-2">
                      <UCheckbox
                        :model-value="!!selectedLineMap[detail.id]"
                        @update:model-value="(v) => {
                          if (!v) delete selectedLineMap[detail.id]
                          else selectedLineMap[detail.id] = null
                        }"
                      />
                    </td>
                    <td class="px-3 py-2">{{ detail.customer?.name ?? '-' }}</td>
                    <td class="px-3 py-2">
                      <p class="font-medium">{{ detail.part?.part_name ?? '-' }}</p>
                      <p class="text-xs text-muted font-mono">{{ detail.part?.part_number }}</p>
                    </td>
                    <td class="px-3 py-2 text-right font-mono">{{ detail.qty_request.toLocaleString() }}</td>
                    <td class="px-3 py-2">{{ fmtDate(detail.delivery_date) }}</td>
                    <td class="px-3 py-2">
                      <UInput
                        v-if="selectedLineMap[detail.id] !== undefined"
                        v-model.number="selectedLineMap[detail.id]"
                        type="number"
                        placeholder="Line ID"
                        size="sm"
                        class="w-28"
                      />
                      <span v-else class="text-muted text-xs">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-4 text-sm text-muted flex items-center gap-2">
              <UIcon name="i-lucide-info" class="w-4 h-4" />
              {{ createProducts.length }} of {{ planDetails.length }} products selected
            </div>
          </UCard>
        </template>

        <!-- ─── DETAIL MODE ──────────────────────────────────────────────────── -->
        <template v-else>
          <OrderInfoCard
            :order="currentOrder"
            :fmt-date="fmtDate"
            :fmt-num="fmtNum"
          />

          <OrderTabsSection
            :order="currentOrder"
            :is-editable="isEditable"
            :saving="saving"
            :fmt-date="fmtDate"
            :fmt-num="fmtNum"
            @add-schedule="openAddSchedule"
            @edit-schedule="openEditSchedule"
            @delete-schedule="handleDeleteSchedule"
            @delete-product="handleDeleteProduct"
            @reschedule="rescheduleModal = true"
          />
        </template>

        <!-- ─── SCHEDULE MODAL ───────────────────────────────────────────────── -->
        <ScheduleModal
          v-model:open="scheduleModal.open"
          :product="scheduleModal.product"
          :schedule="scheduleModal.schedule"
          :shifts="shifts"
          :po-start-date="currentOrder?.production_start_date ?? ''"
          :po-end-date="currentOrder?.production_end_date ?? ''"
          :saving="saving"
          @save="handleSaveSchedule"
        />

        <!-- ─── RESCHEDULE MODAL ──────────────────────────────────────────────── -->
        <RescheduleModal
          v-model:open="rescheduleModal"
          :current-start="currentOrder?.production_start_date ?? ''"
          :current-end="currentOrder?.production_end_date ?? ''"
          :saving="saving"
          @confirm="handleReschedule"
        />

        <!-- ─── CONFIRM DIALOG ────────────────────────────────────────────────── -->
        <ConfirmDialog
          v-model:open="confirm.open"
          :title="confirm.title"
          :description="confirm.description"
          :confirm-label="confirm.confirmLabel"
          :loading="saving"
          @confirm="confirm.action?.()"
        />

        <!-- ─── REJECT DIALOG ─────────────────────────────────────────────────── -->
        <RejectDialog
          v-model:open="rejectDialog.open"
          :title="rejectDialog.title"
          :description="rejectDialog.description"
          :loading="saving"
          required
          @confirm="handleReject"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>