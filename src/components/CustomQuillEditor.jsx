import "quill/dist/quill.snow.css";
import Quill from "quill";
import { useEffect, useRef, useState } from "react";

export default function CustomQuillEditor({ value, handleChange, valSwitch }) {
  const containerRef = useRef(null);
  const [quillState, setQuillState] = useState();

  useEffect(() => {
    const child = containerRef.current.appendChild(
      containerRef.current.ownerDocument.createElement("div")
    );
    let quill = new Quill(child, {
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic"],
          ["clean"],
        ],
      },
      theme: "snow",
    });
    quill.on("text-change", () => {
      handleChange(quill.root.innerHTML);
    });
    setQuillState(() => quill);
    return () => {
      if (containerRef.current !== null) {
        [...containerRef.current.children].map((child) => {
          child.remove();
        });
      }
    };
  }, []);

  useEffect(() => {
    if (quillState) {
      quillState.clipboard.dangerouslyPasteHTML(value);
    }
  }, [valSwitch]);

  return (
    <>
      <div id="editor" ref={containerRef}></div>
    </>
  );
}
