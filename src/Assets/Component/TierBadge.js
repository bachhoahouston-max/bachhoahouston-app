import React, { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

// Tier colors from the brand spec; light/dark are derived shades for the metallic gradient.
const TIER_COLORS = {
  loyal: { base: '#0a4', light: '#3A9C7D', dark: '#0a4', bg: '#FFFDF4' },
  silver: { base: '#A7B0B7', light: '#EEF1F3', dark: '#6B747B', bg: '#A7B0B714' },
  gold: { base: '#D8A62E', light: '#F8DE8A', dark: '#94690F', bg: '#D8A62E14' },
  diamond: { base: '#55B8E8', light: '#D4F1FF', dark: '#22709E', bg: '#55B8E814' },
};

export const tierColor = tier => {
  const key = String(tier?.key || tier?.name || tier || '').toLowerCase();
  return TIER_COLORS[key] || null;
};

// SVG gradient ids must be plain identifiers
export const svgId = id => id.replace(/[^a-zA-Z0-9_-]/g, '');

const STAR = 'M20 10.5 l2.8 5.7 6.3 0.9 -4.6 4.4 1.1 6.3 -5.6 -3 -5.6 3 1.1 -6.3 -4.6 -4.4 6.3 -0.9 z';

// Round medal for Loyal/Silver/Gold, a cut gem for Diamond.
const TierBadge = ({ tier, size = 40, style }) => {
  const uid = svgId(useId());
  const c = tierColor(tier) || TIER_COLORS.gold;
  const metal = `metal-${uid}`;
  const inner = `inner-${uid}`;

  if (c === TIER_COLORS.diamond) {
    return (
      <Svg width={size} height={size} viewBox="0 0 40 40" style={style}>
        <Defs>
          <LinearGradient id={metal} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={c.light} />
            <Stop offset="50%" stopColor={c.base} />
            <Stop offset="100%" stopColor={c.dark} />
          </LinearGradient>
        </Defs>
        <Path d="M11 7 h18 l8 9 -17 19 -17 -19 z" fill={`url(#${metal})`} />
        <Path
          d="M3 16 h34 M11 7 l4 9 5 19 5 -19 4 -9 M15 16 l5 -9 5 9"
          fill="none"
          stroke="#fff"
          strokeOpacity={0.55}
          strokeWidth={0.9}
          strokeLinejoin="round"
        />
        <Path d="M11 7 h9 l-5 9 h-12 z" fill="#fff" fillOpacity={0.35} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" style={style}>
      <Defs>
        <LinearGradient id={metal} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={c.light} />
          <Stop offset="55%" stopColor={c.base} />
          <Stop offset="100%" stopColor={c.dark} />
        </LinearGradient>
        <LinearGradient id={inner} x1="1" y1="1" x2="0" y2="0">
          <Stop offset="0%" stopColor={c.light} />
          <Stop offset="60%" stopColor={c.base} />
          <Stop offset="100%" stopColor={c.dark} />
        </LinearGradient>
      </Defs>
      <Circle cx="20" cy="20" r="19" fill={`url(#${metal})`} />
      <Circle cx="20" cy="20" r="14" fill={`url(#${inner})`} stroke="#fff" strokeOpacity={0.5} strokeWidth={1} />
      <Path d={STAR} fill="#fff" fillOpacity={0.95} stroke={c.dark} strokeWidth={0.6} strokeLinejoin="round" />
    </Svg>
  );
};

export default TierBadge;
