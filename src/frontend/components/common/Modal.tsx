import { PropsWithChildren, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type ModalProps = {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
} & PropsWithChildren;
const Modal = ({ isOpen, children, onClose, className }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform bg-transparent backdrop:bg-black/70 backdrop:backdrop-blur-sm ${className}`}
    >
      {children}
    </dialog>,
    document.body,
  );
};

export default Modal;
