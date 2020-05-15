import {Fab} from "@material-ui/core";
import React from "react";

export const ActionButton = (props:any) =>
    <Fab {...props}
         style={{borderRadius:4,fontSize:'12px',margin:'5px',paddingLeft:10,paddingRight:10,paddingBottom:5,paddingTop:5,backgroundColor:'#717272'}}
         variant="extended" size='small'>{props.children}</Fab>

