import { useNavigate } from "react-router-dom";
import { Trash2, SquarePen, FileText } from "lucide-react";
import styles from "./DocumentRow.module.css";

export default function DocumentRow({ doc, onDelete, onRename }) {

    const navigate = useNavigate();

    const formattedDate = new Date(doc.updatedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

  return (
    <div className={styles.row} onClick={()=> navigate(`/doc/${doc._id}`)}>

        <div className={styles.info}>
            <span className={styles.title}> <FileText size={22} color="blue"/> {doc.title}</span>
            <span className={styles.date}>Edited {formattedDate}</span>
        </div>

        <div className={styles.actions}>

            <button
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); onRename(doc); }}
                >
                    <SquarePen size={18}/>
                </button>

            <button 
                className={styles.deleteBtn} 
                onClick={(e)=>{
                    e.stopPropagation();
                    onDelete(doc._id);
                }}
            >
                <Trash2/>
            </button>
        </div>


    </div>
  );
}
