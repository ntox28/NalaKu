import React, { useState, useMemo, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Customer, CustomerLevel } from '../customers/CustomerManagement';
import { Bahan } from '../bahan/BahanManagement';
import { Order, OrderItem, Payment, PaymentStatus, ProductionStatus } from '../orders/OrderManagement';
import { User } from '../Login';
import PrintIcon from '../icons/PrintIcon';
import WhatsAppIcon from '../icons/WhatsAppIcon';
import ImageIcon from '../icons/ImageIcon';
import Nota from './Nota';
import Pagination from '../Pagination';
import FilterBar from '../FilterBar';
import StatCard from '../dashboard/StatCard';
import TrendingUpIcon from '../icons/TrendingUpIcon';
import FinanceIcon from '../icons/FinanceIcon';
import ClipboardListIcon from '../icons/ClipboardListIcon';
import Struk from './Struk';
import ReceiptIcon from '../icons/ReceiptIcon';
import { useToast } from '../../hooks/useToast';

interface TransactionManagementProps {
    orders: Order[];
    onUpdate: (updatedOrders: Order[]) => void;
    customers: Customer[];
    bahanList: Bahan[];
    loggedInUser: User;
    users: User[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
        'Belum Lunas': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        'DP': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Lunas': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    return colors[status];
};

const getProductionStatusColor = (status: ProductionStatus) => {
    const colors: Record<ProductionStatus, string> = {
        'Belum Dikerjakan': 'bg-gray-100 text-gray-800 dark:bg-slate-600 dark:text-slate-200',
        'Proses': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Selesai': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    return colors[status];
};

const getPriceForCustomer = (bahan: Bahan, level: CustomerLevel): number => {
    switch (level) {
        case 'End Customer': return bahan.hargaEndCustomer;
        case 'Retail': return bahan.hargaRetail;
        case 'Grosir': return bahan.hargaGrosir;
        case 'Reseller': return bahan.hargaReseller;
        case 'Corporate': return bahan.hargaCorporate;
        default: return 0;
    }
};

const calculateTotalPaid = (order: Order): number => {
    if (!order.payments || order.payments.length === 0) {
        return 0;
    }
    return order.payments.reduce((sum, payment) => sum + payment.amount, 0);
};

const TransactionManagement: React.FC<TransactionManagementProps> = ({ orders, onUpdate, customers, bahanList, loggedInUser, users }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState<number | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [newPaymentAmount, setNewPaymentAmount] = useState(0);
    const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const notaRef = useRef<HTMLDivElement>(null);
    const strukRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;
    
    const [filters, setFilters] = useState({
        customerId: 'all',
        startDate: '',
        endDate: '',
        status: 'all',
    });

    const calculateTotal = (order: Order): number => {
        const customer = customers.find(c => c.id === order.pelangganId);
        if (!customer) return 0;

        return order.items.reduce((total, item) => {
            const bahan = bahanList.find(b => b.id === item.bahanId);
            if (!bahan) return total;

            const price = getPriceForCustomer(bahan, customer.level);
            const itemArea = item.panjang > 0 && item.lebar > 0 ? item.panjang * item.lebar : 1;
            const itemTotal = price * itemArea * item.qty;
            return total + itemTotal;
        }, 0);
    };
    
    const todayStats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];

        const revenueToday = orders.flatMap(o => o.payments)
            .filter(p => p.date === todayStr)
            .reduce((sum, p) => sum + p.amount, 0);
        
        const todaysOrders = orders.filter(o => o.tanggal === todayStr);

        const unpaidToday = todaysOrders
            .filter(o => o.statusPembayaran !== 'Lunas')
            .reduce((sum, o) => {
                const total = calculateTotal(o);
                const paid = calculateTotalPaid(o);
                return sum + (total - paid);
            }, 0);
            
        const totalOrdersToday = todaysOrders.length;

        return { revenueToday, unpaidToday, totalOrdersToday };
    }, [orders, customers, bahanList]);

    const transactions = useMemo(() => {
        return orders
            .filter(order => {
                const isTransaction = order.items.some(item => item.statusProduksi === 'Proses' || item.statusProduksi === 'Selesai');
                if (!isTransaction) return false;

                const customerMatch = filters.customerId === 'all' || order.pelangganId === Number(filters.customerId);
                const startDateMatch = !filters.startDate || order.tanggal >= filters.startDate;
                const endDateMatch = !filters.endDate || order.tanggal <= filters.endDate;
                const statusMatch = filters.status === 'all' || order.statusPembayaran === filters.status;
                
                return customerMatch && startDateMatch && endDateMatch && statusMatch;
            })
            .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    }, [orders, filters]);

    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
    const currentTransactions = transactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const handleFilterChange = (name: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            customerId: 'all',
            startDate: '',
            endDate: '',
            status: 'all',
        });
    };

    const paymentStatusOptions = [
        { value: 'Belum Lunas', label: 'Belum Lunas' },
        { value: 'DP', label: 'DP' },
        { value: 'Lunas', label: 'Lunas' },
    ];

    const handleOpenModal = (order: Order) => {
        setSelectedOrder(order);
        setNewPaymentAmount(0);
        setNewPaymentDate(new Date().toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
        setNewPaymentAmount(0);
    };

    const handlePaymentSubmit = () => {
        if (!selectedOrder || newPaymentAmount <= 0) {
            addToast('Jumlah pembayaran harus lebih besar dari 0.', 'error');
            return;
        }

        const totalTagihan = calculateTotal(selectedOrder);
        const totalPaid = calculateTotalPaid(selectedOrder);
        const newTotalPaid = totalPaid + newPaymentAmount;

        let newStatus: PaymentStatus = 'DP';
        if (newTotalPaid >= totalTagihan) {
            newStatus = 'Lunas';
        }

        const newPayment: Payment = {
            amount: newPaymentAmount,
            date: newPaymentDate,
            kasirId: loggedInUser.id,
        };

        const updatedOrder: Order = {
            ...selectedOrder,
            payments: [...selectedOrder.payments, newPayment],
            statusPembayaran: newStatus,
        };

        onUpdate(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        addToast(`Pembayaran sebesar ${formatCurrency(newPaymentAmount)} berhasil ditambahkan.`, 'success');
        handleCloseModal();
    };

    const getKasirName = (order: Order) => {
        if (!order.payments || order.payments.length === 0) return '-';
        const lastPayment = order.payments[order.payments.length - 1];
        return users.find(u => u.id === lastPayment.kasirId)?.id || 'N/A';
    };
    
    const handlePrint = () => {
       if (!notaRef.current) {
            addToast('Gagal memuat data nota.', 'error');
            return;
        }
    
        addToast('Mempersiapkan nota untuk dicetak...', 'info');
        const printContents = notaRef.current.innerHTML;
        const printWindow = window.open('', '', 'height=800,width=800');

        if (printWindow) {
            printWindow.document.write('<html><head><title>Cetak Nota</title>');
            printWindow.document.write(`
                <style>
                    @page {
                        margin: 15mm 10mm;
                    }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        color: black !important;
                        background-color: white !important;
                        margin: 0;
                        padding: 0;
                        font-size: 10pt;
                    }
                    .nota-dot-matrix {
                        width: 100%;
                    }
                    .nota-header, .nota-footer {
                        text-align: center;
                    }
                    .company-name {
                        font-size: 14pt;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .nota-info, .summary-row, .item-calculation {
                        display: flex;
                        justify-content: space-between;
                        margin: 2px 0;
                    }
                    hr.separator {
                        border: none;
                        border-top: 1px dashed black;
                        margin: 10px 0;
                    }
                    .item-row {
                        margin-bottom: 8px;
                    }
                    .item-name {
                        font-weight: bold;
                    }
                    .item-desc {
                        font-size: 9pt;
                        padding-left: 10px;
                        color: black;
                    }
                    .item-calculation {
                        padding-left: 10px;
                    }
                    .nota-summary {
                        margin-top: 10px;
                    }
                    .summary-row.total {
                        font-weight: bold;
                        margin-top: 5px;
                        padding-top: 5px;
                        border-top: 1px solid black;
                    }
                    .nota-footer {
                        margin-top: 20px;
                    }
                </style>
            `);
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContents);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();

            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };
    
    const handlePrintStruk = () => {
       addToast('Mempersiapkan struk untuk dicetak...', 'info');
       const printContents = strukRef.current?.innerHTML;
       if(printContents) {
         const printWindow = window.open('', '', 'height=600,width=400');
         printWindow?.document.write('<html><head><title>Cetak Struk</title>');
         printWindow?.document.write(`
          <style>
              body { font-family: 'Courier New', Courier, monospace; font-size: 10pt; color: #000; margin: 0; padding: 10px; }
              .struk-container { width: 300px; }
              h1, h2, h3, p, div, span, td, th { font-family: 'Courier New', Courier, monospace !important; }
              hr { border: none; border-top: 1px dashed black; margin: 8px 0; }
          </style>
        `);
         printWindow?.document.write('<script src="https://cdn.tailwindcss.com"></script>');
         printWindow?.document.write('</head><body class="bg-white">');
         printWindow?.document.write(`<div class="struk-container">${printContents}</div>`);
         printWindow?.document.write('</body></html>');
         printWindow?.document.close();
         printWindow?.focus();
         setTimeout(() => {
            printWindow?.print();
            printWindow?.close();
         }, 500);
       }
    };
    
    const handleSaveImage = () => {
        if(notaRef.current && selectedOrder){
            addToast('Menyimpan nota sebagai gambar...', 'info');
            html2canvas(notaRef.current, {scale: 2, backgroundColor: '#ffffff'}).then(canvas => {
                const link = document.createElement('a');
                link.download = `nota-${selectedOrder.noNota}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };
    
    const handleSendWhatsApp = () => {
        if(!selectedOrder) return;
        const customer = customers.find(c => c.id === selectedOrder.pelangganId);
        const totalTagihan = calculateTotal(selectedOrder);
        const totalPaid = calculateTotalPaid(selectedOrder);
        const kasir = getKasirName(selectedOrder);
        
        let itemsList = '';
        selectedOrder.items.forEach(item => {
            const bahan = bahanList.find(b => b.id === item.bahanId);
            if (!bahan || !customer) return;
            const hargaSatuan = getPriceForCustomer(bahan, customer.level);
            const itemArea = item.panjang > 0 && item.lebar > 0 ? item.panjang * item.lebar : 1;
            const jumlah = hargaSatuan * itemArea * item.qty;

            itemsList += `${bahan.name}\n`;
            itemsList += `  ${item.qty} x ${formatCurrency(hargaSatuan * itemArea)} = ${formatCurrency(jumlah)}\n`;
        });
        
        let message = `*NalaKu*\nJl. Prof. Moh. Yamin,Cerbonan,Karanganyar\n(Timur Stadion 45)\nTelp: 0812-3456-7890\n--------------------------------\n`;
        message += `No Nota  : ${selectedOrder.noNota}\n`;
        message += `Tanggal  : ${new Date(selectedOrder.tanggal).toLocaleString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})}\n`;
        message += `Kasir    : ${kasir}\n`;
        message += `Pelanggan: ${customer?.name || 'N/A'}\n`;
        message += `--------------------------------\n`;
        message += itemsList;
        message += `--------------------------------\n`;
        message += `Total    : *${formatCurrency(totalTagihan)}*\n`;
        message += `Bayar    : ${formatCurrency(totalPaid)}\n`;
        message += `Sisa     : ${formatCurrency(totalTagihan - totalPaid)}\n`;
        message += `--------------------------------\n`;
        message += `Terima kasih!`;

        const phone = customer?.phone.replace(/[^0-9]/g, '');
        if(phone){
            addToast('Membuka WhatsApp...', 'info');
            const whatsappUrl = `https://wa.me/62${phone.startsWith('0') ? phone.substring(1) : phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            addToast('Nomor telepon pelanggan tidak ditemukan.', 'error');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
             {/* This is for rendering the note for export */}
            <div className="hidden">
                 {selectedOrder && (
                    <>
                        <Nota ref={notaRef} order={selectedOrder} customers={customers} bahanList={bahanList} users={users} calculateTotal={calculateTotal} />
                        <Struk ref={strukRef} order={selectedOrder} customers={customers} bahanList={bahanList} users={users} calculateTotal={calculateTotal} />
                    </>
                 )}
            </div>
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Transaksi</h2>
            </div>

            {/* Daily Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard title="Pendapatan Hari Ini" value={formatCurrency(todayStats.revenueToday)} icon={<TrendingUpIcon />} />
                <StatCard title="Pesanan Belum Lunas Hari Ini" value={formatCurrency(todayStats.unpaidToday)} icon={<FinanceIcon />} />
                <StatCard title="Total Pesanan Hari Ini" value={todayStats.totalOrdersToday.toString()} icon={<ClipboardListIcon />} />
            </div>

            <FilterBar
                customers={customers}
                statusOptions={paymentStatusOptions}
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
            />

            {transactions.length > 0 ? (
                <>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 sticky top-0 backdrop-blur-sm">
                            <tr>
                                <th scope="col" className="px-6 py-3">No. Nota</th>
                                <th scope="col" className="px-6 py-3">Pelanggan</th>
                                <th scope="col" className="px-6 py-3">Kasir</th>
                                <th scope="col" className="px-6 py-3 text-right">Total Tagihan</th>
                                <th scope="col" className="px-6 py-3 text-center">Status Pembayaran</th>
                                <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {currentTransactions.map((order) => {
                                const total = calculateTotal(order);
                                return (
                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{order.noNota}</th>
                                        <td className="px-6 py-4">{customers.find(c => c.id === order.pelangganId)?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 capitalize">{getKasirName(order)}</td>
                                        <td className="px-6 py-4 text-right font-semibold">{formatCurrency(total)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => order.statusPembayaran !== 'Lunas' && handleOpenModal(order)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-transform duration-200 ${getPaymentStatusColor(order.statusPembayaran)} ${order.statusPembayaran !== 'Lunas' ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                                            >
                                                {order.statusPembayaran}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="relative inline-block">
                                                <button 
                                                    onClick={() => { 
                                                        setSelectedOrder(order); 
                                                        setIsActionMenuOpen(isActionMenuOpen === order.id ? null : order.id); 
                                                    }} 
                                                    className="bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-bold py-1 px-3 rounded-lg text-xs transition-colors"
                                                >
                                                    Nota
                                                </button>
                                                {isActionMenuOpen === order.id && (
                                                    <div 
                                                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg z-10"
                                                        onMouseLeave={() => setIsActionMenuOpen(null)}
                                                    >
                                                        <a href="#" onClick={(e)=>{e.preventDefault(); handlePrintStruk()}} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"><ReceiptIcon className="w-4 h-4 mr-2"/>Cetak Struk</a>
                                                        <a href="#" onClick={(e)=>{e.preventDefault(); handlePrint()}} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"><PrintIcon className="w-4 h-4 mr-2"/>Cetak Nota</a>
                                                        <a href="#" onClick={(e)=>{e.preventDefault(); handleSendWhatsApp()}} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"><WhatsAppIcon className="w-4 h-4 mr-2"/>Kirim WhatsApp</a>
                                                        <a href="#" onClick={(e)=>{e.preventDefault(); handleSaveImage()}} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"><ImageIcon className="w-4 h-4 mr-2"/>Simpan Gambar</a>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
            ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tidak Ada Transaksi Ditemukan</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Tidak ada data yang cocok dengan filter yang Anda pilih.
                        <br />
                        Coba sesuaikan atau atur ulang filter Anda.
                    </p>
                </div>
            )}


            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={handleCloseModal}>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl p-8 m-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Proses Pembayaran</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">No. Nota: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedOrder.noNota}</span></p>
                        
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 max-h-60 overflow-y-auto mb-4">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                                    <tr>
                                        <th className="text-left pb-2">Item</th>
                                        <th className="text-center pb-2">Status Produksi</th>
                                        <th className="text-right pb-2">Harga</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                                    {selectedOrder.items.map(item => {
                                        const customer = customers.find(c => c.id === selectedOrder.pelangganId);
                                        const bahan = bahanList.find(b => b.id === item.bahanId);
                                        if(!customer || !bahan) return null;
                                        const price = getPriceForCustomer(bahan, customer.level);
                                        const itemArea = item.panjang > 0 && item.lebar > 0 ? item.panjang * item.lebar : 1;
                                        const itemTotal = price * itemArea * item.qty;
                                        const statusColor = getProductionStatusColor(item.statusProduksi);
                                        return (
                                            <tr key={item.id}>
                                                <td className="py-2 text-slate-800 dark:text-slate-200">{bahan.name} ({item.qty}x)</td>
                                                <td className="py-2 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                                                        {item.statusProduksi}
                                                    </span>
                                                </td>
                                                <td className="py-2 text-right text-slate-800 dark:text-slate-200">{formatCurrency(itemTotal)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="space-y-3">
                           <div className="flex justify-between items-center text-lg">
                               <span className="text-slate-600 dark:text-slate-300">Total Tagihan</span>
                               <span className="font-bold text-orange-600">{formatCurrency(calculateTotal(selectedOrder))}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-600 dark:text-slate-300">Sudah Dibayar</span>
                               <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(calculateTotalPaid(selectedOrder))}</span>
                           </div>
                           <hr className="border-slate-200 dark:border-slate-700"/>
                           <div className="flex justify-between items-center font-bold text-lg">
                               <span className="text-slate-800 dark:text-slate-100">Sisa Tagihan</span>
                               <span className="text-slate-900 dark:text-slate-50">{formatCurrency(calculateTotal(selectedOrder) - calculateTotalPaid(selectedOrder))}</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                                <label htmlFor="paymentDate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Tanggal Bayar</label>
                                <input type="date" name="paymentDate" id="paymentDate" value={newPaymentDate} onChange={(e) => setNewPaymentDate(e.target.value)} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300" />
                            </div>
                            <div>
                                <label htmlFor="jumlahBayar" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Jumlah Bayar / DP Baru</label>
                                <input type="number" name="jumlahBayar" id="jumlahBayar" value={newPaymentAmount} onChange={(e) => setNewPaymentAmount(Number(e.target.value))} min="0" className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-4 pt-6">
                            <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                            <button type="button" onClick={handlePaymentSubmit} className="px-6 py-2 rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors">Simpan Pembayaran</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionManagement;