import {useAuth} from "../../context/AuthContext.jsx";
import { UserRoundCheck, UserRoundPlus} from "lucide-react";
import ConnectionStatus from "../ConnectionStatus/ConnectionStatus.jsx";
import { useNavigate } from "react-router-dom";
import styles from "./EditorHeader.module.css";
import { useState } from "react";
import ShareModal from "../ShareModal/ShareModal.jsx";

export default function EditorHeader({doc}) {

  const {user} = useAuth();
  const navigate = useNavigate();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const docLoaded = Boolean(doc._id);

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <button className={styles.brand} onClick={()=> navigate('/dashboard')}>
          <img
            src="/favicon.svg"
            alt="SyncDocs logo"
            className={styles.logoImg}
          />
          <h2>SyncDocs</h2> 
        </button>
      </div>

      <div className={styles.center}>
        <p className={styles.title}>{doc.title}</p>
        <ConnectionStatus status="idle" />
      </div>

      <div className={styles.right}>
        {docLoaded && (
          <>
            {user && doc.owner === user.id && (
              <button
                  className={styles.shareBtn}
                  onClick={() => setIsShareOpen(true)}
              >
                  <UserRoundPlus size={18} /> Share
              </button>
            )}

            {doc.owner == null && 
                <button 
                  className={styles.claimBtn} 
                  title="Save your document or Claim as your own"
                  onClick={()=> navigate(`/login?claim=${doc._id}`)}
                > 
                  <UserRoundCheck size={18}/> Claim Document
                </button>
            }
          </>
        )}
      </div>

      <ShareModal
        isOpen={isShareOpen}
        docId={doc._id}
        onClose={() => setIsShareOpen(false)}
      />

    </div>

  )
}