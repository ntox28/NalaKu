
import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../../hooks/useToast';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import ExclamationCircleIcon from '../icons/ExclamationCircleIcon';
import XCircleIcon from '../icons/XCircleIcon';

interface ToastProps {
    toast: ToastMessage;
    onRemove: (id: number) => void;
}

const toastConfig = {
    success: {
        icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
        bg: 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-500/30',
        text: 'text-slate-700 dark:text-slate-200',
    },
    error: {
        icon: <ExclamationCircleIcon className="w-6 h-6 text-red-500" />,
        bg: 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-500/30',
        text: 'text-slate-700 dark:text-slate-200',
    },
    info: {
        icon: <ExclamationCircleIcon className="w-6 h-6 text-cyan-500" />,
        bg: 'bg-cyan-50 dark:bg-cyan-900/40 border-cyan-200 dark:border-cyan-500/30',
        text: 'text-slate-700 dark:text-slate-200',
    },
};

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleRemove();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, []);

    const handleRemove = () => {
        setIsFadingOut(true);
        setTimeout(() => onRemove(toast.id), 300); // Wait for fade-out animation
    };

    const config = toastConfig[toast.type];

    return (
        <div
            className={`toast-item ${isFadingOut ? 'fade-out' : 'fade-in'} w-full max-w-sm overflow-hidden rounded-lg shadow-lg bg-white dark:bg-slate-800 border ${config.bg} flex items-center`}
        >
            <div className="p-4">
                {config.icon}
            </div>
            <div className="flex-1 p-4">
                <p className={`text-sm ${config.text}`}>{toast.message}</p>
            </div>
            <button onClick={handleRemove} className="p-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                <XCircleIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Toast;
