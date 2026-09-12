/**
 * StickerRenderer — a single Duʿā sticker rendered as a self-contained
 * 260×260 unit, decorated with react-native-svg (arabesque borders,
 * medallion, banner, star-burst…). Zero image assets — all typography
 * + SVG so it ships OTA-safe.
 *
 * Each phrase can be rendered in multiple visual STYLES so the user
 * gets variety like the WhatsApp sticker packs.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle, Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop, G,
} from 'react-native-svg';
import type { DuaSticker } from '../data/duaCards';

export const STICKER_STYLES = [
  'gold-medallion',
  'rose-cream',
  'green-banner',
  'star-burst',
  'ivory-geo',
  'navy-frame',
  'mihrab',
  'scroll',
  'star-geometry',
  'minimal',
] as const;
export type StickerStyle = typeof STICKER_STYLES[number];

export interface StickerRendererProps {
  sticker: DuaSticker;
  style: StickerStyle;
  size?: number;
}

// Ornamental arabesque path used by several styles.
const ARABESQUE_D = `
M 130 20
C 150 40 160 40 180 30
C 200 20 220 30 230 55
C 240 80 230 100 210 110
C 230 120 240 140 230 160
C 220 180 200 190 180 180
C 160 170 150 170 130 190
C 110 170 100 170 80 180
C 60 190 40 180 30 160
C 20 140 30 120 50 110
C 30 100 20 80 30 55
C 40 30 60 20 80 30
C 100 40 110 40 130 20 Z
`;

// ────────────────────────────────────────────────────────────────
// Small helper that computes the text metrics for a given sticker
// `size`. The SVG scales via viewBox but our React Native text
// overlay does NOT — so we derive font sizes and padding from `size`
// (baseline 260) so that a 140px grid tile is not 1.9× oversized.
//
// Also: we deliberately DO NOT set a fixed `lineHeight` on the Arabic
// text. `adjustsFontSizeToFit` on Android is known to shrink glyphs
// while leaving fixed line-boxes untouched, which clips the longest
// duʿās (Innā lillāhi…, Ḥasbunallāh…, Lā ḥawla…). Letting the line
// box compute from the font itself keeps everything inside.
function metrics(size: number) {
  const scale = size / 260;
  return {
    arabic: Math.round(30 * scale),
    translit: Math.max(9, Math.round(12 * scale)),
    padH: Math.round(24 * scale),
    gap: Math.max(2, Math.round(6 * scale)),
  };
}

export function StickerRenderer({ sticker, style, size = 260 }: StickerRendererProps) {
  const m = metrics(size);
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {style === 'gold-medallion' && <GoldMedallion sticker={sticker} size={size} m={m} />}
      {style === 'rose-cream' && <RoseCream sticker={sticker} size={size} m={m} />}
      {style === 'green-banner' && <GreenBanner sticker={sticker} size={size} m={m} />}
      {style === 'star-burst' && <StarBurst sticker={sticker} size={size} m={m} />}
      {style === 'ivory-geo' && <IvoryGeo sticker={sticker} size={size} m={m} />}
      {style === 'navy-frame' && <NavyFrame sticker={sticker} size={size} m={m} />}
      {style === 'mihrab' && <Mihrab sticker={sticker} size={size} m={m} />}
      {style === 'scroll' && <Scroll sticker={sticker} size={size} m={m} />}
      {style === 'star-geometry' && <StarGeometry sticker={sticker} size={size} m={m} />}
      {style === 'minimal' && <Minimal sticker={sticker} size={size} m={m} />}
    </View>
  );
}

type M = ReturnType<typeof metrics>;

// Shared text overlay — Arabic on top, transliteration below.
// No fixed lineHeight → Android auto-shrink works correctly.
function TextOverlay({
  sticker, color, translitColor, m,
}: { sticker: DuaSticker; color: string; translitColor: string; m: M }) {
  return (
    <View style={[styles.textCenter, { paddingHorizontal: m.padH, gap: m.gap }]}>
      <Text
        style={[styles.arabic, { color, fontSize: m.arabic }]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {sticker.ar}
      </Text>
      <Text
        style={[styles.translit, { color: translitColor, fontSize: m.translit }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {sticker.translit}
      </Text>
    </View>
  );
}

// ── Style 1: Gold Medallion (navy background, gold circle frame) ──
function GoldMedallion({ sticker, size, m }: { sticker: DuaSticker; size: number; m: M }) {
  return (
    <>
      <Svg width={size} height={size} viewBox="0 0 260 260" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#0A1128" />
            <Stop offset="1" stopColor="#1E3A5F" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="260" height="260" fill="url(#mg)" rx="20" />
        {/* Outer ring */}
        <Circle cx="130" cy="130" r="115" fill="none" stroke="#D4AF37" strokeWidth="2" />
        <Circle cx="130" cy="130" r="108" fill="none" stroke="#D4AF37" strokeWidth="0.6" opacity="0.5" />
        {/* Inner subtle arabesque */}
        <Path d={ARABESQUE_D} fill="none" stroke="#D4AF37" strokeWidth="0.6" opacity="0.35" />
        {/* Four tiny corner accents */}
        {[[30,30],[230,30],[30,230],[230,230]].map(([cx,cy],i)=>(
          <Circle key={i} cx={cx} cy={cy} r="3" fill="#D4AF37" opacity="0.8" />
        ))}
      </Svg>
      <TextOverlay sticker={sticker} color="#F5D06F" translitColor="#F5D06FDD" m={m} />
    </>
  );
}

// ── Style 2: Rose Cream (soft cream, roses, red Arabic) ─────────
function RoseCream({ sticker, size, m }: { sticker: DuaSticker; size: number; m: M }) {
  return (
    <>
      <Svg width={size} height={size} viewBox="0 0 260 260" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="rc" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFF6EA" />
            <Stop offset="1" stopColor="#F7E3D0" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="260" height="260" fill="url(#rc)" rx="20" />
        <G opacity="0.55">
          {Array.from({length: 12}).map((_, i) => {
            const a = (i * Math.PI * 2) / 12;
            const cx = 130 + Math.cos(a) * 95;
            const cy = 130 + Math.sin(a) * 95;
            return <Circle key={i} cx={cx} cy={cy} r="10" fill="#DB6B6B" />;
          })}
        </G>
        <Circle cx="130" cy="130" r="88" fill="#FFF6EA" />
        <Circle cx="130" cy="130" r="88" fill="none" stroke="#B54747" strokeWidth="1.2" />
      </Svg>
      <TextOverlay sticker={sticker} color="#B54747" translitColor="#B54747" m={m} />
    </>
  );
}

// ── Style 3: Green Banner (emerald with gold banner) ────────────
function GreenBanner({ sticker, size, m }: { sticker: DuaSticker; size: number; m: M }) {
  return (
    <>
      <Svg width={size} height={size} viewBox="0 0 260 260" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="gb" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#0B4F3B" />
            <Stop offset="1" stopColor="#116B4F" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="260" height="260" fill="url(#gb)" rx="20" />
        <Path d="M 20 90 L 240 90 L 220 130 L 240 170 L 20 170 L 40 130 Z"
          fill="#F5D06F" opacity="0.15" />
        <Path d="M 20 90 L 240 90 L 220 130 L 240 170 L 20 170 L 40 130 Z"
          fill="none" stroke="#F5D06F" strokeWidth="1.5" />
        {[[50,50],[210,50],[50,210],[210,210],[130,40],[130,220]].map(([cx,cy],i)=>(
          <Path key={i} d={`M ${cx} ${cy-6} L ${cx+2} ${cy-2} L ${cx+6} ${cy-1} L ${cx+3} ${cy+2} L ${cx+4} ${cy+6} L ${cx} ${cy+4} L ${cx-4} ${cy+6} L ${cx-3} ${cy+2} L ${cx-6} ${cy-1} L ${cx-2} ${cy-2} Z`}
            fill="#F5D06F" opacity="0.7" />
        ))}
      </Svg>
      <TextOverlay sticker={sticker} color="#F5D06F" translitColor="#F5D06FE6" m={m} />
    </>
  );
}

// ── Style 4: Star Burst (purple, radiating rays) ────────────────
function StarBurst({ sticker, size, m }: { sticker: DuaSticker; size: number; m: M }) {
  return (
    <>
      <Svg width={size} height={size} viewBox="0 0 260 260" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="sb" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#4C1D95" />
            <Stop offset="1" stopColor="#7C3AED" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="260" height="260" fill="url(#sb)" rx="20" />
        <G opacity="0.35">
          {Array.from({length: 24}).map((_, i) => {
            const a = (i * Math.PI * 2) / 24;
            const x2 = 130 + Math.cos(a) * 130;
            const y2 = 130 + Math.sin(a) * 130;
            return <Path key={i} d={`M 130 130 L ${x2} ${y2}`} stroke="#F5D06F" strokeWidth="0.8" />;
          })}
        </G>
        <Path d="M 130 60 L 145 115 L 200 100 L 155 140 L 200 180 L 145 165 L 130 220 L 115 165 L 60 180 L 105 140 L 60 100 L 115 115 Z"
          fill="none" stroke="#F5D06F" strokeWidth="1.3" opacity="0.9" />
      </Svg>
      <TextOverlay sticker={sticker} color="#F5D06F" translitColor="#F5D06F" m={m} />
    </>
  );
}

// ── Style 5: Ivory Geometric (cream + geometric border) ─────────
function IvoryGeo({ sticker, size, m }: { sticker: DuaSticker; size: number; m: M }) {
  return (
    <>
      <Svg width={size} height={size} viewBox="0 0 260 260" style={StyleSheet.absoluteFill}>
        <Rect x="0" y="0" width="260" height="260" fill="#FBF6EA" rx="20" />
        <G transform="rotate(45 130 130)" opacity="0.7">
          <Rect x="30" y="30" width="200" height="200" fill="none" stroke="#0F172A" strokeWidth="1" />
          <Rect x="50" y="50" width="160" height="160" fill="none" stroke="#0F172A" strokeWidth="0.8" opacity="0.5" />
        </G>
        <Rect x="18" y="18" width="224" height="224" fill="none" stroke="#0F172A" strokeWidth="1.5" rx="14" />
        {[[130,20],[240,130],[130,240],[20,130]].map(([cx,cy],i)=>(
          <Path key={i} d={`M ${cx} ${cy-6} L ${cx+6} ${cy} L ${cx} ${cy+6} L ${cx-6} ${cy} Z`} fill="#0F172A" />
        ))}
      </Svg>
      <TextOverlay sticker={sticker} color="#0F172A" translitColor="#0F172AB3" m={m} />
    </>
  );
}

// ── Style 6: Navy Frame (deep navy w/ subtle gold hairline) ─────
function NavyFrame({ sticker, size, m }: { sticker: DuaSticker; size: number; m: M }) {
  return (
    <>
      <Svg width={size} height={size} viewBox="0 0 260 260" style={StyleSheet.absoluteFill}>
        <Rect x="0" y="0" width="260" height="260" fill="#0F172A" rx="20" />
        <Rect x="14" y="14" width="232" height="232" fill="none" stroke="#D4AF37" strokeWidth="1" rx="16" />
        <Rect x="22" y="22" width="216" height="216" fill="none" stroke="#D4AF37" strokeWidth="0.4" opacity="0.5" rx="12" />
        {[[30,30,0],[230,30,90],[230,230,180],[30,230,270]].map(([x,y,r],i)=>(
          <G key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <Path d="M 0 0 Q 12 -6 20 4 Q 12 8 0 0 Z" fill="#D4AF37" opacity="0.85" />
          </G>
        ))}
      </Svg>
      <TextOverlay sticker={sticker} color="#F5D06F" translitColor="#F5D06FCC" m={m} />
    </>
  );
}

// ── Style 7: Mihrab — arched prayer niche in deep teal + gold ────
function Mihrab({ sticker, size, m }: { sticker: DuaSticker; size: number; m: M }) {
  return (
    <>
      <Svg width={size} height={size} viewBox="0 0 260 260" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="mh" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0F3D3D" />
            <Stop offset="1" stopColor="#062A2A" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="260" height="260" fill="url(#mh)" rx="20" />
        {/* Mihrab arch — pointed dome shape */}
        <Path d="M 40 240 L 40 130 Q 40 40 130 40 Q 220 40 220 130 L 220 240 Z"
          fill="none" stroke="#D4AF37" strokeWidth="1.5" />
        <Path d="M 55 235 L 55 135 Q 55 55 130 55 Q 205 55 205 135 L 205 235"
          fill="none" stroke="#D4AF37" strokeWidth="0.6" opacity="0.55" />
        {/* Hanging lamp motif */}
        <Path d="M 130 55 L 130 75" stroke="#D4AF37" strokeWidth="1" />
        <Circle cx="130" cy="82" r="7" fill="none" stroke="#D4AF37" strokeWidth="1" />
        <Path d="M 125 89 L 135 89 L 132 96 L 128 96 Z" fill="#D4AF37" opacity="0.85" />
        {/* Base plinth */}
        <Rect x="40" y="230" width="180" height="10" fill="#D4AF37" opacity="0.85" />
      </Svg>
      <View style={{ ...StyleSheet.absoluteFillObject, paddingTop: 100, alignItems: 'center' }}>
        <View style={{ paddingHorizontal: m.padH, gap: m.gap, alignItems: 'center' }}>
          <Text
            style={[styles.arabic, { color: '#F5D06F', fontSize: m.arabic }]}
            numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}
          >{sticker.ar}</Text>
          <Text
            style={[styles.translit, { color: '#F5D06FCC', fontSize: m.translit }]}
            numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}
          >{sticker.translit}</Text>
        </View>
      </View>
    </>
  );
}

// ── Style 8: Scroll — antique parchment with rolled-corner scroll ─
function Scroll({ sticker, size, m }: { sticker: DuaSticker; size: number; m: M }) {
  return (
    <>
      <Svg width={size} height={size} viewBox="0 0 260 260" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="sc" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F5EAD1" />
            <Stop offset="0.5" stopColor="#EFDDB6" />
            <Stop offset="1" stopColor="#E5CC9C" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="260" height="260" fill="#4A2C0F" rx="20" />
        {/* Parchment body */}
        <Path d="M 25 55 L 235 55 L 235 205 L 25 205 Z" fill="url(#sc)" />
        {/* Rolled top edge */}
        <Path d="M 15 55 Q 15 40 30 40 L 230 40 Q 245 40 245 55 L 245 65 L 25 65 Z" fill="#3E2308" />
        <Path d="M 25 65 L 235 65" stroke="#8C6428" strokeWidth="0.5" />
        {/* Rolled bottom edge */}
        <Path d="M 15 205 Q 15 220 30 220 L 230 220 Q 245 220 245 205 L 245 195 L 25 195 Z" fill="#3E2308" />
        <Path d="M 25 195 L 235 195" stroke="#8C6428" strokeWidth="0.5" />
        {/* Ornamental caps */}
        <Circle cx="20" cy="52" r="8" fill="#8C6428" />
        <Circle cx="240" cy="52" r="8" fill="#8C6428" />
        <Circle cx="20" cy="208" r="8" fill="#8C6428" />
        <Circle cx="240" cy="208" r="8" fill="#8C6428" />
      </Svg>
      <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ paddingHorizontal: m.padH * 1.5, gap: m.gap, alignItems: 'center' }}>
          <Text
            style={[styles.arabic, { color: '#4A2C0F', fontSize: m.arabic }]}
            numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}
          >{sticker.ar}</Text>
          <Text
            style={[styles.translit, { color: '#4A2C0FB3', fontSize: m.translit }]}
            numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}
          >{sticker.translit}</Text>
        </View>
      </View>
    </>
  );
}

// ── Style 9: Star Geometry — 8-fold Islamic star pattern ─────────
function StarGeometry({ sticker, size, m }: { sticker: DuaSticker; size: number; m: M }) {
  return (
    <>
      <Svg width={size} height={size} viewBox="0 0 260 260" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#111827" />
            <Stop offset="1" stopColor="#1F2937" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="260" height="260" fill="url(#sg)" rx="20" />
        {/* Interlaced 8-pointed star (girih) */}
        <G opacity="0.85">
          {/* First 8-point */}
          <Path
            d="M 130 30 L 155 105 L 230 130 L 155 155 L 130 230 L 105 155 L 30 130 L 105 105 Z"
            fill="none" stroke="#C9A227" strokeWidth="1.2"
          />
          {/* Rotated overlay */}
          <G transform="rotate(22.5 130 130)">
            <Path
              d="M 130 30 L 155 105 L 230 130 L 155 155 L 130 230 L 105 155 L 30 130 L 105 105 Z"
              fill="none" stroke="#C9A227" strokeWidth="0.8" opacity="0.5"
            />
          </G>
        </G>
        {/* Central octagon */}
        <Path d="M 130 90 L 158 102 L 170 130 L 158 158 L 130 170 L 102 158 L 90 130 L 102 102 Z"
          fill="none" stroke="#C9A227" strokeWidth="1.4" />
        {/* Outer frame */}
        <Rect x="10" y="10" width="240" height="240" fill="none" stroke="#C9A227" strokeWidth="0.8" rx="16" opacity="0.6" />
      </Svg>
      <TextOverlay sticker={sticker} color="#F5D06F" translitColor="#F5D06FCC" m={m} />
    </>
  );
}

// ── Style 10: Minimal — just clean typography on cream ───────────
function Minimal({ sticker, size, m }: { sticker: DuaSticker; size: number; m: M }) {
  return (
    <>
      <Svg width={size} height={size} viewBox="0 0 260 260" style={StyleSheet.absoluteFill}>
        <Rect x="0" y="0" width="260" height="260" fill="#F8F5EF" rx="20" />
        {/* Two hairline dividers */}
        <Path d="M 70 110 L 190 110" stroke="#0F172A" strokeWidth="0.8" opacity="0.35" />
        <Path d="M 70 150 L 190 150" stroke="#0F172A" strokeWidth="0.8" opacity="0.35" />
        {/* Small dot glyph */}
        <Circle cx="130" cy="80" r="3" fill="#0F172A" opacity="0.55" />
        <Circle cx="130" cy="180" r="3" fill="#0F172A" opacity="0.55" />
      </Svg>
      <TextOverlay sticker={sticker} color="#0F172A" translitColor="#0F172A99" m={m} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 20, overflow: 'hidden' },
  textCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  arabic: {
    fontWeight: '800', textAlign: 'center', letterSpacing: 0.3,
    // Amiri is a beautiful classical Arabic serif; already loaded app-wide.
    // Falls back to system font on iOS/Android if Amiri hasn't finished loading.
    fontFamily: 'Amiri_700Bold',
  },
  translit: {
    fontWeight: '700', letterSpacing: 0.3, fontStyle: 'italic',
  },
});
