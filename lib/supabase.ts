import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DatabaseEmployee {
  id: string
  nama: string
  posisi: string
  email: string
  telepon: string
  created_at: string
  updated_at: string
}

// Employee service functions
export const employeeService = {
  // Get all employees
  async getAll(): Promise<DatabaseEmployee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('nama', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Get employee by ID
  async getById(id: string): Promise<DatabaseEmployee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Create new employee
  async create(employee: Omit<DatabaseEmployee, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseEmployee> {
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update employee
  async update(id: string, employee: Partial<Omit<DatabaseEmployee, 'id' | 'created_at' | 'updated_at'>>): Promise<DatabaseEmployee> {
    const { data, error } = await supabase
      .from('employees')
      .update(employee)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete employee
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Check if email exists
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('employees')
      .select('id')
      .eq('email', email)
    
    if (excludeId) {
      query = query.neq('id', excludeId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return (data?.length || 0) > 0
  }
}