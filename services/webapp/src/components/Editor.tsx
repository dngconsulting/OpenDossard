import React, { useEffect, useState } from 'react';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';


const Editor = (props: any) => {

   const [obs,setObs]=useState<string>("");
   useEffect(()=>{setObs(props.edit)},[props.edit]);
    console.log(typeof props.edit)
    console.log(obs)
    return (
        <div>
            <h3>Notes de l'organisation</h3>
            <CKEditor   style={{ minHeight: 100 }}
                data={obs}
                editor={ClassicEditor}
                onInit={(editor: any) => {
                        editor.setData(props.edit);
                        editor.editing.view.change((writer: any) => {
                        writer.setStyle(
                            "height",
                            "200px",
                            editor.editing.view.document.getRoot()
                        );
                    })
                }}
                onChange={(event: any, editor: { getData: () => any; }) => {
                    
                    props.data((editor.getData()));
                    
                }}

            />
        </div>
    )
}

export default Editor;