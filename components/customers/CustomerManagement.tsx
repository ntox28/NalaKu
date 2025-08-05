import React, { useState, useEffect, useRef } from 'react';
import EditIcon from '../icons/EditIcon';
import TrashIcon from '../icons/TrashIcon';
import Pagination from '../Pagination';
import { useToast } from '../../hooks/useToast';
import { supabase, Customer, CustomerLevel } from '../../lib/supabaseClient';

interface CustomerManagementProps {
    customers: Customer[];
    onUpdate: () => void;
    highlightedItem?: { view: string; id: number | string } | null;
    clearHighlightedItem?: () => void;
}

const getLevelColor = (level: CustomerLevel) => {
    const colors: Record<CustomerLevel, string> = {
        'End Customer': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Retail': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Grosir': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Reseller': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        'Corporate': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return colors[level] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
};


const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, onUpdate, highlightedItem, clearHighlightedItem }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', level: 'End Customer' as CustomerLevel });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;
    const itemRefs = useRef<Record<number, HTMLTableRowElement | null>>({});

    const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
    const currentCustomers = customers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (highlightedItem && highlightedItem.view === 'Daftar Pelanggan' && clearHighlightedItem) {
            const { id } = highlightedItem;
            
            const itemIndex = customers.findIndex(c => c.id === id);
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
    }, [highlightedItem, clearHighlightedItem, customers]);

    useEffect(() => {
        if (isModalOpen) {
            if (editingCustomer) {
                setFormData({
                    name: editingCustomer.name,
                    email: editingCustomer.email,
                    phone: editingCustomer.phone,
                    address: editingCustomer.address,
                    level: editingCustomer.level,
                });
            } else {
                 setFormData({ name: '', email: '', phone: '', address: '', level: 'End Customer' });
            }
        }
    }, [isModalOpen, editingCustomer]);


    const handleOpenModal = (customer: Customer | null) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (editingCustomer) {
            const { error } = await supabase
                .from('customers')
                .update(formData)
                .eq('id', editingCustomer.id);

            if (error) {
                addToast(`Gagal memperbarui pelanggan: ${error.message}`, 'error');
            } else {
                addToast('Pelanggan berhasil diperbarui!', 'success');
                onUpdate();
                handleCloseModal();
            }
        } else {
            const { error } = await supabase.from('customers').insert(formData);
            
            if (error) {
                addToast(`Gagal menambahkan pelanggan: ${error.message}`, 'error');
            } else {
                addToast('Pelanggan berhasil ditambahkan!', 'success');
                onUpdate();
                handleCloseModal();
            }
        }
        setIsLoading(false);
    };

    const handleDelete = async (customerId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
            setIsLoading(true);
            const { error } = await supabase.from('customers').delete().eq('id', customerId);
            if (error) {
                addToast(`Gagal menghapus pelanggan: ${error.message}`, 'error');
            } else {
                addToast('Pelanggan berhasil dihapus.', 'success');
                onUpdate();
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Pelanggan</h2>
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
                            <th scope="col" className="px-6 py-3">Nama</th>
                            <th scope="col" className="px-6 py-3">Level</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Telepon</th>
                            <th scope="col" className="px-6 py-3 hidden lg:table-cell">Alamat</th>
                            <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 md:divide-y-0">
                        {currentCustomers.map((customer) => (
                            <tr 
                                key={customer.id} 
                                ref={el => { itemRefs.current[customer.id] = el; }}
                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                            >
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{customer.name}</th>
                                <td data-label="Level" className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(customer.level)}`}>
                                        {customer.level}
                                    </span>
                                </td>
                                <td data-label="Email" className="px-6 py-4">{customer.email}</td>
                                <td data-label="Telepon" className="px-6 py-4 hidden md:table-cell">{customer.phone}</td>
                                <td data-label="Alamat" className="px-6 py-4 hidden lg:table-cell">{customer.address}</td>
                                <td data-label="Aksi" className="px-6 py-4 text-center space-x-3">
                                    <button onClick={() => handleOpenModal(customer)} className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors p-1">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 transition-colors p-1">
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
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex-shrink-0">{editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
                        <div className="overflow-y-auto pr-2 -mr-4 flex-1">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nama</label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300" />
                                </div>
                                <div>
                                    <label htmlFor="level" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Level Pelanggan</label>
                                    <select
                                        name="level"
                                        id="level"
                                        value={formData.level}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300 appearance-none"
                                        style={{ 
                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                                            backgroundPosition: 'right 0.5rem center', 
                                            backgroundRepeat: 'no-repeat', 
                                            backgroundSize: '1.5em 1.5em' 
                                        }}
                                    >
                                        <option value="End Customer">End Customer</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Grosir">Grosir</option>
                                        <option value="Reseller">Reseller</option>
                                        <option value="Corporate">Corporate</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
                                    <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nomor Telepon</label>
                                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300" />
                                </div>
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Alamat</label>
                                    <textarea name="address" id="address" value={formData.address} onChange={handleInputChange} required rows={3} className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300"></textarea>
                                </div>
                                <div className="flex justify-end space-x-4 pt-4 flex-shrink-0">
                                    <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                                    <button type="submit" disabled={isLoading} className="px-6 py-2 rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:bg-orange-300">{isLoading ? 'Menyimpan...' : (editingCustomer ? 'Simpan Perubahan' : 'Simpan')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerManagement;
