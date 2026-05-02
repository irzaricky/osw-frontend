

export function useAppToast() {
  const toast = useToast()

  function toastSuccess(message: string) {
    toast.add({
      title: message,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  }

  function toastError(error: any) {
    let message = 'An unknown error occurred'

    if (typeof error === 'string') {
      message = error
    } else {
      message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        message
    }

    toast.add({
      title: 'Error',
      description: message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }

  return {
    toastSuccess,
    toastError
  }
}
