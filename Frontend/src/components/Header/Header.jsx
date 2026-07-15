import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {Search, LogOut} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./Header.module.css";

export default function Header({searchQuery, setSearchQuery}) {

    const {user, logout} = useAuth();
    const navigate = useNavigate();
    const[isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(()=>{

        function handleClickOutside(event) {
            if(dropdownRef.current && !dropdownRef.current.contains(event.target)){
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = async()=>{
        await logout();
        navigate("/login");
    };

    const handleDropdown = ()=>{
        setIsDropdownOpen((prev)=> !prev);
    }

    return (
        <div className={styles.header}>

            <button className={styles.logoRow} onClick={()=> navigate('/dashboard')} title="Go to dashboard">
                <img src="/favicon.svg" alt="SyncDocs" className={styles.logoIcon} />
                <span className={styles.logoText}>SyncDocs</span>
            </button>

            <div className={styles.searchContainer}>

                <Search className={styles.searchIcon} size={18}/>
                <input className={styles.searchInput} type="text" placeholder="Search documents..." value={searchQuery} onChange={(e)=> setSearchQuery(e.target.value)}/>
            </div>

            <div className={styles.userSection} ref={dropdownRef}>

                <button className={styles.userBtn} onClick={handleDropdown}>{user.name.charAt(0).toUpperCase()}</button>

                {isDropdownOpen && (

                    <div className={styles.dropdownMenu}>

                        <div className={styles.dropdownHeader}>
                            <div className={styles.avatarLarge}> {user.name.charAt(0).toUpperCase()} </div>
                            <div>
                                <p className={styles.name}>{user.name}</p>
                                <p className={styles.email}>{user.email}</p>
                            </div>
                        </div>

                        <hr />

                        <button className={styles.logoutBtn} onClick={handleLogout}><LogOut/>Logout</button>

                    </div>
                )}
                
            </div>

        </div>
  );
}
