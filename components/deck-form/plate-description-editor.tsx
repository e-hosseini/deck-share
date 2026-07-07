"use client";

import { useRef } from "react";
import { Plate, usePlateEditor } from "platejs/react";

import { EditorKit } from "@/components/editor/editor-kit";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { htmlToPlateValue, plateValueToHtml } from "@/lib/plate-html";
import { cn } from "@/lib/utils";

export function PlateDescriptionEditor({
  value,
  onChange,
  placeholder = "Write something…",
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const serializeId = useRef(0);
  const initialValue = useRef(htmlToPlateValue(value)).current;

  const editor = usePlateEditor({
    plugins: EditorKit,
    value: initialValue,
  });

  return (
    <div className="min-w-0 w-full max-w-full">
      <Plate
        editor={editor}
        onChange={({ value: plateValue }) => {
          const id = ++serializeId.current;
          void plateValueToHtml(plateValue).then((html) => {
            if (id === serializeId.current) onChange(html);
          });
        }}
      >
        <EditorContainer
          variant="select"
          className={cn("min-w-0 max-w-full overflow-visible", className)}
        >
          <Editor
            variant="select"
            placeholder={placeholder}
            className="max-h-[min(60vh,520px)] min-h-[140px] overflow-y-auto text-sm"
          />
        </EditorContainer>
      </Plate>
    </div>
  );
}
