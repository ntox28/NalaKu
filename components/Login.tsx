
import React, { useState } from 'react';
import UserIcon from './icons/UserIcon';
import LockIcon from './icons/LockIcon';
import NalaKuLogo from './icons/NalaKuLogo';

export type UserLevel = 'Admin' | 'Kasir' | 'Produksi' | 'Office';

export interface User {
    id: string; // username for login
    password: string;
    level: UserLevel;
    employeeId: number; // Link to Employee
}

interface LoginProps {
    onLoginSuccess: (user: User) => void;
    users: User[];
}

const LoginComponent: React.FC<LoginProps> = ({ onLoginSuccess, users }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');
        
        setTimeout(() => {
            setIsLoading(false);
            const foundUser = users.find(
                user => user.id.toLowerCase() === userId.toLowerCase() && user.password === password
            );

            if (foundUser) {
                onLoginSuccess(foundUser);
            } else {
                setError('ID Pengguna atau Kata Sandi salah.');
            }
        }, 1000);
    };

    return (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6">
            <div className="text-center">
                <NalaKuLogo className="w-20 h-20 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">NalaKu</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Masuk dengan akunmu untuk melanjutkan.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        id="user-id"
                        name="user-id"
                        type="text"
                        autoComplete="username"
                        required
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300"
                        placeholder="Masukkan IDmu"
                    />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-300"
                        placeholder="Masukkan Passwordmu"
                    />
                </div>

                 {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 bg-slate-100 dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-orange-600 focus:ring-orange-500 rounded" />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-400">
                            Ingat saya
                        </label>
                    </div>

                    <div className="text-sm">
                        <a href="#" className="font-medium text-orange-600 hover:text-orange-500 transition-colors">
                            Lupa kata sandi?
                        </a>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-orange-500 disabled:bg-orange-300 disabled:cursor-not-allowed transition-all duration-300 mt-4"
                    >
                        {isLoading ? (
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                        ) : 'Masuk'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginComponent;
