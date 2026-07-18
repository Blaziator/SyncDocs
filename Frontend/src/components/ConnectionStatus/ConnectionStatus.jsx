import { useAuth } from "../../context/AuthContext";
import styles from "./ConnectionStatus.module.css";

export default function ConnectionStatus({ status = "idle", isGuestDoc = false }) {

  const {user} = useAuth();
  
  const statusConfig = {
    connected: { color: "#22C55E", label: "Synced" },
    syncing: { color: "#F59E0B", label: "Syncing..." },
    disconnected: { color: "#DC2626", label: "Disconnected" },
    idle: { color: "#9CA3AF", label: "Single-user mode" },
  };

  const { color, label } = statusConfig[status] || statusConfig.idle;
  
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
