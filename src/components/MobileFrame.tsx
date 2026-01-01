import React from 'react';
import { cn } from '@/lib/utils';

interface MobileFrameProps {
    children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
    return (
        <div className="min-h-screen w-full bg-[#f0f2f5] flex items-center justify-center p-0 md:p-4">
            {/* Mobile Device Frame */}
            <div className={cn(
                "w-full h-full md:w-[400px] md:h-[850px] bg-background md:rounded-[40px] shadow-2xl overflow-hidden relative border-0 md:border-[8px] md:border-gray-900",
                "flex flex-col"
            )}>
                {/* Notch (Visual only on desktop) */}
                <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-gray-900 rounded-b-[18px] z-50"></div>

                {/* Status Bar Area */}
                <div className="h-[44px] w-full bg-background flex-shrink-0 z-40 border-b border-border/10"></div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar relative w-full bg-background">
                    {children}
                </div>

                {/* Home Indicator */}
                <div className="h-[20px] w-full bg-background flex-shrink-0 flex items-center justify-center pt-2">
                    <div className="w-[120px] h-[5px] bg-gray-300 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}
