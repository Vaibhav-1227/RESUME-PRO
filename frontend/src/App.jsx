import { RouterProvider } from "react-router"
import { Routersab } from "./app.routes.jsx"
import { AuthProvider } from "./feature/auth/auth.context.jsx"
import { InterviewProvider } from "./feature/interview/interview.context.jsx"
function App(){
    return (
     <AuthProvider>
      <InterviewProvider>
       <RouterProvider router={Routersab}/>
       </InterviewProvider>
     </AuthProvider>
  )
}

export default App

//  <RouterProvider router={Routersab}/>===childern
// ab routeprovider jo bhi pag render krega wo sb authprovider ke andar rhege aur authprovider ke andar jo bhi data hoga wo sb page me use kr skte hai without prop drillingc