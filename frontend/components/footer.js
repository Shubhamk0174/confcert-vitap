'use client';

import Image from 'next/image';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            Made with
            <Heart className="h-4 w-4 text-red-500 fill-red-500 " />
            by
          </span>
          
          {/* Shubham's section */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="font-semibold text-foreground">Shubham</span>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/Shubhamk0174"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110 hover:opacity-80"
                aria-label="Shubham's GitHub Profile"
              >
                <Image
                  src="/icons/icons8-github-64.png"
                  alt="GitHub"
                  width={18}
                  height={18}
                  className="dark:invert"
                />
              </a>
              
              <a
                href="https://www.linkedin.com/in/shubhamkumar-profile/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110 hover:opacity-80"
                aria-label="Shubham's LinkedIn Profile"
              >
                <Image
                  src="/icons/icons8-linkedin-96.png"
                  alt="LinkedIn"
                  width={18}
                  height={18}
                />
              </a>
            </div>
          </div>
          
          <span className="text-muted-foreground/50">•</span>
          
          {/* Second person's section */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="font-semibold text-foreground">Amar</span>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/omegaopinmthechat"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110 hover:opacity-80"
                aria-label="[Your Name]'s GitHub Profile"
              >
                <Image
                  src="/icons/icons8-github-64.png"
                  alt="GitHub"
                  width={18}
                  height={18}
                  className="dark:invert"
                />
              </a>
              
              <a
                href="https://www.linkedin.com/in/amarsankarmaitra/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110 hover:opacity-80"
                aria-label="[Your Name]'s LinkedIn Profile"
              >
                <Image
                  src="/icons/icons8-linkedin-96.png"
                  alt="LinkedIn"
                  width={18}
                  height={18}
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
