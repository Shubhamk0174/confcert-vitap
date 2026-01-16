'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Create', href: '/create' },
    { name: 'Verify', href: '/verify' },
    { name: 'Templates', href: '/edit-template' },
    { name: 'About', href: '/about' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Shield className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-lg font-bold text-foreground">
              Conf<span className="text-primary">Cert</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-0.5">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button variant="ghost" className="font-medium">
                  {item.name}
                </Button>
              </Link>
            ))}

            <a
              href="https://github.com/Shubhamk0174/confcert-blockchain"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Image
                src="/icons/icons8-github-64.png"
                alt="GitHub"
                width={24}
                height={24}
                className="transition-opacity dark:invert"
              />
            </a>
          </div>

          {/* Theme Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t bg-background"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    {item.name}
                  </Button>
                </Link>
              ))}

              <div className="pt-2 border-t">
                <Button
                  onClick={toggleTheme}
                  variant="ghost"
                  className="w-full justify-start mb-2"
                >
                  <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span>Toggle theme</span>
                </Button>
                <a
                  href="https://github.com/Shubhamk0174/confcert-blockchain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors mb-2"
                >
                  <Image
                    src="/icons/icons8-github-64.png"
                    alt="GitHub"
                    width={20}
                    height={20}
                    className="opacity-75 dark:invert"
                  />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
