import { Accessor, Show } from "solid-js";

/**
 * Lets the user show questions that no remaining benefit needs answers for.
 * Renders nothing while every question is still needed.
 */
export default function HiddenQuestionsNotice({
  unneededQuestionCount,
  showAllQuestions,
  onToggleShowAllQuestions,
}: {
  unneededQuestionCount: Accessor<number>;
  showAllQuestions: Accessor<boolean>;
  onToggleShowAllQuestions: () => void;
}) {
  const count = () => unneededQuestionCount();

  return (
    <Show when={count() > 0}>
      <div
        id="hidden-questions-notice"
        class="mt-4 pt-3 border-t border-gray-200"
      >
        <Show when={!showAllQuestions()}>
          <p class="text-sm text-gray-600">
            {count() === 1
              ? "1 question is hidden because no remaining benefit needs it."
              : `${count()} questions are hidden because no remaining benefit needs them.`}
          </p>
        </Show>
        <button
          type="button"
          class="text-left text-blue-700 underline text-sm w-fit"
          onClick={onToggleShowAllQuestions}
        >
          {showAllQuestions()
            ? "Hide questions that aren't needed"
            : "Show all questions"}
        </button>
      </div>
    </Show>
  );
}
