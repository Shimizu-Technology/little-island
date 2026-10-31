import { Text } from "./Text";
import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Pressable,
  PressableProps,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  ViewStyle,
  TextStyle,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, IconName } from "./Icon";
import { easeOut, nativeDriver, useReducedMotion } from "./motion";
import { useSheetPresence } from "./sheetPresence";
export const C = {
  ink: "#183F39",
  muted: "#64716C",
  cream: "#FCFAF4",
  paper: "#FFFFFF",
  line: "#DBE3DA",
  teal: "#246858",
  soft: "#E5EFE5",
  coral: "#C56D50",
  gold: "#E1B251",
  blue: "#386C9A",
  /** Success surface (finished rounds, matched cards, found letters). */
  success: "#E3EFE3",
  /** Neutral status surface. */
  sand: "#F0F1E8",
  /** Error text on cream. */
  error: "#9C432D",
};
export const font = Platform.OS === "ios" ? "AvenirNext-Regular" : undefined;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
/**
 * Press feedback: scale to 0.97 on touch-down (fast ease-out) and settle back.
 * Instant visual confirmation that the app heard the tap; no delay before the action.
 */
export function usePressScale(amount = 0.97) {
  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  const to = (value: number, duration: number) =>
    Animated.timing(scale, { toValue: value, duration, easing: easeOut, useNativeDriver: nativeDriver }).start();
  return {
    scale,
    onPressIn: () => {
      if (!reduced) to(amount, 90);
    },
    onPressOut: () => to(1, 160),
  };
}
/** A Pressable whose whole surface scales on press. Use for board cells, cards and tiles. */
export function PressableScale({
  style,
  amount,
  children,
  ...rest
}: Omit<PressableProps, "style"> & { style?: ViewStyle | (ViewStyle | false | null | undefined)[]; amount?: number }) {
  const press = usePressScale(amount);
  const [focused, setFocused] = useState(false);
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        press.onPressIn();
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        rest.onPressOut?.(e);
      }}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={[
        style,
        { transform: [{ scale: press.scale }] },
        focused && { outlineColor: C.blue, outlineWidth: 3, outlineStyle: "solid" },
      ]}
    >
      {children as React.ReactNode}
    </AnimatedPressable>
  );
}
export function Label({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}
export function Copy({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.copy, style]}>{children}</Text>;
}
export function Heading({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <Text accessibilityRole="header" style={[styles.heading, style]}>
      {children}
    </Text>
  );
}
export function Button({
  children,
  onPress,
  quiet = false,
  disabled = false,
  selected = false,
  compact = false,
  label,
  icon,
  style,
  textStyle,
  numberOfLines,
}: {
  children: React.ReactNode;
  onPress: () => void;
  quiet?: boolean;
  disabled?: boolean;
  selected?: boolean;
  compact?: boolean;
  label?: string;
  icon?: IconName;
  style?: ViewStyle;
  textStyle?: TextStyle;
  numberOfLines?: number;
}) {
  const [pressed, setPressed] = useState(false);
  const textColor = selected ? C.paper : quiet ? C.ink : "#FFF";
  return (
    <PressableScale
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        quiet && styles.quiet,
        compact && { minHeight: 44, paddingHorizontal: 13, paddingVertical: 9 },
        selected && { backgroundColor: C.teal, borderColor: C.teal },
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.85 },
        icon ? { flexDirection: "row", gap: 7 } : null,
        style ?? null,
      ]}
    >
      {icon && <Icon name={icon} size={compact ? 18 : 20} color={textColor} />}
      <Text numberOfLines={numberOfLines} style={[styles.buttonText, { color: textColor }, textStyle]}>{children}</Text>
    </PressableScale>
  );
}
/** A 44pt round control with an icon and a required spoken label. */
export function IconButton({
  icon,
  label,
  onPress,
  disabled = false,
  selected = false,
  size = 44,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  size?: number;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      amount={0.92}
      hitSlop={4}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: selected ? C.teal : C.paper,
          borderWidth: 1,
          borderColor: selected ? C.teal : C.line,
        },
        disabled && { opacity: 0.45 },
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} color={selected ? C.paper : C.ink} />
    </PressableScale>
  );
}
export function Chip({
  children,
  onPress,
  selected = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Button
      onPress={onPress}
      quiet
      selected={selected}
      style={{ borderRadius: 24, paddingHorizontal: 16, minHeight: 44, flexShrink: 0 }}
    >
      {children}
    </Button>
  );
}
/** A labelled on/off setting row with the platform switch. */
export function ToggleRow({
  label,
  detail,
  value,
  disabled,
  onChange,
}: {
  label: string;
  detail?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={[styles.row, { backgroundColor: C.paper, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 14, gap: 12 }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: font, fontSize: 17, fontWeight: "700", color: C.ink }}>{label}</Text>
        {detail && <Copy style={{ fontSize: 13, lineHeight: 18 }}>{detail}</Copy>}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ true: C.teal, false: "#CBD3CA" }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#CBD3CA"
      />
    </View>
  );
}
/**
 * Compact game bar: back, the game's name, then sound and help as icons.
 * Keeps the board as the first big thing on screen.
 */
export function GameHeader({
  title,
  onBack,
  backLabel = "Games",
  sound,
  onHelp,
  children,
}: {
  title: string;
  onBack: () => void;
  backLabel?: string;
  sound?: { on: boolean; toggle: () => void };
  onHelp?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.row, { paddingVertical: 8, gap: 8 }]}>
      <Button compact quiet icon="back" label={backLabel === "Leave" ? "Leave this round" : backLabel === "Back" ? "Go back" : `Back to ${backLabel.toLowerCase()}`} onPress={onBack} style={{ paddingLeft: 9 }}>
        {backLabel}
      </Button>
      <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.heading, { flex: 1, fontSize: 21, letterSpacing: -0.3 }]}>
        {title}
      </Text>
      {children}
      {sound && (
        <IconButton
          icon={sound.on ? "sound-on" : "sound-off"}
          label={sound.on ? "Sound on. Turn sound off" : "Sound off. Turn sound on"}
          onPress={sound.toggle}
        />
      )}
      {onHelp && <IconButton icon="help" label={`How to play ${title}`} onPress={onHelp} />}
    </View>
  );
}
/**
 * Bottom sheet on phones, centred card on tablets. The primary action goes in `footer`,
 * which stays pinned above the keyboard and never scrolls out of reach.
 */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  footer,
  scrollKey,
  presence = true,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollKey?: string | number;
  /** Auto-presented sheets that wait for others (the islander creator) opt out. */
  presence?: boolean;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const wide = width >= 600;
  const [shown, setShown] = useState(visible);
  useSheetPresence(shown, presence);
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));
  const [drag] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Keeps the modal mounted while its exit animation plays.
      setShown(true);
      drag.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: reduced ? 150 : 260,
        easing: easeOut,
        useNativeDriver: nativeDriver,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: reduced ? 120 : 180,
        easing: easeOut,
        useNativeDriver: nativeDriver,
      }).start(({ finished }) => {
        if (finished) setShown(false);
      });
    }
  }, [visible, reduced, progress, drag]);
  // Swipe the grabber/title down to dismiss (phone sheets only).
  const pan = useMemo(
    () =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 0.9) onClose();
        else Animated.spring(drag, { toValue: 0, useNativeDriver: nativeDriver, bounciness: 0 }).start();
      },
      onPanResponderTerminate: () => Animated.spring(drag, { toValue: 0, useNativeDriver: nativeDriver, bounciness: 0 }).start(),
    }),
    [drag, onClose]
  );
  const enter = reduced
    ? []
    : wide
      ? [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }]
      : [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [56, 0] }) }];
  return (
    <Modal visible={shown} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(18,40,34,.38)", opacity: progress }]}>
        <Pressable accessible={false} importantForAccessibility="no" tabIndex={-1} style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        pointerEvents="box-none"
        style={{
          flex: 1,
          justifyContent: wide ? "center" : "flex-end",
          alignItems: "center",
          paddingTop: insets.top + 12,
          paddingHorizontal: wide ? 24 : 0,
          paddingBottom: wide ? insets.bottom + 12 : 0,
        }}
      >
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            wide
              ? { borderRadius: 26 }
              : { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxWidth: undefined },
            { opacity: progress, transform: [...enter, { translateY: drag }] },
          ]}
        >
          <View {...(wide ? {} : pan.panHandlers)} style={{ paddingTop: wide ? 20 : 8, paddingHorizontal: 22 }}>
            {!wide && <View style={styles.grabber} />}
            <View style={styles.row}>
              <Heading style={{ fontSize: 24, flex: 1 }}>{title}</Heading>
              <Button compact quiet onPress={onClose} label={`Close ${title}`}>
                Close
              </Button>
            </View>
          </View>
          <ScrollView key={scrollKey}
            style={{ flexShrink: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 16, paddingBottom: footer ? 8 : 16 + (wide ? 0 : insets.bottom), paddingHorizontal: 22, gap: 16 }}
          >
            {children}
          </ScrollView>
          {footer && (
            <View style={[styles.sheetFooter, { paddingBottom: wide ? 18 : Math.max(insets.bottom, 14) }]}>{footer}</View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function Status({ title, detail, success = false }: { title: string; detail?: string; success?: boolean }) {
  return (
    <View accessibilityLiveRegion="polite" style={[styles.status, success && { backgroundColor: C.success }]}>
      <Heading style={{ fontSize: 20 }}>{title}</Heading>
      {detail && <Copy style={{ marginTop: 4, fontSize: 14, lineHeight: 21 }}>{detail}</Copy>}
    </View>
  );
}
export function Controls({ children }: { children: React.ReactNode }) {
  return <View style={[styles.row, { flexWrap: "wrap", justifyContent: "center", marginTop: 18 }]}>{children}</View>;
}
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.cream },
  content: { width: "100%", maxWidth: 1080, alignSelf: "center", paddingHorizontal: 22, paddingBottom: 36 },
  heading: { fontFamily: font, fontSize: 32, fontWeight: "700", color: C.ink, letterSpacing: -0.6 },
  copy: { fontFamily: font, fontSize: 16, lineHeight: 25, color: C.muted },
  label: {
    fontFamily: font,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: C.teal,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.teal,
    backgroundColor: C.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  quiet: { backgroundColor: C.paper, borderColor: C.line },
  buttonText: { fontFamily: font, fontSize: 15, fontWeight: "700", color: "#FFF" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18,40,34,.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  sheet: { width: "100%", maxWidth: 560, flexShrink: 1, borderRadius: 26, backgroundColor: C.cream, overflow: "hidden" },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: "#CBD3CA", marginBottom: 10 },
  sheetFooter: { paddingHorizontal: 22, paddingTop: 12, gap: 10, backgroundColor: C.cream, borderTopWidth: 1, borderTopColor: C.line },
  status: { alignSelf: "stretch", padding: 12, borderRadius: 16, backgroundColor: C.sand, marginBottom: 12 },
  board: { alignSelf: "center", overflow: "hidden", borderRadius: 20, borderWidth: 2, borderColor: C.ink },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 15,
    fontFamily: font,
    fontSize: 18,
    color: C.ink,
    backgroundColor: C.paper,
    minHeight: 52,
  },
});
