import { useEffect } from 'react';

export function useStickyHeader() {
  useEffect(() => {
    const header = document.querySelector('.main-header');
    if (!header) return undefined;

    let lastScroll = 0;

    const onScroll = () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll <= 0) {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        return;
      }

      if (currentScroll > lastScroll) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
        header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
      }

      lastScroll = currentScroll;
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}
