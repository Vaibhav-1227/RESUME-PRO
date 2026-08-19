// conecept of context api is to create a global state and use it in any component without prop drilling

import {createContext, useEffect,  useState} from 'react';


export const AuthContext=createContext();
// authcontext me hmne user ka state bna diya jisme user ka data store hoga aur loading ka state bna diya jisme loading ka data store hoga
// AuthProvider user, loading (aur setUser, setLoading agar diye hain) ko React Context ke through apne andar ke saare components ko provide karta hai.
export const AuthProvider=({children})=>{
      const [user,setUser]=useState(null);
      const [loading,setLoading]=useState(true);

      return (
            <AuthContext.Provider value={{user,setUser,loading,setLoading}}>
                  {children}
            </AuthContext.Provider>
      )
}
// context api ye bolta hai mere andar jitne bhi component hai unko ye data provide krdo aur ye data kisi bhi component me use kr skte hai without prop drilling
// AuthContext = Khali Box
// Provider = Is box me data bharne wala
// provider k andar  user,setUser,loading,setLoading ye data bhar diya jisse ye data kisi bhi component me use kr skte hai without prop drilling