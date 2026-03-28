import { useEffect } from 'react';

export function useHeroRotation(heroClass = 'hero', bgClass = 'hero-bg', intervalMs = 6000) {
  useEffect(() => {
    const hero = document.querySelector(`.${heroClass}`);
    if (!hero) return undefined;

    const backgrounds = hero.querySelectorAll(`.${bgClass}`);
    if (backgrounds.length === 0) return undefined;

    let current = 0;
    backgrounds[current].classList.add('active');

    const id = setInterval(() => {
      backgrounds[current].classList.remove('active');
      current = (current + 1) % backgrounds.length;
      backgrounds[current].classList.add('active');
    }, intervalMs);

    return () => {
      clearInterval(id);
      backgrounds.forEach((el) => el.classList.remove('active'));
    };
  }, [heroClass, bgClass, intervalMs]);
}
