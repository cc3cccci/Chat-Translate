import React from 'react';
import { Icon } from './Icon';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    return (
        <header className="flex-none h-16 px-6 flex items-center justify-between z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md sticky top-0 border-b border-gray-50 dark:border-slate-700 transition-colors">
            <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-accent-coral to-accent-sky flex items-center justify-center text-white shadow-md">
                    <Icon name="translate" className="text-xl" />
                </div>
                <h1 className="font-bold text-xl tracking-tight text-text-dark dark:text-white">ChatTranslate</h1>
            </div>
            <button
                aria-label="Menu"
                className="p-2.5 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-text-light dark:text-slate-400 group cursor-pointer"
                onClick={onMenuClick}
            >
                <Icon name="menu" className="group-hover:text-accent-coral transition-colors" />
            </button>
        </header>
    );
};
