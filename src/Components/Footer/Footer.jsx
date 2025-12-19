import React from "react";
import styles from "./Footer.module.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <p className={styles.copyright}>
          &copy; {currentYear} MultiAlmeida PDV - Desenvolvido por <strong>Murillo Almeida</strong>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
