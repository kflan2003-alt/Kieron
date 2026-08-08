// Never actually shown: the tab bar intercepts presses on this tab and
// pushes the /scan modal stack instead (see (tabs)/_layout.tsx). This file
// only needs to exist so expo-router registers the route.
export default function ScanTabPlaceholder() {
  return null;
}
