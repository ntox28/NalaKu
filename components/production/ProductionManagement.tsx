import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Customer } from '../customers/CustomerManagement';
import { Bahan } from '../bahan/BahanManagement';
import { Order, OrderItem, ProductionStatus } from '../orders/OrderManagement';
import { User } from '../Login';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import Pagination from '../Pagination';
import FilterBar from '../FilterBar';
import { useToast } from '../../hooks/useToast';

interface ProductionManagementProps {
    orders: Order[];
    onUpdate: (updatedOrders: Order[]) => void;
    customers: Customer[];
    bahanList: Bahan[];
    loggedInUser: User;
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

const getStatusColor = (status: ProductionStatus) => {
    const colors: Record<ProductionStatus, string> = {
        'Belum Dikerjakan': 'bg-gray-100 text-gray-800 dark:bg-slate-600 dark:text-slate-200',
        'Proses': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Selesai': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    return colors[status];
};

const ProductionManagement: React.FC<ProductionManagementProps> = ({ orders, onUpdate, customers, bahanList, loggedInUser, highlightedItem, clearHighlightedItem }) => {
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;
    const itemRefs = useRef<Record<number, HTMLTableRowElement | null>>({});
    
    const [filters, setFilters] = useState({
        customerId: 'all',
        startDate: '',
        endDate: '',
        status: 'all',
    });

    const filteredOrders = useMemo(() => {
        return orders
            .filter(order => {
                const customerMatch = filters.customerId === 'all' || order.pelangganId === Number(filters.customerId);
                const startDateMatch = !filters.startDate || order.tanggal >= filters.startDate;
                const endDateMatch = !filters.endDate || order.tanggal <= filters.endDate;
                const statusMatch = filters.status === 'all' || order.items.some(item => item.statusProduksi === filters.status);
                return customerMatch && startDateMatch && endDateMatch && statusMatch;
            })
            .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    }, [orders, filters]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const currentOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (highlightedItem && (highlightedItem.view === 'Produksi' || highlightedItem.view === 'Transaksi') && clearHighlightedItem) {
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
    
    const productionStatusOptions = [
        { value: 'Belum Dikerjakan', label: 'Belum Dikerjakan' },
        { value: 'Proses', label: 'Proses' },
        { value: 'Selesai', label: 'Selesai' },
    ];

    const getCustomerName = (id: number | '') => {
        return customers.find(c => c.id === id)?.name || 'N/A';
    }

    const toggleExpand = (orderId: number) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };
    
    const handleTakeJob = (orderId: number) => {
        const updatedOrders = orders.map(order => 
            order.id === orderId ? { ...order, pelaksanaId: loggedInUser.id } : order
        );
        onUpdate(updatedOrders);
        addToast(`Pekerjaan untuk Nota ${orders.find(o=>o.id === orderId)?.noNota} telah diambil.`, 'success');
    };

    const handleReleaseJob = (orderId: number) => {
        const updatedOrders = orders.map(order => 
            order.id === orderId ? { ...order, pelaksanaId: null } : order
        );
        onUpdate(updatedOrders);
        addToast(`Pekerjaan untuk Nota ${orders.find(o=>o.id === orderId)?.noNota} telah dilepaskan.`, 'info');
    };


    const handleStatusChange = (orderId: number, itemId: number, newStatus: ProductionStatus) => {
        const updatedOrders = orders.map(order => {
            if (order.id === orderId) {
                const updatedItems = order.items.map(item => 
                    item.id === itemId ? { ...item, statusProduksi: newStatus } : item
                );
                return { ...order, items: updatedItems };
            }
            return order;
        });
        onUpdate(updatedOrders);
        addToast(`Status item untuk Nota ${orders.find(o=>o.id === orderId)?.noNota} telah diubah menjadi ${newStatus}.`, 'info');
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Produksi</h2>
            </div>

            <FilterBar
                customers={customers}
                statusOptions={productionStatusOptions}
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
                            <th scope="col" className="px-6 py-3">Pelaksana</th>
                            <th scope="col" className="px-6 py-3 text-center">Detail Item</th>
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
                                <td data-label="Pelaksana" className="px-6 py-4">
                                    {order.pelaksanaId ? (
                                        <div className="flex items-center justify-end md:justify-start gap-2">
                                            <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">{order.pelaksanaId}</span>
                                            {order.pelaksanaId === loggedInUser.id && (
                                                <button 
                                                    onClick={() => handleReleaseJob(order.id)} 
                                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-200 font-semibold py-1 px-3 rounded-lg text-xs transition-colors"
                                                >
                                                    Lepaskan
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleTakeJob(order.id)} 
                                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors w-full md:w-auto"
                                        >
                                            Ambil Pekerjaan
                                        </button>
                                    )}
                                </td>
                                <td data-label="Detail Item" className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => toggleExpand(order.id)}
                                        className="flex items-center justify-center w-full space-x-2 text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
                                    >
                                        <span>{order.items.length} item</span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                                    </button>
                                </td>
                            </tr>
                            {expandedOrderId === order.id && (
                                <tr className="bg-slate-50 dark:bg-slate-700/50 md:table-row">
                                    <td colSpan={5} className="p-0">
                                        <div className="px-4 sm:px-8 py-4">
                                            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3">Status Pengerjaan Item:</h4>
                                            <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                                                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-700">
                                                        <tr>
                                                            <th scope="col" className="px-4 py-2">Bahan</th>
                                                            <th scope="col" className="px-4 py-2">Ukuran</th>
                                                            <th scope="col" className="px-4 py-2 text-center">Qty</th>
                                                            <th scope="col" className="px-4 py-2 text-center">Status</th>
                                                            <th scope="col" className="px-4 py-2 text-center">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                                                        {order.items.map(item => {
                                                            const bahan = bahanList.find(b => b.id === item.bahanId);
                                                            return (
                                                                <tr key={item.id}>
                                                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{bahan?.name || 'N/A'}</td>
                                                                    <td className="px-4 py-3">{item.panjang > 0 && item.lebar > 0 ? `${item.panjang}m x ${item.lebar}m` : '-'}</td>
                                                                    <td className="px-4 py-3 text-center">{item.qty}</td>
                                                                    <td className="px-4 py-3 text-center">
                                                                         <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.statusProduksi)}`}>
                                                                            {item.statusProduksi}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center space-x-2">
                                                                        <button 
                                                                            onClick={() => handleStatusChange(order.id, item.id, 'Proses')}
                                                                            disabled={item.statusProduksi === 'Proses' || item.statusProduksi === 'Selesai'}
                                                                            className="px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-md hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900/70 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 dark:disabled:text-slate-400 transition-colors"
                                                                        >
                                                                            Proses
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleStatusChange(order.id, item.id, 'Selesai')}
                                                                            disabled={item.statusProduksi === 'Selesai'}
                                                                            className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-md hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 dark:disabled:text-slate-400 transition-colors"
                                                                        >
                                                                            Selesai
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
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

        </div>
    );
};

export default ProductionManagement;