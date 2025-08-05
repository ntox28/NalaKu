import React from 'react';
import CustomerManagement, { Customer } from './customers/CustomerManagement';
import EmployeeManagement, { Employee } from './employees/EmployeeManagement';
import SettingsManagement from './settings/SettingsManagement';
import BahanManagement, { Bahan } from './bahan/BahanManagement';
import ExpenseManagement, { Expense } from './expenses/ExpenseManagement';
import OrderManagement, { Order } from './orders/OrderManagement';
import ProductionManagement from './production/ProductionManagement';
import TransactionManagement from './transactions/TransactionManagement';
import DashboardView from './dashboard/DashboardView';
import FinanceView from './finance/FinanceView';
import { User } from './Login';
import GlobalSearch from './GlobalSearch';
import MenuIcon from './icons/MenuIcon';

export type HighlightItem = {
    view: string;
    id: number | string;
};

interface MainContentProps {
  user: User;
  activeView: string;
  users: User[];
  onUsersUpdate: (users: User[]) => void;
  customers: Customer[];
  onCustomersUpdate: (customers: Customer[]) => void;
  bahanList: Bahan[];
  onBahanUpdate: (bahan: Bahan[]) => void;
  employees: Employee[];
  onEmployeesUpdate: (employees: Employee[]) => void;
  orders: Order[];
  onOrdersUpdate: (orders: Order[]) => void;
  expenses: Expense[];
  onExpensesUpdate: (expenses: Expense[]) => void;
  onSearchResultSelect: (view: string, id: number | string) => void;
  highlightedItem: HighlightItem | null;
  clearHighlightedItem: () => void;
  onToggleSidebar: () => void;
}

const WelcomeContent: React.FC<{ user: User; activeView: string }> = ({ user, activeView }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Selamat Datang di {activeView}
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
            Ini adalah area konten untuk {activeView}. Fungsionalitas spesifik untuk modul ini akan ditampilkan di sini.
            Saat ini, Anda masuk sebagai <span className="font-bold text-orange-600 capitalize">{user.id}</span>.
        </p>
    </div>
);


const MainContent: React.FC<MainContentProps> = (props) => {
  const { 
    user, activeView, users, onUsersUpdate, 
    customers, onCustomersUpdate, bahanList, onBahanUpdate,
    employees, onEmployeesUpdate, orders, onOrdersUpdate,
    expenses, onExpensesUpdate,
    onSearchResultSelect, highlightedItem, clearHighlightedItem,
    onToggleSidebar
  } = props;

  const highlightProps = {
      highlightedItem: highlightedItem,
      clearHighlightedItem: clearHighlightedItem,
  };

  const employee = employees.find(e => e.id === user.employeeId);
  const displayName = employee ? employee.name : user.id;
  const avatarSeed = displayName;


  const renderContent = () => {
    switch (activeView) {
      case 'Dashboard':
        return <DashboardView orders={orders} customers={customers} expenses={expenses} />;
      case 'Keuangan':
        return <FinanceView orders={orders} expenses={expenses} customers={customers} bahanList={bahanList} users={users} />;
      case 'Order':
        return <OrderManagement customers={customers} bahanList={bahanList} orders={orders} onUpdate={onOrdersUpdate} {...highlightProps}/>;
      case 'Produksi':
        return <ProductionManagement orders={orders} onUpdate={onOrdersUpdate} customers={customers} bahanList={bahanList} loggedInUser={user} {...highlightProps}/>;
      case 'Transaksi':
        return <TransactionManagement orders={orders} onUpdate={onOrdersUpdate} customers={customers} bahanList={bahanList} loggedInUser={user} users={users} employees={employees} {...highlightProps}/>;
      case 'Daftar Pelanggan':
        return <CustomerManagement customers={customers} onUpdate={onCustomersUpdate} {...highlightProps}/>;
      case 'Daftar Karyawan':
        return <EmployeeManagement employees={employees} onUpdate={onEmployeesUpdate} users={users} onUsersUpdate={onUsersUpdate} />;
      case 'Daftar Bahan':
        return <BahanManagement bahanList={bahanList} onUpdate={onBahanUpdate} />;
       case 'Pengeluaran':
        return <ExpenseManagement expenses={expenses} onUpdate={onExpensesUpdate} />;
      case 'Pengaturan':
        return <SettingsManagement users={users} onUsersUpdate={onUsersUpdate} employees={employees} />;
      default:
        return <WelcomeContent user={user} activeView={activeView} />;
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col bg-gray-100 dark:bg-slate-900 h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 gap-4">
        <div className="flex items-center gap-4">
             <button onClick={onToggleSidebar} className="lg:hidden text-slate-600 dark:text-slate-300">
                <MenuIcon className="h-6 w-6" />
             </button>
             <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{activeView}</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <GlobalSearch orders={orders} customers={customers} onResultSelect={onSearchResultSelect} />
          <div className="text-right flex-shrink-0">
            <p className="text-slate-800 dark:text-slate-200 font-semibold capitalize truncate">{displayName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{user.level}</p>
          </div>
          <img
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-orange-500 object-cover"
            src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}`}
            alt="User Avatar"
          />
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 mt-6 lg:mt-8 overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainContent;