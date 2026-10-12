import React, { useId } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { svgId, tierColor } from './TierBadge';

// One laurel branch (left side); mirrored for the right.
const LEAVES = [
  { x: 30, y: 92, r: -20 },
  { x: 22, y: 80, r: -35 },
  { x: 17, y: 67, r: -50 },
  { x: 15, y: 54, r: -65 },
  { x: 16, y: 41, r: -80 },
  { x: 20, y: 29, r: -95 },
];

const LEAF = 'M0 0 C4 -5 12 -5 16 0 C12 5 4 5 0 0Z';

const SPARKLES = [
  [24, 16, 4],
  [98, 20, 3.2],
  [104, 70, 2.6],
];

const TierTrophy = ({ tier, size = 72, style }) => {
  const uid = svgId(useId());
  const c = tierColor(tier) || tierColor('gold');
  const isDiamond = c === tierColor('diamond');
  const metal = `metal-${uid}`;
  const shine = `shine-${uid}`;
  const glow = `glow-${uid}`;

  const branch = (
    <G fill={`url(#${metal})`}>
      <Path
        d="M38 102 C20 90 12 66 20 26"
        fill="none"
        stroke={`url(#${metal})`}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      {LEAVES.map((l, i) => (
        <G key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r})`}>
          <Path d={LEAF} transform="translate(0 -1) rotate(-25)" />
          <Path d={LEAF} transform="translate(0 1) rotate(205)" />
        </G>
      ))}
    </G>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" style={style}>
      <Defs>
        <LinearGradient id={metal} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={c.light} />
          <Stop offset="45%" stopColor={c.base} />
          <Stop offset="100%" stopColor={c.dark} />
        </LinearGradient>
        <LinearGradient id={shine} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#fff" stopOpacity={0} />
          <Stop offset="50%" stopColor="#fff" stopOpacity={0.55} />
          <Stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </LinearGradient>
        <RadialGradient id={glow}>
          <Stop offset="0%" stopColor={c.base} stopOpacity={0.28} />
          <Stop offset="100%" stopColor={c.base} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Soft halo */}
      <Circle cx="60" cy="58" r="56" fill={`url(#${glow})`} />

      {/* Laurel wreath */}
      {branch}
      <G transform="translate(120 0) scale(-1 1)">{branch}</G>

      {/* Cup */}
      <G fill={`url(#${metal})`} stroke={c.dark} strokeWidth={1} strokeLinejoin="round">
        <Path d="M38 26 h44 v6 c0 18 -9 30 -22 32 c-13 -2 -22 -14 -22 -32 z" />
        <Path d="M38 32 c-10 0 -12 4 -11 9 c1 7 7 11 14 12 l0 -4 c-5 -1 -9 -4 -10 -8 c-0.5 -3 1 -5 7 -5 z" />
        <Path d="M82 32 c10 0 12 4 11 9 c-1 7 -7 11 -14 12 l0 -4 c5 -1 9 -4 10 -8 c0.5 -3 -1 -5 -7 -5 z" />
        <Path d="M56 63 h8 v12 h-8 z" />
        <Path d="M50 75 h20 l3 6 h-26 z" />
        <Rect x="42" y="81" width="36" height="8" rx="2" />
      </G>
      {/* Shine sweep */}
      <Path d="M44 29 h8 c0 16 3 25 9 31 c-10 -3 -17 -14 -17 -31 z" fill={`url(#${shine})`} />

      {/* Star */}
      <Path
        d="M60 33 l3.3 6.8 7.5 1.1 -5.4 5.3 1.3 7.4 -6.7 -3.5 -6.7 3.5 1.3 -7.4 -5.4 -5.3 7.5 -1.1 z"
        fill="#fff"
        fillOpacity={0.95}
        stroke={c.dark}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />

      {/* Sparkles for the top tier */}
      {isDiamond &&
        SPARKLES.map(([x, y, r], i) => (
          <Path
            key={i}
            d={`M${x} ${y - r * 2} Q${x} ${y} ${x + r * 2} ${y} Q${x} ${y} ${x} ${y + r * 2} Q${x} ${y} ${x - r * 2} ${y} Q${x} ${y} ${x} ${y - r * 2}Z`}
            fill={c.light}
            stroke={c.base}
            strokeWidth={0.6}
          />
        ))}
    </Svg>
  );
};

export default TierTrophy;
