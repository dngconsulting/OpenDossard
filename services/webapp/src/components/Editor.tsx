import React, { useEffect, useState } from "react";
import CKEditor from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const Editor = (props: any) => {
  const [ready, setReady] = useState(false);
  return (
    <div>
      <div style={{ fontSize: 15, marginBottom: 16, fontWeight: "bold" }}>
        Informations sur l'épreuve
      </div>
      <CKEditor
        style={{ minHeight: 100 }}
        data={props.observations}
        onInit={(editor: any) => {
          setReady(true);
        }}
        editor={ClassicEditor}
        onBlur={(event: any, editor: { getData: () => any }) => {
          props.updateObservations(editor.getData());
        }}
      />
    </div>
  );
};

export default Editor;
