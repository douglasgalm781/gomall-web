"use client";
import { useEffect, useState } from "react";

// Touch UX for product cards. On hover-capable (desktop) devices this is a
// no-op — CSS `:hover` reveals the Buy/Add actions and a click navigates.
// On touch devices there is no hover, so the first tap on a card reveals its
// actions (instead of navigating); a second tap outside the buttons navigates
// to the product, and tapping a button runs that button's action.
export function useTapReveal() {
  const [revealed, setRevealed] = useState(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setIsTouch(window.matchMedia("(hover: none)").matches);
    }
  }, []);

  // onClick handler for the card's <Link>. Pass the card id and whether it has
  // any revealable actions (e.g. in stock). First touch reveals; later taps nav.
  const onCardClick = (id, hasActions = true) => (e) => {
    if (isTouch && hasActions && revealed !== id) {
      e.preventDefault();
      setRevealed(id);
    }
  };

  // Visibility classes for the actions container. Mobile: gated by `revealed`.
  // Desktop (lg+): gated by group-hover. Combine with your positioning classes.
  const actionCls = (id) =>
    `transition-all duration-300 ${
      revealed === id
        ? "opacity-100 pointer-events-auto translate-y-0"
        : "opacity-0 pointer-events-none translate-y-2"
    } lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto lg:group-hover:translate-y-0`;

  return { onCardClick, actionCls, revealed };
}
