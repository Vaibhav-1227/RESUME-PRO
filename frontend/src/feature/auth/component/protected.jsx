// Kisi bhi page ko direct access se bachane ke liye usko Protected Route banate hain.
// Protected Route me check karte hain ki user login hai ya nahi.
// AuthContext me jo `user` state hai, usi se authentication check hota hai.
// Agar `user === null` hai, to user login nahi hai,
// isliye usko Login page par redirect kar denge.
// Agar `user !== null` hai, to user login hai,
// isliye usko requested page access karne denge.


import { useAuth } from "../hooks/authhooks.js";
import React from "react";
import { Navigate } from "react-router";

export const Protected = ({ children }) => {
    const { loading, user } = useAuth();

    if (loading) {
        return <h1>Loading...</h1>;
    }

    if (!user) {
            return <Navigate to={"/login"} />;
    }
    console.log("Protected user:", user);

    return children;
};   


// aab jis bhi compoent ko protected route me rakhna hai usko <Protected> </Protected> ke andar rakh do aur usko koi bhi idrectly access ni kr payega for ecample tum homepage bnaye ho to usko <Protected> <Home/> </Protected> ke andar rakh do aur agar koi user directly homepage kholne ki kosis karega to wo login page pe redirect ho jayega



