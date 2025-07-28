import GradientContainer from "./GradientContainer";
import Modal, { ModalProps } from "./Modal";

type Props = {
  message: string;
  onCancel?: () => void;
  onConfirm?: () => void;
} & ModalProps;
const ConfirmModal = ({
  message,
  onCancel,
  onConfirm,
  isOpen,
  onClose,
  className,
}: Props) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <GradientContainer className="px-3 py-4">
        <h2>{message}</h2>
        <div className="flex justify-end gap-3 py-3">
          <button
            className="rounded-xl bg-red-400 px-3 py-1 hover:bg-red-500"
            onClick={() => {
              if (onCancel) onCancel();
              if (onClose) onClose();
            }}
          >
            Anuleaza
          </button>
          <button
            className="rounded-xl bg-green-400 px-3 py-1 hover:bg-green-500"
            onClick={onConfirm}
          >
            Confirma
          </button>
        </div>
      </GradientContainer>
    </Modal>
  );
};
export default ConfirmModal;
