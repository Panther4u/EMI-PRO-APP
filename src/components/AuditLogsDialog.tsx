import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Shield,
    Lock,
    Unlock,
    UserPlus,
    UserMinus,
    Edit,
    Trash2,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react';

interface AuditLog {
    id: string;
    actor: {
        name: string;
        email: string;
        role: string;
    };
    action: string;
    target: {
        type: string;
        name: string;
    };
    details: any;
    timestamp: string;
    status: string;
}

interface AuditLogsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AuditLogsDialog = ({ open, onOpenChange }: AuditLogsDialogProps) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const { toast } = useToast();

    const adminToken = localStorage.getItem('adminToken');
    const limit = 50;

    useEffect(() => {
        if (open) {
            fetchLogs();
        }
    }, [open, filter, page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                skip: (page * limit).toString(),
            });

            if (filter !== 'all') {
                params.append('action', filter);
            }

            const response = await fetch(`/api/admin/audit-logs?${params}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setLogs(data.logs);
                setHasMore(data.pagination.hasMore);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to fetch audit logs',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch audit logs',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE_ADMIN':
                return <UserPlus className="h-4 w-4 text-blue-600" />;
            case 'UPDATE_ADMIN_LIMIT':
                return <Edit className="h-4 w-4 text-orange-600" />;
            case 'DISABLE_ADMIN':
            case 'DELETE_ADMIN':
                return <UserMinus className="h-4 w-4 text-red-600" />;
            case 'ENABLE_ADMIN':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'LOCK_DEVICE':
                return <Lock className="h-4 w-4 text-red-600" />;
            case 'UNLOCK_DEVICE':
                return <Unlock className="h-4 w-4 text-green-600" />;
            case 'DELETE_CUSTOMER':
                return <Trash2 className="h-4 w-4 text-red-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-slate-600" />;
        }
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Audit Logs
                    </DialogTitle>
                    <DialogDescription>
                        Complete audit trail of all system actions
                    </DialogDescription>
                </DialogHeader>

                {/* Filters */}
                <div className="flex items-center gap-4 pb-4 border-b">
                    <Select value={filter} onValueChange={(value) => { setFilter(value); setPage(0); }}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="CREATE_ADMIN">Create Admin</SelectItem>
                            <SelectItem value="UPDATE_ADMIN_LIMIT">Update Limit</SelectItem>
                            <SelectItem value="DISABLE_ADMIN">Disable Admin</SelectItem>
                            <SelectItem value="ENABLE_ADMIN">Enable Admin</SelectItem>
                            <SelectItem value="LOCK_DEVICE">Lock Device</SelectItem>
                            <SelectItem value="UNLOCK_DEVICE">Unlock Device</SelectItem>
                            <SelectItem value="CREATE_CUSTOMER">Create Customer</SelectItem>
                            <SelectItem value="DELETE_CUSTOMER">Delete Customer</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLogs()}
                        disabled={loading}
                    >
                        <Clock className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Logs Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Shield className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-slate-600 font-medium">No audit logs found</p>
                        <p className="text-slate-400 text-sm">Try changing the filter</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            {getActionIcon(log.action)}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatAction(log.action)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{log.actor.name}</span>
                                                <span className="text-xs text-slate-500">{log.actor.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{log.target.name}</span>
                                                <span className="text-xs text-slate-500">{log.target.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">
                                            {log.details.oldValue !== undefined && log.details.newValue !== undefined
                                                ? `${log.details.oldValue} → ${log.details.newValue}`
                                                : log.details.reason || '-'}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {formatTimestamp(log.timestamp)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-slate-600">
                        Page {page + 1} • {logs.length} logs
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={!hasMore || loading}
                        >
                            Next
                        </Button>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuditLogsDialog;
