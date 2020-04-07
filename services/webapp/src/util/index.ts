// @ts-ignore
export const addWrappedText = ({text, textWidth, doc, fontSize = 10, fontType = 'normal', lineSpacing = 5, xPosition = 10, initialYPosition = 10, pageWrapInitialYPosition = 10}) => {
    doc.setFontType(fontType);
    doc.setTextColor(70,70,70);
    doc.setFontSize(fontSize);
    let textLines = doc.splitTextToSize(text, textWidth); // Split the text into lines
    let pageHeight = doc.internal.pageSize.height;        // Get page height, we'll use this for auto-paging. TRANSLATE this line if using units other than `pt`
    let cursorY = initialYPosition;
    console.log('initial y position = ' + cursorY)
    textLines.forEach((lineText:any) => {
        if (cursorY > pageHeight) { // Auto-paging
            doc.addPage();
            cursorY = pageWrapInitialYPosition;
        }
        console.log("xposition=" + xPosition + ' cursoryY=' + cursorY + ' ' + lineText)
        doc.text(xPosition, cursorY, lineText);
        cursorY += lineSpacing;
    })
}

export const capitalizeFirstLetter = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
};
