
import React, { useState, useEffect } from 'react';
import LoginComponent, { User } from './components/Login';
import DashboardComponent from './components/Dashboard';
import { Customer } from './lib/supabaseClient';
import { Bahan } from './components/bahan/BahanManagement';
import { Order } from './components/orders/OrderManagement';
import { Employee } from './components/employees/EmployeeManagement';
import { Expense } from './components/expenses/ExpenseManagement';
import { ToastProvider, useToast } from './hooks/useToast';
import ToastContainer from './components/toasts/ToastContainer';
import useLocalStorage from './hooks/useLocalStorage';
import { ThemeProvider } from './hooks/useTheme';
import { supabase } from './lib/supabaseClient';


const initialUsers: User[] = [
    { id: 'admin', password: 'admin', level: 'Admin', employeeId: 1 },
    { id: 'kasir', password: 'kasir', level: 'Kasir', employeeId: 2 },
    { id: 'produksi', password: 'produksi', level: 'Produksi', employeeId: 4 },
    { id: 'office', password: 'office', level: 'Office', employeeId: 5 },
];

const initialBahan: Bahan[] = [
    { id: 1, name: 'Flexi 280gr', hargaEndCustomer: 25000, hargaRetail: 22000, hargaGrosir: 20000, hargaReseller: 18000, hargaCorporate: 15000 },
    { id: 2, name: 'Flexi 340gr', hargaEndCustomer: 30000, hargaRetail: 28000, hargaGrosir: 25000, hargaReseller: 23000, hargaCorporate: 20000 },
    { id: 3, name: 'Artpaper', hargaEndCustomer: 15000, hargaRetail: 13000, hargaGrosir: 11000, hargaReseller: 10000, hargaCorporate: 8000 },
    { id: 4, name: 'Art Carton', hargaEndCustomer: 20000, hargaRetail: 18000, hargaGrosir: 16000, hargaReseller: 14000, hargaCorporate: 12000 },
    { id: 5, name: 'One Way Vision', hargaEndCustomer: 75000, hargaRetail: 70000, hargaGrosir: 65000, hargaReseller: 60000, hargaCorporate: 55000 },
    { id: 6, name: 'Sticker Vynil', hargaEndCustomer: 50000, hargaRetail: 45000, hargaGrosir: 40000, hargaReseller: 38000, hargaCorporate: 35000 },
];

const initialEmployees: Employee[] = [
    { id: 1, name: 'Andi Wijaya', position: 'Admin', email: 'andi.w@example.com', phone: '081122334455' },
    { id: 2, name: 'Siti Aminah', position: 'Kasir', email: 'siti.a@example.com', phone: '081234567891' },
    { id: 3, name: 'Rina Fauziah', position: 'Designer', email: 'rina.f@example.com', phone: '082233445566' },
    { id: 4, name: 'Joko Susilo', position: 'Produksi', email: 'joko.s@example.com', phone: '085566778899' },
    { id: 5, name: 'Lina Marlina', position: 'Office', email: 'lina.m@example.com', phone: '087788990011' },
];

const initialExpenses: Expense[] = [
    { id: 1, tanggal: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], jenisPengeluaran: 'Pembelian Tinta Printer', qty: 2, harga: 150000 },
    { id: 2, tanggal: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], jenisPengeluaran: 'Biaya Listrik', qty: 1, harga: 500000 },
    { id: 3, tanggal: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], jenisPengeluaran: 'Gaji Karyawan - Siti', qty: 1, harga: 2500000 },
    { id: 4, tanggal: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], jenisPengeluaran: 'Pembelian Kertas A4 (rim)', qty: 5, harga: 50000 },
    { id: 5, tanggal: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], jenisPengeluaran: 'Biaya Internet', qty: 1, harga: 350000 },
];

const initialOrders: Order[] = [
    { 
        id: 1, noNota: 'INV-001', tanggal: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], pelangganId: 1, pelaksanaId: 'produksi', statusPembayaran: 'Lunas', statusPesanan: 'Proses',
        payments: [{ amount: 374000, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], kasirId: 'kasir' }],
        items: [{ id: 101, bahanId: 1, deskripsiPesanan: 'Banner untuk Toko', panjang: 2, lebar: 1, qty: 2, statusProduksi: 'Selesai', finishing: 'Mata Ayam' }]
    },
    { 
        id: 2, noNota: 'INV-002', tanggal: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], pelangganId: 5, pelaksanaId: 'produksi', statusPembayaran: 'Lunas', statusPesanan: 'Proses',
        payments: [{ amount: 2200000, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], kasirId: 'kasir' }],
        items: [{ id: 102, bahanId: 5, deskripsiPesanan: 'Sticker Kaca Kantor', panjang: 5, lebar: 2, qty: 4, statusProduksi: 'Selesai', finishing: 'Cutting' }]
    },
    { 
        id: 3, noNota: 'INV-003', tanggal: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], pelangganId: 2, pelaksanaId: 'produksi', statusPembayaran: 'Belum Lunas', statusPesanan: 'Proses',
        payments: [],
        items: [
            { id: 103, bahanId: 3, deskripsiPesanan: 'Brosur Promosi', panjang: 0, lebar: 0, qty: 500, statusProduksi: 'Selesai', finishing: 'Potong Lurus' },
            { id: 104, bahanId: 6, deskripsiPesanan: 'Sticker Logo', panjang: 0, lebar: 0, qty: 100, statusProduksi: 'Selesai', finishing: 'Kiss-cut' }
        ]
    },
    { 
        id: 4, noNota: 'INV-004', tanggal: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], pelangganId: 3, pelaksanaId: null, statusPembayaran: 'Belum Lunas', statusPesanan: 'Pending',
        payments: [],
        items: [{ id: 105, bahanId: 2, deskripsiPesanan: 'Spanduk Event', panjang: 5, lebar: 1, qty: 5, statusProduksi: 'Proses', finishing: 'Slongsong' }]
    },
     { 
        id: 5, noNota: 'INV-005', tanggal: new Date().toISOString().split('T')[0], pelangganId: 4, pelaksanaId: null, statusPembayaran: 'Belum Lunas', statusPesanan: 'Pending',
        payments: [],
        items: [{ id: 106, bahanId: 4, deskripsiPesanan: 'Kartu Nama', panjang: 0, lebar: 0, qty: 200, statusProduksi: 'Belum Dikerjakan', finishing: 'Laminasi Doff' }]
    },
    { 
        id: 6, noNota: 'INV-006', tanggal: new Date().toISOString().split('T')[0], pelangganId: 1, pelaksanaId: 'produksi', statusPembayaran: 'Belum Lunas', statusPesanan: 'Proses',
        payments: [],
        items: [
            { id: 107, bahanId: 1, deskripsiPesanan: 'Banner Promosi Besar', panjang: 5, lebar: 2, qty: 1, statusProduksi: 'Proses', finishing: 'Mata Ayam Pojok' },
            { id: 108, bahanId: 2, deskripsiPesanan: 'Spanduk HUT RI', panjang: 3, lebar: 1, qty: 5, statusProduksi: 'Proses', finishing: 'Slongsong Atas Bawah' },
            { id: 109, bahanId: 3, deskripsiPesanan: 'Kartu Nama Pribadi', panjang: 0, lebar: 0, qty: 100, statusProduksi: 'Selesai', finishing: 'Potong Sesuai Ukuran' },
            { id: 110, bahanId: 4, deskripsiPesanan: 'Undangan Pernikahan', panjang: 0, lebar: 0, qty: 300, statusProduksi: 'Selesai', finishing: 'Laminasi Glossy + Lipat' },
            { id: 111, bahanId: 5, deskripsiPesanan: 'Stiker Kaca Belakang Mobil', panjang: 1, lebar: 0.5, qty: 2, statusProduksi: 'Selesai', finishing: 'Cutting Sesuai Pola' },
            { id: 112, bahanId: 6, deskripsiPesanan: 'Label Produk Makanan', panjang: 0, lebar: 0, qty: 1000, statusProduksi: 'Selesai', finishing: 'Kiss-cut per lembar A3' },
            { id: 113, bahanId: 1, deskripsiPesanan: 'Backdrop Panggung Acara', panjang: 4, lebar: 3, qty: 1, statusProduksi: 'Belum Dikerjakan', finishing: 'Tanpa Finishing (lembaran)' },
            { id: 114, bahanId: 3, deskripsiPesanan: 'Poster Edukasi A3+', panjang: 0, lebar: 0, qty: 50, statusProduksi: 'Belum Dikerjakan', finishing: 'Tanpa Finishing' },
            { id: 115, bahanId: 6, deskripsiPesanan: 'Stiker Branding Laptop', panjang: 0, lebar: 0, qty: 20, statusProduksi: 'Belum Dikerjakan', finishing: 'Die-cut' },
            { id: 116, bahanId: 4, deskripsiPesanan: 'Sertifikat Pelatihan', panjang: 0, lebar: 0, qty: 15, statusProduksi: 'Belum Dikerjakan', finishing: 'Cetak 1 Sisi' }
        ]
    },
];

const DataMigrationManager: React.FC<{
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}> = ({ orders, setOrders }) => {
  const { addToast } = useToast();

  useEffect(() => {
    const requiresMigrationV1 = orders.some(o => (o.statusPembayaran as any) === 'DP');
    const requiresMigrationV2 = orders.some(o => !o.hasOwnProperty('statusPesanan'));
    
    if (requiresMigrationV1 || requiresMigrationV2) {
      console.log("Running data migration for order structure...");
      setOrders(currentOrders => currentOrders.map(o => {
          let updatedOrder = { ...o };
          if ((o.statusPembayaran as any) === 'DP') {
              updatedOrder.statusPembayaran = 'Belum Lunas';
          }
          if (!o.hasOwnProperty('statusPesanan')) {
              updatedOrder.statusPesanan = 'Proses';
          }
          return updatedOrder;
      }));
       addToast('Data pesanan berhasil dimigrasi ke versi terbaru.', 'info');
    }
  }, [orders, setOrders, addToast]);

  return null; // This component does not render anything visible
};

const AppContent: React.FC = () => {
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

    const [users, setUsers] = useLocalStorage<User[]>('nala-app:users', initialUsers);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [bahanList, setBahanList] = useLocalStorage<Bahan[]>('nala-app:bahan', initialBahan);
    const [employees, setEmployees] = useLocalStorage<Employee[]>('nala-app:employees', initialEmployees);
    const [orders, setOrders] = useLocalStorage<Order[]>('nala-app:orders', initialOrders);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('nala-app:expenses', initialExpenses);
    const { addToast } = useToast();

    const fetchCustomers = async () => {
        const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching customers:', error);
            addToast(`Gagal mengambil data pelanggan: ${error.message}`, 'error');
        } else {
            setCustomers(data || []);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleLoginSuccess = (user: User) => {
        setLoggedInUser(user);
    };

    const handleLogout = () => {
        setLoggedInUser(null);
    };

    return (
        <>
            <DataMigrationManager orders={orders} setOrders={setOrders} />
            <div className="min-h-screen bg-gray-100 dark:bg-slate-900 selection:bg-orange-500 selection:text-white">
                <ToastContainer />
                {loggedInUser ? (
                    <DashboardComponent 
                        user={loggedInUser} 
                        onLogout={handleLogout} 
                        users={users}
                        onUsersUpdate={setUsers}
                        customers={customers}
                        onCustomersUpdate={fetchCustomers}
                        bahanList={bahanList}
                        onBahanUpdate={setBahanList}
                        employees={employees}
                        onEmployeesUpdate={setEmployees}
                        orders={orders}
                        onOrdersUpdate={setOrders}
                        expenses={expenses}
                        onExpensesUpdate={setExpenses}
                    />
                ) : (
                    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
                        <LoginComponent onLoginSuccess={handleLoginSuccess} users={users} />
                    </div>
                )}
            </div>
        </>
    );
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
