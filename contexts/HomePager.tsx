import { createContext, useContext } from 'react';

export const PAGE = { ranks: 0, home: 1, profile: 2 } as const;

export interface HomePagerValue {
  goTo: (page: number) => void;
  setNavHidden: (hidden: boolean) => void;
  // Space the floating nav bar takes at the bottom (excluding safe area)
  navSpace: number;
}

// Set only for screens rendered inside the home pager (ranks · home · profile).
// Standalone pushes of the same screens get null and keep their normal back.
export const HomePagerContext = createContext<HomePagerValue | null>(null);

export function useHomePager() {
  return useContext(HomePagerContext);
}
