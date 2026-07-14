import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import styles from "./Login.module.css";

export default function Login() {
  
  const navigate = useNavigate();
  const {user, login} = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchParams] = useSearchParams();
  const claimDocId = searchParams.get("claim");
  const registerLink = claimDocId ? `/register?claim=${claimDocId}` : "/register";

  useEffect(()=>{
    if(user){
      navigate("/dashboard")
    }
  }, [user, navigate]);  

  const handleSubmit = async(e)=>{
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try{
      
      await login(email, password, claimDocId);
      navigate("/dashboard");

    }catch(err){
      setError(err.response?.data?.message || "Something went wrong. Please try again.");

    }finally{
      setIsSubmitting(false);
    }
  };
  
  return (

    <div className={styles.loginPage}>

      <div className={styles.card}>

        <div className={styles.logoRow}>
          <img src="/logo-icon.svg" alt="SyncDocs" className={styles.logoIcon} />
          <span className={styles.logoText}>SyncDocs</span>
        </div>

        <h1 className={styles.title}>Log in to your account</h1>
        <p className={styles.subtitle}>Write together. Instantly.</p>

        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>


          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button className={styles.button} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>

        </form>

        <p className={styles.footer}>
          New here? <Link className={styles.link} to={registerLink}>Register</Link>
        </p>

      </div>

    </div>

  )
}
