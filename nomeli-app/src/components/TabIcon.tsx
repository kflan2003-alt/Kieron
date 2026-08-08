import Svg, { Path, Circle, Rect } from 'react-native-svg';

type Name = 'home' | 'kitchen' | 'camera' | 'calendar' | 'user';

export function TabIcon({ name, color, size = 22 }: { name: Name; color: string; size?: number }) {
  const common = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'home' && (
        <>
          <Path d="M4 11.5 12 4l8 7.5" {...common} />
          <Path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" {...common} />
        </>
      )}
      {name === 'kitchen' && (
        <>
          <Path d="M4 9h16l-1.5 10.3a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 9Z" {...common} />
          <Path d="M8 9V7a4 4 0 0 1 8 0v2" {...common} />
        </>
      )}
      {name === 'camera' && (
        <>
          <Path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" {...common} />
          <Circle cx={12} cy={13} r={3.3} {...common} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect x={3.5} y={5} width={17} height={16} rx={2.5} {...common} />
          <Path d="M8 3v4M16 3v4M3.5 10h17" {...common} />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle cx={12} cy={8.2} r={3.6} {...common} />
          <Path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" {...common} />
        </>
      )}
    </Svg>
  );
}
