import { createContext, PropsWithChildren, useCallback, useState } from "react";
import {
  DEFAULT_SCHEDULER_CONFIG,
  SchedulerConfig,
} from "../../util/timetable";

type AdvancedSettingsContextType = {
  advancedSettings: SchedulerConfig;
  updateSettings: (newSettings: Partial<SchedulerConfig>) => void;
};
export const AdvancedSettingsContext =
  createContext<AdvancedSettingsContextType>({} as AdvancedSettingsContextType);

const AdvancedSettingsProvider = ({ children }: PropsWithChildren) => {
  const [advancedSettings, setAdvancedSettings] = useState<SchedulerConfig>(
    DEFAULT_SCHEDULER_CONFIG,
  );

  const updateSettings = useCallback(
    (newSettings: Partial<SchedulerConfig>) => {
      setAdvancedSettings(prev => {
        const out = { ...prev };
        for (const [key, val] of Object.entries(newSettings))
          out[key as keyof SchedulerConfig] = val;
        return out;
      });
    },
    [setAdvancedSettings],
  );

  return (
    <AdvancedSettingsContext.Provider
      value={{ advancedSettings, updateSettings }}
    >
      {children}
    </AdvancedSettingsContext.Provider>
  );
};
export default AdvancedSettingsProvider;
