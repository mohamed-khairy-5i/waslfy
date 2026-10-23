'use client';

/**
 * باركود SVG خفيف — بيرسم الخطوط مباشرة من مولّد Code128 المحلي.
 * مفيش أي مكتبة خارجية — نفس فلسفة waslfy-parser.
 */

import { code128Bars, code128Width } from '@/lib/waslfy/barcode';

interface ShipmentBarcodeProps {
  value: string;
  moduleWidth?: number;
  height?: number;
  className?: string;
}

export function ShipmentBarcode({
  value,
  moduleWidth = 2,
  height = 46,
  className,
}: ShipmentBarcodeProps) {
  const bars = code128Bars(value, moduleWidth);
  const width = code128Width(value, moduleWidth);
  if (!bars.length) return null;

  return (
    <svg
      role="img"
      aria-label={`باركود الشحنة ${value}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      style={{ display: 'block' }}
    >
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="#000000" />
      ))}
    </svg>
  );
}
