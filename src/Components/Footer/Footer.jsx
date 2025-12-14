import React from "react";
import { FaHeart } from "react-icons/fa";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <h3 className={styles.footerTitle}>MultiAlmeida PDV</h3>
        <p className={styles.footerDescription}>
          Sistema completo de PDV e gestão empresarial
        </p>
      </div>

      <div className={styles.footerBottom}>
        <p className={styles.copyright}>
          &copy; {currentYear} MultiAlmeida PDV. Todos os direitos reservados.
        </p>
        <p className={styles.developer}>
          Desenvolvido com <FaHeart className={styles.heartIcon} /> por <strong>Murillo Almeida</strong>
        </p>
      </div>
    </footer>
  );
}
