'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, User, Award, Calendar, FileCheck, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getUserInitials = () => {
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserTypeLabel = () => {
    const typeMap = {
      'admin': 'Admin',
      'club-admin': 'Club Admin',
      'student': 'Student'
    };
    return typeMap[user.userType] || user.userType;
  };

  // Dummy certificates data
  const dummyCertificates = [
    {
      id: 1,
      title: 'Web Development Workshop',
      issuer: 'Tech Club',
      date: '2025-12-15',
      certificateId: 'CERT-2025-001',
    },
    {
      id: 2,
      title: 'Blockchain Fundamentals',
      issuer: 'Innovation Cell',
      date: '2025-11-20',
      certificateId: 'CERT-2025-002',
    },
    {
      id: 3,
      title: 'Hackathon Participation',
      issuer: 'VIT AP',
      date: '2025-10-05',
      certificateId: 'CERT-2025-003',
    },
  ];

  return (
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
                  <h3 className="text-xl font-semibold mb-1">
                    {user.username || 'User'}
                  </h3>
                  <Badge variant="secondary" className="mb-2">
                    {getUserTypeLabel()}
                  </Badge>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-sm break-all">{user.email || user.username}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Username</p>
                      <p className="text-sm">{user.username || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Certificates Received</p>
                      <p className="text-2xl font-bold text-primary">{dummyCertificates.length}</p>
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
                  <Link href="/create">
                    <Button variant="outline" className="w-full gap-2">
                      <Shield className="h-4 w-4" />
                      Create Certificate
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
                {dummyCertificates.length === 0 ? (
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
                    {dummyCertificates.map((cert, index) => (
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
                                    <h4 className="font-semibold mb-1">{cert.title}</h4>
                                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                      <span>Issued by: {cert.issuer}</span>
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(cert.date).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                        })}</span>
                                      </div>
                                      <Badge variant="outline" className="w-fit text-xs">
                                        ID: {cert.certificateId}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Eye className="h-3 w-3" />
                                  View
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1">
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
  );
}
