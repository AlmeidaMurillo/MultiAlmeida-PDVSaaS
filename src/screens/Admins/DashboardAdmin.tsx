import { useEffect } from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import styles from "./DashboardAdmin.module.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function DashboardAdmin() {
  useEffect(() => {
    document.title = "MultiAlmeida | Dashboard Admin";
  }, []);

  const vendasMensais = [
    { mes: "Jan", valor: 4000 },
    { mes: "Fev", valor: 3000 },
    { mes: "Mar", valor: 5000 },
    { mes: "Abr", valor: 4500 },
    { mes: "Mai", valor: 6000 },
    { mes: "Jun", valor: 7000 },
  ];

  const pagamentosStatus = [
    { name: "Pendentes", value: 3 },
    { name: "Recebidos", value: 27 },
  ];

  const COLORS = ["#FF8042", "#00C49F"];

  return (
    <Sidebar>
      <div className={styles.dashboardContent}>
        <h1>Dashboard Admin</h1>

        <div className={styles.cards}>
          <div className={styles.card}><h3>Empresas</h3><p>35</p></div>
          <div className={styles.card}><h3>Pendentes</h3><p>12</p></div>
          <div className={styles.card}><h3>Recebidos</h3><p>28</p></div>
          <div className={styles.card}><h3>Faturamento</h3><p>R$ 47.000</p></div>
        </div>

        <div className={styles.charts}>
          <div className={styles.chartContainer}>
            <h3>Vendas Mensais</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendasMensais}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valor" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartContainer}>
            <h3>Status dos Pagamentos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pagamentosStatus} dataKey="value" outerRadius={100} label>
                  {pagamentosStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
