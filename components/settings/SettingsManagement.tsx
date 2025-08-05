import React, { useState, useEffect } from 'react';
import EditIcon from '../icons/EditIcon';
import TrashIcon from '../icons/TrashIcon';
import { User, UserLevel } from '../Login';
import { Employee } from '../employees/EmployeeManagement';
import Pagination from '../Pagination';
import { useToast } from '../../hooks/useToast';

interface SettingsProps {
    users: User[];
    onUsersUpdate: (users: User[]) => void;
    employees: Employee[];
}

const getLevelColor = (level: UserLevel) => {
    const colors: Record<UserLevel, string> = {
        'Admin': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        'Kasir': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
        'Produksi': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Office': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    };
    return colors[level] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
};

const SettingsManagement: React.FC<SettingsProps> = ({ users, onUsersUpdate, employees }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ id: '', password: '', level: 'Kasir' as UserLevel, employeeId: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
    const currentUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const employeesWithoutUsers = employees.filter(emp => !users.some(u => u.employeeId === emp.id));

    useEffect(() => {
        if (isModalOpen) {
            if (editingUser) {
                setFormData({
                    id: editingUser.id,
                    password: '', // Keep password field empty for security
                    level: editingUser.level,
                    employeeId: editingUser.employeeId,
                });
            } else {
                 setFormData({ id: '', password: '', level: 'Kasir', employeeId: 0 });
            }
        }
    }, [isModalOpen, editingUser]);


    const handleOpenModal = (user: User | null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumberField = name === 'employeeId';
        setFormData(prev => ({ ...prev, [name]: isNumberField ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingUser) {
            // Update user
            if (users.some(u => u.id.toLowerCase() === formData.id.toLowerCase() && u.id !== editingUser.id)) {
                addToast("Username sudah ada. Silakan gunakan username lain.", 'error');
                return;
            }

            const updatedUsers = users.map(u => 
                u.id === editingUser.id 
                ? { ...u, id: formData.id, level: formData.level, password: formData.password || u.password } 
                : u
            );
            onUsersUpdate(updatedUsers);
            addToast(`Pengguna '${formData.id}' berhasil diperbarui.`, 'success');
        } else {
            // Add new user
            if (!formData.employeeId || !formData.id || !formData.password) {
                addToast("Karyawan, Username, dan Kata Sandi harus diisi.", 'error');
                return;
            }
            if (users.some(u => u.id.toLowerCase() === formData.id.toLowerCase())) {
                addToast("Username sudah ada. Silakan gunakan username lain.", 'error');
                return;
            }
            const newUser: User = { 
                id: formData.id, 
                password: formData.password, 
                level: formData.level,
                employeeId: formData.employeeId, 
            };
            const updatedUsers = [...users, newUser];
            onUsersUpdate(updatedUsers);
            setCurrentPage(Math.ceil(updatedUsers.length / ITEMS_PER_PAGE));
            addToast(`Akun untuk pengguna '${formData.id}' berhasil dibuat.`, 'success');
        }
        handleCloseModal();
    };

    const handleDelete = (userId: string) => {
        if (users.length <= 1) {
            addToast("Tidak dapat menghapus pengguna terakhir.", 'error');
            return;
        }
        if (window.confirm(`Apakah Anda yakin ingin menghapus akun pengguna '${userId}'?`)) {
            onUsersUpdate(users.filter(u => u.id !== userId));
            if (currentUsers.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            addToast(`Pengguna '${userId}' berhasil dihapus.`, 'success');
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Pengguna</h2>
                    <button
                        onClick={() => handleOpenModal(null)}
                        disabled={employeesWithoutUsers.length === 0}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center disabled:bg-orange-300 disabled:cursor-not-allowed"
                        title={employeesWithoutUsers.length === 0 ? "Semua karyawan sudah memiliki akun" : "Buat akun baru"}
                    >
                        Tambah
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                     <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300 responsive-table">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 sticky top-0 backdrop-blur-sm">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama Karyawan</th>
                                <th scope="col" className="px-6 py-3">Level</th>
                                <th scope="col" className="px-6 py-3">Kata Sandi</th>
                                <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 md:divide-y-0">
                            {currentUsers.map((user) => {
                                const employee = employees.find(e => e.id === user.employeeId);
                                return (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                        {employee ? employee.name : <span className="text-red-500 italic">Karyawan Dihapus</span>}
                                        <div className="text-xs font-normal text-slate-500 dark:text-slate-400">@{user.id}</div>
                                    </th>
                                    <td data-label="Level" className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(user.level)}`}>
                                            {user.level}
                                        </span>
                                    </td>
                                    <td data-label="Kata Sandi" className="px-6 py-4 text-slate-500 dark:text-slate-400 italic">Terenkripsi</td>
                                    <td data-label="Aksi" className="px-6 py-4 text-center space-x-3">
                                        <button onClick={() => handleOpenModal(user)} className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors p-1">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 transition-colors p-1">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300" onClick={handleCloseModal}>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex-shrink-0">{editingUser ? `Edit Pengguna: @${editingUser.id}` : 'Buat Akun untuk Karyawan'}</h3>
                         <div className="overflow-y-auto pr-2 -mr-4 flex-1">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="employeeId" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Karyawan</label>
                                    {editingUser ? (
                                        <input 
                                            type="text" 
                                            disabled 
                                            value={employees.find(e => e.id === editingUser.employeeId)?.name || 'Karyawan tidak ditemukan'}
                                            className="w-full pl-4 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-500 dark:text-slate-400"
                                        />
                                    ) : (
                                        <select
                                            name="employeeId"
                                            id="employeeId"
                                            value={formData.employeeId}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300 appearance-none"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                                        >
                                            <option value={0} disabled>Pilih Karyawan</option>
                                            {employeesWithoutUsers.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="id" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Username</label>
                                    <input type="text" name="id" id="id" value={formData.id} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300" />
                                </div>
                                <div>
                                    <label htmlFor="level" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Level</label>
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
                                        <option value="Admin">Admin</option>
                                        <option value="Kasir">Kasir</option>
                                        <option value="Office">Office</option>
                                        <option value="Produksi">Produksi</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Kata Sandi</label>
                                    <input type="password" name="password" id="password" value={formData.password} onChange={handleInputChange} required={!editingUser} placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah' : ''} className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300" />
                                </div>
                                <div className="flex justify-end space-x-4 pt-4 flex-shrink-0">
                                    <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                                    <button type="submit" className="px-6 py-2 rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors">{editingUser ? 'Simpan Perubahan' : 'Simpan'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsManagement;