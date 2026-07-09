import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance.js";

const AuthContext = createContext();

export function AuthProvider({ children }){
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{

        const checkAuth = async()=>{
            try{
                const res = await axiosInstance.get("/auth/me");
                setUser(res.data.user);

            }catch(err){
                setUser(null);
            }finally{
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async(email, password, claimDocId)=>{
        const res = await axiosInstance.post("/auth/login", {email, password, claimDocId});
        setUser(res.data.user);
        return res.data;
    };

    const register = async(name, email, password, claimDocId)=>{
        const res = await axiosInstance.post("/auth/register", {name, email, password, claimDocId});
        setUser(res.data.user);
        return res.data;
    };

    const logout = async()=>{
        await axiosInstance.post("/auth/logout");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(){
    return useContext(AuthContext);
}