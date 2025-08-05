import React, { useState, useEffect, useMemo, useRef } from 'react';
import EditIcon from '../icons/EditIcon';
import TrashIcon from '../icons/TrashIcon';
import PrintIcon from '../icons/PrintIcon';
import { Customer, CustomerLevel } from '../customers/CustomerManagement';
import { Bahan } from '../bahan/BahanManagement';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import Pagination from '../Pagination';
import FilterBar from '../FilterBar';
import { useToast } from '../../hooks/useToast';
import SPK from './SPK';

export type ProductionStatus = 'Belum Dikerjakan' | 'Proses' | 'Selesai';
export type PaymentStatus = 'Belum Lunas' | 'Lunas';

export interface OrderItem {
    id: number;
    bahanId: number | '';
    deskripsiPesanan: string;
    panjang: number;
    lebar: number;
    qty: number;
    statusProduksi: ProductionStatus;
    finishing: string;
}

export interface Payment {
    amount: number;
    date: string;
    kasirId: string;
}

export interface Order {
    id: number;
    noNota: string;
    tanggal: string;
    pelangganId: number | '';
    items: OrderItem[];
    pelaksanaId: string | null;
    statusPembayaran: PaymentStatus;
    payments: Payment[];
}

interface OrderManagementProps {
    customers: Customer[];
    bahanList: Bahan[];
    orders: Order[];
    onUpdate: (updatedOrders: Order[]) => void;
    highlightedItem?: { view: string; id: number | string } | null;
    clearHighlightedItem?: () => void;
}

const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const emptyItem: Omit<OrderItem, 'id'> = { bahanId: '', deskripsiPesanan: '', panjang: 0, lebar: 0, qty: 1, statusProduksi: 'Belum Dikerjakan', finishing: '' };
const emptyOrder: Omit<Order, 'id'> = {
    noNota: '',
    tanggal: new Date().toISOString().split('T')[0],
    pelangganId: '',
    items: [{ ...emptyItem, id: Date.now() }],
    pelaksanaId: null,
    statusPembayaran: 'Belum Lunas',
    payments: [],
};

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.125 0 1.131.094 1.976 1.057 1.976 2.192V7.5M8.25 7.5h7.5M8.25 7.5h-1.5a1.5 1.5 0 0 0-1.5 1.5v11.25c0 .828.672 1.5 1.5 1.5h9.75a1.5 1.5 0 0 0 1.5-1.5V9a1.5 1.5 0 0 0-1.5-1.5h-1.5" />
  </svg>
);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
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

const calculateTotal = (order: Omit<Order, 'id'>, customers: Customer[], bahanList: Bahan[]): number => {
    const customer = customers.find(c => c.id === order.pelangganId);
    if (!customer) return 0;

    return order.items.reduce((total, item) => {
        const bahan = bahanList.find(b => b.id === item.bahanId);
        if (!bahan || !item.bahanId) return total;

        const price = getPriceForCustomer(bahan, customer.level);
        const itemArea = item.panjang > 0 && item.lebar > 0 ? item.panjang * item.lebar : 1;
        const itemTotal = price * itemArea * item.qty;
        return total + itemTotal;
    }, 0);
};

const OrderManagement: React.FC<OrderManagementProps> = ({ customers, bahanList, orders, onUpdate, highlightedItem, clearHighlightedItem }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [formData, setFormData] = useState<Omit<Order, 'id'>>(emptyOrder);
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;
    
    const [selectedOrderForSpk, setSelectedOrderForSpk] = useState<Order | null>(null);
    const spkRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Record<number, HTMLTableRowElement | null>>({});
    
    const [filters, setFilters] = useState({
        customerId: 'all',
        startDate: '',
        endDate: '',
        status: 'all',
    });

    const modalOrderTotal = useMemo(() => {
        if (!formData.pelangganId) return 0;
        return calculateTotal(formData, customers, bahanList);
    }, [formData, customers, bahanList]);

    const filteredOrders = useMemo(() => {
        return orders
            .filter(order => {
                const customerMatch = filters.customerId === 'all' || order.pelangganId === Number(filters.customerId);
                const startDateMatch = !filters.startDate || order.tanggal >= filters.startDate;
                const endDateMatch = !filters.endDate || order.tanggal <= filters.endDate;
                const statusMatch = filters.status === 'all' || order.statusPembayaran === filters.status;
                return customerMatch && startDateMatch && endDateMatch && statusMatch;
            })
            .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    }, [orders, filters]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const currentOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (highlightedItem && (highlightedItem.view === 'Order' || highlightedItem.view === 'Transaksi' || highlightedItem.view === 'Produksi') && clearHighlightedItem) {
            const { id } = highlightedItem;
            
            const itemIndex = filteredOrders.findIndex(o => o.id === id);
            if (itemIndex > -1) {
                const page = Math.ceil((itemIndex + 1) / ITEMS_PER_PAGE);
                setCurrentPage(page);

                setTimeout(() => {
                    const element = itemRefs.current[id as number];
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('bg-orange-100', 'dark:bg-orange-800/50', 'transition-all', 'duration-300');
                        setTimeout(() => {
                            element.classList.remove('bg-orange-100', 'dark:bg-orange-800/50');
                        }, 2500);
                    }
                }, 100);
            }
            clearHighlightedItem();
        }
    }, [highlightedItem, clearHighlightedItem, filteredOrders]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    useEffect(() => {
        if (isModalOpen) {
            if (editingOrder) {
                setFormData(JSON.parse(JSON.stringify(editingOrder)));
            } else {
                setFormData({ ...emptyOrder, items: [{ ...emptyItem, id: Date.now() }] });
            }
        }
    }, [isModalOpen, editingOrder]);

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
        { value: 'Lunas', label: 'Lunas' },
    ];

    const handleOpenModal = (order: Order | null) => {
        setEditingOrder(order);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOrder(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'pelangganId' ? Number(value) : value 
        }));
    };

    const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const newItems = [...formData.items];
        const itemToUpdate = { ...newItems[index] };
        
        const numericFields = ['bahanId', 'qty', 'panjang', 'lebar'];
        if (numericFields.includes(name)) {
             (itemToUpdate as any)[name] = Number(value);
        } else {
             (itemToUpdate as any)[name] = value;
        }

        newItems[index] = itemToUpdate;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, { ...emptyItem, id: Date.now() }] }));
    };

    const removeItem = (index: number) => {
        if (formData.items.length <= 1) {
             addToast('Pesanan harus memiliki minimal satu item.', 'error');
            return;
        };
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingOrder) {
            const updatedOrderData = { ...formData, id: editingOrder.id, payments: editingOrder.payments, statusPembayaran: editingOrder.statusPembayaran };
            onUpdate(orders.map(o => o.id === editingOrder.id ? updatedOrderData : o));
            addToast('Order berhasil diperbarui!', 'success');
        } else {
            const newOrder: Order = { ...formData, id: Date.now(), payments: [], statusPembayaran: 'Belum Lunas' };
            const updatedOrders = [...orders, newOrder];
            onUpdate(updatedOrders);
            setCurrentPage(1); // Go to the first page to see the newest item
            addToast('Order berhasil ditambahkan!', 'success');
        }
        handleCloseModal();
    };

    const handleDelete = (orderId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
            onUpdate(orders.filter(o => o.id !== orderId));
            if (currentOrders.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            addToast('Order berhasil dihapus.', 'success');
        }
    };
    
    const getCustomerName = (id: number | '') => {
        return customers.find(c => c.id === id)?.name || 'N/A';
    }

    const toggleExpand = (orderId: number) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    const handleCopyItemDetails = (order: Order, item: OrderItem) => {
        const customerName = getCustomerName(order.pelangganId);
        const nota = order.noNota;
        const bahan = bahanList.find(b => b.id === item.bahanId)?.name || 'N/A';
        const deskripsi = item.deskripsiPesanan || '-';
        const ukuran = item.panjang > 0 && item.lebar > 0 ? `${item.panjang}X${item.lebar}` : '-';
        const qty = `${item.qty}Pcs`;
        const finishing = item.finishing || '-';

        const textToCopy = [customerName, nota, bahan, deskripsi, ukuran, qty, finishing].join('//').toUpperCase();

        navigator.clipboard.writeText(textToCopy).then(() => {
            addToast('Detail item berhasil disalin!', 'success');
        }).catch(err => {
            console.error('Could not copy text: ', err);
            addToast('Gagal menyalin teks.', 'error');
        });
    };
    
    const handlePrintSpk = (order: Order) => {
        setSelectedOrderForSpk(order);

        setTimeout(() => {
            if (spkRef.current) {
                addToast('Mempersiapkan SPK untuk dicetak...', 'info');
                const printContents = spkRef.current.innerHTML;
                const printWindow = window.open('', '', 'height=600,width=400');
                if (printWindow) {
                    printWindow.document.write('<html><head><title>Cetak SPK</title>');
                    printWindow.document.write(`
                        <style>
                            @page { margin: 5mm; }
                            body { 
                                font-family: sans-serif; 
                                font-size: 10pt; 
                                color: #000;
                            }
                            hr {
                                border: none;
                                border-top: 1px dashed black;
                                margin: 4px 0;
                                width: 100%;
                            }
                            .text-center { text-align: center; }
                            .font-bold { font-weight: bold; }
                            .text-lg { font-size: 1.125rem; }
                            .flex { display: flex; }
                            .w-\\[5\\%\\] { width: 5%; }
                            .w-\\[10\\%\\] { width: 10%; } .w-\\[15\\%\\] { width: 15%; }
                            .w-\\[20\\%\\] { width: 20%; } .w-\\[25\\%\\] { width: 25%; }
                            .w-\\[30\\%\\] { width: 30%; }
                            .pr-1 { padding-right: 0.25rem; }
                            .text-right { text-align: right; }
                            .align-top { vertical-align: top; }
                            .break-words { word-wrap: break-word; }
                            .mt-2 { margin-top: 8px; }
                            p, h1, div { margin: 0; padding: 0; }
                            div.mt-2 { margin-top: 8px; }
                        </style>
                    `);
                    printWindow.document.write('</head><body class="bg-white">');
                    printWindow.document.write(printContents);
                    printWindow.document.write('</body></html>');
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }
            }
            setSelectedOrderForSpk(null);
        }, 100);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <div className="hidden">
                {selectedOrderForSpk && (
                    <SPK
                        ref={spkRef}
                        order={selectedOrderForSpk}
                        customer={customers.find(c => c.id === selectedOrderForSpk.pelangganId)}
                        bahanList={bahanList}
                    />
                )}
            </div>
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Order</h2>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center"
                >
                    Tambah
                </button>
            </div>

            <FilterBar
                customers={customers}
                statusOptions={paymentStatusOptions}
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
            />
            
            <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                 <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300 responsive-table">
                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 sticky top-0 backdrop-blur-sm">
                        <tr>
                            <th scope="col" className="px-6 py-3">No. Nota</th>
                            <th scope="col" className="px-6 py-3">Tanggal</th>
                            <th scope="col" className="px-6 py-3">Pelanggan</th>
                            <th scope="col" className="px-6 py-3 text-center">Detail Item</th>
                            <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 md:divide-y-0">
                        {currentOrders.map((order) => (
                           <React.Fragment key={order.id}>
                            <tr 
                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                                ref={el => { itemRefs.current[order.id] = el; }}
                            >
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{order.noNota}</th>
                                <td data-label="Tanggal" className="px-6 py-4">{formatDate(order.tanggal)}</td>
                                <td data-label="Pelanggan" className="px-6 py-4">{getCustomerName(order.pelangganId)}</td>
                                <td data-label="Detail Item" className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => toggleExpand(order.id)}
                                        className="flex items-center justify-center w-full space-x-2 text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
                                    >
                                        <span>{order.items.length} item</span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                                    </button>
                                </td>
                                <td data-label="Aksi" className="px-6 py-4 text-center space-x-2">
                                    <button onClick={() => handleOpenModal(order)} className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors p-1" title="Edit Pesanan">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handlePrintSpk(order)} className="text-slate-600 hover:text-slate-500 dark:text-slate-400 dark:hover:text-slate-300 transition-colors p-1" title="Cetak SPK">
                                        <PrintIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 transition-colors p-1" title="Hapus Pesanan">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                            {expandedOrderId === order.id && (
                                <tr className="bg-slate-50 dark:bg-slate-800/50 md:table-row">
                                    <td colSpan={5} className="p-0">
                                        <div className="px-4 sm:px-6 py-4">
                                            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3">Rincian Item Pesanan:</h4>
                                            <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                                                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-700">
                                                        <tr>
                                                            <th scope="col" className="px-4 py-2">Bahan</th>
                                                            <th scope="col" className="px-4 py-2">Deskripsi</th>
                                                            <th scope="col" className="px-4 py-2">Finishing</th>
                                                            <th scope="col" className="px-4 py-2">Ukuran</th>
                                                            <th scope="col" className="px-4 py-2 text-center">Qty</th>
                                                            <th scope="col" className="px-4 py-2 text-center">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                                                        {order.items.map(item => {
                                                            const bahan = bahanList.find(b => b.id === item.bahanId);
                                                            return (
                                                                <tr key={item.id}>
                                                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{bahan?.name || 'N/A'}</td>
                                                                    <td className="px-4 py-3">{item.deskripsiPesanan || '-'}</td>
                                                                    <td className="px-4 py-3">{item.finishing || '-'}</td>
                                                                    <td className="px-4 py-3">{item.panjang > 0 && item.lebar > 0 ? `${item.panjang}m x ${item.lebar}m` : '-'}</td>
                                                                    <td className="px-4 py-3 text-center">{item.qty}</td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <button 
                                                                            onClick={() => handleCopyItemDetails(order, item)} 
                                                                            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors p-1"
                                                                            title="Salin detail item"
                                                                        >
                                                                            <CopyIcon className="w-5 h-5" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="flex justify-end items-center mt-4 text-right">
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 mr-4">Estimasi Total Harga:</span>
                                                <span className="text-xl font-bold text-orange-600 dark:text-orange-500">
                                                    {formatCurrency(calculateTotal(order, customers, bahanList))}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                           </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300" onClick={handleCloseModal}>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl p-6 sm:p-8 m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex-shrink-0">{editingOrder ? 'Edit Order' : 'Tambah Order Baru'}</h3>
                         <div className="overflow-y-auto pr-2 -mr-4 flex-1">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Order Header */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="noNota" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">No. Nota</label>
                                        <input type="text" name="noNota" id="noNota" value={formData.noNota} onChange={handleFormChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                    </div>
                                    <div>
                                        <label htmlFor="tanggal" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Tanggal</label>
                                        <input type="date" name="tanggal" id="tanggal" value={formData.tanggal} onChange={handleFormChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                    </div>
                                    <div>
                                        <label htmlFor="pelangganId" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Pelanggan</label>
                                        <select name="pelangganId" id="pelangganId" value={formData.pelangganId} onChange={handleFormChange} required className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                                            <option value="" disabled>Pilih Pelanggan</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-4">
                                    {formData.items.map((item, index) => (
                                        <div key={item.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 space-y-4 relative">
                                            <h4 className="font-semibold text-orange-600">Item #{index + 1}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label htmlFor={`bahanId-${index}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Bahan</label>
                                                    <select name="bahanId" id={`bahanId-${index}`} value={item.bahanId} onChange={(e) => handleItemChange(index, e)} required className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                                                        <option value="" disabled>Pilih Bahan</option>
                                                        {bahanList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label htmlFor={`deskripsiPesanan-${index}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Deskripsi Pesanan</label>
                                                    <input type="text" name="deskripsiPesanan" id={`deskripsiPesanan-${index}`} value={item.deskripsiPesanan} onChange={(e) => handleItemChange(index, e)} className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                                </div>
                                                <div>
                                                    <label htmlFor={`finishing-${index}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Finishing</label>
                                                    <input type="text" name="finishing" id={`finishing-${index}`} value={item.finishing} onChange={(e) => handleItemChange(index, e)} className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label htmlFor={`panjang-${index}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Panjang (m)</label>
                                                    <input type="number" name="panjang" id={`panjang-${index}`} value={item.panjang} onChange={(e) => handleItemChange(index, e)} min="0" step="0.01" className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                                </div>
                                                <div>
                                                    <label htmlFor={`lebar-${index}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Lebar (m)</label>
                                                    <input type="number" name="lebar" id={`lebar-${index}`} value={item.lebar} onChange={(e) => handleItemChange(index, e)} min="0" step="0.01" className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                                </div>
                                                <div>
                                                    <label htmlFor={`qty-${index}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Qty</label>
                                                    <input type="number" name="qty" id={`qty-${index}`} value={item.qty} onChange={(e) => handleItemChange(index, e)} required min="1" className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                                </div>
                                            </div>
                                            {formData.items.length > 1 && (
                                                <button type="button" onClick={() => removeItem(index)} className="absolute top-3 right-3 text-red-600 hover:text-red-500 p-1 rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addItem} className="w-full py-2 rounded-lg text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/60 border border-orange-200 dark:border-orange-900/50 transition-colors">Tambah Item</button>

                                {/* Modal Footer */}
                                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-700 mt-6 flex-shrink-0 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Estimasi Total Harga</p>
                                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-500">{formatCurrency(modalOrderTotal)}</p>
                                    </div>
                                    <div className="flex space-x-4">
                                        <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                                        <button type="submit" className="px-6 py-2 rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors">{editingOrder ? 'Simpan Perubahan' : 'Simpan Order'}</button>
                                    </div>
                                </div>
                            </form>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;