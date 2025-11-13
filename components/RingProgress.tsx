import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, CircleProps } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RingProgressProps = {
  radius?: number;
  strokeWidth?: number;
  progress: number;           // 0..1
  color?: string;             // progress color
  backgroundColor?: string;   // track color
  center?: React.ReactNode;   // render anything in the middle (emoji)
};

export default function RingProgress({
  radius = 80,
  strokeWidth = 20,
  progress,
  color = '#00E0FF',
  backgroundColor = 'rgba(255,255,255,0.15)',
  center,
}: RingProgressProps) {
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(progress, { duration: 1200 });
  }, [progress]);

  const animatedProps = useAnimatedProps<CircleProps>(() => ({
    strokeDasharray: [circumference * fill.value, circumference],
  }));

  const baseCircle: CircleProps = {
    cx: radius,
    cy: radius,
    r: innerRadius,
    strokeWidth,
    strokeLinecap: 'round',
    fill: 'none',
    rotation: -90 as any, // start from top
    originX: radius,
    originY: radius,
  };

  return (
    <View style={{ width: radius * 2, height: radius * 2, alignSelf: 'center' }}>
      <Svg width={radius * 2} height={radius * 2}>
        <Circle {...baseCircle} stroke={backgroundColor} />
        <AnimatedCircle {...baseCircle} animatedProps={animatedProps} stroke={color} />
      </Svg>

      {/* center content (emoji) */}
      {center ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: radius * 2,
            height: radius * 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {center}
        </View>
      ) : null}
    </View>
  );
}
