import { Accessor, createEffect, onCleanup } from 'solid-js'
import { Content, createJSONEditor, JSONContent, JSONEditorPropsOptional, Mode, OnChange } from 'vanilla-jsoneditor'

const JSONEditorSolid = (props: JSONEditorPropsOptional) => {
  let refContainer;
  let refEditor;

  createEffect(() => {
    // create editor
    refEditor = createJSONEditor({
      target: refContainer,
      props: {}
    });

    onCleanup(() => {
      // destroy editor
      if (refEditor) {
        refEditor.destroy()
        refEditor = null
      }
    })
  });

  // update props
  createEffect(() => {
    if (refEditor) {
      refEditor.updateProps(props);
    }
  });

  return <div ref={refContainer}/>;
}


const CheckJsonEditor = (
  { jsonContent, onValidJsonChange }:
  { jsonContent?: Accessor<Content>, onValidJsonChange: (json: JSONContent) => void }
) => {
  const onChange = (updatedContent: Content, previousContent: Content, { contentErrors, patchResult }) => {
    if (contentErrors) {
      return;
    }

    let jsonContent: JSONContent;
    // You can access the updated JSON or text content here
    if ("json" in updatedContent) {
      jsonContent = { ...updatedContent };
    } else if ("text" in updatedContent) {
      jsonContent = { json: JSON.parse(updatedContent.text) };
    }
    onValidJsonChange(jsonContent);
  }

  return (
    <div class="h-full">
      <JSONEditorSolid
        content={jsonContent()}
        mode={Mode.text}
        onChange={onChange}
        mainMenuBar={false}
      />
    </div>
  );
}
export default CheckJsonEditor;
