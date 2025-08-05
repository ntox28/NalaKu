import React, { forwardRef } from 'react';
import { Customer } from '../customers/CustomerManagement';
import { Bahan } from '../bahan/BahanManagement';
import { Order } from '../orders/OrderManagement';
import { User } from '../Login';
import { Employee } from '../employees/EmployeeManagement';

interface NotaProps {
  order: Order;
  customers: Customer[];
  bahanList: Bahan[];
  users: User[];
  employees: Employee[];
  loggedInUser: User;
  calculateTotal: (order: Order) => number;
}

const formatCurrencyDotMatrix = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (isoDate: string) => {
  return new Date(isoDate).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

const Nota = forwardRef<HTMLDivElement, NotaProps>(({
  order, customers, bahanList, users, employees, loggedInUser, calculateTotal
}, ref) => {

  const customer = customers.find(c => c.id === order.pelangganId);
  const totalTagihan = calculateTotal(order);
  const totalPaid = order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  const getEmployeeNameByUserId = (userId: string | null | undefined): string => {
    if (!userId) return 'N/A';
    const user = users.find(u => u.id === userId);
    if (!user) return userId;
    const employee = employees.find(e => e.id === user.employeeId);
    return employee ? employee.name : userId;
  };

  const lastPayment = order.payments?.length > 0 ? order.payments[order.payments.length - 1] : null;
  const kasirName = lastPayment ? getEmployeeNameByUserId(lastPayment.kasirId) : getEmployeeNameByUserId(loggedInUser.id);

  return (
    <div ref={ref} className="nota-dot-matrix bg-white text-black p-4 font-sans text-xs">
      <div className="nota-header text-center">
        <h1 className="company-name text-base font-bold">Nala Media</h1>
        <div>Jl. Prof. Moh. Yamin, Cerbonan, Karanganyar (Timur Stadion 45)</div>
        <div>Telepon: 0812-3456-7890</div>
      </div>

      <hr className="separator" />

      {/* Informasi Nota */}
      <div className="nota-info">
        <span>No Nota: {order.noNota}</span>
        <span>Tanggal: {formatDate(order.tanggal)}</span>
      </div>
      <div className="nota-info">
        <span>Pelanggan: {customer?.name || 'N/A'}</span>
        <span>Kasir: {kasirName}</span>
      </div>

      <hr className="separator" />

      {/* Tabel Item Nota */}
      <div className="nota-items">
        <div className="flex font-bold">
          <div className="w-[10%] pr-1">No.</div>
          <div className="w-[35%] pr-1">Deskripsi</div>
          <div className="w-[20%] pr-1">Bahan</div>
          <div className="w-[15%] text-center pr-1">Ukuran</div>
          <div className="w-[20%] text-right">Total Harga</div>
        </div>
        <hr className="my-1 border-dashed border-black" />

        {order.items?.map((item, index) => {
          const bahan = bahanList.find(b => b.id === item.bahanId);
          if (!bahan || !customer) return null;

          const hargaSatuan = getPriceForCustomer(bahan, customer.level);
          const area = item.panjang > 0 && item.lebar > 0 ? item.panjang * item.lebar : 1;
          const jumlah = hargaSatuan * area * item.qty;

          return (
            <div key={item.id} className="flex items-start py-0.5">
              <div className="w-[10%] pr-1">{index + 1}.</div>
              <div className="w-[35%] pr-1 break-words">{item.deskripsiPesanan || '-'}</div>
              <div className="w-[20%] pr-1 break-words">{bahan.name}</div>
              <div className="w-[15%] text-center pr-1">
                {item.panjang > 0 ? `${item.panjang}x${item.lebar}m` : '-'}
              </div>
              <div className="w-[20%] text-right">{formatCurrencyDotMatrix(jumlah)}</div>
            </div>
          );
        })}
      </div>

      {/* Riwayat Pembayaran */}
      {order.payments?.length > 0 && (
        <>
          <hr className="separator" />
          <div className="nota-payment-history mt-2">
            <div className="font-bold">Riwayat Pembayaran:</div>
            <div className="flex font-bold text-[9px]">
              <div className="w-[35%]">Tanggal</div>
              <div className="w-[35%]">Kasir</div>
              <div className="w-[30%] text-right">Jumlah</div>
            </div>
            <hr className="my-1 border-dashed border-black" />
            {order.payments.map((payment, index) => (
              <div key={index} className="flex items-start py-0.5 text-[9px]">
                <div className="w-[35%]">{formatDate(payment.date)}</div>
                <div className="w-[35%] capitalize">{getEmployeeNameByUserId(payment.kasirId)}</div>
                <div className="w-[30%] text-right">{formatCurrencyDotMatrix(payment.amount)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <hr className="separator" />

<table className="w-full text-[9px] mt-2">
  <tbody>
    <tr className="align-top">
      <td className="w-2/3 pr-4">
        <strong>Pembayaran Transfer: a/n Ariska Prima Diastari</strong>
      </td>
      <td className="w-1/3 text-right font-semibold">
        Subtotal: {formatCurrencyDotMatrix(totalTagihan)}
      </td>
    </tr>
    <tr className="align-top">
      <td>BRI: 670-70-10-28864537 | BCA: 0154361801 | BPD JATENG: 3142069325</td>
      <td className="text-right font-semibold">
        Bayar: {formatCurrencyDotMatrix(totalPaid)}
      </td>
    </tr>
    <tr className="align-top">
      <td>Mohon barang dicek terlebih dahulu | Komplain lebih dari 1 hari tidak kami layani!</td>
      <td className="text-right font-bold">
        SISA: {formatCurrencyDotMatrix(totalTagihan - totalPaid)}
      </td>
    </tr>
  </tbody>
</table>

      {/* Tanda Tangan */}
      <div className="flex justify-end mt-8">
        <div className="text-center">
          <div>Hormat kami,</div>
        </div>
      </div>
    </div>
  );
});

export default Nota;