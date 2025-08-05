

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order } from '../orders/OrderManagement';
import { Expense } from '../expenses/ExpenseManagement';
import { Customer } from '../../lib/supabaseClient';
import { Bahan } from '../bahan/BahanManagement';
import { User } from '../Login';
import Pagination from '../Pagination';
import DownloadIcon from '../icons/DownloadIcon';
import PrintIcon from '../icons/PrintIcon';

interface ReportsProps {
    orders: Order[];
    expenses: Expense[];
    customers: Customer[];
    bahanList: Bahan[];
    users: User[];
    calculateOrderTotal: (order: Order, customers: Customer[], bahanList: Bahan[]) => number;
    getPriceForCustomer: (bahan: Bahan, level: Customer['level']) => number;
    formatCurrency: (value: number) => string;
}

const Reports: React.FC<ReportsProps> = (props) => {
    const { orders, expenses, customers, bahanList, calculateOrderTotal, formatCurrency } = props;
    const [activeReport, setActiveReport] = useState('sales');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;
    
    const [filters, setFilters] = useState({
        customerId: 'all',
        status: 'all',
        start: '',
        end: new Date().toISOString().split('T')[0],
    });

    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeReport, filters]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const resetFilters = () => {
        setFilters({
            customerId: 'all',
            status: 'all',
            start: '',
            end: new Date().toISOString().split('T')[0],
        });
    };

    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${filename}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const handlePrint = () => {
        window.print();
        setIsExportMenuOpen(false);
    };

    const handleExportCSV = () => {
        exportToCSV(currentReport.data, activeReport);
        setIsExportMenuOpen(false);
    };

    const reportsData = useMemo(() => {
        const dateFilteredOrders = orders.filter(o => {
            const orderDate = new Date(o.tanggal);
            const start = filters.start ? new Date(filters.start) : null;
            const end = filters.end ? new Date(filters.end) : null;
            if (start) start.setHours(0,0,0,0);
            if (end) end.setHours(23,59,59,999);
            return (!start || orderDate >= start) && (!end || orderDate <= end);
        });

        const dateFilteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.tanggal);
            const start = filters.start ? new Date(filters.start) : null;
            const end = filters.end ? new Date(filters.end) : null;
            if (start) start.setHours(0,0,0,0);
            if (end) end.setHours(23,59,59,999);
            return (!start || expenseDate >= start) && (!end || expenseDate <= end);
        });

        const salesReportOrders = dateFilteredOrders.filter(o => {
            const customerMatch = filters.customerId === 'all' || o.pelangganId === Number(filters.customerId);
            const statusMatch = filters.status === 'all' || o.statusPembayaran === filters.status;
            return customerMatch && statusMatch;
        });
        
        const sales = {
            data: salesReportOrders.map(o => {
                const customer = customers.find(c => c.id === o.pelangganId);
                const total = calculateOrderTotal(o, customers, bahanList);
                return {
                    "No Nota": o.noNota, "Tanggal": o.tanggal, "Pelanggan": customer?.name || 'N/A', "Total": total, "Status": o.statusPembayaran,
                };
            }),
            summary: {
                "Total Transaksi": salesReportOrders.length, "Total Penjualan": salesReportOrders.reduce((sum, o) => sum + calculateOrderTotal(o, customers, bahanList), 0),
            }
        };
        
        const expenseList = {
            data: dateFilteredExpenses.map(e => ({ "Tanggal": e.tanggal, "Jenis Pengeluaran": e.jenisPengeluaran, "Qty": e.qty, "Harga Satuan": e.harga, "Jumlah": e.qty * e.harga, })),
            summary: { "Total Pengeluaran": dateFilteredExpenses.reduce((sum, e) => sum + (e.harga * e.qty), 0), }
        };
        
        const customerSpending = dateFilteredOrders.reduce((acc, order) => {
            const total = calculateOrderTotal(order, customers, bahanList);
            if (order.pelangganId) acc[order.pelangganId] = (acc[order.pelangganId] || 0) + total;
            return acc;
        }, {} as Record<number, number>);

        const topCustomers = {
            data: Object.entries(customerSpending).sort(([, a], [, b]) => b - a).map(([customerId, total]) => {
                const customer = customers.find(c => c.id === Number(customerId));
                return { "Pelanggan": customer?.name || 'N/A', "Total Belanja": total, "Jumlah Transaksi": orders.filter(o => o.pelangganId === Number(customerId)).length };
            })
        };

        const materialSales = dateFilteredOrders.flatMap(o => {
            const customer = customers.find(c => c.id === o.pelangganId);
            return o.items.map(item => ({...item, customerLevel: customer?.level, orderId: o.id}))
        }).reduce((acc, item) => {
            const bahan = bahanList.find(b => b.id === item.bahanId);
            if (item.bahanId && bahan && item.customerLevel) {
                if (!acc[item.bahanId]) acc[item.bahanId] = { name: bahan.name, qty: 0, revenue: 0 };
                const price = props.getPriceForCustomer(bahan, item.customerLevel);
                const area = item.panjang > 0 && item.lebar > 0 ? item.panjang * item.lebar : 1;
                const totalQty = area * item.qty;
                acc[item.bahanId].qty += totalQty;
                acc[item.bahanId].revenue += totalQty * price;
            }
            return acc;
        }, {} as Record<number, { name: string, qty: number, revenue: number }>);
        
        const bestMaterials = {
            data: Object.values(materialSales).sort((a,b) => b.revenue - a.revenue).map(m => ({ "Nama Bahan": m.name, "Total Terjual (Qty/m²)": m.qty, "Total Pendapatan": m.revenue, }))
        };
        
        return { sales, expenses: expenseList, topCustomers, bestMaterials };
    }, [orders, expenses, customers, bahanList, filters]);
    
    const reportConfig = {
        sales: { title: "Penjualan", data: reportsData.sales.data, summary: reportsData.sales.summary, headers: ["No Nota", "Tanggal", "Pelanggan", "Total", "Status"] },
        expenses: { title: "Pengeluaran", data: reportsData.expenses.data, summary: reportsData.expenses.summary, headers: ["Tanggal", "Jenis Pengeluaran", "Qty", "Harga Satuan", "Jumlah"] },
        topCustomers: { title: "Pelanggan Teratas", data: reportsData.topCustomers.data, summary: null, headers: ["Pelanggan", "Total Belanja", "Jumlah Transaksi"] },
        bestMaterials: { title: "Bahan Terlaris", data: reportsData.bestMaterials.data, summary: null, headers: ["Nama Bahan", "Total Terjual (Qty/m²)", "Total Pendapatan"] }
    };

    const currentReport = reportConfig[activeReport as keyof typeof reportConfig];
    const totalPages = Math.ceil(currentReport.data.length / ITEMS_PER_PAGE);
    const paginatedData = currentReport.data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const renderTableCell = (item: any, header: string) => {
        const value = item[header];
        // Columns that should be formatted as currency. We exclude counts like 'Transaksi'.
        const isCurrencyColumn = ['Total', 'Harga', 'Pendapatan', 'Belanja', 'Jumlah'].some(term => header.includes(term)) && !header.includes('Transaksi');
        
        // All numeric columns for alignment purposes.
        const isNumericColumn = typeof value === 'number' || isCurrencyColumn || ['Qty', 'Transaksi'].some(term => header.includes(term));

        const cellValue = (typeof value === 'number' && isCurrencyColumn)
            ? formatCurrency(value)
            : String(value ?? '');

        return (
            <td key={header} className={`px-6 py-4 ${isNumericColumn ? 'text-right' : 'text-left'}`}>
                {cellValue}
            </td>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 space-y-6 printable-area">
            <div className="no-print">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="border-b border-slate-200 dark:border-slate-700">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            {Object.entries(reportConfig).map(([key, { title }]) => (
                                <button key={key} onClick={() => setActiveReport(key)}
                                    className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeReport === key ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500'}`}>
                                    Laporan {title}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="relative" ref={exportMenuRef}>
                        <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 text-sm">
                            <DownloadIcon className="w-5 h-5"/>Ekspor Laporan
                        </button>
                        {isExportMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 divide-y divide-slate-100 dark:divide-slate-600 rounded-md shadow-lg z-20 focus:outline-none">
                                <div className="py-1">
                                    <button onClick={handlePrint} className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"><PrintIcon className="w-5 h-5 mr-3" />Cetak / Simpan PDF</button>
                                    <button onClick={handleExportCSV} className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"><DownloadIcon className="w-5 h-5 mr-3" />Ekspor ke CSV</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            
                <div className="flex flex-wrap items-end gap-4 mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    {activeReport === 'sales' && (
                        <>
                            <div className="flex-grow min-w-[150px]">
                                <label htmlFor="customerId" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Pelanggan</label>
                                <select name="customerId" id="customerId" value={filters.customerId} onChange={handleFilterChange} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                                     <option value="all">Semua Pelanggan</option>
                                     {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-grow min-w-[150px]">
                                <label htmlFor="status" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Status Pembayaran</label>
                                <select name="status" id="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                                     <option value="all">Semua Status</option>
                                     <option value="Lunas">Lunas</option>
                                     <option value="Belum Lunas">Belum Lunas</option>
                                </select>
                            </div>
                        </>
                    )}
                    <div className="flex-grow min-w-[120px]">
                        <label htmlFor="start" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tanggal Mulai</label>
                        <input type="date" name="start" id="start" value={filters.start} onChange={handleFilterChange} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                    </div>
                     <div className="flex-grow min-w-[120px]">
                        <label htmlFor="end" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tanggal Akhir</label>
                        <input type="date" name="end" id="end" value={filters.end} onChange={handleFilterChange} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                    </div>
                    <div className="flex-shrink-0">
                        <button onClick={resetFilters} className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4 py-2 rounded-md text-sm hover:bg-slate-200 dark:hover:bg-slate-700">
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="hidden print:block text-center mb-4">
                 <h1 className="text-2xl font-bold">Laporan {reportConfig[activeReport as keyof typeof reportConfig].title}</h1>
                 {(filters.start || filters.end) && <p className="text-sm">Periode: {filters.start ? new Date(filters.start).toLocaleDateString('id-ID') : '...'} - {filters.end ? new Date(filters.end).toLocaleDateString('id-ID') : '...'}</p>}
            </div>

            {currentReport.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
                    {Object.entries(currentReport.summary).map(([key, value]) => (
                        <div key={key} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-600 dark:text-slate-300">{key}</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                {typeof value === 'number' && !key.includes('Transaksi')
                                    ? formatCurrency(value)
                                    : String(value ?? '')}
                            </p>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            {currentReport.headers.map(header => (
                                <th key={header} scope="col" className={`px-6 py-3 ${(header.toLowerCase().includes('total') || header.toLowerCase().includes('harga') || header.toLowerCase().includes('pendapatan') || header.toLowerCase().includes('belanja') || header.toLowerCase().includes('qty') || header.toLowerCase().includes('jumlah')) ? 'text-right' : 'text-left'}`}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedData.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                {currentReport.headers.map(header => renderTableCell(item, header))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {paginatedData.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-slate-500 dark:text-slate-400">Tidak ada data untuk ditampilkan.</p>
                </div>
            )}

            <div className="no-print">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

export default Reports;