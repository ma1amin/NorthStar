export function canRegisterServiceWorker(isProduction: boolean, navigatorValue: Pick<Navigator, "serviceWorker"> | undefined) {
  return isProduction && Boolean(navigatorValue?.serviceWorker);
}

export async function registerNorthStarServiceWorker(isProduction: boolean) {
  if (!canRegisterServiceWorker(isProduction, typeof navigator === "undefined" ? undefined : navigator)) return undefined;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}
