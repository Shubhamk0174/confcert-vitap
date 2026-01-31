'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Wallet, 
  Trash2, 
  Eye,
  FileText,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axiosClient from '@/lib/axiosClient';
import AuthGuard from '@/components/AuthGuard';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('manage-club-admins');
  const [mounted, setMounted] = useState(false);

  // Admin user data
  const [adminData, setAdminData] = useState(null);
  const [loadingAdminData, setLoadingAdminData] = useState(true);

  // State for creating club admin
  const [clubAdminForm, setClubAdminForm] = useState({ name: '', username: '', password: '' });
  const [clubAdminLoading, setClubAdminLoading] = useState(false);
  const [clubAdminMessage, setClubAdminMessage] = useState(null);

  // State for creating admin
  const [adminForm, setAdminForm] = useState({ name: '', username: '', password: '' });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState(null);

  // State for managing club admins
  const [clubAdmins, setClubAdmins] = useState([]);
  const [clubAdminsLoading, setClubAdminsLoading] = useState(false);

  // State for managing admins
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  // State for wallet stats
  const [walletStats, setWalletStats] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState(null);

  // State for blockchain admin management
  const [adminAddressForm, setAdminAddressForm] = useState({ address: '' });
  const [adminAddressLoading, setAdminAddressLoading] = useState(false);
  const [adminAddressMessage, setAdminAddressMessage] = useState(null);
  const [blockchainAdmins, setBlockchainAdmins] = useState([]);
  const [blockchainAdminsLoading, setBlockchainAdminsLoading] = useState(false);

  // State for viewing certificates
  const [selectedClubAdmin, setSelectedClubAdmin] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);

  // State for certificate search
  const [searchType, setSearchType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState(null);

  // Track which sections have been loaded to prevent unnecessary refetches
  const [loadedSections, setLoadedSections] = useState({
    'manage-club-admins': false,
    'manage-admins': false,
    'developer-options': false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch admin user data from API
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) return;

      try {
        setLoadingAdminData(true);
        const response = await axiosClient.get('/api/auth/get-user-data');
        
        if (response.data && response.data.data) {
          setAdminData(response.data.data.user);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        // Don't set error for 401 - axios interceptor will handle redirect
      } finally {
        setLoadingAdminData(false);
      }
    };

    fetchAdminData();
  }, [user]);

  // Load data when section changes
  useEffect(() => {
    if (mounted && user) {
      // Only load if section hasn't been loaded yet
      if (activeSection === 'manage-club-admins' && !loadedSections['manage-club-admins']) {
        loadClubAdmins();
        setLoadedSections(prev => ({ ...prev, 'manage-club-admins': true }));
      } else if (activeSection === 'manage-admins' && !loadedSections['manage-admins']) {
        loadAdmins();
        setLoadedSections(prev => ({ ...prev, 'manage-admins': true }));
      } else if (activeSection === 'developer-options' && !loadedSections['developer-options']) {
        loadWalletStats();
        loadBlockchainAdmins();
        setLoadedSections(prev => ({ ...prev, 'developer-options': true }));
      }
      // Note: search-certificates section maintains its state when navigating away
    }
  }, [activeSection, mounted, user, loadedSections]);

  // API Functions
  const createClubAdmin = async (e) => {
    e.preventDefault();
    setClubAdminLoading(true);
    setClubAdminMessage(null);

    try {
      const response = await axiosClient.post('/api/web2admin/register/club-admin', clubAdminForm);
      setClubAdminMessage({ type: 'success', text: 'Club admin created successfully!' });
      setClubAdminForm({ name: '', username: '', password: '' });
      // Don't auto-refresh to avoid unnecessary API calls
    } catch (error) {
      setClubAdminMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create club admin credentials' 
      });
    } finally {
      setClubAdminLoading(false);
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const response = await axiosClient.post('/api/web2admin/register/admin', adminForm);
      setAdminMessage({ type: 'success', text: 'Admin created successfully!' });
      setAdminForm({ name: '', username: '', password: '' });
      // Refresh admin list to show the new admin
      if (activeSection === 'manage-admins') {
        loadAdmins();
      }
    } catch (error) {
      setAdminMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create admin' 
      });
    } finally {
      setAdminLoading(false);
    }
  };

  const loadClubAdmins = async () => {
    setClubAdminsLoading(true);
    try {
      const response = await axiosClient.post('/api/web2admin/get-club-admins');
      setClubAdmins(response.data.data.clubAdmins || []);
    } catch (error) {
      console.error('Failed to load club admins:', error);
    } finally {
      setClubAdminsLoading(false);
    }
  };

  const loadAdmins = async () => {
    setAdminsLoading(true);
    try {
      const response = await axiosClient.post('/api/web2admin/get-admins');
      setAdmins(response.data.data.admins || []);
    } catch (error) {
      console.error('Failed to load admins:', error);
    } finally {
      setAdminsLoading(false);
    }
  };

  const deleteClubAdmin = async (id) => {
    if (!confirm('Are you sure you want to delete this club admin?')) return;

    try {
      await axiosClient.delete(`/api/web2admin/delete-club-admin/${id}`);
      // Refresh the list after deletion
      loadClubAdmins();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete club admin');
    }
  };

  const deleteAdmin = async (id) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      await axiosClient.delete(`/api/web2admin/delete-admin/${id}`);
      // Refresh the list after deletion
      loadAdmins();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  const viewCertificates = async (clubAdmin) => {
    setSelectedClubAdmin(clubAdmin);
    setCertificatesLoading(true);
    try {
      // TODO: This endpoint does not exist in backend yet
      // const response = await axiosClient.get(`/api/web2admin/club-admins/${clubAdmin.id}/certificates`);
      // setCertificates(response.data.data.certificates || []);
      setCertificates([]); // Empty for now
      console.warn('Certificate viewing endpoint not implemented in backend');
    } catch (error) {
      console.error('Failed to load certificates:', error);
      setCertificates([]);
    } finally {
      setCertificatesLoading(false);
    }
  };

  const searchCertificates = async (e) => {
    if (e) e.preventDefault();
    setSearchLoading(true);
    setSearchMessage(null);

    try {
      // Validate input based on search type
      if (searchType !== 'all' && !searchQuery.trim()) {
        setSearchMessage({ 
          type: 'error', 
          text: searchType === 'regno' 
            ? 'Please enter a registration number' 
            : 'Please enter an issuer name' 
        });
        setSearchLoading(false);
        return;
      }

      // Use the new search endpoint
      const response = await axiosClient.post('/api/certificate/search', {
        searchType,
        searchQuery: searchQuery.trim()
      });

      const certificates = response.data.data.certificates || [];
      setSearchResults(certificates);
      
      if (certificates.length === 0) {
        setSearchMessage({ type: 'info', text: 'No certificates found' });
      } else {
        setSearchMessage({ 
          type: 'success', 
          text: `Found ${certificates.length} certificate(s)` 
        });
      }
    } catch (error) {
      console.error('Failed to search certificates:', error);
      setSearchMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to search certificates' 
      });
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadWalletStats = async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const response = await axiosClient.get('/api/web2admin/get-stats');
      setWalletStats(response.data.data || null);
      setWalletError(null);
    } catch (error) {
      console.error('Failed to load wallet stats:', error);
      setWalletError(error.response?.data?.message || 'Failed to load wallet statistics. Please try again.');
      setWalletStats(null);
    } finally {
      setWalletLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const addAdminAddress = async (e) => {
    e.preventDefault();
    setAdminAddressLoading(true);
    setAdminAddressMessage(null);

    try {
      const response = await axiosClient.post('/api/web3admin/add-admin-address', {
        address: adminAddressForm.address
      });
      setAdminAddressMessage({ 
        type: 'success', 
        text: `Admin address added successfully! TX: ${response.data.data.transactionHash}` 
      });
      setAdminAddressForm({ address: '' });
      // Reload the admin list
      loadBlockchainAdmins();
    } catch (error) {
      setAdminAddressMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add admin address' 
      });
    } finally {
      setAdminAddressLoading(false);
    }
  };

  const loadBlockchainAdmins = async () => {
    setBlockchainAdminsLoading(true);
    try {
      const response = await axiosClient.get('/api/web3admin/get-all-admins');
      setBlockchainAdmins(response.data.data.admins || []);
    } catch (error) {
      console.error('Failed to load blockchain admins:', error);
      setBlockchainAdmins([]);
    } finally {
      setBlockchainAdminsLoading(false);
    }
  };

  const removeAdminAddress = async (address) => {
    if (!confirm(`Are you sure you want to remove admin address: ${address}?`)) return;

    try {
      const response = await axiosClient.post('/api/web3admin/remove-admin', {
        address: address
      });
      alert(`Admin address removed successfully! TX: ${response.data.data.transactionHash}`);
      // Reload the admin list
      loadBlockchainAdmins();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove admin address');
    }
  };

  const menuItems = [
    { id: 'manage-club-admins', label: 'Manage Club Admins', icon: Users },
    { id: 'manage-admins', label: 'Add/Remove Admins', icon: Shield },
    { id: 'search-certificates', label: 'Search Certificates', icon: FileText },
    { id: 'developer-options', label: 'Developer Options', icon: Wallet },
  ];

  return (
    <AuthGuard requireAuth={true} allowedRoles={['admin']}>
      <div className="min-h-screen bg-background mt-16">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-card border-r border-border p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Admin Panel
            </h2>
            {loadingAdminData ? (
              <div className="h-5 w-24 bg-muted animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                {adminData?.name || adminData?.username || user?.user_metadata?.username || 'Admin'}
              </p>
            )}
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeSection === item.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${
                    activeSection === item.id ? 'rotate-90' : ''
                  }`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Manage Club Admins Section */}
            {activeSection === 'manage-club-admins' && (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Create Club Admin Credentials
                    </CardTitle>
                    <CardDescription>
                      Register a new club admin with username and password
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createClubAdmin} className="space-y-4 max-w-md">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Name
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter full name"
                          value={clubAdminForm.name}
                          onChange={(e) => setClubAdminForm({ ...clubAdminForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Username
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter username"
                          value={clubAdminForm.username}
                          onChange={(e) => setClubAdminForm({ ...clubAdminForm, username: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Enter password (min 6 characters)"
                          value={clubAdminForm.password}
                          onChange={(e) => setClubAdminForm({ ...clubAdminForm, password: e.target.value })}
                          required
                          minLength={6}
                        />
                      </div>

                      {clubAdminMessage && (
                        <Alert variant={clubAdminMessage.type === 'error' ? 'destructive' : 'default'}>
                          {clubAdminMessage.type === 'success' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <AlertDescription>{clubAdminMessage.text}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" disabled={clubAdminLoading} className="w-full">
                        {clubAdminLoading ? 'Creating...' : 'Create Club Admin Credentials'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Existing Club Admins
                        </CardTitle>
                        <CardDescription>
                          View, delete, or check certificates issued by club admins
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadClubAdmins}
                        disabled={clubAdminsLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${clubAdminsLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clubAdminsLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                      </div>
                    ) : clubAdmins.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No club admins found</p>
                    ) : (
                      <div className="space-y-3">
                        {clubAdmins.map((clubAdmin) => (
                          <div
                            key={clubAdmin.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                          >
                            <div>
                              <p className="font-medium text-foreground">{clubAdmin.name || clubAdmin.username}</p>
                              <p className="text-sm text-muted-foreground">Username: {clubAdmin.username}</p>
                              <p className="text-sm text-muted-foreground">
                                Created: {new Date(clubAdmin.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewCertificates(clubAdmin)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Certificates
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteClubAdmin(clubAdmin.auth_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Certificates Modal/Section */}
                {selectedClubAdmin && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Certificates by {selectedClubAdmin.username}
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedClubAdmin(null)}
                      >
                        Close
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {certificatesLoading ? (
                        <div className="text-center py-8">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                        </div>
                      ) : certificates.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No certificates issued yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {certificates.map((cert) => (
                            <div
                              key={cert.id}
                              className="p-3 border border-border rounded-lg"
                            >
                              <p className="font-medium">{cert.student_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Certificate ID: {cert.certificate_id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Issued: {new Date(cert.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Manage Admins Section */}
            {activeSection === 'manage-admins' && (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Add New Admin
                    </CardTitle>
                    <CardDescription>
                      Register a new admin account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createAdmin} className="space-y-4 max-w-md">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Name
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter full name"
                          value={adminForm.name}
                          onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Username
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter username"
                          value={adminForm.username}
                          onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Enter password (min 6 characters)"
                          value={adminForm.password}
                          onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                          required
                          minLength={6}
                        />
                      </div>

                      {adminMessage && (
                        <Alert variant={adminMessage.type === 'error' ? 'destructive' : 'default'}>
                          {adminMessage.type === 'success' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <AlertDescription>{adminMessage.text}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" disabled={adminLoading} className="w-full">
                        {adminLoading ? 'Creating...' : 'Create Admin'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Existing Admins
                        </CardTitle>
                        <CardDescription>
                          Manage existing admin accounts
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadAdmins}
                        disabled={adminsLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${adminsLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {adminsLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                      </div>
                    ) : admins.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No admins found</p>
                    ) : (
                      <div className="space-y-3">
                        {admins.map((admin) => (
                          <div
                            key={admin.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                          >
                            <div>
                              <p className="font-medium text-foreground">{admin.name || admin.username}</p>
                              <p className="text-sm text-muted-foreground">Username: {admin.username}</p>
                              <p className="text-sm text-muted-foreground">
                                Created: {new Date(admin.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteAdmin(admin.auth_id)}
                              disabled={admin.username === user.user_metadata?.username}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Search Certificates Section */}
            {activeSection === 'search-certificates' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Search Certificates
                    </CardTitle>
                    <CardDescription>
                      Search for certificates by registration number, issuer name, or view all certificates in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={searchCertificates} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Search Type
                          </label>
                          <select
                            value={searchType}
                            onChange={(e) => {
                              setSearchType(e.target.value);
                              setSearchQuery('');
                              setSearchMessage(null);
                              setSearchResults([]);
                            }}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="all">All Certificates</option>
                            <option value="regno">By Registration Number</option>
                            <option value="issuer">By Issuer/Club Name</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 flex gap-2">
                          {searchType !== 'all' && (
                            <div className="flex-1">
                              <label className="text-sm font-medium text-foreground mb-2 block">
                                {searchType === 'regno' ? 'Registration Number' : 'Issuer/Club Name'}
                              </label>
                              <Input
                                type="text"
                                placeholder={
                                  searchType === 'regno' 
                                    ? 'Enter registration number (e.g., 22BCE0001)' 
                                    : 'Enter issuer or club name'
                                }
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                              />
                            </div>
                          )}
                          <div className={searchType === 'all' ? 'flex-1' : ''}>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              &nbsp;
                            </label>
                            <Button 
                              type="submit" 
                              disabled={searchLoading}
                              className="w-full"
                            >
                              {searchLoading ? (
                                <>
                                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                                  Searching...
                                </>
                              ) : (
                                'Search'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {searchMessage && (
                        <Alert variant={searchMessage.type === 'error' ? 'destructive' : 'default'}>
                          {searchMessage.type === 'success' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : searchMessage.type === 'error' ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          <AlertDescription>{searchMessage.text}</AlertDescription>
                        </Alert>
                      )}
                    </form>
                  </CardContent>
                </Card>

                {/* Search Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Search Results
                      </span>
                      {searchResults.length > 0 && (
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {searchResults.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {searchLoading ? (
                      <div className="text-center py-16">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                        <p className="mt-4 text-muted-foreground">Searching certificates...</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-center py-16">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No certificates to display. Use the search form above to find certificates.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {searchResults.map((cert, index) => (
                          <div
                            key={cert.id || cert.certificate_id || index}
                            className="p-5 border border-border rounded-lg hover:shadow-md hover:border-primary/50 transition-all duration-200 bg-card"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 space-y-2">
                                {/* Student Name - Primary */}
                                <div>
                                  <h3 className="text-lg font-bold text-foreground">
                                    {cert.student_name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Reg No: <span className="font-mono font-semibold text-foreground">{cert.reg_no}</span>
                                  </p>
                                </div>

                                {/* Certificate Details */}
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Certificate ID</p>
                                    <p className="text-sm font-mono font-medium text-foreground">
                                      {cert.certificate_id}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Issuer Name</p>
                                    <p className="text-sm font-medium text-foreground">
                                      {cert.event_name}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Issued By</p>
                                    <p className="text-sm font-medium text-foreground">
                                      {cert.issuer_name}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Issued Date</p>
                                    <p className="text-sm font-medium text-foreground">
                                      {new Date(cert.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>

                                {/* Issuer Address */}
                                {cert.issuer_address && (
                                  <div className="pt-2">
                                    <p className="text-xs text-muted-foreground">Issuer Wallet Address</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                                        {cert.issuer_address.slice(0, 6)}...{cert.issuer_address.slice(-4)}
                                      </code>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(cert.issuer_address)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2">
                                {cert.ipfs_hash && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${cert.ipfs_hash}`, '_blank')}
                                    className="whitespace-nowrap"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Certificate
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`https://sepolia.etherscan.io/address/${cert.issuer_address}`, '_blank')}
                                  className="whitespace-nowrap"
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  View on Chain
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Blockchain Admin Addresses Section */}
            {activeSection === 'developer-options' && (
              <div className="space-y-6">
                {/* Blockchain Admin Management Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Blockchain Admin Addresses
                    </CardTitle>
                    <CardDescription>
                      Add or remove wallet addresses that can perform admin operations on the smart contract
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Add Admin Address Form */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Add Admin Address</h3>
                      <form onSubmit={addAdminAddress} className="space-y-4 max-w-2xl">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Wallet Address
                          </label>
                          <Input
                            type="text"
                            placeholder="0x..."
                            value={adminAddressForm.address}
                            onChange={(e) => setAdminAddressForm({ address: e.target.value })}
                            required
                            className="font-mono"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter the Ethereum wallet address to grant admin privileges
                          </p>
                        </div>

                        {adminAddressMessage && (
                          <Alert variant={adminAddressMessage.type === 'error' ? 'destructive' : 'default'}>
                            {adminAddressMessage.type === 'success' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <AlertDescription className="break-all">
                              {adminAddressMessage.text}
                            </AlertDescription>
                          </Alert>
                        )}

                        <Button type="submit" disabled={adminAddressLoading}>
                          {adminAddressLoading ? 'Adding...' : 'Add Admin Address'}
                        </Button>
                      </form>
                    </div>

                    <Separator />

                    {/* List of Admin Addresses */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Current Admin Addresses</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={loadBlockchainAdmins}
                          disabled={blockchainAdminsLoading}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${blockchainAdminsLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                      {blockchainAdminsLoading ? (
                        <div className="text-center py-8">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                          <p className="mt-2 text-sm text-muted-foreground">Loading admin addresses...</p>
                        </div>
                      ) : blockchainAdmins.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No admin addresses found</p>
                      ) : (
                        <div className="space-y-2">
                          {blockchainAdmins.map((address, index) => (
                            <div
                              key={address}
                              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Badge variant="secondary">#{index + 1}</Badge>
                                <code className="text-sm font-mono truncate">{address}</code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(address)}
                                  className="shrink-0"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeAdminAddress(address)}
                                className="shrink-0 ml-2"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Important:</strong> Only add trusted wallet addresses. Admin addresses can issue and manage certificates on the blockchain.
                        Use the remove button to revoke admin privileges from any address.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Wallet & Contract Stats */}
                {walletLoading ? (
                  <Card>
                    <CardContent className="py-16">
                      <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                        <p className="mt-4 text-muted-foreground">Loading wallet statistics...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : walletError ? (
                  <Card>
                    <CardContent className="py-8">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {walletError}
                        </AlertDescription>
                      </Alert>
                      <div className="mt-4 text-center">
                        <Button onClick={loadWalletStats} variant="outline">
                          Try Again
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : walletStats ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wallet className="h-5 w-5" />
                          Wallet Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Wallet Address</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                              {walletStats.wallet.address}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(walletStats.wallet.address)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Balance</label>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {parseFloat(walletStats.wallet.balanceInEth).toFixed(4)} ETH
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Contract Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Contract Address</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                              {walletStats.contract.address}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(walletStats.contract.address)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://sepolia.etherscan.io/address/${walletStats.contract.address}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-muted-foreground">Total Certificates</label>
                            <p className="text-2xl font-bold text-foreground mt-1">
                              {walletStats.contract.totalCertificates}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Certificates in DB</label>
                            <p className="text-2xl font-bold text-foreground mt-1">
                              {walletStats.contract.certificatesInDb}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          User Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-3xl font-bold text-primary">
                              {walletStats.users.admins}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Admins</p>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-3xl font-bold text-primary">
                              {walletStats.users.clubAdmins}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Club Admins</p>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-3xl font-bold text-primary">
                              {walletStats.users.students}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Students</p>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-3xl font-bold text-primary">
                              {walletStats.users.total}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Total Users</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">No wallet statistics available</p>
                      <Button onClick={loadWalletStats} variant="outline">
                        Load Wallet Statistics
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
