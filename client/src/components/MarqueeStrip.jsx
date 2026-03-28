export default function MarqueeStrip({ items, variant = 'light' }) {
  const doubled = [...items, ...items];
  return (
    <div className={`marquee-strip marquee-strip--${variant}`} aria-hidden="true">
      <div className="marquee-strip__track">
        {doubled.map((text, i) => (
          <span key={`${text}-${i}`} className="marquee-strip__item">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
