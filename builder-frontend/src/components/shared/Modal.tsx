import { Accessor, Component, createEffect, ParentProps, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { CircleX } from "lucide-solid";

import styles from "./Modal.module.css";

interface Props {
  show: boolean;
  onClose: () => void;
  // False while the content is busy, e.g. saving, so it cannot be dismissed.
  dismissible?: boolean;
}
export const Modal: Component<ParentProps<Props>> = (props) => {
  const close = () => {
    if (props.dismissible !== false) props.onClose();
  };
  return (
    <Show when={props.show}>
      <Portal>
        <div
          class={styles["modal-wrapper"]}
          onClick={close}
          data-modal-root
        >
          <div
            class={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div class={styles["modal-header"]}>
              <div class={styles["modal-close"]} onClick={close}>
                <button type="button" disabled={props.dismissible === false}>
                  <CircleX />
                </button>
              </div>
            </div>
            <div class={styles["modal-body"]}>{props.children}</div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
