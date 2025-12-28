import { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomerCard } from '@/components/CustomerCard';
import { CustomerDetailsModal } from '@/components/CustomerDetailsModal';
import { Customer } from '@/types/customer';
import { useDevice } from '@/context/DeviceContext';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Customers = () => {
  const { customers, updateCustomer, deleteCustomer } = useDevice();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNo.includes(searchQuery) ||
      c.imei1.includes(searchQuery);

    const matchesFilter = filter === 'all' ||
      (filter === 'locked' && c.isLocked) ||
      (filter === 'unlocked' && !c.isLocked);

    return matchesSearch && matchesFilter;
  });

  const handleLockToggle = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    const newLockState = !customer.isLocked;

    await updateCustomer(id, {
      isLocked: newLockState,
      lockHistory: [
        ...customer.lockHistory,
        {
          id: Date.now().toString(),
          action: newLockState ? 'locked' : 'unlocked',
          timestamp: new Date().toISOString(),
          reason: newLockState ? 'Manual lock by admin' : 'Manual unlock by admin',
        }
      ]
    });
  };

  const handleEdit = (id: string) => {
    navigate(`/customers/${id}/edit`);
  };

  const handleCollectEmi = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (!customer || customer.paidEmis >= customer.totalEmis) return;

    await updateCustomer(id, {
      paidEmis: customer.paidEmis + 1
    });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteCustomer(deleteId);
      setDeleteId(null);
    }
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Customers</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold opacity-70">Directory Management</p>
        </div>
        <Button className="w-full rounded-xl shadow-lg shadow-primary/10">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search directory..."
            className="pl-10 bg-secondary/30 border-border/50 h-11 rounded-xl"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 rounded-xl h-9"
              onClick={() => setFilter('all')}
            >
              All ({customers.length})
            </Button>
            <Button
              variant={filter === 'locked' ? 'destructive' : 'outline'}
              size="sm"
              className="flex-1 rounded-xl h-9"
              onClick={() => setFilter('locked')}
            >
              Locked ({customers.filter(c => c.isLocked).length})
            </Button>
          </div>
          <Button
            variant={filter === 'unlocked' ? 'success' : 'outline'}
            size="sm"
            className="w-full rounded-xl h-9"
            onClick={() => setFilter('unlocked')}
          >
            Active ({customers.filter(c => !c.isLocked).length})
          </Button>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onLockToggle={handleLockToggle}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onCollectEmi={handleCollectEmi}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">No customers found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        customer={selectedCustomer}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onLockToggle={handleLockToggle}
        onCollectEmi={handleCollectEmi}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              and remove their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;
