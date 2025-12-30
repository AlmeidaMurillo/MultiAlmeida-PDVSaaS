import { useEffect } from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import styles from "./Perfil.module.css";

function Perfil() {

  useEffect(() => {
    document.title="MultiAlmeida | Perfil";
  }, []);
  
  return (
    <Sidebar>
      <div className={styles.perfilContent}>
        <h1 className={styles.title}>Gerenciar Planos</h1>

        
      </div>
    </Sidebar>
  );
}


export default Perfil;