import { useNavigate } from "react-router-dom";
import { Shredder, SquarePen, FileText } from "lucide-react";
import styles from "./DocumentRow.module.css";

export default function DocumentRow({ doc, onDelete}) {

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

        <button 
            className={styles.deleteBtn} 
            onClick={(e)=>{
                e.stopPropagation();
                onDelete(doc._id);
            }}
        >
            <Shredder/>
        </button>

    </div>
  );
}
