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
    // Assuming implicit admin role for blockage logic or simple global lock
    const isBlocked = isAdminLocked;

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative selection:bg-primary/20">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 flex flex-col overflow-hidden relative w-full">
                {/* Mobile Header */}
                <header className="h-14 border-b border-border/50 flex items-center px-4 bg-card/50 backdrop-blur-md z-30 flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 hover:bg-secondary rounded-xl transition-all duration-200 active:scale-95"
                    >
                        <Menu className="w-5 h-5 text-foreground" />
                    </button>
                    <Link to="/" className="ml-3 flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Shield className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-foreground text-sm tracking-tight">SecureFinance</span>
                    </Link>
                </header>

                <div className="flex-1 overflow-y-auto p-0 sm:p-4 w-full animate-in fade-in duration-500 scrollbar-hide relative bg-secondary/10">
                    {children}

                    {/* Lock Overlay */}
                    {isBlocked && (
                        <div className="absolute inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-8 text-center animate-in fade-in duration-500">
                            <div className="max-w-xs space-y-6">
                                <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mx-auto ring-4 ring-destructive/5 animate-pulse">
                                    <Shield className="w-10 h-10 text-destructive" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight text-foreground">LIMIT REACHED</h2>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                        Your access has been suspended by system oversight.
                                    </p>
                                </div>
                                <div className="bg-secondary/50 p-4 rounded-2xl border border-border/50">
                                    <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1">Contact Authority</p>
                                    <p className="text-lg font-black tracking-tighter text-primary">9876543219</p>
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
