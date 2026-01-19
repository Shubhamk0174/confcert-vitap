'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axiosClient from '@/lib/axiosClient';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('create-club-admin');
  const [mounted, setMounted] = useState(false);

  // State for creating club admin
  const [clubAdminForm, setClubAdminForm] = useState({ username: '', password: '' });
  const [clubAdminLoading, setClubAdminLoading] = useState(false);
  const [clubAdminMessage, setClubAdminMessage] = useState(null);

  // State for creating admin
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
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

  // State for viewing certificates
  const [selectedClubAdmin, setSelectedClubAdmin] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && (!user || !user.user_metadata?.roles?.includes('admin'))) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load data when section changes
  useEffect(() => {
    if (mounted && user) {
      if (activeSection === 'manage-club-admins') {
        loadClubAdmins();
      } else if (activeSection === 'manage-admins') {
        loadAdmins();
      } else if (activeSection === 'wallet-stats') {
        loadWalletStats();
      }
    }
  }, [activeSection, mounted, user]);

  // API Functions
  const createClubAdmin = async (e) => {
    e.preventDefault();
    setClubAdminLoading(true);
    setClubAdminMessage(null);

    try {
      const response = await axiosClient.post('/api/auth/register/club-admin', clubAdminForm);
      setClubAdminMessage({ type: 'success', text: 'Club admin created successfully!' });
      setClubAdminForm({ username: '', password: '' });
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
      const response = await axiosClient.post('/api/auth/register/admin', adminForm);
      setAdminMessage({ type: 'success', text: 'Admin created successfully!' });
      setAdminForm({ username: '', password: '' });
      // Refresh admin list if we're on that section
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
      const response = await axiosClient.get('/api/auth/club-admins');
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
      const response = await axiosClient.get('/api/auth/admins');
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
      await axiosClient.delete(`/api/auth/club-admins/${id}`);
      loadClubAdmins();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete club admin');
    }
  };

  const deleteAdmin = async (id) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      await axiosClient.delete(`/api/auth/admins/${id}`);
      loadAdmins();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  const viewCertificates = async (clubAdmin) => {
    setSelectedClubAdmin(clubAdmin);
    setCertificatesLoading(true);
    try {
      const response = await axiosClient.get(`/api/auth/club-admins/${clubAdmin.id}/certificates`);
      setCertificates(response.data.data.certificates || []);
    } catch (error) {
      console.error('Failed to load certificates:', error);
      setCertificates([]);
    } finally {
      setCertificatesLoading(false);
    }
  };

  const loadWalletStats = async () => {
    setWalletLoading(true);
    try {
      const response = await axiosClient.get('/api/wallet/stats');
      setWalletStats(response.data.data);
    } catch (error) {
      console.error('Failed to load wallet stats:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'create-club-admin', label: 'Create Club Admin credentials', icon: UserPlus },
    { id: 'manage-club-admins', label: 'Manage Club Admins', icon: Users },
    { id: 'manage-admins', label: 'Add/Remove Admins', icon: Shield },
    { id: 'wallet-stats', label: 'Wallet & Contract', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-background mt-16">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-card border-r border-border p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Admin Panel
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user.user_metadata?.username || 'Admin'}
            </p>
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
            {/* Create Club Admin credentials Section */}
            {activeSection === 'create-club-admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Create Club Admin credentials
                  </CardTitle>
                  <CardDescription>
                    Register a new club admin with username and password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createClubAdmin} className="space-y-4 max-w-md">
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
                      {clubAdminLoading ? 'Creating...' : 'Create Club Admin credentials'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Manage Club Admins Section */}
            {activeSection === 'manage-club-admins' && (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Manage Club Admins
                    </CardTitle>
                    <CardDescription>
                      View, delete, or check certificates issued by club admins
                    </CardDescription>
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
                              <p className="font-medium text-foreground">{clubAdmin.username}</p>
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
                                onClick={() => deleteClubAdmin(clubAdmin.id)}
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
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Existing Admins
                    </CardTitle>
                    <CardDescription>
                      Manage existing admin accounts
                    </CardDescription>
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
                              <p className="font-medium text-foreground">{admin.username}</p>
                              <p className="text-sm text-muted-foreground">
                                Created: {new Date(admin.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteAdmin(admin.id)}
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

            {/* Wallet & Contract Stats Section */}
            {activeSection === 'wallet-stats' && (
              <div className="space-y-6">
                {walletLoading ? (
                  <div className="text-center py-16">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  </div>
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
                    <CardContent className="py-8">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Failed to load wallet statistics. Please try again.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
