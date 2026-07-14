import { useNavigate } from "react-router-dom"
import { FileQuestion } from "lucide-react";
import styles from "./NotFound.module.css";

export default function NotFound() {

  const navigate = useNavigate();

  return (
    <div className={styles.page}>
        <div className={styles.logoRow}>
          <img src="/favicon.svg" alt="SyncDocs" className={styles.logoIcon} />
          <span className={styles.logoText}>SyncDocs</span>
        </div>
        <div className={styles.pageContent}>
          <FileQuestion size={64} className={styles.icon}/>
          <h1 className={styles.title}>404 - Page not found</h1>
          <p className={styles.subtitle}>
              The page you're looking for doesn't exist or may have been moved.
          </p>
          <button className={styles.btn} onClick={()=> navigate("/")}>Go to Home</button>
        </div>
    </div>
  );
}
