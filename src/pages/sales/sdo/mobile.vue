<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSdoStore } from '../../../stores/sales/sdo.store'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { storeToRefs } from 'pinia'
import { compressImage } from '../../../utils'

const route = useRoute()
const store = useSdoStore()
const { loading, detail } = storeToRefs(store)

const sdoId = ref(route.params.id)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'SDO' },
  { label: 'Driver Mobile Portal' }
]

// Delivery Form State Variables
const receivedQuantities = ref<Record<number, number>>({})
const detailNotes = ref<Record<number, string>>({})
const overallNotes = ref('')
const podFiles = ref<File[]>([])
const podPreviewUrls = ref<string[]>([])
const isSubmitting = ref(false)
const isSuccess = ref(false)
const validationError = ref<string | null>(null)

onMounted(async () => {
  if (sdoId.value) {
    try {
      await store.fetchSdoById(sdoId.value as string)
      if (detail.value?.details) {
        detail.value.details.forEach(item => {
          receivedQuantities.value[item.id] = item.sent_qty
          detailNotes.value[item.id] = ''
        })
      }
    } catch (e) {
      console.error('Failed to load SDO on mobile view:', e)
    }
  }
})

// Quick Shortcut function: match all quantities in one click
function matchAllQuantities() {
  if (!detail.value?.details) return
  detail.value.details.forEach(item => {
    receivedQuantities.value[item.id] = item.sent_qty
  })
}

// Sanitize quantity value to ensure it doesn't exceed sent_qty
function onQtyInput(id: number, val: number, max: number) {
  if (val > max) {
    receivedQuantities.value[id] = max
  } else if (val < 0 || isNaN(val)) {
    receivedQuantities.value[id] = 0
  } else {
    receivedQuantities.value[id] = val
  }
}

// Photo File input handler
async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const files = Array.from(input.files)
    for (const file of files) {
      const compressed = await compressImage(file)
      podFiles.value.push(compressed)
      podPreviewUrls.value.push(URL.createObjectURL(compressed))
    }
  }
}

function removePhoto(index: number) {
  if (podPreviewUrls.value[index]) {
    URL.revokeObjectURL(podPreviewUrls.value[index])
  }
  podFiles.value.splice(index, 1)
  podPreviewUrls.value.splice(index, 1)
}

// Submit Dispatch Confirmation
async function submitDelivery() {
  validationError.value = null
  if (!detail.value?.details) return

  // Validate POD Images
  if (podFiles.value.length === 0) {
    validationError.value = 'Proof of Delivery (POD) photo is required before final submission.'
    return
  }

  isSubmitting.value = true
  try {
    const detailsPayload = detail.value.details.map(item => ({
      delivery_order_detail_id: item.id,
      received_qty: receivedQuantities.value[item.id] ?? item.sent_qty,
      notes: detailNotes.value[item.id] || ''
    }))

    const formData = new FormData()
    formData.append('notes', overallNotes.value)
    formData.append('details', JSON.stringify(detailsPayload))
    podFiles.value.forEach(file => {
      formData.append('proof_of_delivery', file)
    })

    await store.updateSdoStatus(sdoId.value as string, formData)
    isSuccess.value = true
  } catch (err: any) {
    validationError.value = err.response?.data?.message || err.message || 'Submission failed. Please check network and try again.'
  } finally {
    isSubmitting.value = false
  }
}
// Compute if there's any discrepancies in items (partial delivery)
const hasShortages = computed(() => {
  if (!detail.value?.details) return false
  return detail.value.details.some(item => {
    const rec = receivedQuantities.value[item.id] ?? item.sent_qty
    return rec < item.sent_qty
  })
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-default/10 text-default font-sans pb-10">
    <!-- Mobile Header -->
    <div class="bg-elevated/80 backdrop-blur-md px-4 py-3 border-b border-default sticky top-0 z-20 flex items-center gap-3">
      <div class="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
        <UIcon name="i-lucide-smartphone" class="w-5 h-5" />
      </div>
      <div>
        <h1 class="font-bold text-sm text-default">
          Driver Mobile Portal
        </h1>
        <p class="text-[10px] text-muted-foreground">
          Real-time Delivery Dispatch & Proof of Delivery
        </p>
      </div>
      <UBadge
        color="success"
        variant="subtle"
        size="xs"
        class="ml-auto rounded-full font-bold px-2"
      >
        Driver Mode
      </UBadge>
    </div>

    <!-- Main Container -->
    <div class="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
      <Breadcrumbs :items="breadcrumbItems" class="text-xs text-muted-foreground mb-2" />

      <!-- SUCCESS CONFIRMATION VIEW -->
      <div
        v-if="isSuccess"
        class="bg-elevated rounded-2xl p-8 border border-default text-center space-y-5 shadow-2xl relative overflow-hidden"
      >
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
        
        <div class="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <UIcon name="i-lucide-badge-check" class="w-8 h-8" />
        </div>

        <div class="space-y-2">
          <h2 class="text-xl font-bold text-default">
            Shipment Dispatched!
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Delivery Order **{{ detail?.do_number }}** has been updated successfully. Stocks have been reconciled and logistics planners have been notified.
          </p>
        </div>

        <div class="p-4 bg-default/20 border border-default rounded-xl space-y-2 text-left text-xs">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Status</span>
            <span class="font-bold text-emerald-400">DELIVERED</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Delivery Type</span>
            <span class="font-bold text-default">
              {{ hasShortages ? 'Partial Fulfillment' : 'Full Fulfillment' }}
            </span>
          </div>
        </div>

        <UButton
          color="neutral"
          variant="outline"
          class="w-full font-bold justify-center"
          icon="i-lucide-arrow-left"
          label="Back to Overview"
          to="/"
        />
      </div>

      <!-- SDO EDITING FORM VIEW -->
      <template v-else>
        <!-- Loading Indicator -->
        <div v-if="loading && !detail" class="py-12 text-center text-muted-foreground text-xs">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" />
          Fetching shipment allocations...
        </div>

        <div v-else-if="(detail?.delivery_status as string) === 'Delivered'" class="bg-elevated rounded-2xl p-6 border border-default text-center space-y-4">
          <div class="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <UIcon name="i-lucide-shield-check" class="w-6 h-6" />
          </div>
          <h3 class="font-bold text-sm text-default">
            Delivery Order Already Complete
          </h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            This shipment **{{ detail?.do_number }}** has already been dispatched and processed. Drivers cannot re-modify finalized delivery orders.
          </p>
          <UButton
            color="neutral"
            variant="outline"
            class="w-full font-bold justify-center"
            label="Home Dashboard"
            to="/"
          />
        </div>

        <div v-else class="space-y-4">
          <!-- SDO Status Header Card -->
          <div class="bg-elevated rounded-2xl p-5 border border-default shadow-lg space-y-4 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
            
            <div class="flex justify-between items-start">
              <div>
                <span class="text-[10px] uppercase font-mono tracking-wider text-muted-foreground font-bold">Delivery order</span>
                <h2 class="text-lg font-bold text-default mt-0.5">
                  {{ detail?.do_number || `SDO ID #${sdoId}` }}
                </h2>
              </div>
              <UBadge
                :color="detail?.delivery_status === 'Delivered' ? 'success' : 'warning'"
                variant="solid"
                size="xs"
                class="rounded-full px-2.5 font-bold"
              >
                {{ detail?.delivery_status || 'In Transit' }}
              </UBadge>
            </div>

            <hr class="border-default">

            <div class="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p class="text-muted-foreground">
                  Destination
                </p>
                <p class="font-bold text-default mt-0.5 truncate">
                  {{ detail?.deliveryPlan?.destination || 'N/A' }}
                </p>
              </div>
              <div>
                <p class="text-muted-foreground">
                  Shipment Date
                </p>
                <p class="font-bold text-default mt-0.5">
                  {{ detail?.shipment_date ? new Date(detail.shipment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' }}
                </p>
              </div>
            </div>

            <!-- OpenStreetMap routing trigger -->
            <div v-if="detail?.deliveryPlan?.destination" class="pt-2">
              <UButton
                color="neutral"
                variant="subtle"
                class="w-full text-xs font-bold justify-center"
                icon="i-lucide-navigation"
                label="Navigate in OpenStreetMap"
                :to="`https://www.openstreetmap.org/search?query=${encodeURIComponent(detail.deliveryPlan.destination)}`"
                target="_blank"
              />
            </div>
          </div>

          <!-- Alert Driver Notice -->
          <div
            v-if="hasShortages"
            class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3 text-xs text-rose-500 dark:text-rose-300"
          >
            <UIcon name="i-lucide-shield-alert" class="w-5 h-5 shrink-0" />
            <div>
              <h4 class="font-bold text-rose-500 dark:text-rose-400">
                Shortages Flagged (Partial Shipment)
              </h4>
              <p class="mt-0.5 leading-relaxed text-rose-600 dark:text-rose-400/90">
                One or more items are flagged with shortages. Please record specific reasoning in the comments section below before submitting.
              </p>
            </div>
          </div>
          <div v-else class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-xs text-amber-600 dark:text-amber-300">
            <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 shrink-0" />
            <div>
              <h4 class="font-bold text-amber-700 dark:text-amber-400">
                Driver Action Required
              </h4>
              <p class="mt-0.5 leading-relaxed text-amber-600 dark:text-amber-400/90">
                Verify each item quantity physically with the customer. If shortages are present, use the adjustments below.
              </p>
            </div>
          </div>

          <!-- Fulfillment Items list editor -->
          <div class="bg-elevated rounded-2xl p-4 border border-default shadow-lg space-y-3">
            <div class="flex justify-between items-center px-1">
              <h3 class="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Fulfillment Items
              </h3>
              <UButton
                color="primary"
                variant="ghost"
                size="xs"
                label="Match All Sent Qty"
                icon="i-lucide-check-check"
                class="font-bold cursor-pointer"
                @click="matchAllQuantities"
              />
            </div>

            <div v-if="detail?.details && detail.details.length > 0" class="space-y-3">
              <div
                v-for="item in detail.details"
                :key="item.id"
                class="bg-default/20 p-4 rounded-xl border border-default space-y-4"
              >
                <!-- Detail Info -->
                <div class="flex justify-between items-start gap-3">
                  <div>
                    <h4 class="text-sm font-bold text-default">
                      {{ item.planDetail?.spoDetail?.part?.part_name || 'Part' }}
                    </h4>
                    <p class="text-[10px] text-muted-foreground">
                      Part No: {{ item.planDetail?.spoDetail?.part?.part_number || 'N/A' }}
                    </p>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="text-[9px] font-bold text-muted-foreground block mb-0.5">Planned Sent</span>
                    <span class="text-xs font-mono text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {{ item.sent_qty }} pcs
                    </span>
                  </div>
                </div>

                <!-- Quantity adjustment controls -->
                <div class="flex items-center justify-between border-t border-default pt-3">
                  <span class="text-xs text-muted-foreground font-semibold">Received Qty</span>
                  
                  <div class="flex items-center gap-3">
                    <UInput
                      type="number"
                      v-model.number="receivedQuantities[item.id]"
                      class="w-28 font-bold font-mono"
                      :max="item.sent_qty"
                      min="0"
                      @input="onQtyInput(item.id, receivedQuantities[item.id], item.sent_qty)"
                    />
                  </div>
                </div>

                <!-- Item Notes/Shortage reasons -->
                <div v-if="(receivedQuantities[item.id] ?? item.sent_qty) < item.sent_qty">
                  <UInput
                    v-model="detailNotes[item.id]"
                    placeholder="Provide shortage reason..."
                    size="xs"
                    icon="i-lucide-alert-circle"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Proof of Delivery Upload Section -->
          <div class="bg-elevated rounded-2xl p-4 border border-default shadow-lg space-y-4">
            <div class="flex justify-between items-center px-1">
              <h3 class="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Proof of Delivery (POD)
              </h3>
              <UBadge v-if="podFiles.length > 0" color="neutral" variant="subtle" size="xs">
                {{ podFiles.length }} photos
              </UBadge>
            </div>

            <!-- Upload Photo Preview Grid -->
            <div v-if="podPreviewUrls.length > 0" class="grid grid-cols-2 gap-3">
              <div v-for="(url, idx) in podPreviewUrls" :key="idx" class="relative border border-default rounded-xl overflow-hidden bg-default/25 aspect-square">
                <img
                  :src="url"
                  class="w-full h-full object-cover"
                  alt="POD Receipt preview"
                >
                <button
                  class="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1.5 shadow cursor-pointer"
                  @click="removePhoto(idx)"
                >
                  <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- File selection controls -->
            <div class="flex flex-col items-center justify-center p-6 border border-dashed border-default rounded-xl bg-default/5 gap-3">
              <div class="w-10 h-10 bg-default/20 rounded-full flex items-center justify-center text-muted-foreground shadow-inner">
                <UIcon name="i-lucide-camera" class="w-5 h-5" />
              </div>
              <div class="text-center">
                <p class="text-xs font-bold text-default">
                  {{ podFiles.length > 0 ? 'Add another photo' : 'Take POD Photo' }}
                </p>
                <p class="text-[9px] text-muted-foreground mt-0.5">
                  Capture signed Surat Jalan receipt
                </p>
              </div>

              <!-- Real native camera/file selector trigger wrapper -->
              <label class="w-full cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  class="hidden"
                  @change="onFileChange"
                >
                <div class="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-center py-3 sm:py-3.5 rounded-xl text-sm font-bold transition-all shadow-md">
                  {{ podFiles.length > 0 ? 'Capture Another Photo' : 'Capture Receipt Camera' }}
                </div>
              </label>
            </div>
          </div>

          <!-- Overall Notes -->
          <div class="bg-elevated rounded-2xl p-4 border border-default shadow-lg space-y-3">
            <h3 class="font-bold text-xs uppercase tracking-wider text-muted-foreground px-1">
              Overall Notes
            </h3>
            <textarea
              v-model="overallNotes"
              rows="3"
              class="w-full rounded-xl bg-default/15 border border-default p-3 text-xs text-default focus:outline-none focus:border-default/80 placeholder-muted-foreground/60"
              placeholder="Enter optional dispatch notes..."
            />
          </div>

          <!-- Validation alerts -->
          <div v-if="validationError" class="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 rounded-xl text-xs font-semibold leading-relaxed">
            {{ validationError }}
          </div>

          <!-- Submission Action buttons -->
          <UButton
            color="success"
            class="w-full py-3 font-bold justify-center shadow-lg cursor-pointer"
            icon="i-lucide-check-circle"
            label="Finalize & Submit Delivery"
            :loading="isSubmitting"
            @click="submitDelivery"
          />
        </div>
      </template>
    </div>
  </div>
</template>
