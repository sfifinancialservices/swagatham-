import { useEffect } from 'react';

function animateValue(el, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    el.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

export function useStatsAnimation() {
  useEffect(() => {
    const statNumbers = document.querySelectorAll('.stat-number');
    const statsContainer =
      document.querySelector('.stats-container') || document.querySelector('.bento-home-stats');
    if (!statNumbers.length || !statsContainer) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            statNumbers.forEach((stat) => {
              const target = parseInt(stat.getAttribute('data-count'), 10);
              animateValue(stat, 0, target, 2000);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(statsContainer);
    return () => observer.disconnect();
  }, []);
}
