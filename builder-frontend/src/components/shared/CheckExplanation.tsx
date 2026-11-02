import { Show } from "solid-js";
import CircleHelp from "lucide-solid/icons/circle-help";

import Tooltip from "@/components/shared/Tooltip";

/** Plain text, shared by published and preview results. */
export default function CheckExplanation(props: {
  explanation?: string | null;
  name: string;
}) {
  return (
    <Show when={props.explanation?.trim()}>
      {(explanation) => (
        <div class="inline-flex ml-1 align-middle">
          <Tooltip
            ariaLabel={`About ${props.name}`}
            label={
              <CircleHelp
                size={18}
                aria-hidden="true"
                class="text-gray-600 hover:text-gray-900"
              />
            }
          >
            <span class="whitespace-pre-wrap">{explanation()}</span>
          </Tooltip>
        </div>
      )}
    </Show>
  );
}
