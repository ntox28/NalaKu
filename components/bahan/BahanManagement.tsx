
import React, { useState, useEffect } from 'react';
import EditIcon from '../icons/EditIcon';
import TrashIcon from '../icons/TrashIcon';
import Pagination from '../Pagination';
import { useToast } from '../../hooks/useToast';
import { Bahan, supabase } from '../../lib/supabaseClient';


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

interface BahanManagementProps {
    bahanList: Bahan[];
    onUpdate: () => void;
}

const BahanManagement: React.FC<BahanManagementProps> = ({ bahanList, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBahan, setEditingBahan] = useState<Bahan | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        harga_end_customer: 0,
        harga_retail: 0,
        harga_grosir: 0,
        harga_reseller: 0,
        harga_corporate: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(bahanList.length / ITEMS_PER_PAGE);
    const currentBahanList = bahanList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (isModalOpen) {
            if (editingBahan) {
                setFormData({
                    name: editingBahan.name,
                    harga_end_customer: editingBahan.harga_end_customer,
                    harga_retail: editingBahan.harga_retail,
                    harga_grosir: editingBahan.harga_grosir,
                    harga_reseller: editingBahan.harga_reseller,
                    harga_corporate: editingBahan.harga_corporate,
                });
            } else {
                 setFormData({ name: '', harga_end_customer: 0, harga_retail: 0, harga_grosir: 0, harga_reseller: 0, harga_corporate: 0 });
            }
        }
    }, [isModalOpen, editingBahan]);


    const handleOpenModal = (bahan: Bahan | null) => {
        setEditingBahan(bahan);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBahan(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'name' ? value : Number(value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (editingBahan) {
            const { error } = await supabase
                .from('bahan')
                .update(formData)
                .eq('id', editingBahan.id);

            if (error) {
                addToast(`Gagal memperbarui bahan: ${error.message}`, 'error');
            } else {
                addToast('Bahan berhasil diperbarui!', 'success');
                onUpdate();
                handleCloseModal();
            }
        } else {
            const { error } = await supabase.from('bahan').insert(formData);
            
            if (error) {
                addToast(`Gagal menambahkan bahan: ${error.message}`, 'error');
            } else {
                addToast('Bahan berhasil ditambahkan!', 'success');
                onUpdate();
                handleCloseModal();
            }
        }
        setIsLoading(false);
    };

    const handleDelete = async (bahanId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus bahan ini?')) {
            setIsLoading(true);
            const { error } = await supabase.from('bahan').delete().eq('id', bahanId);
            
            if (error) {
                addToast(`Gagal menghapus bahan: ${error.message}`, 'error');
            } else {
                addToast('Bahan berhasil dihapus.', 'success');
                onUpdate();
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Bahan & Harga</h2>
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
                            <th scope="col" className="px-6 py-3">Nama Bahan</th>
                            <th scope="col" className="px-6 py-3 text-right">End Customer</th>
                            <th scope="col" className="px-6 py-3 text-right">Retail</th>
                            <th scope="col" className="px-6 py-3 text-right">Grosir</th>
                            <th scope="col" className="px-6 py-3 text-right">Reseller</th>
                            <th scope="col" className="px-6 py-3 text-right">Corporate</th>
                            <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 md:divide-y-0">
                        {currentBahanList.map((bahan) => (
                            <tr key={bahan.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{bahan.name}</th>
                                <td data-label="End Customer" className="px-6 py-4 text-right">{formatCurrency(bahan.harga_end_customer)}</td>
                                <td data-label="Retail" className="px-6 py-4 text-right">{formatCurrency(bahan.harga_retail)}</td>
                                <td data-label="Grosir" className="px-6 py-4 text-right">{formatCurrency(bahan.harga_grosir)}</td>
                                <td data-label="Reseller" className="px-6 py-4 text-right">{formatCurrency(bahan.harga_reseller)}</td>
                                <td data-label="Corporate" className="px-6 py-4 text-right">{formatCurrency(bahan.harga_corporate)}</td>
                                <td data-label="Aksi" className="px-6 py-4 text-center space-x-3">
                                    <button onClick={() => handleOpenModal(bahan)} className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors p-1">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(bahan.id)} className="text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 transition-colors p-1">
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
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex-shrink-0">{editingBahan ? 'Edit Bahan' : 'Tambah Bahan Baru'}</h3>
                         <div className="overflow-y-auto pr-2 -mr-4 flex-1">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nama Bahan</label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="harga_end_customer" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Harga End Customer</label>
                                        <input type="number" name="harga_end_customer" id="harga_end_customer" value={formData.harga_end_customer} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                    </div>
                                    <div>
                                        <label htmlFor="harga_retail" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Harga Retail</label>
                                        <input type="number" name="harga_retail" id="harga_retail" value={formData.harga_retail} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                    </div>
                                    <div>
                                        <label htmlFor="harga_grosir" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Harga Grosir</label>
                                        <input type="number" name="harga_grosir" id="harga_grosir" value={formData.harga_grosir} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                    </div>
                                    <div>
                                        <label htmlFor="harga_reseller" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Harga Reseller</label>
                                        <input type="number" name="harga_reseller" id="harga_reseller" value={formData.harga_reseller} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                    </div>
                                    <div>
                                        <label htmlFor="harga_corporate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Harga Corporate</label>
                                        <input type="number" name="harga_corporate" id="harga_corporate" value={formData.harga_corporate} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4 pt-4 flex-shrink-0">
                                    <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                                    <button type="submit" disabled={isLoading} className="px-6 py-2 rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:bg-orange-300">{isLoading ? 'Menyimpan...' : (editingBahan ? 'Simpan Perubahan' : 'Simpan')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BahanManagement;
