'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, UserCircle, ArrowRight, AlertCircle, Crown, Users, GraduationCap, ArrowLeft, Trophy, BookOpen, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import axiosClient from '@/lib/axiosClient';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuth();
  
  const [userType, setUserType] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/profile');
    }
  }, [user, authLoading, router]);

  const userTypes = [
    { 
      value: 'admin', 
      label: 'Admin', 
      description: 'Full system access',
      icon: Shield,
      color: 'from-purple-500 to-purple-600'
    },
    { 
      value: 'club-admin', 
      label: 'Club Admin', 
      description: 'Manage club certificates',
      icon: Award,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      value: 'student', 
      label: 'Student', 
      description: 'View your certificates',
      icon: GraduationCap,
      color: 'from-green-500 to-green-600'
    },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!userType) {
      setError('Please select a user type');
      return;
    }
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const endpoint = `/api/auth/login/${userType === 'club-admin' ? 'club-admin' : userType}`;
      const response = await axiosClient.post(endpoint, {
        username: email,
        password: password,
      });

      console.log('Login response:', response.data);

      // Backend returns: { statusCode, data: { user, session }, message, success }
      if (response.data && response.data.success && response.data.data) {
        const { user, session } = response.data.data;
        const token = session?.access_token;
        const refreshToken = session?.refresh_token;

        if (!token) {
          setError('Login failed: No authentication token received');
          return;
        }

        // Set Supabase session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error('Error setting Supabase session:', sessionError);
          setError('Failed to establish session. Please try again.');
          return;
        }

        // Store additional data in localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_type', userType);
        localStorage.setItem('user_data', JSON.stringify(user));
        
        // Update auth context
        if (setUser) {
          setUser({
            ...user,
            userType: userType,
          });
        }

        // Redirect to profile page
        router.push('/profile');
      } else {
        setError('Login failed. Invalid response from server.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <Shield className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold">
              Conf<span className="text-primary">Cert</span>
            </span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              {!userType ? 'Choose your role to continue' : 'Sign in to your account'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {!userType ? (
                /* User Type Selection Cards */
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">I am a</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {userTypes.map((type, index) => {
                      const IconComponent = type.icon;
                      return (
                        <motion.div
                          key={type.value}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Card
                            className="cursor-pointer hover:shadow-md transition-all duration-300 border-2 hover:border-primary group"
                            onClick={() => {
                              setUserType(type.value);
                              setError('');
                            }}
                          >
                            <CardContent className="p-3 flex flex-col items-center text-center space-y-2">
                              <div className={`w-10 h-10 rounded-full bg-linear-to-br ${type.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                <IconComponent className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">{type.label}</h4>
                                <p className="text-xs text-muted-foreground leading-tight">{type.description}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Register Link */}
                  <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Don&apos;t have an account?{' '}
                      <Link href="/register" className="text-primary hover:underline font-medium">
                        Register as Student
                      </Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Login Form */
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Back Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUserType('');
                      setEmail('');
                      setPassword('');
                      setError('');
                    }}
                    className="mb-4 gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Change Role
                  </Button>

                  {/* Selected User Type Badge */}
                  <div className="flex items-center justify-center mb-6">
                    {(() => {
                      const selectedType = userTypes.find(t => t.value === userType);
                      const IconComponent = selectedType?.icon;
                      return (
                        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-muted">
                          <div className={`w-10 h-10 rounded-full bg-linear-to-br ${selectedType?.color} flex items-center justify-center`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-sm">{selectedType?.label}</p>
                            <p className="text-xs text-muted-foreground">{selectedType?.description}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email/Username Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email or Username
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter your email or username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </label>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>

                    {/* Error Message */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Login Button */}
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </form>

                  {/* Register Link */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Don&apos;t have an account?{' '}
                      <Link href="/register" className="text-primary hover:underline font-medium">
                        Register as Student
                      </Link>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Info Badge */}
        <div className="mt-6 flex justify-center">
          <Badge variant="outline" className="text-xs">
            Secured with blockchain technology
          </Badge>
        </div>
      </motion.div>
    </div>
  );
}
