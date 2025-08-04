import React, { forwardRef } from 'react';
import { Customer } from '../customers/CustomerManagement';
import { Bahan } from '../bahan/BahanManagement';
import { Order } from '../orders/OrderManagement';
import { User } from '../Login';

interface StrukProps {
  order: Order;
  customers: Customer[];
  bahanList: Bahan[];
  users: User[];
  calculateTotal: (order: Order) => number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value).replace('Rp', '').trim();
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

const Struk = forwardRef<HTMLDivElement, StrukProps>(({ order, customers, bahanList, users, calculateTotal }, ref) => {
  const customer = customers.find(c => c.id === order.pelangganId);
  const lastPayment = order.payments.length > 0 ? order.payments[order.payments.length - 1] : null;
  const kasir = users.find(u => u.id === lastPayment?.kasirId);
  const totalTagihan = calculateTotal(order);
  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div ref={ref} className="p-2 bg-white text-black font-mono text-xs w-[300px]">
      <div className="text-center">
        <h2 className="text-base font-bold">NalaKu</h2>
        <p>Jl. Prof. Moh. Yamin,Cerbonan,Karanganyar</p>
        <p>(Timur Stadion 45)</p>
        <p>Telp: 0812-3456-7890</p>
      </div>
      <hr className="my-2 border-dashed border-black"/>
      <div>
        <p>No Nota  : {order.noNota}</p>
        <p>Tanggal  : {new Date(order.tanggal).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        <p>Kasir    : {kasir?.id || 'N/A'}</p>
        <p>Pelanggan: {customer?.name || 'N/A'}</p>
      </div>
      <hr className="my-2 border-dashed border-black"/>
      <div>
        {order.items.map((item) => {
          const bahan = bahanList.find(b => b.id === item.bahanId);
          if (!bahan || !customer) return null;
          
          const hargaSatuan = getPriceForCustomer(bahan, customer.level);
          const itemArea = item.panjang > 0 && item.lebar > 0 ? item.panjang * item.lebar : 1;
          const jumlah = hargaSatuan * itemArea * item.qty;

          return (
            <div key={item.id} className="mb-1">
              <p>{bahan.name}</p>
              <div className="flex justify-between">
                <span>{item.qty} x {formatCurrency(hargaSatuan * itemArea)}</span>
                <span>{formatCurrency(jumlah)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <hr className="my-2 border-dashed border-black"/>
      <div className="space-y-1">
          <div className="flex justify-between">
            <span>Total</span>
            <span>{formatCurrency(totalTagihan)}</span>
          </div>
          <div className="flex justify-between">
            <span>Bayar</span>
            <span>{formatCurrency(totalPaid)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Sisa</span>
            <span>{formatCurrency(totalTagihan - totalPaid)}</span>
          </div>
      </div>
      <hr className="my-2 border-dashed border-black"/>
      <div className="text-center mt-2">
        <p>Terima kasih atas kunjungan Anda!</p>
      </div>
    </div>
  );
});

export default Struk;