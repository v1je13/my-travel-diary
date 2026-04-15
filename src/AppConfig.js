import vkBridge, {
  parseURLSearchParamsForGetLaunchParams,
} from "@vkontakte/vk-bridge";
import {
  useAdaptivity,
  useAppearance,
  useInsets,
} from "@vkontakte/vk-bridge-react";
import { AdaptivityProvider, ConfigProvider, AppRoot } from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";

import { transformVKBridgeAdaptivity } from "./utils/transformVKBridgeAdaptivity";
import App from "./App.jsx";

export const AppConfig = () => {
  const vkBridgeAppearance = useAppearance() || undefined;
  const vkBridgeInsets = useInsets() || undefined;
  const adaptivity = transformVKBridgeAdaptivity(useAdaptivity());
  const { vk_platform } = parseURLSearchParamsForGetLaunchParams(
    window.location.search,
  );

  return (
    <ConfigProvider
      colorScheme="light"
      platform={vk_platform === "desktop_web" ? "vkcom" : undefined}
      isWebView={vkBridge.isWebView()}
      hasCustomPanelHeaderAfter={true}
      style={{ background: "#f5f0e8" }}
    >
      <AdaptivityProvider {...adaptivity}>
        <AppRoot
          mode="full"
          safeAreaInsets={vkBridgeInsets}
          style={{ background: "#f5f0e8" }}
        >
          <App />
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
};
