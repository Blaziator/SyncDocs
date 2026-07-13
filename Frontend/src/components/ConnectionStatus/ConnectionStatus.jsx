import styles from "./ConnectionStatus.module.css";

export default function ConnectionStatus({ status = "idle" }) {

    const statusConfig = {
        connected: { color: "#22C55E", label: "Synced" },
        syncing: { color: "#F59E0B", label: "Syncing..." },
        disconnected: { color: "#DC2626", label: "Disconnected" },
        idle: { color: "#9CA3AF", label: "Single-user mode" },
    };

    const { color, label } = statusConfig[status];

  return (
    <div className={styles.statusRow}>
        <span className={styles.dot} style={{ backgroundColor: color }} />
        <span className={styles.label}>{label}</span>
    </div>
  )
}
