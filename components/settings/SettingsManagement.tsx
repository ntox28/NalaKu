
import React, { useState } from 'react';
import Pagination from '../Pagination';
import { useToast } from '../../hooks/useToast';
import { Employee, EmployeePosition } from '../../lib/supabaseClient';

interface SettingsProps {
    onUsersUpdate: () => void;
    employees: Employee[];
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


const SettingsManagement: React.FC<SettingsProps> = ({ employees }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
    const currentEmployees = employees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Karyawan & Akun</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Untuk menambah atau mengubah pengguna login, silakan akses Supabase Dashboard Anda.</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                     <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300 responsive-table">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 sticky top-0 backdrop-blur-sm">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama Karyawan</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Posisi / Jabatan</th>
                                <th scope="col" className="px-6 py-3">Status Akun</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 md:divide-y-0">
                            {currentEmployees.map((employee) => {
                                return (
                                <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                        {employee.name}
                                    </th>
                                    <td data-label="Email Login" className="px-6 py-4">{employee.email || '-'}</td>
                                    <td data-label="Posisi" className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPositionColor(employee.position)}`}>
                                            {employee.position}
                                        </span>
                                    </td>
                                    <td data-label="Status Akun" className="px-6 py-4">
                                        {employee.user_id ? 
                                            <span className="text-green-600 dark:text-green-400 font-semibold">Terhubung</span> : 
                                            <span className="text-red-500 dark:text-red-400">Tidak Terhubung</span>
                                        }
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

export default SettingsManagement;
