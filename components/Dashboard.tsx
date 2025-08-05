import React, { useState, useMemo } from 'react';
import MainContent, { HighlightItem } from './MainContent';
import DashboardIcon from './icons/DashboardIcon';
import FinanceIcon from './icons/FinanceIcon';
import OrderIcon from './icons/OrderIcon';
import ProductionIcon from './icons/ProductionIcon';
import TransactionIcon from './icons/TransactionIcon';
import ExpenseIcon from './icons/ExpenseIcon';
import IngredientsIcon from './icons/IngredientsIcon';
import CustomersIcon from './icons/CustomersIcon';
import EmployeesIcon from './icons/EmployeesIcon';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';
import { User } from './Login';
import { Customer } from './customers/CustomerManagement';
import { Bahan } from './bahan/BahanManagement';
import { Order } from './orders/OrderManagement';
import { Employee } from './employees/EmployeeManagement';
import { Expense } from './expenses/ExpenseManagement';
import ThemeToggle from './ThemeToggle';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  users: User[];
  onUsersUpdate: (users: User[]) => void;
  customers: Customer[];
  onCustomersUpdate: (customers: Customer[]) => void;
  bahanList: Bahan[];
  onBahanUpdate: (bahan: Bahan[]) => void;
  employees: Employee[];
  onEmployeesUpdate: (employees: Employee[]) => void;
  orders: Order[];
  onOrdersUpdate: (orders: Order[] | ((orders: Order[]) => Order[])) => void;
  expenses: Expense[];
  onExpensesUpdate: (expenses: Expense[]) => void;
}

const allMenuItems = [
  { name: 'Dashboard', icon: DashboardIcon, roles: ['Admin', 'Kasir', 'Produksi', 'Office'] },
  { name: 'Keuangan', icon: FinanceIcon, roles: ['Admin'] },
  { name: 'Order', icon: OrderIcon, roles: ['Admin', 'Kasir', 'Office'] },
  { name: 'Produksi', icon: ProductionIcon, roles: ['Admin', 'Kasir', 'Produksi', 'Office'] },
  { name: 'Transaksi', icon: TransactionIcon, roles: ['Admin', 'Kasir'] },
  { name: 'Pengeluaran', icon: ExpenseIcon, roles: ['Admin', 'Kasir'] },
  { name: 'Daftar Bahan', icon: IngredientsIcon, roles: ['Admin', 'Kasir'] },
  { name: 'Daftar Pelanggan', icon: CustomersIcon, roles: ['Admin', 'Kasir'] },
  { name: 'Daftar Karyawan', icon: EmployeesIcon, roles: ['Admin', 'Kasir'] },
  { name: 'Pengaturan', icon: SettingsIcon, roles: ['Admin'] },
];

const DashboardComponent: React.FC<DashboardProps> = (props) => {
  const { user, onLogout } = props;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const visibleMenuItems = useMemo(() => {
    return allMenuItems.filter(item => item.roles.includes(user.level));
  }, [user.level]);

  const [activeView, setActiveView] = useState(visibleMenuItems[0]?.name || 'Dashboard');
  const [highlightedItem, setHighlightedItem] = useState<HighlightItem | null>(null);

  const handleSearchResultSelect = (view: string, id: number | string) => {
    setActiveView(view);
    setHighlightedItem({ view, id });
  };
  
  const handleMenuClick = (viewName: string) => {
    setActiveView(viewName);
    if(window.innerWidth < 1024) {
        setIsSidebarOpen(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
          <div 
              className="fixed inset-0 bg-black/50 z-20 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
          ></div>
      )}
      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:flex`}>
        <div className="h-20 flex items-center justify-center border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-orange-600">NalaKu</h1>
            <p className="text-xs italic text-slate-500 dark:text-slate-400 -mt-1">Satu Aplikasi, Seribu Solusi</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.name;
            return (
              <a
                key={item.name}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleMenuClick(item.name);
                }}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-700 dark:hover:text-orange-500'
                }`}
              >
                <Icon className="h-6 w-6 mr-4" />
                <span className="font-medium">{item.name}</span>
              </a>
            );
          })}
        </nav>
        <div className="px-4 py-6 border-t border-slate-200 dark:border-slate-700">
            <ThemeToggle />
            <button
                onClick={onLogout}
                className="flex items-center w-full px-4 py-3 mt-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-red-50/80 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
            >
                <LogoutIcon className="h-6 w-6 mr-4" />
                <span className="font-medium">Logout</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <MainContent 
            {...props}
            activeView={activeView} 
            onSearchResultSelect={handleSearchResultSelect}
            highlightedItem={highlightedItem}
            clearHighlightedItem={() => setHighlightedItem(null)}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </main>
    </div>
  );
};

export default DashboardComponent;