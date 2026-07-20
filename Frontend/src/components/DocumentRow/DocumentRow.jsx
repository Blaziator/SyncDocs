import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {useAuth} from "../../context/AuthContext.jsx";
import ShareModal from "../ShareModal/ShareModal.jsx";
import { useState } from "react";
import { Trash2, SquarePen, FileText, Share2 } from "lucide-react";
import styles from "./DocumentRow.module.css";

export default function DocumentRow({ doc, onDelete, onRename }) {

    const navigate = useNavigate();
    const {user} = useAuth();
    const isShared = doc.owner && doc.owner._id !== user.id;

    const [isShareOpen, setIsShareOpen] = useState(false);

    const relativeTime = formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true });

    const handleRowClick = () => {
        if (isShareOpen) return;
        navigate(`/doc/${doc._id}`);
    };

  return (
    <div className={styles.row} onClick={handleRowClick}>

        <div className={styles.info}>
            <span className={styles.title}> <FileText size={22} color="blue"/> {doc.title}</span>
            
            <div className={styles.meta}>
                {isShared && (
                    <>
                        <span className={styles.sharedBy}>Shared by <strong>{doc.owner.name}</strong></span>
                        <span className={styles.separator}>•</span>
                    </>
                )}

                <span className={styles.date}>Edited {relativeTime}</span>

            </div>
        </div>

        <div className={styles.actions}>

            <button
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); onRename(doc); }}
                >
                    <SquarePen size={18}/>
            </button>

            {!isShared && 

              <button
                  className={styles.shareBtn}
                  onClick={(e) => {e.stopPropagation(); setIsShareOpen(true)}}
              >
                  <Share2 size={18} />
              </button>
            }

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

        <ShareModal
                isOpen={isShareOpen}
                docId={doc._id}
                onClose={() => setIsShareOpen(false)}
        />

    </div>
  );
}
