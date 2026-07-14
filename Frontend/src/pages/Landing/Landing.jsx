import axiosInstance from "../../api/axiosInstance.js";
import {useAuth} from "../../context/AuthContext.jsx";
import {useNavigate} from "react-router-dom";
import {ArrowRight} from "lucide-react";
import styles from "./Landing.module.css";
import { useEffect, useState } from "react";

export default function Landing() {

  const {user} = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(()=>{
    if(user){
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGuestStart = async()=>{
    setError("");

    try{

      const response = await axiosInstance.post("/documents/guest");
      console.log(response);
      console.log(response.data.docId);
      navigate(`/doc/${response.data.docId}`);

    }catch(err){
      setError(err.response?.data?.message || "Something went wrong. Try again");
    }
  }

  return (
    <div className={styles.landing}>

      <div className={styles.header}>

        <div className={styles.logoContainer}>
          <img src="/favicon.svg" alt="SyncDocs logo" className={styles.logo}/>
          <h2>SyncDocs</h2>
        </div>

        <div className={styles.navBtns}>
          <button className={styles.btnOutline} onClick={handleGuestStart}>Continue as Guest</button>  
          <button className={styles.btnOutline} onClick={()=> navigate("/login")}>Log in</button>  
          <button className={styles.btnFilled} onClick={()=> navigate("/register")}>Sign Up</button>  
        </div>       
      </div>

      {error && <p className={styles.error}>{error}</p>}    

      <div className={styles.body}>

        <div className={styles.bodyContent}>

          <h1 className={styles.title}>Write together. <span className={styles.highlight}>Instantly.</span> </h1>

          <p className={styles.subtitle}>Real-time collaborative documents for teams that move fast and think together.</p>

          <button className={styles.ctaBtn} onClick={handleGuestStart}>Start Writing <ArrowRight size={18}/></button>

        </div>

      </div>
    </div>
  )
}