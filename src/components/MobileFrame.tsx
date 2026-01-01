import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MobileFrameProps {
    children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return <div className="min-h-screen w-full bg-background">{children}</div>;

    // Detect if we are on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 1024 ||
        navigator.userAgent.includes('MobileApp');

    // If it's a mobile device, just return the content. 
    // NO wrapper with backgrounds or centering.
    if (isMobile) {
        return (
            <div className="h-full w-full bg-background flex flex-col">
                {children}
            </div>
        );
    }

    // On Desktop, show the nice phone frame simulator
    return (
        <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
            {/* Mobile Device Frame */}
            <div className={cn(
                "w-[400px] h-[850px] bg-background rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative border-[8px] border-slate-800",
                "flex flex-col transform scale-90 md:scale-100 transition-transform duration-500"
            )}>
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-slate-800 rounded-b-[20px] z-50"></div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0 overflow-y-auto no-scrollbar bg-background">
                        {children}
                    </div>
                </div>

                {/* Home Indicator */}
                <div className="h-6 w-full bg-background flex items-center justify-center">
                    <div className="w-32 h-1.5 bg-slate-200 rounded-full opacity-50"></div>
                </div>
            </div>
        </div>
    );
}
