<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  modelValue: string
  open: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:open': [value: boolean]
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null

const loading = ref(false)
const searchCity = ref('')
const localAddress = ref('')
const initialLat = -6.200000 // Jakarta default
const initialLng = 106.816666

async function reverseGeocode(lat: number, lng: number) {
  loading.value = true
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
    const data = await response.json()
    if (data && data.display_name) {
      localAddress.value = data.display_name
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  } finally {
    loading.value = false
  }
}

function initMapAt(lat: number, lng: number) {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value).setView([lat, lng], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)

  marker = L.marker([lat, lng], { draggable: true }).addTo(map)

  marker.on('dragend', (event) => {
    const pos = event.target.getLatLng()
    reverseGeocode(pos.lat, pos.lng)
  })

  map.on('click', (event) => {
    const { lat, lng } = event.latlng
    marker?.setLatLng([lat, lng])
    reverseGeocode(lat, lng)
  })

  // Fix for leaflet icons in Vite
  const iconDefault = L.icon({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  })
  marker.setIcon(iconDefault)
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    localAddress.value = props.modelValue
    // Wait for modal transition and DOM to be ready
    setTimeout(async () => {
      if (map) {
        map.remove()
        map = null
      }

      let lat = initialLat
      let lng = initialLng

      if (props.modelValue) {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(props.modelValue)}&limit=1`)
          const data = await response.json()
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat)
            lng = parseFloat(data[0].lon)
          }
        } catch (e) {
          console.error('Initial geocode error:', e)
        }
      }

      initMapAt(lat, lng)
    }, 300)
  } else {
    // Cleanup map when modal closes to prevent stale references
    if (map) {
      map.remove()
      map = null
    }
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

function handleConfirm() {
  emit('update:modelValue', localAddress.value)
  emit('update:open', false)
}

async function searchLocation() {
  if (!searchCity.value.trim()) return
  loading.value = true
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchCity.value)}`)
    const data = await response.json()
    if (data && data.length > 0) {
      const { lat, lon } = data[0]
      const newLat = parseFloat(lat)
      const newLng = parseFloat(lon)
      map?.setView([newLat, newLng], 15)
      marker?.setLatLng([newLat, newLng])
      reverseGeocode(newLat, newLng)
    }
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Pilih Lokasi Pengiriman"
    description="Geser pin atau klik pada peta untuk mendapatkan alamat otomatis."
    class="sm:max-w-3xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Search bar inside map modal -->
        <div class="flex gap-2">
          <UInput
            v-model="searchCity"
            placeholder="Search"
            class="flex-1"
            @keyup.enter="searchLocation"
          />
          <UButton
            icon="i-lucide-search"
            color="neutral"
            variant="subtle"
            :loading="loading"
            @click="searchLocation"
          />
        </div>

        <div class="relative w-full h-[400px] border border-default rounded-xl overflow-hidden shadow-inner">
          <div ref="mapContainer" class="w-full h-full z-0" />
          
          <div v-if="loading" class="absolute inset-0 bg-default/50 backdrop-blur-[1px] flex items-center justify-center z-[1000]">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>

        <div class="p-3 bg-elevated rounded-lg border border-default flex gap-3 items-start">
          <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Address:
            </p>
            <p class="text-sm font-medium leading-relaxed">
              {{ localAddress }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="emit('update:open', false)"
        />
        <UButton
          color="primary"
          label="Confirm"
          :disabled="!localAddress"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>

<style>
/* Ensure leaflet controls don't overlap UI */
.leaflet-container {
  font-family: inherit;
}
.leaflet-control-attribution {
  font-size: 10px !important;
}
</style>
