
import React, { forwardRef } from 'react';
import { Customer, CustomerLevel } from '../../lib/supabaseClient';
import { Bahan } from '../bahan/BahanManagement';
import { Order } from '../orders/OrderManagement';
import { User } from '../Login';
import { Employee } from '../employees/EmployeeManagement';

interface StrukProps {
  order: Order;
  customers: Customer[];
  bahanList: Bahan[];
  users: User[];
  employees: Employee[];
  loggedInUser: User;
  calculateTotal: (order: Order) => number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const getPriceForCustomer = (bahan: Bahan, level: Customer['level']): number => {
    switch (level) {
        case 'End Customer': return bahan.hargaEndCustomer;
        case 'Retail': return bahan.hargaRetail;
        case 'Grosir': return bahan.hargaGrosir;
        case 'Reseller': return bahan.hargaReseller;
        case 'Corporate': return bahan.hargaCorporate;
        default: return 0;
    }
};

const Struk = forwardRef<HTMLDivElement, StrukProps>(({ order, customers, bahanList, users, employees, loggedInUser, calculateTotal }, ref) => {
  const customer = customers.find(c => c.id === order.pelangganId);
  const totalTagihan = calculateTotal(order);
  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);

  const getEmployeeNameByUserId = (userId: string | null | undefined): string => {
    if (!userId) return 'N/A';
    const user = users.find(u => u.id === userId);
    if (!user) return userId;
    const employee = employees.find(e => e.id === user.employeeId);
    return employee ? employee.name : userId;
  };

  const lastPayment = order.payments.length > 0 ? order.payments[order.payments.length - 1] : null;
  const kasirName = lastPayment ? getEmployeeNameByUserId(lastPayment.kasirId) : getEmployeeNameByUserId(loggedInUser.id);


  return (
    <div ref={ref} className="bg-white text-black font-sans text-xs w-[300px] p-1">
      <div className="text-center">
                <h1 className="font-bold text-lg leading-tight">NALAMEDIA</h1>
            </div>
            <hr className="border-dashed border-black my-0.5" />
      <div className="text-center text-[9px] leading-tight mt-2">
  <div className="m-0">Jl. Prof. Moh. Yamin</div>
  <div className="m-0">Cerbonan, Karanganyar</div>
  <div className="m-0">(Timur Stadion 45)</div>
  <div className="m-0">Telp: 0813-9872-7722</div>
</div>
      <hr className="border-dashed border-black my-0.5"/>
    <div className="leading-tight">
        <div className="flex justify-between">
          <span>No Nota  :</span>
          <span>{order.noNota}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal  :</span>
          <span>{new Date(order.tanggal).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir    :</span>
          <span>{kasirName}</span>
        </div>
        <div className="flex justify-between">
          <span>Pelanggan:</span>
          <span>{customer?.name || 'N/A'}</span>
        </div>
        </div>
      <hr className="border-dashed border-black my-0.5"/>
      <div className="flex font-bold">
  <div className="w-[10%] pr-1">No.</div>
  <div className="w-[60%] pr-1">Detail Pesanan</div>
  <div className="w-[30%] text-right">Total</div>
</div>
<hr className="border-dashed border-black my-1" />

{order.items.map((item, index) => {
  const bahan = bahanList.find(b => b.id === item.bahanId);
  if (!bahan || !customer) return null;

  const hargaSatuan = getPriceForCustomer(bahan, customer.level);
  const area = item.panjang > 0 && item.lebar > 0 ? item.panjang * item.lebar : 1;
  const jumlah = hargaSatuan * area * item.qty;

  return (
    <div key={item.id} className="py-0.5">
        <div className="flex items-start">
            <div className="w-[10%] pr-1 align-top">{index + 1}.</div>
            <div className="w-[90%] break-words leading-tight">
                <p>{item.deskripsiPesanan || bahan.name}</p>
                <div className="flex justify-between text-[9px]">
                    <span>{item.qty} x {formatCurrency(hargaSatuan * area)}</span>
                    <span className="font-bold">{formatCurrency(jumlah)}</span>
                </div>
            </div>
        </div>
    </div>
  );
})}
<hr className="border-dashed border-black my-0.5" />
<div className="space-y-1 mt-1">
  <div className="flex justify-between">
    <span>Subtotal:</span>
    <span className="font-bold">{formatCurrency(totalTagihan)}</span>
  </div>
  <div className="flex justify-between">
    <span>Bayar:</span>
    <span>{formatCurrency(totalPaid)}</span>
  </div>
  <div className="flex justify-between font-bold text-sm">
    <span>SISA:</span>
    <span>{formatCurrency(totalTagihan - totalPaid)}</span>
  </div>
</div>
<hr className="border-dashed border-black my-2" />
<div className="text-center text-[9px] mt-1 space-y-1">
  <p>Mohon barang dicek kembali.</p>
  <p>Komplain 1x24 Jam.</p>
  <p className="font-bold">Terima Kasih!</p>
</div>

    </div>
  );
});

export default Struk;
