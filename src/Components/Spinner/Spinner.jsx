import { useEffect, useState } from "react";
import styles from "./Spinner.module.css";

export default function Spinner() {
  
  const [theme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className={styles.container}>
      <h1 className={styles.logo}>MultiAlmeida</h1>
      <p className={styles.subtitle}>ERP SaaS PDV</p>
    </div>
  );
}
