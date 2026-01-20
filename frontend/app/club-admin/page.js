'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, User, Award, Calendar, FileCheck, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import axiosClient from '@/lib/axiosClient';

export default function ClubAdminPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [userDataError, setUserDataError] = useState(null);
  const [stats, setStats] = useState({
    totalCertificatesIssued: 0,
    certificatesThisMonth: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setLoadingUserData(true);
        setUserDataError(null);
        const response = await axiosClient.get('/api/auth/get-user-data');
        
        if (response.data && response.data.data) {
          setUserData(response.data.data.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        
        if (error.response?.status !== 401) {
          setUserDataError('Failed to load user data. Please try again.');
        }
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Fetch certificate statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !userData) return;

      try {
        setLoadingStats(true);
        // TODO: Create endpoint to get club admin's certificate statistics
        // const response = await axiosClient.get('/api/club-admin/stats');
        // setStats(response.data.data);
        
        // For now, using placeholder data
        setStats({
          totalCertificatesIssued: 0,
          certificatesThisMonth: 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, userData]);

  if (!mounted) {
    return null;
  }

  return (
    <AuthGuard requireAuth={true} allowedRoles={['club-admin']}>
      <div className="min-h-screen bg-background pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-2">
              <Shield className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-4xl font-bold text-foreground">Club Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Manage and issue certificates for your club
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {loadingUserData ? (
                          <div className="h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary-foreground border-r-transparent"></div>
                        ) : (
                          (userData?.name || userData?.username || 'CA').substring(0, 2).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle>
                    {loadingUserData ? (
                      <div className="h-6 w-32 bg-muted animate-pulse rounded mx-auto"></div>
                    ) : (
                      userData?.name || userData?.username || 'Club Admin'
                    )}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="secondary" className="mt-2">
                      <Shield className="h-3 w-3 mr-1" />
                      Club Administrator
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userDataError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{userDataError}</AlertDescription>
                    </Alert>
                  ) : loadingUserData ? (
                    <>
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Username</p>
                          <p className="font-medium">{userData?.username || 'N/A'}</p>
                        </div>
                      </div>

                      {userData?.email && (
                        <>
                          <Separator />
                          <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Email</p>
                              <p className="font-medium break-all">{userData.email}</p>
                            </div>
                          </div>
                        </>
                      )}

                      <Separator />
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Member Since</p>
                          <p className="font-medium">
                            {userData?.created_at 
                              ? new Date(userData.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Statistics and Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-primary" />
                      Total Certificates Issued
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingStats ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold text-primary">
                        {stats.totalCertificatesIssued}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-500" />
                      Certificates This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingStats ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold text-green-500">
                        {stats.certificatesThisMonth}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Manage certificates and templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/create">
                    <Card className="cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary">
                      <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Issue Certificate</h3>
                          <p className="text-sm text-muted-foreground">
                            Create new certificates
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/edit-template">
                    <Card className="cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary">
                      <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Award className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Manage Templates</h3>
                          <p className="text-sm text-muted-foreground">
                            Edit certificate designs
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </CardContent>
              </Card>

              {/* Info Alert */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  As a Club Admin, you can issue certificates for your club members and manage certificate templates.
                  All certificates are securely stored on the blockchain.
                </AlertDescription>
              </Alert>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
