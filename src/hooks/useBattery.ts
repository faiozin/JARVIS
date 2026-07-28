import { useEffect, useState } from 'react';

interface BatteryManagerLike {
  level: number;
  charging: boolean;
  addEventListener(type: 'levelchange' | 'chargingchange', listener: () => void): void;
  removeEventListener(type: 'levelchange' | 'chargingchange', listener: () => void): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManagerLike>;
}

export interface BatteryInfo {
  level: number;
  charging: boolean;
  supported: boolean;
}

export function useBattery(): BatteryInfo {
  const [info, setInfo] = useState<BatteryInfo>({
    level: 1,
    charging: false,
    supported: false,
  });

  useEffect(() => {
    const nav = navigator as NavigatorWithBattery;
    if (!nav.getBattery) return;
    let battery: BatteryManagerLike | null = null;
    let mounted = true;

    const update = () => {
      if (!battery || !mounted) return;
      setInfo({
        level: battery.level,
        charging: battery.charging,
        supported: true,
      });
    };

    nav.getBattery().then((b) => {
      if (!mounted) return;
      battery = b;
      update();
      b.addEventListener('levelchange', update);
      b.addEventListener('chargingchange', update);
    });

    return () => {
      mounted = false;
      if (battery) {
        battery.removeEventListener('levelchange', update);
        battery.removeEventListener('chargingchange', update);
      }
    };
  }, []);

  return info;
}
