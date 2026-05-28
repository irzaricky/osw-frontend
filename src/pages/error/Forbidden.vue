<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const error = {
  statusCode: 403,
  statusMessage: 'Forbidden',
  message: 'You do not have permission to access this page.'
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
