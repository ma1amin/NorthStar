const assetPrefixes = ["/@vite/", "/@fs/", "/src/", "/node_modules/"];
const assetExtensions = /\.(?:css|js|mjs|ts|tsx|jsx|map|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|webmanifest)$/i;

export function isViteAssetRequest(url: string) {
  const pathname = url.split("?", 1)[0] ?? url;
  return assetPrefixes.some(prefix => pathname.startsWith(prefix)) || assetExtensions.test(pathname);
}
