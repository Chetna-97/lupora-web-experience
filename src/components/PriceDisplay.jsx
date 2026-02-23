export default function PriceDisplay({ price, originalPrice, size = 'sm', showBadge = true }) {
  const isSale = originalPrice && originalPrice > price;
  const discountPct = isSale
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  if (!isSale) {
    return (
      <p className={`text-muted ${size === 'lg' ? 'text-2xl font-serif' : 'text-sm'} tracking-wider`}>
        &#8377;{price?.toLocaleString('en-IN')}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className={`text-foreground ${size === 'lg' ? 'text-2xl font-serif' : 'text-sm'} tracking-wider`}>
        &#8377;{price?.toLocaleString('en-IN')}
      </p>
      <p className={`text-subtle line-through ${size === 'lg' ? 'text-base' : 'text-xs'}`}>
        &#8377;{originalPrice?.toLocaleString('en-IN')}
      </p>
      {showBadge && (
        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] tracking-widest uppercase rounded">
          -{discountPct}%
        </span>
      )}
    </div>
  );
}
