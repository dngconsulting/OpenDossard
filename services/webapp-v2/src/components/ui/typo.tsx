import React from "react"

interface ITypoProps {
    children: React.ReactNode,
    size: 'small' | 'medium' | 'large',
    centered?: boolean,
    bold?: boolean
}

export const Typo = ({ children, size, centered, bold }: ITypoProps) => {
    let className = "flex flex-row";
    if (centered) { className = className + " " + "text-center"; }
    if (bold) { className = className + " " + "font-bold"; }
    if (size === 'small') { className = className + " " + "text-xs"; }
    if (size === 'medium') { className = className + " " + "text-s"; }
    if (size === 'large') { className = className + " " + "text-m"; }
    return (
        <p className={className}>
            {children}
        </p>
    );
}
