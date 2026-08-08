import Svg, { Path, Ellipse, Circle } from 'react-native-svg';
import { color } from '../theme/tokens';

type Mood = 'calm' | 'thinking' | 'happy';

type Props = {
  size?: number;
  mood?: Mood;
};

// Nomeli's mascot: a small, calm stylised avocado. Soft rounded body,
// minimal face, no children's-app exaggeration — meant to read as a
// modern assistant, not a cartoon.
export function Avocado({ size = 56, mood = 'calm' }: Props) {
  const eyeY = 31.5;
  const mouth =
    mood === 'happy'
      ? 'M27 39c1.7 1.9 8.3 1.9 10 0'
      : mood === 'thinking'
        ? 'M27.5 39.5h9'
        : 'M27.5 39c1.7 1.4 8.3 1.4 10 0';

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 4c13 0 21 11 21 26S45.5 60 32 60 11 44 11 30 19 4 32 4Z"
        fill={color.sage}
      />
      <Ellipse cx={32} cy={35} rx={14} ry={17} fill={color.sageSoft} />
      <Circle cx={26.5} cy={eyeY} r={2.1} fill={color.ink} />
      <Circle cx={37.5} cy={eyeY} r={2.1} fill={color.ink} />
      <Path
        d={mouth}
        stroke={color.ink}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M29.5 5c0-3.2 2.2-5.3 5.5-5.5"
        stroke={color.avocadoDark}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
