import React, { forwardRef } from 'react';
import { Customer } from '../customers/CustomerManagement';
import { Bahan } from '../bahan/BahanManagement';
import { Order } from '../orders/OrderManagement';
import { User } from '../Login';

interface NotaProps {
  order: Order;
  customers: Customer[];
  bahanList: Bahan[];
  users: User[];
  calculateTotal: (order: Order) => number;
}

const formatCurrencyDotMatrix = (value: number) => {
    return new Intl.NumberFormat('id-ID', {}).format(value);
};

const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

const Nota = forwardRef<HTMLDivElement, NotaProps>(({ order, customers, bahanList, users, calculateTotal }, ref) => {
  const customer = customers.find(c => c.id === order.pelangganId);
  const lastPayment = order.payments.length > 0 ? order.payments[order.payments.length - 1] : null;
  const kasir = users.find(u => u.id === lastPayment?.kasirId);
  const totalTagihan = calculateTotal(order);
  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div ref={ref} className="nota-dot-matrix bg-white text-black p-4">
      <div className="nota-header">
        <h1 className="company-name">Nala Media</h1>
        <p>Jl. Prof. Moh. Yamin,Cerbonan,Karanganyar (Timur Stadion 45)</p>
        <p>Telepon: 0812-3456-7890</p>
      </div>
      <hr className="separator" />
      <div className="nota-info">
        <span>No Nota: {order.noNota}</span>
        <span>Tanggal: {formatDate(order.tanggal)}</span>
      </div>
       <div className="nota-info">
        <span>Pelanggan: {customer?.name || 'N/A'}</span>
        <span>Kasir: {kasir?.id || 'N/A'}</span>
      </div>
      <hr className="separator" />
      <div className="nota-items">
        {order.items.map((item) => {
          const bahan = bahanList.find(b => b.id === item.bahanId);
          if (!bahan || !customer) return null;
          
          const hargaSatuan = getPriceForCustomer(bahan, customer.level);
          const itemArea = item.panjang > 0 && item.lebar > 0 ? item.panjang * item.lebar : 1;
          const jumlah = hargaSatuan * itemArea * item.qty;

          return (
            <div key={item.id} className="item-row">
              <p className="item-name">{bahan.name} {item.panjang > 0 && `(${item.panjang}x${item.lebar}m)`}</p>
              {item.deskripsiPesanan && <p className="item-desc">{item.deskripsiPesanan}</p>}
              <div className="item-calculation">
                <span>{item.qty} x {formatCurrencyDotMatrix(hargaSatuan * itemArea)}</span>
                <span>{formatCurrencyDotMatrix(jumlah)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <hr className="separator" />
      <div className="nota-summary">
        <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrencyDotMatrix(totalTagihan)}</span>
        </div>
        <div className="summary-row">
            <span>Bayar</span>
            <span>{formatCurrencyDotMatrix(totalPaid)}</span>
        </div>
        <div className="summary-row total">
            <span>SISA</span>
            <span>{formatCurrencyDotMatrix(totalTagihan - totalPaid)}</span>
        </div>
      </div>
      <hr className="separator" />
      <div className="nota-footer">
        <p>Terima kasih atas kepercayaan Anda!</p>
        <p>Barang yang sudah dibeli tidak dapat dikembalikan.</p>
      </div>
    </div>
  );
});

export default Nota;
