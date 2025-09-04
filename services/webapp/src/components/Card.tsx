import React from "react"
import {makeStyles} from "@material-ui/core/styles";
import {grey} from "@material-ui/core/colors";

interface ICardProps {
    children: React.ReactNode
}

const useStyles = makeStyles(theme => ({
    cardContainer: {
        backgroundColor: "white",
        padding: theme.spacing(4),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderColor: grey[200],
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: theme.shape.borderRadius,
        gap: theme.spacing(4)
    }
}));


export const Card = ({ children }: ICardProps) => {
    const classes = useStyles();
    return (
        <div className={classes.cardContainer}>
            {children}
        </div>
    );
}