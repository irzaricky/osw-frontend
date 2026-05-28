<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  images: {
    defect_name: string
    image: string
  }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const currentIndex = ref(0)

watch(
  () => props.open,
  isOpen => {
    if (isOpen) {
      currentIndex.value = 0
    }
  }
)

const currentImage = computed(
  () => props.images[currentIndex.value]
)

const isFirst = computed(
  () => currentIndex.value === 0
)

const isLast = computed(
  () => currentIndex.value === props.images.length - 1
)

function prevImage() {
  if (!isFirst.value) {
    currentIndex.value--
  }
}

function nextImage() {
  if (!isLast.value) {
    currentIndex.value++
  }
}
</script>

<template>
  <UModal
    :open="open"
    title="Defect Evidence"
    description="Quality defect evidence images."
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-5">
        <div class="flex items-center justify-between">
          <UButton
            icon="i-lucide-chevron-left"
            label="Prev"
            variant="soft"
            color="neutral"
            :disabled="isFirst"
            @click="prevImage"
          />

          <div class="text-sm text-muted">
            {{ currentIndex + 1  }}/{{ images.length }}
          </div>

          <UButton
            label="Next"
            trailing-icon="i-lucide-chevron-right"
            variant="soft"
            color="neutral"
            :disabled="isLast"
            @click="nextImage"
          />
        </div>

        <div class="rounded-xl overflow-hidden">
          <img
            v-if="currentImage"
            :src="currentImage.image"
            alt="Defect Evidence"
            class="w-full max-h-[500px] object-contain bg-muted"
          >
        </div>

        <div class="rounded-lg bg-muted px-4 py-3">
          <div class="text-sm text-muted">
            Defect Name
          </div>

          <div class="font-medium">
            {{ currentImage?.defect_name || '-' }}
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>