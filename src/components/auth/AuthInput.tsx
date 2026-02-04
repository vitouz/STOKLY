import React, { forwardRef } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: LucideIcon;
    error?: string;
    success?: boolean;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
    ({ label, icon: Icon, error, success, className = '', ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {Icon && (
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                            <Icon
                                className={`h-5 w-5 transition-all duration-300 ${error ? 'text-red-400' :
                                    success ? 'text-emerald-400' :
                                        'text-gray-500 group-focus-within:text-blue-400'
                                    }`}
                            />
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              block w-full rounded-xl border bg-white/5 px-4 py-3
              text-white placeholder-gray-500
              transition-all duration-300
              focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:opacity-50 disabled:cursor-not-allowed
              ${Icon ? 'pl-11' : ''}
              ${error
                                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                                : success
                                    ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
                                    : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 hover:border-white/20'
                            }
              ${className}
            `}
                        {...props}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        {error && (
                            <AlertCircle className="h-5 w-5 text-red-400 animate-in fade-in zoom-in-75" />
                        )}
                        {!error && success && (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-in fade-in zoom-in-75" />
                        )}
                    </div>
                </div>
                {error && (
                    <p className="text-xs text-red-400 ml-1 animate-in slide-in-from-top-1">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

AuthInput.displayName = 'AuthInput';
