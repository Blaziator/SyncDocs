import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert } from "lucide-react";
import styles from "./AccessDenied.module.css";

export default function AccessDenied() {

    const navigate = useNavigate();
    const {user} = useAuth();

  return (
    <div className={styles.page}>

        <div className={styles.logoRow}>
            <img src="/favicon.svg" alt="SyncDocs" className={styles.logoIcon} />
            <span className={styles.logoText}>SyncDocs</span>
        </div>

        <div className={styles.pageContent}>

            <ShieldAlert size={64} className={styles.icon}/>
            <h1 className={styles.title}>You don't have access to this document</h1>
            <p className={styles.subtitle}>Ask the owner to share the document with you, or check that you're logged into the right account.</p>
            <button className={styles.btn} onClick={() => navigate("/")}>
                {user ? "Go to Dashboard" : "Go to Home"}
            </button>

        </div>
        
    </div>
  )
}
