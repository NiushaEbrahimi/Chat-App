// I kept this as a css module because tailwind couldn't handle sudo elements(before and after)
import style from "../assets/css/CrystalMist.module.css"
import React from "react";

export default function CrystalMist({children, header} : {children : React.ReactNode, header : React.ReactNode}){
    return (
        <>
            <div className={style.liquidGlassCard}>
            <div className={style.cardContent}>
                <div className={style.cardHeader}>
                    {header}
                </div>
                <div className={style.cardBody}>
                    {children}
                </div>
            </div>
            </div>
        </>
    )
}