import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A0C10] flex transition-colors duration-300">
            <Sidebar
                isExpanded={isSidebarExpanded}
                setExpanded={setIsSidebarExpanded}
            />

            <main
                className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'ml-64' : 'ml-20'
                    }`}
            >
                <div className="h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
