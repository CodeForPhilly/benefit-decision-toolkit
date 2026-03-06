/**
 * HamburgerMenu component
 *
 * Usage:
 * - Wrap all sub-components in <HamburgerMenu>
 * - Opens a panel on the left side (can be parameterized in the future)
 *
 * <HamburgerMenu>
 *   <HamburgerMenu.Button>
 *     <MyToggleButton />
 *   </HamburgerMenu.Button>
 *   <HamburgerMenu.Panel>
 *     <MyPanel />
 *   </HamburgerMenu.Panel>
 * </HamburgerMenu>
 */

import { HamburgerMenuWrapper } from "@/components/shared/HamburgerMenu/HamburgerMenuWrapper";
import { HamburgerMenuButton } from "@/components/shared/HamburgerMenu/HamburgerMenuButton";
import { HamburgerMenuPanel } from "@/components/shared/HamburgerMenu/HamburgerMenuPanel";

import "./HamburgerMenu.css";

export const HamburgerMenu = Object.assign(HamburgerMenuWrapper, {
  Button: HamburgerMenuButton,
  Panel: HamburgerMenuPanel,
});
