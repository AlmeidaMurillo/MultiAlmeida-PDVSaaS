import React, { useState, useEffect } from "react";
import styles from "./ModalPermissoesPlano.module.css";

// Exemplo de permissões possíveis
const PERMISSOES_PADRAO = [
  {
    key: "empresas",
    label: "Quantidade de empresas",
    tipo: "quantidade",
  },
  {
    key: "funcionarios",
    label: "Quantidade de funcionários",
    tipo: "quantidade",
  },
  {
    key: "produtos",
    label: "Quantidade de produtos",
    tipo: "quantidade",
  },
  {
    key: "relatorios",
    label: "Acesso a relatórios",
    tipo: "boolean",
  },
  {
    key: "cupons",
    label: "Gerenciar cupons",
    tipo: "boolean",
  },
];

const ModalPermissoesPlano = ({ open, onClose, permissoes = {}, onSave }) => {
  const [form, setForm] = useState({});

  useEffect(() => {
    // Inicializa o form com as permissões recebidas
    const initial = {};
    PERMISSOES_PADRAO.forEach((p) => {
      if (p.tipo === "quantidade") {
        initial[p.key] = permissoes[p.key] || { ilimitado: false, valor: 0 };
      } else {
        initial[p.key] = permissoes[p.key] || false;
      }
    });
    setForm(initial);
  }, [permissoes, open]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleQuantidadeChange = (key, field, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === "ilimitado" ? value : Number(value),
      },
    }));
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Permissões do Plano</h2>
        <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
          {PERMISSOES_PADRAO.map((p) => (
            <div key={p.key} className={styles.permissaoItem}>
              <label>{p.label}</label>
              {p.tipo === "boolean" ? (
                <input
                  type="checkbox"
                  checked={!!form[p.key]}
                  onChange={e => handleChange(p.key, e.target.checked)}
                />
              ) : (
                <div className={styles.quantidadeGroup}>
                  <input
                    type="number"
                    min={0}
                    disabled={form[p.key]?.ilimitado}
                    value={form[p.key]?.valor || 0}
                    onChange={e => handleQuantidadeChange(p.key, "valor", e.target.value)}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={form[p.key]?.ilimitado}
                      onChange={e => handleQuantidadeChange(p.key, "ilimitado", e.target.checked)}
                    />
                    Ilimitado
                  </label>
                </div>
              )}
            </div>
          ))}
          <div className={styles.actions}>
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalPermissoesPlano;
