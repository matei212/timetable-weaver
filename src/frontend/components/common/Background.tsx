import { PropsWithChildren } from "react";
import { createPortal } from "react-dom";

type Props = {
  className?: string;
} & PropsWithChildren;
const Background = ({ className, children }: Props) => {
  return createPortal(
    <div
      className={`ignore-invert fixed inset-0 z-10 bg-black/70 ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
};
export default Background;
