import jwt from "jsonwebtoken";

function parseTokenFromCookieHeader(cookieHeader){

    if(!cookieHeader) return null;

    const cookies = cookieHeader.split(";").map((c)=> c.trim());
    const tokenCookie = cookies.find((c)=> c.startsWith("token="));

    if(!tokenCookie) return null;

    return tokenCookie.split("=")[1];
}

export function attachUserToSocket(socket){
 
    const cookieHeader = socket.handshake.headers.cookie;
    const token = parseTokenFromCookieHeader(cookieHeader);

    if(!token){
        socket.userId = null;
        return;
    }

    try{

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;

    }catch(err){
        socket.userId = null;
    }

}