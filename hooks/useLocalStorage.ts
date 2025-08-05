
import { useState } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            // Jika tidak ada item, inisialisasi dengan nilai awal
            if (!item) {
                window.localStorage.setItem(key, JSON.stringify(initialValue));
                return initialValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            // Wrap the state update in the `setStoredValue`'s functional update form
            // to prevent stale state issues.
            setStoredValue(currentStoredValue => {
                const valueToStore = value instanceof Function ? value(currentStoredValue) : value;
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
                return valueToStore;
            });
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

export default useLocalStorage;
