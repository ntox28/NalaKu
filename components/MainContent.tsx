
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
    expenses, onExpensesUpdate
  } = props;

  const renderContent = () => {
    switch (activeView) {
      case 'Dashboard':
        return <DashboardView orders={orders} customers={customers} expenses={expenses} />;
      case 'Keuangan':
        return <FinanceView orders={orders} expenses={expenses} customers={customers} bahanList={bahanList} users={users} />;
      case 'Order':
        return <OrderManagement customers={customers} bahanList={bahanList} orders={orders} onUpdate={onOrdersUpdate}/>;
      case 'Produksi':
        return <ProductionManagement orders={orders} onUpdate={onOrdersUpdate} customers={customers} bahanList={bahanList} loggedInUser={user} />;
      case 'Transaksi':
        return <TransactionManagement orders={orders} onUpdate={onOrdersUpdate} customers={customers} bahanList={bahanList} loggedInUser={user} users={users} />;
      case 'Daftar Pelanggan':
        return <CustomerManagement customers={customers} onUpdate={onCustomersUpdate} />;
      case 'Daftar Karyawan':
        return <EmployeeManagement employees={employees} onUpdate={onEmployeesUpdate} />;
      case 'Daftar Bahan':
        return <BahanManagement bahanList={bahanList} onUpdate={onBahanUpdate} />;
       case 'Pengeluaran':
        return <ExpenseManagement expenses={expenses} onUpdate={onExpensesUpdate} />;
      case 'Pengaturan':
        return <SettingsManagement users={users} onUsersUpdate={onUsersUpdate} />;
      default:
        return <WelcomeContent user={user} activeView={activeView} />;
    }
  };

  return (
    <div className="flex-1 p-8 flex flex-col bg-gray-100 dark:bg-slate-900 overflow-y-hidden">
      {/* Header */}
      <header className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{activeView}</h1>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-slate-800 dark:text-slate-200 font-semibold capitalize">{user.id}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{user.level}</p>
          </div>
          <img
            className="w-12 h-12 rounded-full border-2 border-orange-500 object-cover"
            src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.id}`}
            alt="User Avatar"
          />
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 mt-8 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainContent;
