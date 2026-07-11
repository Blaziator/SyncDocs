import { useState, useRef, useEffect } from "react";
import styles from "./NameDocumentModal.module.css";

export default function NameDocumentModal({ isOpen, initialValue, onConfirm, onCancel }) {
    const [value, setValue] = useState(initialValue || "Untitled Document");
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) setValue(initialValue || "Untitled Document");
    }, [isOpen, initialValue]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onConfirm(value.trim() || "Untitled Document");
        } else if (e.key === "Escape") {
            onCancel();
        }
    };

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>Document name</h3>
                <input
                    ref={inputRef}
                    className={styles.input}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
                    <button
                        className={styles.confirmBtn}
                        onClick={() => onConfirm(value.trim() || "Untitled Document")}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}