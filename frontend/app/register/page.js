'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axiosClient from '@/lib/axiosClient';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/profile');
    }
  }, [user, authLoading, router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check for VIT AP student email
    if (!formData.email.endsWith('@vitapstudent.ac.in')) {
      setError('Please use your VIT AP student email (@vitapstudent.ac.in)');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosClient.post('/api/auth/register/student', {
        username: formData.email,  // Backend expects 'username' field with email value
        password: formData.password,
      });

      if (response.data) {
        setSuccess(true);
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 pt-16">
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
            <CardTitle className="text-2xl font-bold text-center">Student Registration</CardTitle>
            <CardDescription className="text-center">
              Create your account to receive and manage certificates
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Registration Successful!</h3>
                <p className="text-muted-foreground mb-4">
                  Your account has been created. Redirecting to login...
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    VIT AP Student Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="yourname@vitapstudent.ac.in"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be a valid VIT AP student email
                  </p>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters long
                  </p>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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

                {/* Register Button */}
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
            )}

            {/* Login Link */}
            {!success && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign In
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Badge */}
        <div className="mt-6 flex justify-center">
          <Badge variant="outline" className="text-xs">
            Only for students • Admin registration is restricted
          </Badge>
        </div>
      </motion.div>
    </div>
  );
}
