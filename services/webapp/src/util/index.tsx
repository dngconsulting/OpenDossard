// @ts-ignore
import * as _ from "lodash";
import React, {useEffect, useState} from "react";
import {Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import {Link} from "react-router-dom";

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
        width,
        height
    };
}

export function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}

// @ts-ignore
export const addWrappedText = ({text, textWidth, doc, fontSize = 10, fontType = 'normal', lineSpacing = 5, xPosition = 10, initialYPosition = 10, pageWrapInitialYPosition = 10}) => {
    doc.setFontType(fontType);
    doc.setTextColor(70,70,70);
    doc.setFontSize(fontSize);
    let textLines = doc.splitTextToSize(text, textWidth); // Split the text into lines
    let pageHeight = doc.internal.pageSize.height;        // Get page height, we'll use this for auto-paging. TRANSLATE this line if using units other than `pt`
    let cursorY = initialYPosition;
    textLines.forEach((lineText:any) => {
        if (cursorY > pageHeight) { // Auto-paging
            doc.addPage();
            cursorY = pageWrapInitialYPosition;
        }
        doc.text(xPosition, cursorY, lineText);
        cursorY += lineSpacing;
    })
}

export const capitalizeFirstLetter = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

export const linkToPalmares = (dossard: string, licenceId: string) => {
    return <Link to={`/palmares/${licenceId}`}>{_.padStart(dossard, 3, '0')}</Link>
}

export const displayDossard = (dossard: string) => {
    return _.padStart(dossard, 3, '0')
}

// TODO remplacer un jour par https://github.com/jonatanklosko/material-ui-confirm compatible hooks
export const ConfirmDialog = (props: any) => {
    return (
        <div>
            <Dialog
                open={props.open}
                onClose={props.handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {props.question}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={props.handleClose} variant={'contained'} color="secondary">
                        {props.cancelMessage}
                    </Button>
                    <Button onClick={props.handleOk} variant={'contained'} color="primary"
                            autoFocus={true}>
                        {props.confirmMessage}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
