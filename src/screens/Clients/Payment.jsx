import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../auth";
import styles from "./Payment.module.css";
import { FaMoon, FaSun, FaLock } from "react-icons/fa";

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialPaymentId = queryParams.get("paymentId");
  const { state } = location;

  const [planos, setPlanos] = useState([]);
  const [planoSelecionado, setPlanoSelecionado] = useState(state?.planId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paymentId, setPaymentId] = useState(initialPaymentId);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const isFetchingPaymentRef = useRef(false);

  const periodoSelecionado = state?.periodo || "mensal";

  const carregarPlanos = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/planos");
      setPlanos(response.data.planos);
    } catch {
      setError("Erro ao carregar planos.");
    }
  }, []);

  const createNewPayment = useCallback(async () => {
    setLoading(true);
    setError("");
    setPaymentInfo(null);
    setCopied(false);
    setPaymentId(null);
    setTimer(0);
    setTimerActive(false);
    setUserDetails(null);
    setIsInitialized(false);

    let planoEscolhido;
    for (const planoGrupo of planos) {
      const periodos = ["mensal", "trimestral", "semestral", "anual"];
      for (const periodo of periodos) {
        const planoDetalhes = planoGrupo[periodo];
        if (planoDetalhes?.id === planoSelecionado) {
          planoEscolhido = {
            id: String(planoDetalhes.id),
            nome: planoGrupo.nome,
            periodo,
            preco: Number(planoDetalhes.preco),
            duracaoDias: Number(planoDetalhes.duracaoDias),
            beneficios: planoDetalhes.beneficios,
          };
          break;
        }
      }
      if (planoEscolhido) break;
    }

    if (!planoEscolhido) return setError("Plano não encontrado");

    const dadosPagamento = {
      planoId: planoEscolhido.id,
      nomePlano: planoEscolhido.nome,
      periodo: planoEscolhido.periodo,
      amount: planoEscolhido.preco,
      duracaoDias: planoEscolhido.duracaoDias,
      description: `Plano ${planoEscolhido.nome} - ${planoEscolhido.periodo}`,
    };

    try {
      const response = await axiosInstance.post("/api/payments/create", dadosPagamento);
      setPaymentInfo({
        initPoint: response.data.initPoint || response.data.ticketUrl || "",
        qrCode: response.data.qrCode,
        qrCodeText: response.data.qrCodeText,
      });
      setPaymentId(response.data.paymentId);

      const expirationTime = new Date(response.data.dataExpiracao).getTime();
      const remainingTime = Math.max(0, Math.floor((expirationTime - Date.now()) / 1000));
      setTimer(remainingTime);
      setTimerActive(remainingTime > 0);

      navigate("/payment", { state: { paymentId: response.data.paymentId, planoId: planoSelecionado } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Erro ao criar pagamento");
    } finally {
      setLoading(false);
    }
  }, [planos, planoSelecionado, navigate]);

  const fetchPaymentDetails = useCallback(async (id) => {
    if (isFetchingPaymentRef.current) return;
    isFetchingPaymentRef.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get(`/api/payments/${id}`);
      setPaymentInfo({
        initPoint: response.data.initPoint || response.data.ticketUrl || "",
        qrCode: response.data.qrCode,
        qrCodeText: response.data.qrCodeText,
      });
      setPaymentId(response.data.paymentId);
      const expirationTime = new Date(response.data.dataExpiracao).getTime();
      const remainingTime = Math.max(0, Math.floor((expirationTime - Date.now()) / 1000));
      setTimer(remainingTime);
      setTimerActive(remainingTime > 0);

      if (response.data.usuarioId) {
        const userResponse = await axiosInstance.get(`/api/usuarios/${response.data.usuarioId}`);
        setUserDetails(userResponse.data);
      }
    } catch {
      setError("Pagamento não encontrado ou expirado.");
      setPaymentId(null);
      setPaymentInfo(null);
      setTimer(0);
      setTimerActive(false);
      setUserDetails(null);
    } finally {
      setLoading(false);
      isFetchingPaymentRef.current = false;
    }
  }, []);

  const handleCreatePayment = useCallback(async (e) => {
    e.preventDefault();
    await createNewPayment();
  }, [createNewPayment]);

  useEffect(() => {
    carregarPlanos();
  }, [carregarPlanos]);

  useEffect(() => {
    if (planos.length > 0 && !planoSelecionado) {
      for (const planoGrupo of planos) {
        if (planoGrupo.mensal) {
          setPlanoSelecionado(planoGrupo.mensal.id);
          break;
        }
      }
    }
  }, [planos, planoSelecionado]);

  const isLoggedIn = !!localStorage.getItem("jwt_token");

  useEffect(() => {
    if (planos.length > 0 && planoSelecionado && !isInitialized) {
      setIsInitialized(true);
      const initPaymentFlow = async () => {
        setLoading(true);
        setError("");
        try {
          if (isLoggedIn) {
            if (initialPaymentId) {
              await fetchPaymentDetails(initialPaymentId);
            } else {
              await createNewPayment();
            }
          }
        } finally {
          setLoading(false);
        }
      };
      initPaymentFlow();
    }
  }, [planos, planoSelecionado, isInitialized, initialPaymentId, fetchPaymentDetails, createNewPayment, isLoggedIn]);

  useEffect(() => {
    let interval;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && paymentId && paymentInfo && isInitialized) {
      setTimerActive(false);
      const expirePayment = async () => {
        try {
          if (paymentId) await axiosInstance.post(`/api/payments/${paymentId}/expire`);
        } finally {
          await createNewPayment();
        }
      };
      expirePayment();
    }
    return () => clearInterval(interval);
  }, [timerActive, timer, paymentId, paymentInfo, isInitialized, createNewPayment]);

  useEffect(() => {
    let statusInterval;
    if (paymentId) {
      statusInterval = setInterval(async () => {
        try {
          const response = await axiosInstance.get(`/api/payments/status/${paymentId}`);
          if (response.data.status === "aprovado") navigate("/payment-success");
        } catch {
          // Ignorar erros de verificação de status
        }
      }, 15000);
    }
    return () => clearInterval(statusInterval);
  }, [paymentId, navigate]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));

  const handleCopyPix = () => {
    if (paymentInfo?.qrCodeText) {
      navigator.clipboard.writeText(paymentInfo.qrCodeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  let planoEscolhido;
  for (const planoGrupo of planos) {
    const periodos = ["mensal", "trimestral", "semestral", "anual"];
    for (const periodo of periodos) {
      const planoDetalhes = planoGrupo[periodo];
      if (planoDetalhes?.id === planoSelecionado) {
        planoEscolhido = {
          id: planoDetalhes.id,
          nome: planoGrupo.nome,
          periodo,
          preco: planoDetalhes.preco,
          duracaoDias: planoDetalhes.duracaoDias,
          beneficios: planoDetalhes.beneficios,
        };
        break;
      }
    }
    if (planoEscolhido) break;
  }

  return (
    <>
      <header className={styles.headerTop}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>MultiAlmeida</div>
          <h2 className={styles.subtitle}>PDV SaaS</h2>
        </div>
        <div className={styles.iconsContainer}>
          <button className={styles.iconButton} onClick={toggleTheme}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </header>

      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <h1>Carrinho de Compras</h1>

          {planoEscolhido && (
            <div className={styles.resumo}>
              <h2>Resumo do Pedido</h2>
              <p><strong>Plano:</strong> {planoEscolhido.nome}</p>
              <p><strong>Período:</strong> {periodoSelecionado}</p>
              <p><strong>Duração:</strong> {planoEscolhido.duracaoDias} dias</p>
              <p className={styles.total}><strong>Total:</strong> R$ {planoEscolhido.preco.toFixed(2)}</p>
            </div>
          )}

          {isLoggedIn ? (
            <>
              <form onSubmit={handleCreatePayment} className={styles.form}>
                {timerActive && timer > 0 && (
                  <div className={styles.timer}>
                    <p>Tempo restante para pagamento: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}</p>
                  </div>
                )}
                {userDetails && (
                  <div className={styles.resumo}>
                    <p><strong>Responsável:</strong> {userDetails.nome}</p>
                    <p><strong>Email:</strong> {userDetails.email}</p>
                  </div>
                )}
                <button type="submit" disabled={loading} className={styles.button}>
                  {loading ? "Processando..." : "Gerar Novo Pagamento PIX"}
                </button>
                {error && <p className={styles.error}>{error}</p>}
              </form>

              {paymentInfo && (
                <div className={styles.paymentInfo}>
                  <div className={styles.securityBadge}><FaLock /> Pagamento Seguro</div>
                  {paymentInfo.qrCode && (
                    <div className={styles.qrCodeContainer}>
                      <img src={`data:image/png;base64,${paymentInfo.qrCode}`} alt="QR Code PIX" className={styles.qrCodeImage} />
                      <p>Escaneie com o app do seu banco</p>
                    </div>
                  )}
                  {paymentInfo.qrCodeText && (
                    <div className={styles.pixCodeContainer}>
                      <button onClick={handleCopyPix} className={styles.copyButton}>{copied ? "✓ Copiado!" : "Copiar código PIX"}</button>
                      <p className={styles.pixNote}>Ou cole o código no seu app de pagamentos</p>
                    </div>
                  )}
                  {paymentInfo.initPoint && (
                    <a href={paymentInfo.initPoint} target="_blank" rel="noopener noreferrer" className={styles.paymentLink}>Ver detalhes do pagamento</a>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.carrinhoActions}>
              <button className={styles.button} onClick={() => navigate("/login", { state: { planId: planoSelecionado, periodo: periodoSelecionado } })}>Finalizar Compra</button>
              <p className={styles.registroLink}>
                Não tem conta? <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/registro?planId=${planoSelecionado}&periodo=${periodoSelecionado}`); }}>Registre-se</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Payment;
