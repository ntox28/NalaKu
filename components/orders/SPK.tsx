import React, { forwardRef } from 'react';
import { Order } from './OrderManagement';
import { Customer } from '../../lib/supabaseClient';
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
        <div ref={ref} className="bg-white text-black font-sans text-xs w-[300px]">
            <div className="text-center">
                <h1 className="font-bold text-lg">NALAMEDIA</h1>
            </div>
            <hr className="border-dashed border-black my-0.5" />
            <div className="text-center text-[10px] leading-tight">
                <p>Nota: {order.noNota} | {customer?.name || 'N/A'}</p>
                <p>Tanggal Masuk: {formatDateForSPK(order.tanggal)}</p>
            </div>

            <hr className="border-dashed border-black my-0.5" />
            
            <div className="flex font-semibold">
                <div className="w-[10%] pr-1">No.</div>
                <div className="w-[90%]">Detail Pesanan</div>
            </div>
            
            <hr className="border-dashed border-black my-0.5" />

            {/* Items List */}
            <div className="mt-0.5">
                {order.items.map((item, index) => {
                    const bahan = bahanList.find(b => b.id === item.bahanId);
                    const ukuran = item.panjang > 0 && item.lebar > 0 ? `${item.panjang}x${item.lebar}` : '-';
                    const deskripsi = item.deskripsiPesanan || '-';
                    const qty = `${item.qty}Pcs`;
                    const finishing = item.finishing || '-';

                    return (
                        <div key={item.id} className="flex mb-1">
                            <div className="w-[10%] pr-1 align-top">{index + 1}.</div>
                            <div className="w-[90%] leading-tight">
                                <p className="font-bold break-words">{deskripsi}</p>
                                <p className="break-words">{bahan?.name || 'Bahan Tidak Ditemukan'}</p>
                                <p className="break-words">{ukuran} // {qty}</p>
                                <p className="break-words">{finishing}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <hr className="border-dashed border-black my-0.5" />
            <div className="text-center text-[9px] leading-tight space-y-0.5 pt-0.5">
                <p>--PERHATIAN--</p>
                <p>Cek data pekerjaan sebelum cetak</p>
                <p>Pastikan semua data benar</p>
                <p>Tanyakan ke Office jika ada data</p>
                <p>yang salah atau kurang!!!</p>
            </div>
        </div>
    );
});

export default SPK;