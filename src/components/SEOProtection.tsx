import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEOProtection() {
  const location = useLocation();

  useEffect(() => {
    const isPublicRoute = location.pathname === '/' || location.pathname.startsWith('/get-started');
    
    // Attempt to find existing robots meta tag
    let metaRobots = document.querySelector('meta[name="robots"]');
    
    if (!isPublicRoute) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else {
      // For public routes, we want it indexable. Remove or set to index, follow.
      if (metaRobots) {
        metaRobots.setAttribute('content', 'index, follow');
      }
    }
  }, [location.pathname]);

  return null;
}
