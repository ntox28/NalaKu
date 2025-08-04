
import React, { useState, useEffect } from 'react';
import EditIcon from '../icons/EditIcon';
import TrashIcon from '../icons/TrashIcon';
import Pagination from '../Pagination';
import { useToast } from '../../hooks/useToast';

export interface Bahan {
    id: number;
    name: string;
    hargaEndCustomer: number;
    hargaRetail: number;
    hargaGrosir: number;
    hargaReseller: number;
    hargaCorporate: number;
}

interface BahanManagementProps {
    bahanList: Bahan[];
    onUpdate: (updatedBahan: Bahan[]) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const BahanManagement: React.FC<BahanManagementProps> = ({ bahanList, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBahan, setEditingBahan] = useState<Bahan | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        hargaEndCustomer: 0,
        hargaRetail: 0,
        hargaGrosir: 0,
        hargaReseller: 0,
        hargaCorporate: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(bahanList.length / ITEMS_PER_PAGE);
    const currentBahanList = bahanList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (isModalOpen) {
            if (editingBahan) {
                setFormData(editingBahan);
            } else {
                 setFormData({ name: '', hargaEndCustomer: 0, hargaRetail: 0, hargaGrosir: 0, hargaReseller: 0, hargaCorporate: 0 });
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBahan) {
            onUpdate(bahanList.map(b => b.id === editingBahan.id ? { ...b, ...formData } : b));
            addToast('Bahan berhasil diperbarui!', 'success');
        } else {
            const newBahan = { id: Date.now(), ...formData };
            const updatedBahanList = [...bahanList, newBahan];
            onUpdate(updatedBahanList);
            setCurrentPage(Math.ceil(updatedBahanList.length / ITEMS_PER_PAGE));
            addToast('Bahan berhasil ditambahkan!', 'success');
        }
        handleCloseModal();
    };

    const handleDelete = (bahanId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus bahan ini?')) {
            onUpdate(bahanList.filter(b => b.id !== bahanId));
            if (currentBahanList.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            addToast('Bahan berhasil dihapus.', 'success');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Bahan & Harga</h2>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center"
                >
                    Tambah Bahan
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                 <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
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
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {currentBahanList.map((bahan) => (
                            <tr key={bahan.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{bahan.name}</th>
                                <td className="px-6 py-4 text-right">{formatCurrency(bahan.hargaEndCustomer)}</td>
                                <td className="px-6 py-4 text-right">{formatCurrency(bahan.hargaRetail)}</td>
                                <td className="px-6 py-4 text-right">{formatCurrency(bahan.hargaGrosir)}</td>
                                <td className="px-6 py-4 text-right">{formatCurrency(bahan.hargaReseller)}</td>
                                <td className="px-6 py-4 text-right">{formatCurrency(bahan.hargaCorporate)}</td>
                                <td className="px-6 py-4 text-center space-x-3">
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
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl p-8 m-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">{editingBahan ? 'Edit Bahan' : 'Tambah Bahan Baru'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nama Bahan</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="hargaEndCustomer" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Harga End Customer</label>
                                    <input type="number" name="hargaEndCustomer" id="hargaEndCustomer" value={formData.hargaEndCustomer} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                </div>
                                <div>
                                    <label htmlFor="hargaRetail" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Harga Retail</label>
                                    <input type="number" name="hargaRetail" id="hargaRetail" value={formData.hargaRetail} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                </div>
                                <div>
                                    <label htmlFor="hargaGrosir" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Harga Grosir</label>
                                    <input type="number" name="hargaGrosir" id="hargaGrosir" value={formData.hargaGrosir} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                </div>
                                <div>
                                    <label htmlFor="hargaReseller" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Harga Reseller</label>
                                    <input type="number" name="hargaReseller" id="hargaReseller" value={formData.hargaReseller} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                </div>
                                <div>
                                    <label htmlFor="hargaCorporate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Harga Corporate</label>
                                    <input type="number" name="hargaCorporate" id="hargaCorporate" value={formData.hargaCorporate} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100" />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                                <button type="submit" className="px-6 py-2 rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors">{editingBahan ? 'Simpan Perubahan' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BahanManagement;
