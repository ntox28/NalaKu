
import React, { useState, useEffect } from 'react';
import LoginComponent from './components/Login';
import DashboardComponent from './components/Dashboard';
import { Customer, Employee, Bahan, Expense, Order, supabase, Session, User as AuthUser } from './lib/supabaseClient';
import { ToastProvider, useToast } from './hooks/useToast';
import { ThemeProvider } from './hooks/useTheme';
import ToastContainer from './components/toasts/ToastContainer';


const AppContent: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const [users, setUsers] = useState<AuthUser[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [bahanList, setBahanList] = useState<Bahan[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const { addToast } = useToast();
    
    useEffect(() => {
        const fetchCurrentSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };
    
        fetchCurrentSession();
        
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
    
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);
    
    const fetchAllData = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const [
                customersRes,
                employeesRes,
                bahanRes,
                expensesRes,
                ordersRes,
            ] = await Promise.all([
                supabase.from('customers').select('*').order('name', { ascending: true }),
                supabase.from('employees').select('*').order('name', { ascending: true }),
                supabase.from('bahan').select('*').order('name', { ascending: true }),
                supabase.from('expenses').select('*').order('tanggal', { ascending: false }),
                supabase.from('orders').select('*, order_items(*), payments(*)').order('created_at', { ascending: false }),
            ]);

            if (customersRes.error) throw customersRes.error;
            if (employeesRes.error) throw employeesRes.error;
            if (bahanRes.error) throw bahanRes.error;
            if (expensesRes.error) throw expensesRes.error;
            if (ordersRes.error) throw ordersRes.error;
            
            setCustomers(customersRes.data || []);
            setEmployees(employeesRes.data || []);
            setBahanList(bahanRes.data || []);
            setExpenses(expensesRes.data || []);
            setOrders(ordersRes.data || []);
            // Users are not fetched from client-side anymore for security.
            setUsers([]);
            
            addToast('Data berhasil dimuat dari server.', 'success');
        } catch (error: any) {
            console.error('Error fetching data:', error);
            addToast(`Gagal mengambil data: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchAllData();
        }
    }, [session]);
    
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            addToast(`Logout gagal: ${error.message}`, 'error');
        }
    };

    if (loading) {
       return <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center"><p>Memuat...</p></div>;
    }

    return (
        <>
            <div className="min-h-screen bg-gray-100 dark:bg-slate-900 selection:bg-orange-500 selection:text-white">
                <ToastContainer />
                {session ? (
                    <DashboardComponent 
                        user={session.user}
                        onLogout={handleLogout} 
                        users={users}
                        customers={customers}
                        bahanList={bahanList}
                        employees={employees}
                        orders={orders}
                        expenses={expenses}
                        refetchData={fetchAllData}
                    />
                ) : (
                    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
                        <LoginComponent />
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