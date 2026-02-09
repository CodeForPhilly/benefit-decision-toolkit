import { Accessor, Component, createEffect, ParentProps, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { CircleX } from "lucide-solid";

import styles from "./Modal.module.css";

interface Props {
  show: Accessor<boolean>;
  onClose: () => void;
}
export const Modal: Component<ParentProps<Props>> = (props) => {
  return (
    <Show when={props.show()}>
      <Portal>
        <div class={styles["modal-wrapper"]} onClick={() => props.onClose()}>
          <div
            class={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div class={styles["modal-header"]}>
              <div
                class={styles["modal-close"]}
                onClick={() => props.onClose()}
              >
                <button type="button">
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
