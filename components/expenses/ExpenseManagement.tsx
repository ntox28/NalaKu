
import React, { useState, useEffect, useMemo } from 'react';
import EditIcon from '../icons/EditIcon';
import TrashIcon from '../icons/TrashIcon';
import Pagination from '../Pagination';
import { useToast } from '../../hooks/useToast';
import { Expense, supabase } from '../../lib/supabaseClient';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

interface ExpenseManagementProps {
    expenses: Expense[];
    onUpdate: () => void;
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ expenses, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [formData, setFormData] = useState<Omit<Expense, 'id' | 'created_at'>>({ tanggal: '', jenis_pengeluaran: '', qty: 1, harga: 0 });
    const [totalHarga, setTotalHarga] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;

    const sortedExpenses = useMemo(() => [...expenses].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()), [expenses]);

    const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE);
    const currentExpenses = sortedExpenses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (isModalOpen) {
            if (editingExpense) {
                setFormData({
                    tanggal: editingExpense.tanggal,
                    jenis_pengeluaran: editingExpense.jenis_pengeluaran,
                    qty: editingExpense.qty,
                    harga: editingExpense.harga,
                });
            } else {
                 setFormData({ tanggal: new Date().toISOString().split('T')[0], jenis_pengeluaran: '', qty: 1, harga: 0 });
            }
        }
    }, [isModalOpen, editingExpense]);

    useEffect(() => {
        setTotalHarga(formData.qty * formData.harga);
    }, [formData.qty, formData.harga]);


    const handleOpenModal = (expense: Expense | null) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (editingExpense) {
            const { error } = await supabase
                .from('expenses')
                .update(formData)
                .eq('id', editingExpense.id);

            if (error) {
                addToast(`Gagal memperbarui pengeluaran: ${error.message}`, 'error');
            } else {
                addToast('Data pengeluaran berhasil diperbarui!', 'success');
                onUpdate();
                handleCloseModal();
            }
        } else {
            const { error } = await supabase.from('expenses').insert(formData);
            
            if (error) {
                addToast(`Gagal menambahkan pengeluaran: ${error.message}`, 'error');
            } else {
                addToast('Data pengeluaran berhasil ditambahkan!', 'success');
                onUpdate();
                handleCloseModal();
            }
        }
        setIsLoading(false);
    };

    const handleDelete = async (expenseId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data pengeluaran ini?')) {
            setIsLoading(true);
            const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
            
            if (error) {
                addToast(`Gagal menghapus pengeluaran: ${error.message}`, 'error');
            } else {
                addToast('Data pengeluaran berhasil dihapus.', 'success');
                onUpdate();
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Pengeluaran</h2>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center"
                >
                    Tambah
                </button>
            </div>
            <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                 <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300 responsive-table">
                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 sticky top-0 backdrop-blur-sm">
                        <tr>
                            <th scope="col" className="px-6 py-3">Jenis Pengeluaran</th>
                            <th scope="col" className="px-6 py-3">Tanggal</th>
                            <th scope="col" className="px-6 py-3 text-center">Qty</th>
                            <th scope="col" className="px-6 py-3 text-right">Harga Satuan</th>
                            <th scope="col" className="px-6 py-3 text-right">Jumlah Harga</th>
                            <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 md:divide-y-0">
                        {currentExpenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{expense.jenis_pengeluaran}</th>
                                <td data-label="Tanggal" className="px-6 py-4">{formatDate(expense.tanggal)}</td>
                                <td data-label="Qty" className="px-6 py-4 text-center">{expense.qty}</td>
                                <td data-label="Harga Satuan" className="px-6 py-4 text-right">{formatCurrency(expense.harga)}</td>
                                <td data-label="Jumlah Harga" className="px-6 py-4 text-right font-semibold">{formatCurrency(expense.qty * expense.harga)}</td>
                                <td data-label="Aksi" className="px-6 py-4 text-center space-x-3">
                                    <button onClick={() => handleOpenModal(expense)} className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors p-1">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 transition-colors p-1">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300" onClick={handleCloseModal}>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex-shrink-0">{editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}</h3>
                        <div className="overflow-y-auto pr-2 -mr-4 flex-1">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="tanggal" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Tanggal</label>
                                    <input type="date" name="tanggal" id="tanggal" value={formData.tanggal} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300" />
                                </div>
                                <div>
                                    <label htmlFor="jenis_pengeluaran" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Jenis Pengeluaran</label>
                                    <input type="text" name="jenis_pengeluaran" id="jenis_pengeluaran" value={formData.jenis_pengeluaran} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="qty" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Qty</label>
                                        <input type="number" name="qty" id="qty" value={formData.qty} onChange={handleInputChange} required min="1" className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                    </div>
                                    <div>
                                        <label htmlFor="harga" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Harga Satuan</label>
                                        <input type="number" name="harga" id="harga" value={formData.harga} onChange={handleInputChange} required min="0" className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                    </div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 mt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">Jumlah Harga:</span>
                                        <span className="text-orange-600 font-bold text-xl">{formatCurrency(totalHarga)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4 pt-4 flex-shrink-0">
                                    <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                                    <button type="submit" disabled={isLoading} className="px-6 py-2 rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:bg-orange-300">{isLoading ? 'Menyimpan...' : (editingExpense ? 'Simpan Perubahan' : 'Simpan')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseManagement;
