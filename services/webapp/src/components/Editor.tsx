import React, { useState } from 'react';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const Editor = () => {

    return (
        <CKEditor style={{ minHeight: 100 }}
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
                console.log('Editor is ready to use!', editor);
            }}
            onChange={(event: any, editor: { getData: () => any; }) => {
                const data = editor.getData();
                console.log({ event, editor, data });
            }}
            onBlur={(event: any, editor: any) => {
                console.log('Blur.', editor);
            }}
            onFocus={(event: any, editor: any) => {
                console.log('Focus.', editor);
            }}
        />
    )
}

export default Editor;