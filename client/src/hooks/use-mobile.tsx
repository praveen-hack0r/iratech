import { useEffect, useState } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window !== 'undefined') {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      // Initial check
      checkIfMobile();

      // Add event listener
      window.addEventListener('resize', checkIfMobile);

      // Cleanup
      return () => {
        window.removeEventListener('resize', checkIfMobile);
      };
    }
  }, []);

  return isMobile;
}