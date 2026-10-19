import { AppColors } from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type Props = {
    progress: number; // 0 → 1
    size?: number;
    strokeWidth?: number;
    segments?: number;
    gapAngle?: number;
    value?: number;
    label?: string;
    valueColor?: string;
    labelColor?: string;
    activeStrokeColor?: string;
    inactiveStrokeColor?: string;
};

export function SegmentedHalfCircleProgress30({
    progress,
    size = 60,
    strokeWidth = 28,
    segments = 15,
    gapAngle = 25,
    value,
    label,
    valueColor = '#0F172A',
    labelColor = '#64748B',
    activeStrokeColor = AppColors.primary,
    inactiveStrokeColor = '#E2E8F0',
}: Props) {
    const clamped = Math.max(0, Math.min(1, progress));

    const radius = (size - strokeWidth) / 2;
    const cx = size / 2;
    const cy = size / 2;

    const totalAngle = 180;
    const totalGap = gapAngle * (segments - 1);

    // ↓ slightly reduce angle to avoid edge overlap
    const segmentAngle = (totalAngle - totalGap) / segments - 0.5;

    const activeSegments = Math.round(clamped * segments);

    const polarToCartesian = (angle: number) => {
        const rad = (Math.PI / 180) * angle;
        return {
            x: cx + radius * Math.cos(rad),
            y: cy - radius * Math.sin(rad),
        };
    };

    const createArc = (startAngle: number, endAngle: number) => {
        const start = polarToCartesian(startAngle);
        const end = polarToCartesian(endAngle);

        return `
      M ${start.x} ${start.y}
      A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}
    `;
    };

    let currentAngle = 180;

    return (
        <View
            style={{
                width: size,
                height: size / 2,
                alignItems: "center",
                justifyContent: "flex-end",
            }}
        >
            <Svg width={size} height={size / 2}>
                {Array.from({ length: segments }).map((_, i) => {
                    const start = currentAngle;
                    const end = currentAngle - segmentAngle;
                    currentAngle = end - gapAngle;

                    const isActive = i < activeSegments;

                    return (
                        <Path
                            key={i}
                            d={createArc(start, end)}
                            stroke={isActive ? activeStrokeColor : inactiveStrokeColor}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeLinecap="butt" // ✅ CRITICAL
                        />
                    );
                })}
            </Svg>

            <View style={styles.textOverlay}>
                <Text style={[styles.mainText, { color: valueColor }]}>{value}</Text>
                <Text style={[styles.subText, { color: labelColor }]}>{label}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    textOverlay: {
        position: "absolute",
        bottom: -10,
        alignItems: "center",
        justifyContent: "center",
    },
    mainText: {
        fontSize: 32,
        fontWeight: "700",
        color: "#0F172A",
    },
    subText: {
        fontSize: 14,
        color: "#64748B",
        fontWeight: "500",
    },
});