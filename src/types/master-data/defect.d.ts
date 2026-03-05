export interface DefectCategory {
  id: number,
  name: string,
  description?: string | null,
  createdAt?: string,
  updatedAt?: string,
  deleted_at?: string | null
}

export interface Defect {
  id: number,
  defect_code: string,
  name: string,
  defect_category_id: number,
  category?: DefectCategory | null,
  description?: string | null,
  createdAt?: string,
  updatedAt?: string,
  deleted_at?: string | null
}
