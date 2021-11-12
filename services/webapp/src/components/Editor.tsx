import React, { useEffect, useState } from "react";
import CKEditor from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const Editor = (props: any) => {
  const [obs, setObs] = useState<string>("");
  useEffect(() => {
    setObs(props.edit);
  }, [props.edit]);

  return (
    <div>
      <div style={{ fontSize: 15, marginBottom: 16, fontWeight: "bold" }}>
        Informations sur l'épreuve
      </div>
      <CKEditor
        style={{ minHeight: 100 }}
        data={obs}
        editor={ClassicEditor}
        onInit={(editor: any) => {
          editor.editing.view.change((writer: any) => {
            writer.setStyle(
              "height",
              "100px",
              editor.editing.view.document.getRoot()
            );
          });
        }}
        onChange={(event: any, editor: { getData: () => any }) => {
          props.data(editor.getData());
        }}
      />
    </div>
  );
};

export default Editor;
