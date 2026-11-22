import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TextStyle,
  Platform,
} from 'react-native';

const { width: windowWidth } = Dimensions.get('window');

export interface RulerPickerProps {
  /**
   * Minimum value of the ruler
   */
  min: number;
  /**
   * Maximum value of the ruler
   */
  max: number;
  /**
   * Step increment between ticks (default: 1)
   */
  step?: number;
  /**
   * Initial value (default: min)
   */
  initialValue?: number;
  /**
   * Number of fractional digits (default: 0)
   */
  fractionDigits?: number;
  /**
   * Unit label (e.g. 'kg')
   */
  unit?: string;
  /**
   * Width of the picker container
   */
  width?: number;
  /**
   * Height of the ruler viewport
   */
  height?: number;
  /**
   * Height of the center indicator line
   */
  indicatorHeight?: number;
  /**
   * Color of the center indicator line
   */
  indicatorColor?: string;
  /**
   * Color of the short ticks
   */
  shortStepColor?: string;
  /**
   * Color of the long ticks (every 10 steps)
   */
  longStepColor?: string;
  /**
   * Height of short tick marks
   */
  shortStepHeight?: number;
  /**
   * Height of long tick marks
   */
  longStepHeight?: number;
  /**
   * Thickness of tick marks
   */
  stepWidth?: number;
  /**
   * Space between tick marks
   */
  gapBetweenSteps?: number;
  /**
   * Custom style for the large numerical value
   */
  valueTextStyle?: TextStyle;
  /**
   * Custom style for the unit text
   */
  unitTextStyle?: TextStyle;
  /**
   * Callback fired continuously during scrolling
   */
  onValueChange?: (value: string) => void;
  /**
   * Callback fired when scrolling settles
   */
  onValueChangeEnd?: (value: string) => void;
}

export const RulerPicker: React.FC<RulerPickerProps> = ({
  min,
  max,
  step = 1,
  initialValue = min,
  fractionDigits = 0,
  unit = 'kg',
  width = windowWidth,
  height = 110,
  indicatorHeight = 72,
  indicatorColor = '#22C55E',
  shortStepColor = '#CBD5E1',
  longStepColor = '#94A3B8',
  shortStepHeight = 18,
  longStepHeight = 36,
  stepWidth = 2,
  gapBetweenSteps = 14,
  valueTextStyle,
  unitTextStyle,
  onValueChange,
  onValueChangeEnd,
}) => {
  const itemWidth = stepWidth + gapBetweenSteps;
  const itemCount = Math.round((max - min) / step);
  const arrData = useRef(Array.from({ length: itemCount + 1 }, (_, i) => i)).current;

  const clampedInitial = Math.max(min, Math.min(max, initialValue));
  const initialIndex = Math.max(0, Math.min(itemCount, Math.round((clampedInitial - min) / step)));

  const [displayValue, setDisplayValue] = useState<string>(
    clampedInitial.toFixed(fractionDigits)
  );

  const flatListRef = useRef<FlatList>(null);
  const currentValueRef = useRef<string>(clampedInitial.toFixed(fractionDigits));
  const isInitialScrollDone = useRef(false);

  // Synchronize when initialValue changes from outside
  useEffect(() => {
    const val = Math.max(min, Math.min(max, initialValue));
    const formatted = val.toFixed(fractionDigits);
    currentValueRef.current = formatted;
    setDisplayValue(formatted);

    const idx = Math.max(0, Math.min(itemCount, Math.round((val - min) / step)));
    if (isInitialScrollDone.current) {
      flatListRef.current?.scrollToOffset({
        offset: idx * itemWidth,
        animated: false,
      });
    }
  }, [initialValue, min, max, step, fractionDigits, itemCount, itemWidth]);

  // Edge spacers to allow min and max items to reach the center indicator
  // Center of item 0 will be at width * 0.5
  const spacerWidth = width * 0.5 - itemWidth * 0.5;

  const renderSeparator = useCallback(
    () => <View style={{ width: spacerWidth }} />,
    [spacerWidth]
  );

  const renderItem = useCallback(
    ({ index }: { index: number }) => {
      // Every 5th tick is long (e.g. 60, 65, 70, 75, 80)
      const isLong = index % 5 === 0;
      const tickHeight = isLong ? longStepHeight : shortStepHeight;
      const tickColor = isLong ? longStepColor : shortStepColor;

      return (
        <View style={[styles.tickContainer, { width: itemWidth, height: 44 }]}>
          <View
            style={[
              styles.tickMark,
              {
                width: stepWidth,
                height: tickHeight,
                backgroundColor: tickColor,
                borderRadius: stepWidth * 0.5,
              },
            ]}
          />
        </View>
      );
    },
    [itemWidth, longStepColor, longStepHeight, shortStepColor, shortStepHeight, stepWidth]
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / itemWidth);
    const clampedIndex = Math.max(0, Math.min(itemCount, index));
    const value = min + clampedIndex * step;
    const formatted = value.toFixed(fractionDigits);

    if (formatted !== currentValueRef.current) {
      currentValueRef.current = formatted;
      setDisplayValue(formatted);
      onValueChange?.(formatted);
    }
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / itemWidth);
    const clampedIndex = Math.max(0, Math.min(itemCount, index));
    const value = min + clampedIndex * step;
    const formatted = value.toFixed(fractionDigits);

    currentValueRef.current = formatted;
    setDisplayValue(formatted);
    onValueChangeEnd?.(formatted);
  };

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index,
      index,
    }),
    [itemWidth]
  );

  const indicatorWidth = 2.5;

  return (
    <View style={[styles.rootContainer, { width }]}>
      {/* 1. Numerical Value & Unit Display (Centered Above the Ruler) */}
      <View style={styles.valueRow}>
        <Text style={[styles.valueText, valueTextStyle]}>{displayValue}</Text>
        {unit ? (
          <Text style={[styles.unitText, unitTextStyle]}>{unit}</Text>
        ) : null}
      </View>

      {/* 2. Interactive Ruler Viewport */}
      <View style={[styles.rulerViewport, { width, height: 110 }]}>
        {/* Horizontal Ticks List */}
        <View style={styles.ticksWrapper}>
          <FlatList
            ref={flatListRef}
            data={arrData}
            keyExtractor={(item) => item.toString()}
            renderItem={renderItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            ListHeaderComponent={renderSeparator}
            ListFooterComponent={renderSeparator}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
            snapToInterval={itemWidth}
            snapToAlignment="start"
            decelerationRate="fast"
            initialScrollIndex={initialIndex}
            getItemLayout={getItemLayout}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                  offset: info.index * itemWidth,
                  animated: false,
                });
              }, 50);
            }}
            onLayout={() => {
              isInitialScrollDone.current = true;
            }}
          />
        </View>

        {/* Center Vertical Green Indicator Bar (Directly Overlapping and Centered on the Ticks) */}
        <View
          pointerEvents="none"
          style={[
            styles.indicatorLine,
            {
              left: width * 0.5 - indicatorWidth * 0.5,
              top: 8,
              height: indicatorHeight,
              width: indicatorWidth,
              backgroundColor: indicatorColor,
              borderRadius: indicatorWidth * 0.5,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 44,
  },
  valueText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 8,
  },
  rulerViewport: {
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  ticksWrapper: {
    width: '100%',
    height: 44,
    marginTop: 8,
  },
  tickContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  tickMark: {
    borderRadius: 1,
  },
  indicatorLine: {
    position: 'absolute',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
