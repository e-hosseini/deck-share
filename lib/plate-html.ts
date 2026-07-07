import { createSlateEditor, deserializeHtml, type Value } from "platejs";
import { createStaticEditor, serializeHtml } from "platejs/static";

import { BaseEditorKit } from "@/components/editor/editor-base-kit";
import { EditorStatic } from "@/components/ui/editor-static";

const emptyValue: Value = [{ type: "p", children: [{ text: "" }] }];

export function htmlToPlateValue(html: string): Value {
  if (!html.trim()) return emptyValue;

  const editor = createSlateEditor({ plugins: BaseEditorKit });
  return deserializeHtml(editor, { element: html }) as Value;
}

export async function plateValueToHtml(value: Value): Promise<string> {
  const editor = createStaticEditor({
    plugins: BaseEditorKit,
    value,
  });

  return serializeHtml(editor, { editorComponent: EditorStatic });
}
