'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, User, Award, Calendar, FileCheck, Download, Eye, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import axiosClient from '@/lib/axiosClient';

export default function ProfilePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [userDataError, setUserDataError] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(true);
  const [certificatesError, setCertificatesError] = useState(null);

  useEffect(() => {
    const setmountfunc = ()=>{
      setMounted(true);
    }
    setmountfunc()
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
        
        // Don't set error for 401 - axios interceptor will handle redirect
        if (error.response?.status !== 401) {
          setUserDataError(error.response?.data?.message || 'Failed to load user data');
        }
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Fetch user certificates from blockchain
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return;

      try {
        setLoadingCertificates(true);
        setCertificatesError(null);

        // Step 1: Get certificate IDs for the user
        const idsResponse = await axiosClient.get('/api/certificate/getcertificate-user');
        
        if (idsResponse.data && idsResponse.data.data && idsResponse.data.data.certificateIds) {
          const certificateIds = idsResponse.data.data.certificateIds;
          
          if (certificateIds.length === 0) {
            setCertificates([]);
            setLoadingCertificates(false);
            return;
          }

          // Step 2: Fetch detailed certificate information in batch
          const detailsResponse = await axiosClient.post('/api/certificate/getcertificate/batch', {
            certificateIds: certificateIds
          });

          if (detailsResponse.data && detailsResponse.data.data && detailsResponse.data.data.certificates) {
            setCertificates(detailsResponse.data.data.certificates);
          }
        }
      } catch (error) {
        console.error('Error fetching certificates:', error);
        // Don't set error for 401 - axios interceptor will handle redirect
        if (error.response?.status !== 401) {
          setCertificatesError(error.response?.data?.message || 'Failed to load certificates');
        }
      } finally {
        setLoadingCertificates(false);
      }
    };

    fetchCertificates();
  }, [user]);

  // Scroll to certificates section if hash is present
  useEffect(() => {
    if (mounted && window.location.hash === '#certificates') {
      setTimeout(() => {
        const element = document.getElementById('certificates');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [mounted]);

  const getUserInitials = () => {
    const displayUser = userData || user;
    if (displayUser?.name) {
      return displayUser.name.substring(0, 2).toUpperCase();
    }
    if (displayUser?.username) {
      return displayUser.username.substring(0, 2).toUpperCase();
    }
    if (displayUser?.email) {
      return displayUser.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserTypeLabel = () => {
    const displayUser = userData || user;
    const role = displayUser?.role || displayUser?.userType;
    const typeMap = {
      'admin': 'Admin',
      'club-admin': 'Club Admin',
      'club_admin': 'Club Admin',
      'student': 'Student'
    };
    return typeMap[role] || role || 'User';
  };

  return (
    <AuthGuard requireAuth={true} allowedRoles={['student']}>
      <div className="min-h-screen bg-background py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">My Profile</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your account and view your certificates
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {loadingUserData ? (
                    <div className="space-y-2">
                      <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                      <div className="h-5 w-24 bg-muted animate-pulse rounded mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold mb-1">
                        {userData?.name || userData?.username || user?.username || 'User'}
                      </h3>
                      <Badge variant="secondary" className="mb-2">
                        {getUserTypeLabel()}
                      </Badge>
                    </>
                  )}
                </div>

                <Separator className="my-4" />

                {userDataError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{userDataError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      {loadingUserData ? (
                        <div className="h-4 w-40 bg-muted animate-pulse rounded mt-1"></div>
                      ) : (
                        <p className="text-sm break-all">{userData?.email || user?.email || user?.username || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Username</p>
                      {loadingUserData ? (
                        <div className="h-4 w-32 bg-muted animate-pulse rounded mt-1"></div>
                      ) : (
                        <p className="text-sm">{userData?.username || user?.username || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  {userData?.created_at && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                        <p className="text-sm">{new Date(userData.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Certificates Received</p>
                      {loadingCertificates ? (
                        <div className="h-8 w-12 bg-muted animate-pulse rounded mt-1"></div>
                      ) : (
                        <p className="text-2xl font-bold text-primary">{certificates.length}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Link href="/verify">
                    <Button variant="outline" className="w-full gap-2">
                      <FileCheck className="h-4 w-4" />
                      Verify Certificate
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Certificates Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
            id="certificates"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  My Certificates
                </CardTitle>
                <CardDescription>
                  Your blockchain-verified certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCertificates ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : certificatesError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{certificatesError}</AlertDescription>
                  </Alert>
                ) : certificates.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven&apos;t received any certificates yet.
                    </p>
                    <Link href="/verify">
                      <Button variant="outline">
                        Verify a Certificate
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certificates.map((cert, index) => (
                      <motion.div
                        key={cert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-3">
                                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Award className="h-6 w-6 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold mb-1">{cert.studentName}</h4>
                                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                      <span>Issued by: {cert.issuerUsername}</span>
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(cert.timestamp * 1000).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                        })}</span>
                                      </div>
                                      <Badge variant="outline" className="w-fit text-xs">
                                        ID: {cert.id}
                                      </Badge>
                                      <span className="text-xs font-mono break-all">Reg No: {cert.regNo}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Link href={`/verify?id=${cert.id}`}>
                                  <Button size="sm" variant="outline" className="gap-1">
                                    <Eye className="h-3 w-3" />
                                    View
                                  </Button>
                                </Link>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="gap-1"
                                  onClick={() => {
                                    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cert.ipfsHash}`;
                                    window.open(ipfsUrl, '_blank');
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
