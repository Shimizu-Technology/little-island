import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";
export type NearbyEvent =
  | { type: "status"; status: string; message: string }
  | { type: "found"; peer: string; room: string; name: string }
  | { type: "lost" | "connected" | "disconnected"; peer: string }
  | { type: "invitation"; peer: string; name: string }
  | { type: "data"; peer: string; payload: string };
export type NearbyModule = {
  identity(): Promise<{ room: string; secret: string; pin: string }>;
  host(name: string, room: string, pin: string): Promise<void>;
  browse(name: string): Promise<void>;
  join(peer: string, room: string, pin: string): Promise<void>;
  approve(peer: string, approved: boolean): Promise<void>;
  send(peer: string, payload: string): Promise<void>;
  close(): Promise<void>;
  addListener(event: "onNearby", callback: (event: NearbyEvent) => void): { remove(): void };
};
export const nearby: NearbyModule | null =
  Platform.OS === "ios" ? requireOptionalNativeModule<NearbyModule>("IslandNearby") : null;
export const nearbyUnavailable =
  Platform.OS === "web"
    ? "Nearby family rooms need the installed iPhone or iPad app. Solo practice works here offline."
    : Platform.OS === "android"
      ? "Nearby family rooms are currently supported on iPhone and iPad. Solo practice works on this device."
      : "This build does not include the nearby module. Install the updated native build; Expo Go cannot host family rooms.";
