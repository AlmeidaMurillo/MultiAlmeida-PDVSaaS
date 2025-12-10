import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaCopy,
  FaCheck,
} from "react-icons/fa";
import { useAuth } from "../../context/useAuthHook"; // Importa o hook useAuth
import styles from "./Payment.module.css";
import Header from "../../Components/Header/Header";

export default function Payment() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, api } = useAuth(); // Obtém isAuthenticated e api do hook useAuth

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (paymentData && paymentData.qrCodeText) {
      try {
        await navigator.clipboard.writeText(paymentData.qrCodeText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Erro ao copiar código PIX:', err);
      }
    }
  };

  useEffect(() => {
    // A rota é protegida por ProtectedRoute, então isAuthenticated já é garantido como true aqui.
    // Não precisa de um if (!isAuthenticated) navigate("/login");
    
    if (paymentId) {
      const fetchPaymentDetails = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/api/payments/${paymentId}`);
          setPaymentData(response.data);
        } catch (err) {
          console.error("Erro ao carregar detalhes do pagamento:", err);
          setError("Erro ao carregar detalhes do pagamento");
        } finally {
          setLoading(false);
        }
      };
      fetchPaymentDetails();
    }
  }, [paymentId, api]); // Adiciona 'api' como dependência

  useEffect(() => {
    if (!paymentId) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/payments/status/${paymentId}`);
        if (response.data.status === 'aprovado') {
          clearInterval(interval);
          navigate('/payment-success');
        }
      } catch (err) {
        console.error("Erro ao verificar status do pagamento:", err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [paymentId, navigate, api]); // Adiciona 'api' como dependência


  return (
    <div className={styles.container}>
      <Header />



      {/* Payment Content */}
      <div className={styles.content}>
        {loading && <div className={styles.loading}>Carregando dados do pagamento...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {paymentData && (
          <div className={styles.paymentContainer}>
            <h1 className={styles.title}>Pagamento PIX</h1>
            <div className={styles.paymentDetails}>
              <div className={styles.planInfo}>
                <h2>Plano: {paymentData.nomePlano} - {paymentData.periodoPlano}</h2>
                <p>Preço: R$ {Number(paymentData.precoPlano).toFixed(2)}</p>
                <p>Duração: {paymentData.duracaoDiasPlano} dias</p>
              </div>
              <div className={styles.qrSection}>
                <h2>QR Code PIX</h2>
                <img src={`data:image/png;base64,${paymentData.qrCode}`} alt="QR Code PIX" className={styles.qrCode} />
                <button className={styles.copyButton} onClick={copyToClipboard}>
                  {copied ? <FaCheck /> : <FaCopy />} {copied ? "Copiado!" : "Copiar Código PIX"}
                </button>
                <p className={styles.expiration}>
                  Expira em: {new Date(paymentData.expirationTime).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
