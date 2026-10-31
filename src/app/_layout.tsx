import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TextLayoutProvider } from "../components/Text";
import { useReducedMotion } from "../components/motion";
import { StoreProvider } from "../state/Store";
export default function Layout() {
  // The platform push shows where a screen came from; Reduce Motion swaps it for a short fade.
  const reduced = useReducedMotion();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider>
      <TextLayoutProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: reduced ? "fade" : "default",
              contentStyle: { backgroundColor: "#FCFAF4" },
            }}
          />
        </StoreProvider>
      </TextLayoutProvider>
    </SafeAreaProvider></GestureHandlerRootView>
  );
}
