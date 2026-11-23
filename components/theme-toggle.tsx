'use client';

import { useState, useEffect } from 'react';
import { useThemeToggle } from '@/hooks/use-theme';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeToggle();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-header-accent/15 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <IconSun className="h-5 w-5 text-header-accent" />
      ) : (
        <IconMoon className="h-5 w-5 text-header-text" />
      )}
    </button>
  );
}
