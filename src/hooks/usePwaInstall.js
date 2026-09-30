import { useState, useEffect } from "react";
import {
  subscribePwaState,
  isAppInstalled,
  isIosDevice,
  promptPwaInstall,
  markAsInstalled,
} from "../utils/pwaInstall";

export function usePwaInstall() {
  const [pwaState, setPwaState] = useState(() => ({
    isInstalled: isAppInstalled(),
    isPromptAvailable: false,
    isIos: isIosDevice(),
  }));

  useEffect(() => {
    const unsubscribe = subscribePwaState((state) => {
      setPwaState(state);
    });
    return unsubscribe;
  }, []);

  const installApp = async () => {
    return await promptPwaInstall();
  };

  return {
    ...pwaState,
    installApp,
    markAsInstalled,
  };
}

export default usePwaInstall;
