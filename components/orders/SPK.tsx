
import React, { forwardRef } from 'react';
import { Order, OrderItem } from './OrderManagement';
import { Customer } from '../customers/CustomerManagement';
import { Bahan } from '../bahan/BahanManagement';

interface SPKProps {
    order: Order;
    customer: Customer | undefined;
    bahanList: Bahan[];
}

const formatDateForSPK = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const SPK = forwardRef<HTMLDivElement, SPKProps>(({ order, customer, bahanList }, ref) => {
    return (
        <div ref={ref} className="bg-white text-black font-mono text-xs p-1">
            <div className="text-center">
                <h1 className="text-lg font-bold">Nala Media</h1>
            </div>
            <hr />
            <p>{formatDateForSPK(order.tanggal)}</p>
            <p>{order.noNota}</p>
            <p>{customer?.name || 'N/A'}</p>
            <hr />
            {/* Header */}
            <div className="flex font-bold">
                <div className="w-[10%] pr-1">No.</div>
                <div className="w-[25%] pr-1">Bahan</div>
                <div className="w-[30%] pr-1">Deskripsi</div>
                <div className="w-[20%] pr-1">Ukuran</div>
                <div className="w-[15%] text-right">Qty</div>
            </div>
            <hr />
            {/* Items */}
            {order.items.map((item, index) => {
                const bahan = bahanList.find(b => b.id === item.bahanId);
                const ukuran = item.panjang > 0 && item.lebar > 0 ? `${item.panjang}x${item.lebar}m` : '-';
                const qty = `${item.qty} Pcs`;
                return (
                    <div key={item.id} className="flex text-xs">
                         <div className="w-[10%] pr-1 align-top">{index + 1}.</div>
                         <div className="w-[25%] pr-1 align-top break-words">{bahan?.name || 'N/A'}</div>
                         <div className="w-[30%] pr-1 align-top break-words">{item.deskripsiPesanan || '-'}</div>
                         <div className="w-[20%] pr-1 align-top">{ukuran}</div>
                         <div className="w-[15%] align-top text-right">{qty}</div>
                    </div>
                );
            })}
             <hr />
             <div className="text-center mt-2">
                <p>Mohon periksa data pekerjaan</p>
                <p>Tanyakan ke Office jika ada data yang salah!!!</p>
            </div>
        </div>
    );
});

export default SPK;
