export function useImageUrl() {
  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined

    // If path is already a full URL, return it
    if (path.startsWith('http')) return path

    // Get API base URL from env
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

    // Combine base URL and path
    // Remove leading slash from path if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    
    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

    return `${cleanBaseUrl}/${cleanPath}`
  }

  return {
    getImageUrl
  }
}