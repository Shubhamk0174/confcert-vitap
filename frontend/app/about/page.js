'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Lock, Zap, Users, Globe, Award, ArrowRight, Github, Linkedin, Code2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function About() {
  const features = [
    {
      icon: Shield,
      title: 'Blockchain Anchored Records',
      description: 'Each certificate is registered on Ethereum Sepolia with immutable metadata, creating a tamper-evident proof trail.',
    },
    {
      icon: Lock,
      title: 'Tamper-Resistant Verification',
      description: 'Verification checks certificate state directly from blockchain records, reducing trust on any single centralized actor.',
    },
    {
      icon: Zap,
      title: 'Fast Certificate Workflows',
      description: 'Issue single or bulk certificates through one interface with backend-managed blockchain transactions and delivery.',
    },
    {
      icon: Users,
      title: 'Role-Based Access Control',
      description: 'Admins, club admins, and students have dedicated workflows for secure operations and clearer responsibilities.',
    },
    {
      icon: Globe,
      title: 'IPFS Certificate Availability',
      description: 'Certificate files are stored on IPFS, and the app uses gateway fallbacks to improve retrieval reliability.',
    },
    {
      icon: Award,
      title: 'Template-Driven Issuance',
      description: 'Use a visual template editor with placeholders, logo support, and reusable designs for consistent branding.',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Sign In By Role',
      description: 'Admins and club admins access issuance tools; students access profile and verification features.',
    },
    {
      number: '2',
      title: 'Create and Issue',
      description: 'Generate certificates from templates or uploaded files, then issue through backend-managed blockchain flow.',
    },
    {
      number: '3',
      title: 'Verify Instantly',
      description: 'Anyone can verify certificate authenticity using certificate ID and on-chain data.',
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">About Us</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About ConfCert
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            ConfCert is a blockchain-backed certificate platform for issuing, managing,
            and verifying digital certificates with auditability and reduced fraud risk.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">ConfCert Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To provide a secure and practical certification platform that combines Web2 usability
                with Web3 trust guarantees. ConfCert enables institutions to issue certificates on-chain
                without forcing recipients to manage crypto wallets, while preserving public verifiability.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Why Choose Us?
            </h2>
            <p className="text-lg text-muted-foreground">
              Built for real institutional workflows, not just demos
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="rounded-lg bg-green-100/70 dark:bg-green-900/20 p-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 inline-flex">
                          <feature.icon className="h-6 w-6 text-green-700 dark:text-green-300" />
                        </div>
                        <div className="flex items-center min-h-6">
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="absolute -top-4 left-6 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                    {step.number}
                  </div>
                  <CardTitle className="pt-6">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* About Developer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit">Developer</Badge>
              <CardTitle className="text-2xl md:text-3xl mt-2">About the Developer</CardTitle>
              <CardDescription>
                Built and maintained by Shubham Kumar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="inline-flex p-2 rounded-lg bg-primary/10">
                    <Code2 className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Shubham is a Full Stack Developer and B.Tech CSE Core student at VIT-AP, focused on building modern web applications and practical blockchain-integrated products.
                    ConfCert reflects this approach by combining user-friendly workflows with verifiable on-chain trust.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild variant="outline" className="gap-2">
                    <a
                      href="https://github.com/Shubhamk0174"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4" />
                      GitHub Profile
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="gap-2">
                    <a
                      href="https://www.linkedin.com/in/shubhamkumar-profile/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Start issuing and verifying blockchain-backed certificates today
              </p>
              <Button asChild size="lg">
                <Link href="/login">
                  Start Creating Certificates
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
