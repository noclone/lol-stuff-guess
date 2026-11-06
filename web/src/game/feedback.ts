const SHAKE_KEYFRAMES: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-6px)" },
  { transform: "translateX(5px)" },
  { transform: "translateX(-3px)" },
  { transform: "translateX(2px)" },
  { transform: "translateX(0)" },
];

const ERROR_FLASH_KEYFRAMES: Keyframe[] = [
  {
    borderColor: "#e5534b",
    boxShadow: "0 0 0 3px rgb(229 83 75 / 40%)",
    backgroundColor: "rgb(229 83 75 / 14%)",
  },
  {},
];

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function shake(element: HTMLElement | null): void {
  if (!element || prefersReducedMotion()) return;
  element.animate(SHAKE_KEYFRAMES, { duration: 360, easing: "ease-out" });
}

export function flashError(element: HTMLElement | null): void {
  element?.animate(ERROR_FLASH_KEYFRAMES, { duration: 700, easing: "ease-out" });
}
