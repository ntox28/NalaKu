
import React, { useState, useEffect } from 'react';
import EditIcon from '../icons/EditIcon';
import TrashIcon from '../icons/TrashIcon';
import Pagination from '../Pagination';
import { useToast } from '../../hooks/useToast';

export type CustomerLevel = 'End Customer' | 'Retail' | 'Grosir' | 'Reseller' | 'Corporate';

export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    level: CustomerLevel;
}

interface CustomerManagementProps {
    customers: Customer[];
    onUpdate: (updatedCustomers: Customer[]) => void;
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


const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', level: 'End Customer' as CustomerLevel });
    const [currentPage, setCurrentPage] = useState(1);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
    const currentCustomers = customers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCustomer) {
            onUpdate(customers.map(c => c.id === editingCustomer.id ? { ...c, ...formData } : c));
            addToast('Pelanggan berhasil diperbarui!', 'success');
        } else {
            const newCustomer = { id: Date.now(), ...formData };
            const updatedCustomers = [...customers, newCustomer];
            onUpdate(updatedCustomers);
            setCurrentPage(Math.ceil(updatedCustomers.length / ITEMS_PER_PAGE));
            addToast('Pelanggan berhasil ditambahkan!', 'success');
        }
        handleCloseModal();
    };

    const handleDelete = (customerId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
            onUpdate(customers.filter(c => c.id !== customerId));
            if (currentCustomers.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            addToast('Pelanggan berhasil dihapus.', 'success');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Pelanggan</h2>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center"
                >
                    Tambah Pelanggan
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                 <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
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
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {currentCustomers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{customer.name}</th>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(customer.level)}`}>
                                        {customer.level}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{customer.email}</td>
                                <td className="px-6 py-4 hidden md:table-cell">{customer.phone}</td>
                                <td className="px-6 py-4 hidden lg:table-cell">{customer.address}</td>
                                <td className="px-6 py-4 text-center space-x-3">
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
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-8 m-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">{editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
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
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                                <button type="submit" className="px-6 py-2 rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors">{editingCustomer ? 'Simpan Perubahan' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerManagement;
