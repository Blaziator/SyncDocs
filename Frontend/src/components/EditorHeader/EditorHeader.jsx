import {useAuth} from "../../context/AuthContext.jsx";
import { UserRoundCheck, UserRoundPlus} from "lucide-react";
import ConnectionStatus from "../ConnectionStatus/ConnectionStatus.jsx";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ShareModal from "../ShareModal/ShareModal.jsx";
import axiosInstance from "../../api/axiosInstance.js";
import styles from "./EditorHeader.module.css";

export default function EditorHeader({doc, connectionStatus}) {

  const {user} = useAuth();
  const navigate = useNavigate();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const docLoaded = Boolean(doc._id);

  const handleClaim = async()=>{

    if(user){
      try{
        await axiosInstance.post("/documents/claim", {docId: doc._id});
        navigate("/dashboard");     
      }catch(err){
        console.error(err);
      }
    }else{
      navigate(`/login?claim=${doc._id}`);
    }
  }

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <button className={styles.brand} onClick={()=> navigate('/dashboard')} title="Go to dashboard">
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
        <ConnectionStatus status={connectionStatus} isGuestDoc={doc.isGuest}/>
      </div>

      <div className={styles.right}>
        {docLoaded && (
          <>
            {user && doc.owner === user.id && (
              <button
                  className={styles.shareBtn}
                  onClick={() => setIsShareOpen(true)}
                  aria-label="Share document"
                  title="Share document"
              >
                  <UserRoundPlus size={18} /> 
                  <span className={styles.shareLabel}>Share</span>
              </button>
            )}

            {doc.owner == null && 
                <button 
                  className={styles.claimBtn} 
                  title="Save your document or Claim as your own"
                  onClick={handleClaim}
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