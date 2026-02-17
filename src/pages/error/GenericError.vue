<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const error = {
  statusCode: 500,
  statusMessage: 'Internal Server Error',
  message: 'Something went wrong.'
}

const clearButton = {
  label: 'Back to home',
  onClick: () => {
    router.push('/')
  }
}
</script>

<template>
  <UError 
    :error="error"
    :clear="clearButton"
  />
</template>
