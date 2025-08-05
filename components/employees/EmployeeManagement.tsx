import React, { useState, useEffect } from 'react';
import EditIcon from '../icons/EditIcon';
import TrashIcon from '../icons/TrashIcon';
import Pagination from '../Pagination';
import { useToast } from '../../hooks/useToast';
import { User } from '../Login';
import { supabase, employeeService, DatabaseEmployee } from '../../lib/supabase';

export type EmployeePosition = 'Kasir' | 'Designer' | 'Sales' | 'Office' | 'Produksi' | 'Admin';

export interface Employee {
    id: number;
    name: string;
    position: EmployeePosition;
    email: string;
    phone: string;
}

// Convert between local and database employee formats
const convertToLocalEmployee = (dbEmployee: DatabaseEmployee): Employee => ({
    id: parseInt(dbEmployee.id.replace(/-/g, '').substring(0, 8), 16), // Convert UUID to number for compatibility
    name: dbEmployee.nama,
    position: dbEmployee.posisi as EmployeePosition,
    email: dbEmployee.email,
    phone: dbEmployee.telepon,
});

const convertToDatabaseEmployee = (employee: Omit<Employee, 'id'>): Omit<DatabaseEmployee, 'id' | 'created_at' | 'updated_at'> => ({
    nama: employee.name,
    posisi: employee.position,
    email: employee.email,
    telepon: employee.phone,
});
interface EmployeeManagementProps {
    employees: Employee[];
    onUpdate: (updatedEmployees: Employee[]) => void;
    users: User[];
    onUsersUpdate: (users: User[]) => void;
}

const getPositionColor = (position: EmployeePosition) => {
    const colors: Record<EmployeePosition, string> = {
        'Admin': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        'Kasir': 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
        'Designer': 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
        'Sales': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        'Office': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
        'Produksi': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[position] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
};

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, onUpdate, users, onUsersUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [formData, setFormData] = useState({ name: '', position: 'Kasir' as EmployeePosition, email: '', phone: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [dbEmployees, setDbEmployees] = useState<DatabaseEmployee[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;

    // Load employees from database on component mount
    useEffect(() => {
        loadEmployeesFromDatabase();
    }, []);

    const loadEmployeesFromDatabase = async () => {
        try {
            setIsLoading(true);
            const dbEmployees = await employeeService.getAll();
            setDbEmployees(dbEmployees);
            
            // Convert to local format for compatibility
            const localEmployees = dbEmployees.map(convertToLocalEmployee);
            onUpdate(localEmployees);
        } catch (error) {
            console.error('Error loading employees:', error);
            addToast('Gagal memuat data karyawan dari database.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
    const currentEmployees = employees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        if (isModalOpen) {
            if (editingEmployee) {
                setFormData({
                    name: editingEmployee.name,
                    position: editingEmployee.position,
                    email: editingEmployee.email,
                    phone: editingEmployee.phone,
                });
            } else {
                 setFormData({ name: '', position: 'Kasir', email: '', phone: '' });
            }
        }
    }, [isModalOpen, editingEmployee]);


    const handleOpenModal = (employee: Employee | null) => {
        setEditingEmployee(employee);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEmployee(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            if (editingEmployee) {
                // Find the database employee ID
                const dbEmployee = dbEmployees.find(db => 
                    convertToLocalEmployee(db).id === editingEmployee.id
                );
                
                if (!dbEmployee) {
                    throw new Error('Employee not found in database');
                }

                // Check if email already exists (excluding current employee)
                const emailExists = await employeeService.emailExists(formData.email, dbEmployee.id);
                if (emailExists) {
                    addToast('Email sudah digunakan oleh karyawan lain.', 'error');
                    return;
                }

                // Update in database
                await employeeService.update(dbEmployee.id, convertToDatabaseEmployee(formData));
                addToast('Karyawan berhasil diperbarui!', 'success');
            } else {
                // Check if email already exists
                const emailExists = await employeeService.emailExists(formData.email);
                if (emailExists) {
                    addToast('Email sudah digunakan oleh karyawan lain.', 'error');
                    return;
                }

                // Create in database
                await employeeService.create(convertToDatabaseEmployee(formData));
                addToast('Karyawan berhasil ditambahkan!', 'success');
            }
            
            // Reload data from database
            await loadEmployeesFromDatabase();
            handleCloseModal();
            
        } catch (error) {
            console.error('Error saving employee:', error);
            addToast('Gagal menyimpan data karyawan.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteOld = (employeeId: number) => {
        if (editingEmployee) {
            onUpdate(employees.map(emp => emp.id === editingEmployee.id ? { ...emp, ...formData } : emp));
            addToast('Karyawan berhasil diperbarui!', 'success');
        } else {
            const newEmployee = { id: Date.now(), ...formData };
            const updatedEmployees = [...employees, newEmployee];
            onUpdate(updatedEmployees);
            setCurrentPage(Math.ceil(updatedEmployees.length / ITEMS_PER_PAGE));
            addToast('Karyawan berhasil ditambahkan!', 'success');
        }
        handleCloseModal();
    };

    const handleDelete = async (employeeId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus karyawan ini? Akun pengguna yang terhubung (jika ada) juga akan dihapus.')) {
            setIsLoading(true);
            
            try {
                // Find the database employee ID
                const dbEmployee = dbEmployees.find(db => 
                    convertToLocalEmployee(db).id === employeeId
                );
                
                if (!dbEmployee) {
                    throw new Error('Employee not found in database');
                }

                // Delete associated user first
                const associatedUser = users.find(u => u.employeeId === employeeId);
                if (associatedUser) {
                    onUsersUpdate(users.filter(u => u.employeeId !== employeeId));
                }
                
                // Delete from database
                await employeeService.delete(dbEmployee.id);
                
                // Reload data from database
                await loadEmployeesFromDatabase();
                
                if (associatedUser) {
                    addToast(`Karyawan dan akun pengguna '${associatedUser.id}' telah dihapus.`, 'success');
                } else {
                    addToast('Karyawan berhasil dihapus.', 'success');
                }

                if (currentEmployees.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
                
            } catch (error) {
                console.error('Error deleting employee:', error);
                addToast('Gagal menghapus karyawan.', 'error');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Karyawan</h2>
                <button
                    onClick={() => handleOpenModal(null)}
                    disabled={isLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center disabled:bg-orange-300 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Loading...' : 'Tambah'}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                 <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300 responsive-table">
                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 sticky top-0 backdrop-blur-sm">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nama</th>
                            <th scope="col" className="px-6 py-3">Posisi</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Telepon</th>
                            <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 md:divide-y-0">
                        {currentEmployees.map((employee) => (
                            <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{employee.name}</th>
                                <td data-label="Posisi" className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPositionColor(employee.position)}`}>
                                        {employee.position}
                                    </span>
                                </td>
                                <td data-label="Email" className="px-6 py-4">{employee.email}</td>
                                <td data-label="Telepon" className="px-6 py-4">{employee.phone}</td>
                                <td data-label="Aksi" className="px-6 py-4 text-center space-x-3">
                                    <button onClick={() => handleOpenModal(employee)} className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors p-1">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(employee.id)} 
                                        disabled={isLoading}
                                        className="text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
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
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex-shrink-0">{editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</h3>
                        <div className="overflow-y-auto pr-2 -mr-4 flex-1">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nama</label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300" />
                                </div>
                                <div>
                                    <label htmlFor="position" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Devisi</label>
                                    <select
                                        name="position"
                                        id="position"
                                        value={formData.position}
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
                                        <option value="Designer">Designer</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Office">Office</option>
                                        <option value="Produksi">Produksi</option>
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
                                <div className="flex justify-end space-x-4 pt-4 flex-shrink-0">
                                    <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                                    <button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="px-6 py-2 rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Menyimpan...' : (editingEmployee ? 'Simpan Perubahan' : 'Simpan')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;