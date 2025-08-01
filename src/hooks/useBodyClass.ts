import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useBodyClass() {
  const location = useLocation();

  useEffect(() => {
    // Remove any existing route classes
    document.body.classList.remove('route-home', 'route-post-detail', 'route-admin');
    
    // Add class based on current route
    if (location.pathname === '/') {
      document.body.classList.add('route-home');
    } else if (location.pathname.startsWith('/post/')) {
      document.body.classList.add('route-post-detail');
    } else if (location.pathname.startsWith('/admin')) {
      document.body.classList.add('route-admin');
    }

    // Set data attribute for CSS targeting
    document.body.setAttribute('data-current-route', location.pathname);

    return () => {
      // Cleanup on unmount
      document.body.classList.remove('route-home', 'route-post-detail', 'route-admin');
      document.body.removeAttribute('data-current-route');
    };
  }, [location.pathname]);
}
