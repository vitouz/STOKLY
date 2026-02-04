import React, { useEffect, useState } from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0C10] font-sans">
            {/* Animated Background Blobs */}
            <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] transition-opacity duration-1000 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/10 rounded-full blur-[100px] transition-opacity duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} />

            <div
                className={`
                    max-w-md w-full space-y-8 p-1 sm:p-px rounded-[2.5rem] 
                    bg-gradient-to-b from-white/10 to-transparent 
                    transition-all duration-700 transform
                    ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                `}
            >
                <div className="bg-[#11141A]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.4rem] shadow-2xl border border-white/5 relative overflow-hidden group">
                    {/* Subtle inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />

                    <div className="text-center relative z-10">
                        <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                            {title}
                        </h2>
                        <p className="text-gray-400 text-sm max-w-sm mx-auto">
                            {subtitle}
                        </p>
                    </div>

                    <div className="mt-8 relative z-10">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
