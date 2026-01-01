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

    // Robust detection for Mobile App (APK), Mobile Browser, or Tablet
    const isWebView = window.navigator.userAgent.includes('wv') ||
        window.navigator.userAgent.includes('MobileApp');

    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent) ||
        window.innerWidth < 1024;

    // If we're in the APK or on a real mobile device, we want a clean, full-screen native feel.
    if (isWebView || isMobileDevice) {
        return (
            <div className="min-h-screen w-full bg-background flex flex-col items-stretch overflow-x-hidden">
                {children}
            </div>
        );
    }

    // On Desktop browsers, show the premium device frame simulator
    return (
        <div className="min-h-screen w-full bg-[#0f172a] flex items-center justify-center p-4 overflow-hidden selection:bg-blue-500/30">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

            {/* Mobile Device Frame */}
            <div className={cn(
                "w-[390px] h-[844px] bg-background rounded-[55px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative border-[12px] border-[#1e293b]",
                "flex flex-col transform scale-90 xxl:scale-100 transition-all duration-700 ease-out hover:shadow-blue-500/20"
            )}>
                {/* Modern Dynamic Island / Notch */}
                <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[110px] h-[34px] bg-[#1e293b] rounded-[20px] z-[100] flex items-center justify-end px-3">
                    <div className="w-3 h-3 rounded-full bg-[#1e293b] border-2 border-[#334155]"></div>
                </div>

                {/* App Content */}
                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0 overflow-y-auto no-scrollbar bg-background">
                        {children}
                    </div>
                </div>

                {/* Home Indicator */}
                <div className="h-7 w-full bg-background flex items-center justify-center flex-shrink-0">
                    <div className="w-32 h-1.5 bg-slate-200 rounded-full opacity-30"></div>
                </div>
            </div>
        </div>
    );
}
