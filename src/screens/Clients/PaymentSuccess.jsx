import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import styles from "./PaymentSuccess.module.css"; // Importa o CSS correto

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.successContainer}>
          <FaCheckCircle size={80} color="#4caf50" />
          <h1>Pagamento Aprovado!</h1>
          <p>Seu pagamento PIX foi confirmado com sucesso.</p>
          <p>
            Você receberá um email de confirmação em breve e poderá acessar o
            painel da sua empresa.
          </p>
          <p>Você será redirecionado para a página inicial em alguns instantes.</p>
        </div>
      </div>
    </div>
  );
}
