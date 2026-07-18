import { useAuth } from "../../context/AuthContext";
import styles from "./ConnectionStatus.module.css";

export default function ConnectionStatus({ status = "disconnected", isGuestDoc = false }) {

  const {user} = useAuth();
  
  const statusConfig = {
    connected: { color: "#22C55E", label: "Synced" },
    syncing: { color: "#F59E0B", label: "Syncing..." },
    disconnected: { color: "#DC2626", label: "Disconnected" },
  };

  const { color, label } = statusConfig[status] || statusConfig.disconnected;
  
  if(!user && isGuestDoc){
    return (
      <div className={styles.statusRow}>
        <span className={styles.dot} style={{ backgroundColor: "#DC2626" }} />
        <span className={styles.label}>Login to save and sync document to cloud</span>
      </div>
    )
  }
  
  return (
    <div className={styles.statusRow}>
      <span className={styles.dot} style={{ backgroundColor: color }} />
      <span className={styles.label}>{label}</span>
    </div>
  )
}
