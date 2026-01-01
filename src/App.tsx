import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { DeviceProvider } from "./context/DeviceContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { useState } from "react";
import { Menu, Shield } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import EditCustomer from "./pages/EditCustomer";
import GenerateQR from "./pages/GenerateQR";
import LockControl from "./pages/LockControl";
import LocationTrack from "./pages/Location";
import Settings from "./pages/Settings";
import MobileSimulator from "./pages/MobileSimulator";
import AndroidSetup from "./pages/AndroidSetup";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AddCustomer from "./pages/AddCustomer";
import DevicesPage from "./pages/Devices";
import MobileFrame from "./components/MobileFrame";
import MobileDashboard from "./pages/MobileDashboard";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isAdminLocked } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Lock check for admins
    if (isAdminLocked && location.pathname !== '/login') {
        // We'll let them stay but the Layout will block content
    }

    return <>{children}</>;
};

// Admin Layout with Sidebar
const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isAdminLocked } = useAuth();
    const isBlocked = isAdminLocked;

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative selection:bg-primary/20 transition-colors duration-300">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 flex flex-col overflow-hidden relative w-full h-full">
                {/* Modern Mobile Header - Clean & Premium */}
                <header className="h-[64px] border-b border-border/40 flex items-center px-5 bg-background/80 backdrop-blur-xl z-40 flex-shrink-0 sticky top-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2.5 -ml-2.5 hover:bg-secondary rounded-2xl transition-all duration-300 active:scale-90 group"
                    >
                        <div className="flex flex-col gap-1 w-5">
                            <span className="h-0.5 w-full bg-foreground rounded-full transition-transform group-hover:bg-primary"></span>
                            <span className="h-0.5 w-2/3 bg-foreground rounded-full transition-transform group-hover:bg-primary"></span>
                            <span className="h-0.5 w-full bg-foreground rounded-full transition-transform group-hover:bg-primary"></span>
                        </div>
                    </button>
                    <Link to="/" className="ml-4 flex items-center gap-2.5 hover:opacity-85 transition-all active:scale-95">
                        <div className="w-9 h-9 rounded-[12px] bg-primary flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.25)] ring-1 ring-white/20">
                            <Shield className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-extrabold text-foreground text-[15px] leading-tight tracking-tight uppercase">SecureFinance</span>
                            <span className="text-[10px] text-muted-foreground font-bold tracking-[0.1em] uppercase leading-none opacity-80">Admin Center</span>
                        </div>
                    </Link>
                </header>

                {/* Content Area - Smooth & Spacious */}
                <div className="flex-1 overflow-y-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500 no-scrollbar relative bg-slate-50/30">
                    <div className="max-w-2xl mx-auto w-full p-4 pb-24 min-h-full">
                        {children}
                    </div>

                    {/* Premium Lock Overlay */}
                    {isBlocked && (
                        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-2xl flex items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="max-w-xs space-y-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-destructive/20 rounded-full blur-[40px] animate-pulse"></div>
                                    <div className="w-24 h-24 bg-destructive/10 rounded-[32px] flex items-center justify-center mx-auto ring-1 ring-destructive/20 relative">
                                        <Shield className="w-12 h-12 text-destructive" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase">Service Suspended</h2>
                                    <p className="text-[15px] text-muted-foreground font-medium leading-relaxed px-4">
                                        Your administrative access has been temporarily restricted.
                                    </p>
                                </div>
                                <div className="bg-secondary/60 p-6 rounded-[28px] border border-border/80 shadow-sm backdrop-blur-md">
                                    <p className="text-[11px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-2">Technical Support</p>
                                    <a href="tel:9876543219" className="text-2xl font-black tracking-tighter text-primary hover:text-primary/80 transition-colors">9876543219</a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const AppRoutes = () => {
    return (
        <MobileFrame>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/android-setup" element={<AndroidSetup />} />
                <Route path="/mobile-simulator/:imei?" element={<MobileSimulator />} />

                {/* Protected Admin Routes */}
                <Route path="/" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
                <Route path="/mobile" element={<ProtectedRoute><MobileDashboard /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute><AdminLayout><Customers /></AdminLayout></ProtectedRoute>} />
                <Route path="/customers/:id" element={<ProtectedRoute><AdminLayout><CustomerDetails /></AdminLayout></ProtectedRoute>} />
                <Route path="/customers/:id/edit" element={<ProtectedRoute><AdminLayout><EditCustomer /></AdminLayout></ProtectedRoute>} />
                <Route path="/add-customer" element={<ProtectedRoute><AdminLayout><AddCustomer /></AdminLayout></ProtectedRoute>} />
                <Route path="/devices" element={<ProtectedRoute><AdminLayout><DevicesPage /></AdminLayout></ProtectedRoute>} />
                <Route path="/generate-qr" element={<ProtectedRoute><AdminLayout><GenerateQR /></AdminLayout></ProtectedRoute>} />
                <Route path="/lock-control" element={<ProtectedRoute><AdminLayout><LockControl /></AdminLayout></ProtectedRoute>} />
                <Route path="/location" element={<ProtectedRoute><AdminLayout><LocationTrack /></AdminLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><AdminLayout><Settings /></AdminLayout></ProtectedRoute>} />

                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
        </MobileFrame>
    );
};

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <AuthProvider>
                <DeviceProvider>
                    <Toaster />
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </DeviceProvider>
            </AuthProvider>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
