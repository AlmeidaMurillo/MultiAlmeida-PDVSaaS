import { useEffect } from "react";
import styles from "./Spinner.module.css";

function Spinner() {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <div className={styles.spinnerOverlay}>
      <div className={styles.spinnerContainer}>
        <div className={styles.logo}>MultiAlmeida</div>
        <h2 className={styles.subtitle}>ERP PDV SaaS</h2>
      </div>
    </div>
  );
}

export default Spinner;
