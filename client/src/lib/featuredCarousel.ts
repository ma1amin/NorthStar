export function nextFeaturedIndex(currentIndex: number, itemCount: number) {
  return itemCount > 0 ? (currentIndex + 1) % itemCount : 0;
}

export function previousFeaturedIndex(currentIndex: number, itemCount: number) {
  return itemCount > 0 ? (currentIndex - 1 + itemCount) % itemCount : 0;
}
