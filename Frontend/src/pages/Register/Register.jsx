import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {useNavigate, Link, useSearchParams} from "react-router-dom";
import styles from "./Register.module.css";


export default function Register() {

  const navigate = useNavigate();
  const {user, register} = useAuth();

  useEffect(()=>{
    if(user){
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchParams] = useSearchParams();
  const rawClaimDocId  = searchParams.get("claim");
  const claimDocId = rawClaimDocId && rawClaimDocId !== "undefined" ? rawClaimDocId : null;
  const loginLink = claimDocId ? `/login?claim=${claimDocId}` : "/login";

  const handleSubmit = async(e)=>{
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try{
      await register(name, email, password, claimDocId);
      navigate("/dashboard");

    }catch(err){
      setError(err.response?.data?.message || "Something went wrong. Please try again.");

    }finally{
      setIsSubmitting(false);
    } 
  };

  return (
    <div className={styles.registerPage}>
      
      <div className={styles.card}>

        <div className={styles.logoRow}>
          <img src="/favicon.svg" alt="SyncDocs" className={styles.logoIcon} />
          <span className={styles.logoText}>SyncDocs</span>
        </div>

        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Write together. Instantly.</p>

        {error && <p className={styles.error}>{error}</p>}
        

        <form className={styles.form} onSubmit={handleSubmit}>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="name">Name</label>
            <input
              id="name"
              className={styles.input}
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className={styles.button} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>

        </form>

        <p className={styles.footer}>
          Already have an account? <Link className={styles.link} to={loginLink}>Log in</Link>
        </p>

      </div>

    </div>
  )
}
