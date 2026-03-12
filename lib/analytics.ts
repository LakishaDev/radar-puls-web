export type AnalyticsEvent =
  | "cta_download_click"
  | "locale_switch"
  | "hero_view"
  | "hero_variant_assigned";

declare global {
  interface Window {
    plausible?: (eventName: string, options?: {props?: Record<string, string>}) => void;
    posthog?: {
      capture: (eventName: string, properties?: Record<string, string>) => void;
    };
  }
}

export function trackEvent(
  eventName: AnalyticsEvent,
  properties: Record<string, string> = {}
) {
  if (typeof window === "undefined") {
    return;
  }

  window.plausible?.(eventName, {props: properties});
  window.posthog?.capture(eventName, properties);
}
