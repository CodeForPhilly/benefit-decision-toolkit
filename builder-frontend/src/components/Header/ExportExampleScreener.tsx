import { exportExampleScreener } from "@/api/account";
import { Button } from "@/components/shared/Button";
import { createSignal, JSX, Match, Setter, Switch } from "solid-js";

interface Props {
  setShowExportMenu: Setter<boolean>;
}
export const ExportExampleScreener = (props: Props) => {
  const [exportingMessage, setExportingMessage] = createSignal("");
  const [isExportingExample, setIsExportingExample] = createSignal(false);

  const handleExportExampleScreener: JSX.EventHandler<
    HTMLButtonElement,
    MouseEvent
  > = async (e) => {
    setIsExportingExample(true);
    setExportingMessage("");
    const result = await exportExampleScreener();
    if (!result.success) {
      setExportingMessage("An error occurred exporting.");
    } else {
      setExportingMessage("Successfully exported screeners.");
    }
    setIsExportingExample(false);
  };

  return (
    <>
      <div>Ready to save changes to the example screener?</div>
      <Button
        variant="secondary"
        onClick={() => props.setShowExportMenu(false)}
      >
        Cancel
      </Button>
      <Switch>
        <Match when={!isExportingExample()}>
          <Button onClick={handleExportExampleScreener}>Export</Button>
        </Match>
        <Match when={isExportingExample()}>Waiting for export</Match>
      </Switch>
      <div>{exportingMessage()}</div>
    </>
  );
};
