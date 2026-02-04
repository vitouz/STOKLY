import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    children: React.ReactNode;
}

export function AuthButton({ loading, children, className = '', disabled, ...props }: AuthButtonProps) {
    return (
        <button
            disabled={loading || disabled}
            className={`
        relative w-full flex justify-center py-3 px-4 border border-transparent 
        rounded-xl text-sm font-bold text-white 
        bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#11141A] focus:ring-blue-500 
        disabled:opacity-50 disabled:cursor-not-allowed 
        transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 
        hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
        ${className}
      `}
            {...props}
        >
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
            )}
            <span className={loading ? 'opacity-0' : 'opacity-100'}>
                {children}
            </span>
        </button>
    );
}
