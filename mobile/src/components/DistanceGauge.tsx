import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors, gradients } from '@/theme';

type Props = {
  /** Current reading in cm. */
  value: number;
  /** Full-scale reading in cm. */
  max: number;
  size?: number;
  strokeWidth?: number;
};

/**
 * Half-circle gauge. Renders a track arc plus a gradient progress arc whose
 * sweep is `value / max`, matching the speedometer-style dial in the mockup.
 */
export function DistanceGauge({ value, max, size = 240, strokeWidth = 16 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const height = size / 2 + strokeWidth / 2;
  const arcLength = Math.PI * radius;

  const fraction = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const arc = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;

  return (
    <View style={styles.container}>
      <Svg width={size} height={height}>
        <Defs>
          <LinearGradient id="gaugeStroke" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={gradients.accent[0]} />
            <Stop offset="1" stopColor={gradients.accent[1]} />
          </LinearGradient>
        </Defs>

        <Path
          d={arc}
          stroke={colors.surfaceAlt}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={arc}
          stroke="url(#gaugeStroke)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${arcLength * fraction} ${arcLength}`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
