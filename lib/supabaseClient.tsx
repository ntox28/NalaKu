
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Anda harus mengganti ini dengan URL dan Kunci Anon Supabase Anda.
const supabaseUrl = process.env.SUPABASE_URL || 'https://ngmuhvxewknicaagzydz.supabase.co'; // GANTI DENGAN URL ANDA
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbXVodnhld2tuaWNhYWd6eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTMzNjAsImV4cCI6MjA2OTg2OTM2MH0.q7tpT6ID0ko_F47LllPHlU6sTSJjfFPdRNj0MfrCxjI'; // GANTI DENGAN KUNCI ANON ANDA

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Self-defined types to prevent import issues from version mismatches.
export type User = {
    id: string;
    app_metadata: { [key: string]: any; provider?: string; providers?: string[], userrole?: string };
    user_metadata: { [key: string]: any };
    aud: string;
    confirmation_sent_at?: string;
    recovery_sent_at?: string;
    email_change_sent_at?: string;
    new_email?: string;
    invited_at?: string;
    action_link?: string;
    email?: string;
    phone?: string;
    created_at: string;
    confirmed_at?: string;
    email_confirmed_at?: string;
    phone_confirmed_at?: string;
    last_sign_in_at?: string;
    role?: string;
    updated_at?: string;
};
export type Session = {
    access_token: string;
    token_type: string;
    expires_in: number;
    expires_at?: number;
    refresh_token: string;
    user: User;
};


export type CustomerLevel = 'End Customer' | 'Retail' | 'Grosir' | 'Reseller' | 'Corporate';
export type EmployeePosition = 'Kasir' | 'Designer' | 'Sales' | 'Office' | 'Produksi' | 'Admin';
export type ProductionStatus = 'Belum Dikerjakan' | 'Proses' | 'Selesai';
export type PaymentStatus = 'Belum Lunas' | 'Lunas';
export type OrderStatus = 'Pending' | 'Proses';


export interface Customer {
    id: number;
    created_at: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    level: CustomerLevel;
}

export interface Employee {
    id: number;
    created_at: string;
    name: string;
    position: EmployeePosition;
    email: string | null;
    phone: string | null;
    user_id: string | null;
}

export interface Bahan {
    id: number;
    created_at: string;
    name: string;
    harga_end_customer: number;
    harga_retail: number;
    harga_grosir: number;
    harga_reseller: number;
    harga_corporate: number;
}

export interface Expense {
    id: number;
    created_at: string;
    tanggal: string;
    jenis_pengeluaran: string;
    qty: number;
    harga: number;
}

export interface Order {
    id: number;
    created_at: string;
    no_nota: string;
    tanggal: string;
    pelanggan_id: number;
    pelaksana_id: string | null;
    status_pembayaran: PaymentStatus;
    status_pesanan: OrderStatus;
    // These are joined from other tables, not part of the 'orders' table itself
    order_items: OrderItem[];
    payments: Payment[];
}

export interface OrderItem {
    id: number;
    created_at: string;
    order_id: number;
    bahan_id: number;
    deskripsi_pesanan: string | null;
    panjang: number | null;
    lebar: number | null;
    qty: number;
    status_produksi: ProductionStatus;
    finishing: string | null;
}

export interface Payment {
    id: number;
    created_at: string;
    order_id: number;
    amount: number;
    payment_date: string;
    kasir_id: string | null;
}

type OrderRow = Omit<Order, "order_items" | "payments">;

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: Customer;
        Insert: {
          name: string;
          email: string;
          phone: string;
          address: string;
          level: CustomerLevel;
        };
        Update: Partial<{
          name: string;
          email: string;
          phone: string;
          address: string;
          level: CustomerLevel;
        }>;
      };
      employees: {
        Row: Employee;
        Insert: {
          name: string;
          position: EmployeePosition;
          email: string | null;
          phone: string | null;
          user_id: string | null;
        };
        Update: Partial<{
          name: string;
          position: EmployeePosition;
          email: string | null;
          phone: string | null;
          user_id: string | null;
        }>;
      };
      bahan: {
        Row: Bahan;
        Insert: {
          name: string;
          harga_end_customer: number;
          harga_retail: number;
          harga_grosir: number;
          harga_reseller: number;
          harga_corporate: number;
        };
        Update: Partial<{
          name: string;
          harga_end_customer: number;
          harga_retail: number;
          harga_grosir: number;
          harga_reseller: number;
          harga_corporate: number;
        }>;
      };
      expenses: {
        Row: Expense;
        Insert: {
          tanggal: string;
          jenis_pengeluaran: string;
          qty: number;
          harga: number;
        };
        Update: Partial<{
          tanggal: string;
          jenis_pengeluaran: string;
          qty: number;
          harga: number;
        }>;
      };
      orders: {
        Row: OrderRow;
        Insert: {
            no_nota: string;
            tanggal: string;
            pelanggan_id: number;
            pelaksana_id: string | null;
            status_pembayaran: PaymentStatus;
            status_pesanan: OrderStatus;
        };
        Update: Partial<{
            no_nota: string;
            tanggal: string;
            pelanggan_id: number;
            pelaksana_id: string | null;
            status_pembayaran: PaymentStatus;
            status_pesanan: OrderStatus;
        }>;
      };
      order_items: {
        Row: OrderItem;
        Insert: {
            order_id: number;
            bahan_id: number;
            deskripsi_pesanan: string | null;
            panjang: number | null;
            lebar: number | null;
            qty: number;
            status_produksi: ProductionStatus;
            finishing: string | null;
        };
        Update: Partial<{
            order_id: number;
            bahan_id: number;
            deskripsi_pesanan: string | null;
            panjang: number | null;
            lebar: number | null;
            qty: number;
            status_produksi: ProductionStatus;
            finishing: string | null;
        }>;
      };
      payments: {
        Row: Payment;
        Insert: {
            order_id: number;
            amount: number;
            payment_date: string;
            kasir_id: string | null;
        };
        Update: Partial<{
            order_id: number;
            amount: number;
            payment_date: string;
            kasir_id: string | null;
        }>;
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
  };
}


export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
