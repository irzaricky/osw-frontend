export interface Factory {
    id: number
    name: string
    address?: string | null
    phone?: string | null
    maps_url?: string | null
    createdAt?: string
    updatedAt?: string
    deleted_at?: string | null
}