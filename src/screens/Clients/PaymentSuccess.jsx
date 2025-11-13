import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import "./Payment.module.css";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container">
      <div className="formContainer">
        <div className="successContainer">
          <FaCheckCircle size={80} color="#4caf50" />
          <h1>Pagamento Aprovado!</h1>
          <p>Seu pagamento PIX foi confirmado com sucesso.</p>
          <p>
            Você receberá um email de confirmação em breve e poderá acessar o
            painel da sua empresa.
          </p>
          <p>Você será redirecionado para a tela de login em alguns instantes.</p>
        </div>
      </div>
    </div>
  );
}
