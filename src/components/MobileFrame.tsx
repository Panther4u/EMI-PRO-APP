import React, { useState, useEffect } from 'react';
import { Signal, Battery, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MobileFrameProps {
    children: React.ReactNode;
}

export const MobileFrame = ({ children }: MobileFrameProps) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-0 md:p-4 overflow-hidden selection:bg-primary/20">
            {/* Background radial glow */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_40%,#1e1e2e_0%,#000000_100%)] z-0" />

            {/* Phone chassis */}
            <div className={cn(
                "relative w-full h-[100vh] md:h-[840px] md:max-w-[390px]",
                "bg-background md:rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.8)]",
                "md:border-[8px] md:border-zinc-800 md:ring-1 md:ring-zinc-700/50",
                "flex flex-col overflow-hidden z-10 transition-all duration-700 ease-in-out"
            )}>

                {/* Top bar (Time & Stats) */}
                <div className="h-12 flex items-center justify-between px-8 pt-2 select-none z-50 bg-background/90 backdrop-blur-md flex-shrink-0">
                    <span className="text-xs font-bold text-foreground">
                        {format(currentTime, 'h:mm')}
                    </span>
                    <div className="flex items-center gap-1.5 text-foreground/80">
                        <Signal className="w-3 h-3" />
                        <Wifi className="w-3 h-3" />
                        <Battery className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* Camera notch (Visual only) */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-800 rounded-full z-[60] hidden md:block" />

                {/* Content wrapper */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {children}
                </div>

                {/* Bottom home bar */}
                <div className="h-6 flex items-center justify-center bg-background/90 backdrop-blur-md z-50 flex-shrink-0">
                    <div className="w-32 h-1 bg-foreground/10 rounded-full" />
                </div>
            </div>

            {/* Gloss reflection overlay */}
            <div className="fixed inset-0 pointer-events-none z-20 opacity-10 hidden md:block">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-white/20 via-transparent to-transparent rotate-[25deg]" />
            </div>
        </div>
    );
};
