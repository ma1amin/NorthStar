export function isNavigatorRouteActive(location: string, href: string) {
  return location === href || (href === "/browse" && location.startsWith("/resource/"));
}
