"use client";

import useSound from "use-sound";
import type {MapEventType} from "@/lib/api";

export type AlertSoundType = MapEventType | "proximity" | "default";

const SOUND_MAP: Record<AlertSoundType, string> = {
  police: "/sounds/alert-police.mp3",
  radar: "/sounds/alert-radar.mp3",
  checkpoint: "/sounds/alert-checkpoint.mp3",
  accident: "/sounds/alert-accident.mp3",
  traffic_jam: "/sounds/alert-traffic.mp3",
  unknown: "/sounds/alert-default.mp3",
  proximity: "/sounds/alert-proximity.mp3",
  default: "/sounds/alert-default.mp3",
};

export function useAlertSound(enabled: boolean) {
  const options = {volume: 0.75, interrupt: true, soundEnabled: enabled};

  const [playPolice] = useSound(SOUND_MAP.police, options);
  const [playRadar] = useSound(SOUND_MAP.radar, options);
  const [playCheckpoint] = useSound(SOUND_MAP.checkpoint, options);
  const [playAccident] = useSound(SOUND_MAP.accident, options);
  const [playTraffic] = useSound(SOUND_MAP.traffic_jam, options);
  const [playUnknown] = useSound(SOUND_MAP.unknown, options);
  const [playProximity] = useSound(SOUND_MAP.proximity, options);
  const [playDefault] = useSound(SOUND_MAP.default, options);

  const playMap: Record<AlertSoundType, () => void> = {
    police: () => playPolice(),
    radar: () => playRadar(),
    checkpoint: () => playCheckpoint(),
    accident: () => playAccident(),
    traffic_jam: () => playTraffic(),
    unknown: () => playUnknown(),
    proximity: () => playProximity(),
    default: () => playDefault(),
  };

  return {
    playByType: (type: AlertSoundType) => {
      playMap[type]?.();
    },
  };
}
