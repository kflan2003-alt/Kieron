import { View } from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { color } from '../theme/tokens';

type Pose = 'wave' | 'happy' | 'thinking' | 'peek';

type Props = {
  size?: number;
  pose?: Pose;
  /** Show little feet — only looks right on the larger, full-body poses. */
  feet?: boolean;
};

/**
 * Nomeli's mascot. A small, warm, expressive avocado — meant to peek in,
 * wave, and react, per the brand's "always smiling, interactive" guidance.
 * Kept to simple shapes (no photographic/hand-authored asset) so it stays
 * crisp at any size and costs nothing to bundle.
 */
export function Avocado({ size = 64, pose = 'happy', feet = false }: Props) {
  const eyeY = 30;
  const mouth =
    pose === 'thinking'
      ? 'M26.5 37.5h9'
      : pose === 'peek'
        ? 'M26 37c1.6 1.3 8.4 1.3 10 0'
        : 'M25.5 36.5c2 2.3 9.5 2.3 11.5 0';

  const rightArmUp = pose === 'wave';

  return (
    <Svg width={size} height={size} viewBox="0 0 64 68" fill="none">
      {feet && (
        <>
          <Ellipse cx={24} cy={63} rx={6} ry={3.4} fill={color.avocadoDark} opacity={0.9} />
          <Ellipse cx={40} cy={63} rx={6} ry={3.4} fill={color.avocadoDark} opacity={0.9} />
        </>
      )}

      {/* left arm */}
      <Path
        d="M14 34c-4 2-6 6-5.5 10.5"
        stroke={color.sage}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={8.5} cy={45} r={4.6} fill={color.sage} />

      {/* right arm — raised for the wave pose, resting otherwise */}
      {rightArmUp ? (
        <>
          <Path
            d="M50 32c5-3 8-9 7-15.5"
            stroke={color.sage}
            strokeWidth={7}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={57.5} cy={15} r={4.8} fill={color.sage} />
        </>
      ) : (
        <>
          <Path
            d="M50 34c4 2 6 6 5.5 10.5"
            stroke={color.sage}
            strokeWidth={7}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={56} cy={45} r={4.6} fill={color.sage} />
        </>
      )}

      {/* body */}
      <Path
        d="M32 6c12.7 0 20.5 10.3 20.5 25S44.7 60 32 60 11.5 45.7 11.5 31 19.3 6 32 6Z"
        fill={color.sage}
      />
      {/* soft highlight for roundness */}
      <Ellipse cx={24.5} cy={22} rx={7} ry={9} fill={color.white} opacity={0.18} />

      {/* face */}
      <Circle cx={26} cy={eyeY} r={2.3} fill={color.ink} />
      <Circle cx={38} cy={eyeY} r={2.3} fill={color.ink} />
      <Path d={mouth} stroke={color.ink} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <Ellipse cx={21} cy={35} rx={3.4} ry={2} fill={color.urgentTomorrow} opacity={0.25} />
      <Ellipse cx={43} cy={35} rx={3.4} ry={2} fill={color.urgentTomorrow} opacity={0.25} />

      {/* stem */}
      <Path
        d="M29 6c0-3.4 2.3-5.6 5.8-5.8"
        stroke={color.avocadoDark}
        strokeWidth={2.8}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Nomeli "peeking" in from the edge of a card or screen — cropped by the
 * parent's overflow so only part of her shows, per the brand guideline
 * that she should feel present throughout rather than confined to a
 * single mascot slot.
 */
export function PeekingAvocado({
  size = 64,
  side = 'right',
  style,
}: {
  size?: number;
  side?: 'left' | 'right';
  style?: object;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          bottom: -size * 0.32,
          [side]: -size * 0.32,
        },
        style,
      ]}
    >
      <Avocado size={size} pose="peek" />
    </View>
  );
}
