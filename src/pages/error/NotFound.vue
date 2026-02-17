<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const error = {
  statusCode: 404,
  statusMessage: 'Page not found',
  message: 'The page you are looking for does not exist.'
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
