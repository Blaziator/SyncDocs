import { useRef, useState } from "react";
import styles from "./Tooltip.module.css";

export default function Tooltip({label, children}) {
    
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef(null);

    const handleMouseEnter= ()=>{
        timeoutRef.current = setTimeout(()=>{
            setIsVisible(true);
        }, 300);
    };

    const handleMouseLeave = ()=>{
        clearTimeout(timeoutRef.current);
        setIsVisible(false);
    }

  return (
    <div className={styles.wrapper} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}

        {isVisible && (
            <div className={styles.tooltip}>
                {label}
                <div className={styles.arrow} />
            </div>
        )}
    </div>
  )
}
