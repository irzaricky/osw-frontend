<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'upload', file: File): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const dragOver = ref(false)

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    setFile(target.files[0])
  }
}

function setFile(file: File) {
  const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
  if (!allowed.includes(file.type)) {
    return
  }
  selectedFile.value = file
}

function handleDrop(event: DragEvent) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) setFile(file)
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  dragOver.value = true
}

function handleDragLeave() {
  dragOver.value = false
}

function clearFile() {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function handleSubmit() {
  if (!selectedFile.value) return
  emit('upload', selectedFile.value)
}

function handleClose() {
  clearFile()
  emit('update:open', false)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <UModal
    :open="open"
    title="Upload Factories"
    description="Upload an Excel file (.xlsx / .xls) to import factory data."
    :ui="{ content: 'sm:max-w-[500px]' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Drop Zone -->
        <div
          class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
          :class="dragOver
            ? 'border-primary bg-primary/5'
            : 'border-default hover:border-primary/50 hover:bg-muted/30'"
          @click="fileInput?.click()"
          @drop.prevent="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            class="hidden"
            @change="handleFileChange"
          />
          <UIcon name="i-lucide-file-spreadsheet" class="w-10 h-10 mx-auto mb-3 text-muted" />
          <p class="text-sm font-medium">
            Drag & drop your Excel file here
          </p>
          <p class="text-xs text-muted mt-1">
            or click to browse — .xlsx / .xls only
          </p>
        </div>

        <!-- Selected File Preview -->
        <div
          v-if="selectedFile"
          class="flex items-center gap-3 p-3 bg-muted/30 border border-default rounded-lg"
        >
          <UIcon name="i-lucide-file-spreadsheet" class="w-8 h-8 text-green-500 shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ selectedFile.name }}</p>
            <p class="text-xs text-muted">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="loading"
            @click.stop="clearFile"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="handleClose"
        />
        <UButton
          icon="i-lucide-upload"
          label="Upload"
          color="primary"
          :loading="loading"
          :disabled="!selectedFile"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>