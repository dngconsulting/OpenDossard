import React, { useRef, useState } from 'react';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const Editor = (props: any) => {
    const editorRef = useRef(null);
    const [data, setData] = useState(null);
    return (
        <div>
            <h2>Notes de l'organisation</h2>
            <CKEditor ref={editorRef} value={data} style={{ minHeight: 100 }}
                editor={ClassicEditor}

                data="<p>Hello OpenDossard!</p>"
                onInit={(editor: any) => {
                    // You can store the "editor" and use when it is needed.
                    editor.editing.view.change((writer: any) => {
                        writer.setStyle(
                            "height",
                            "200px",
                            editor.editing.view.document.getRoot()
                        )
                            ;
                    })
                }}
                onChange={(event: any, editor: { getData: () => any; }) => {
                    setData((editor.getData()));
                    props.data(data);
                }}

            />
        </div>
    )
}

export default Editor;