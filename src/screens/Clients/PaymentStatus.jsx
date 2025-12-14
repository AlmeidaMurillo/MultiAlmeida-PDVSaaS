import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import styles from "./PaymentStatus.module.css";

export default function PaymentStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(6);
  
  // Obtém o status do pagamento (sucesso ou expirado)
  const status = location.state?.status || "success";

  useEffect(() => {
    // Não precisa mais limpar localStorage pois o cupom está no banco
    // O carrinho é limpo automaticamente pelo backend quando pagamento aprovado

    // Inicia contagem regressiva
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Redireciona após 6 segundos
    const timer = setTimeout(() => {
      navigate("/");
    }, 6000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [navigate]);

  if (status === "expired") {
    return (
      <div className={styles.container}>
        <div className={styles.formContainer}>
          <div className={styles.expiredContainer}>
            <FaTimesCircle size={80} className={styles.expiredIcon} />
            <h1>Pagamento Expirado!</h1>
            <p>O tempo para realizar o pagamento PIX expirou.</p>
            <p>
              Não se preocupe! O produto continua no seu carrinho.
            </p>
            <p>
              Você pode voltar ao carrinho e gerar um novo pagamento a qualquer momento.
            </p>
            <div className={styles.countdown}>
              <p>Redirecionando em <strong>{countdown}</strong> segundo{countdown !== 1 ? "s" : ""}...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Status de sucesso
  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.successContainer}>
          <FaCheckCircle size={80} className={styles.successIcon} />
          <h1>Pagamento Aprovado!</h1>
          <p>Seu pagamento PIX foi confirmado com sucesso.</p>
          <p>
            Você receberá um email de confirmação em breve e poderá acessar o
            painel da sua empresa.
          </p>
          <div className={styles.countdown}>
            <p>Redirecionando em <strong>{countdown}</strong> segundo{countdown !== 1 ? "s" : ""}...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
