
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Ganti dengan URL dan Kunci Anon Supabase Anda yang sebenarnya
// Praktik terbaik adalah menyimpannya di environment variables
const supabaseUrl = 'https://ngmuhvxewknicaagzydz.supabase.co'; // <-- GANTI DENGAN URL ANDA
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbXVodnhld2tuaWNhYWd6eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTMzNjAsImV4cCI6MjA2OTg2OTM2MH0.q7tpT6ID0ko_F47LllPHlU6sTSJjfFPdRNj0MfrCxjI'; // <-- GANTI DENGAN KUNCI ANON ANDA

// Define a type for your database schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type CustomerLevel = 'End Customer' | 'Retail' | 'Grosir' | 'Reseller' | 'Corporate';

export interface Customer {
    id: number;
    created_at: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    level: CustomerLevel;
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at'>;
export type CustomerUpdate = Partial<Omit<Customer, 'id' | 'created_at'>>;


export interface Database {
  public: {
    Tables: {
      customers: {
        Row: Customer; // The data model for a row in your table
        Insert: CustomerInsert; // The data model for inserting a new row
        Update: CustomerUpdate; // The data model for updating a row
      };
      // ... you can add other tables here later
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
  };
}

// Create and export the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);