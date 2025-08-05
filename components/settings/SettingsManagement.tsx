
import React, { useState } from 'react';
import Pagination from '../Pagination';
import { useToast } from '../../hooks/useToast';
import { Employee } from '../../lib/supabaseClient';
import { User as AuthUser } from '@supabase/supabase-js';

interface SettingsProps {
    users: AuthUser[];
    onUsersUpdate: () => void;
    employees: Employee[];
}

type UserLevel = 'Admin' | 'Kasir' | 'Produksi' | 'Office';

const getLevelColor = (level: UserLevel) => {
    const colors: Record<UserLevel, string> = {
        'Admin': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        'Kasir': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
        'Produksi': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Office': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    };
    return colors[level] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
};

const SettingsManagement: React.FC<SettingsProps> = ({ users, employees }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const { addToast } = useToast();
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
    const currentUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Pengguna</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Untuk menambah atau mengubah pengguna, silakan akses Supabase Dashboard Anda.</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                     <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300 responsive-table">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 sticky top-0 backdrop-blur-sm">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama Karyawan</th>
                                <th scope="col" className="px-6 py-3">Email Login</th>
                                <th scope="col" className="px-6 py-3">Level</th>
                                <th scope="col" className="px-6 py-3">Terakhir Login</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 md:divide-y-0">
                            {currentUsers.map((user) => {
                                const employee = employees.find(e => e.user_id === user.id);
                                const userLevel = (user.app_metadata?.userrole || 'Kasir') as UserLevel;
                                return (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                        {employee ? employee.name : <span className="text-red-500 italic">Karyawan Tidak Terhubung</span>}
                                    </th>
                                    <td data-label="Email Login" className="px-6 py-4">{user.email}</td>
                                    <td data-label="Level" className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(userLevel)}`}>
                                            {userLevel}
                                        </span>
                                    </td>
                                    <td data-label="Terakhir Login" className="px-6 py-4">
                                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('id-ID') : 'Belum pernah'}
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
