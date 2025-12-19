import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaCopy,
  FaCheck,
  FaClock,
} from "react-icons/fa";
import { api } from "../../auth";
import styles from "./Payment.module.css";
import Header from "../../Components/Header/Header";

function Payment() {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [initialLoading, setInitialLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  const pollingIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

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
    if (paymentId) {
      const fetchPaymentDetails = async () => {
        try {
          const response = await api.get(`/api/payments/${paymentId}`);
          setPaymentData(response.data);
          
          // Calcula o tempo restante
          if (response.data.expirationTime) {
            const expTime = new Date(response.data.expirationTime).getTime();
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expTime - now) / 1000));
            setTimeRemaining(remaining);
          }
        } catch (err) {
          console.error("Erro ao carregar detalhes do pagamento:", err);
          setError("Erro ao carregar detalhes do pagamento");
        } finally {
          setInitialLoading(false);
        }
      };
      fetchPaymentDetails();
    }
  }, [paymentId]); 

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(countdownIntervalRef.current);
        return;
      }
      
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0 && isMountedRef.current) {
      navigate('/payment-status', { state: { status: 'expired', fromPayment: true } });
    }
  }, [timeRemaining, navigate]);

  useEffect(() => {
    if (!paymentId) return;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const checkPaymentStatus = async () => {
      if (!isMountedRef.current) return;
      
      try {
        const response = await api.get(`/api/payments/status/${paymentId}`);
        
        if (!isMountedRef.current) return;
        
        if (response.data.status === 'aprovado') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          navigate('/payment-status', { state: { status: 'success', fromPayment: true } });
        } else if (response.data.status === 'expirado') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          navigate('/payment-status', { state: { status: 'expired', fromPayment: true } });
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.error("Erro ao verificar status do pagamento:", err);
        }
      }
    };

    pollingIntervalRef.current = setInterval(checkPaymentStatus, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [paymentId, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }; 


  return (
    <div className={styles.container}>
      <Header />



      <div className={styles.content}>
        {initialLoading && <div className={styles.loading}>Carregando dados do pagamento...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!initialLoading && paymentData && (
          <div className={styles.paymentContainer}>
            <h1 className={styles.title}>Pagamento PIX</h1>
            <div className={styles.paymentDetails}>
              <div className={styles.planInfo}>
                <h2>Detalhes do Plano</h2>
                <p><strong>Plano:</strong> {paymentData.nomePlano}</p>
                <p><strong>Período:</strong> {paymentData.periodoPlano}</p>
                
                {paymentData.cupomCodigo && paymentData.valorDesconto > 0 ? (
                  <>
                    <p style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <strong>Preço Original:</strong> R$ {Number(paymentData.precoPlano).toFixed(2)}
                    </p>
                    <div className={styles.cupomInfo}>
                      <p style={{ color: 'var(--success-color)', fontWeight: 'bold', margin: '0.5rem 0' }}>
                        🎉 Cupom "{paymentData.cupomCodigo}" aplicado!
                      </p>
                      <p style={{ color: 'var(--success-color)', fontSize: '0.9rem', margin: '0' }}>
                        Desconto: {paymentData.cupomTipo === 'percentual' 
                          ? `${paymentData.cupomValor}%` 
                          : `R$ ${Number(paymentData.cupomValor).toFixed(2)}`} 
                        {' '}(-R$ {Number(paymentData.valorDesconto).toFixed(2)})
                      </p>
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                      <strong>Preço Final:</strong> R$ {Number(paymentData.valorFinal).toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p><strong>Preço:</strong> R$ {Number(paymentData.precoPlano).toFixed(2)}</p>
                )}
                
                <p><strong>Duração:</strong> {paymentData.duracaoDiasPlano} dias</p>
                {paymentData.beneficiosPlano && (() => {
                  try {
                    const beneficios = typeof paymentData.beneficiosPlano === 'string' 
                      ? JSON.parse(paymentData.beneficiosPlano) 
                      : paymentData.beneficiosPlano;
                    return beneficios && beneficios.length > 0 && (
                      <>
                        <h3 style={{ fontSize: '1rem', marginTop: '1rem', marginBottom: '0.5rem' }}>Benefícios inclusos:</h3>
                        <ul>
                          {beneficios.map((beneficio, index) => (
                            <li key={index}>{beneficio}</li>
                          ))}
                        </ul>
                      </>
                    );
                  } catch (e) {
                    console.error('Erro ao processar benefícios:', e);
                    return null;
                  }
                })()}
              </div>
              <div className={styles.qrSection}>
                <h2>QR Code PIX</h2>
                {timeRemaining !== null && timeRemaining > 0 && (
                  <div className={styles.countdown}>
                    <FaClock className={styles.clockIcon} />
                    <span className={styles.countdownText}>
                      Tempo restante: <strong>{formatTime(timeRemaining)}</strong>
                    </span>
                  </div>
                )}
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

export default Payment;
