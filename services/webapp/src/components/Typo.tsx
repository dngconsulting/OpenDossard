import React from "react"
import {makeStyles} from "@material-ui/core/styles";

interface ITypoProps {
    children: React.ReactNode,
    size: 'small' | 'medium' | 'large',
    centered?: boolean,
    bold?: boolean
}

const useStyles = makeStyles(theme => ({
    typoContainer: {
        display: 'flex',
        flexDirection: 'row',
        padding: 0,
        margin: 0,
        cursor: theme.palette.text.primary
    },
    small: {
        fontSize: "12px"
    },
    medium: {
        fontSize: "16px"
    },
    large: {
        fontSize: "25px"
    },
    centered: {
        justifyContent: "center",
    },
    bold : {
        fontWeight: "bold",
    }
}));


export const Typo = ({ children, size, centered, bold }: ITypoProps) => {
    const classes = useStyles();
    let className = classes.typoContainer;
    if (centered) { className = className + " " + classes.centered; }
    if (bold) { className = className + " " + classes.bold; }
    if (size === 'small') { className = className + " " + classes.small; }
    if (size === 'medium') { className = className + " " + classes.medium; }
    if (size === 'large') { className = className + " " + classes.large; }
    return (
        <p className={className}>
            {children}
        </p>
    );
}