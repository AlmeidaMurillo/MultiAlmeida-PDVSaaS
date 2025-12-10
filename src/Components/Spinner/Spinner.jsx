import styles from "./Spinner.module.css";

export default function Spinner() {
  return (
    <div className={styles.spinnerOverlay}>
      <div className={styles.spinnerContainer}>
        <div className={styles.logo}>MultiAlmeida</div>
        <h2 className={styles.subtitle}>ERP PDV SaaS</h2>
        <p className={styles.loadingText}>Carregando...</p>
      </div>
    </div>
  );
}
