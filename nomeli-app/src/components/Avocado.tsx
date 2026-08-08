import { View, Image, ImageStyle } from 'react-native';

// Nomeli's mascot — the actual provided artwork (assets/mascot.png), not a
// redrawn version. Source image is 173x127 (character only, wordmark
// cropped out — see assets/mascot-full.png for the full lockup used on
// the onboarding welcome screen).
const ASPECT_RATIO = 127 / 173;
const mascotImage = require('../../assets/mascot.png');

type Props = {
  /** Width in px; height follows the source image's aspect ratio. */
  size?: number;
  style?: ImageStyle;
};

export function Avocado({ size = 64, style }: Props) {
  return (
    <Image
      source={mascotImage}
      style={[{ width: size, height: size * ASPECT_RATIO }, style]}
      resizeMode="contain"
    />
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
      <Avocado size={size} />
    </View>
  );
}
