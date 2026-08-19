// yha pe hm pure page ko connect krege vackend se by using react-router dom
// ab user/login pe jayega to ye login elmt pe render kr dega wha pe hm login ka page bna dege bs
// yhi kam hai react router ka wha app me hm router provider chala dege jisme yha se sb router bn k chala jayega

import {createBrowserRouter} from "react-router";
import Login from "./feature/auth/pages/login";
import Register from "./feature/auth/pages/register";
import {Protected} from "./feature/auth/component/protected.jsx";
import HOME from "./feature/interview/pages/home.jsx"
import  Interview  from "./feature/interview/pages/interview.jsx";

export const Routersab=createBrowserRouter([
      {
      path:"/login",
      element:<Login/>
      },
      {
      path:"/register",
      element:<Register/>
      },
      {
      path:"/",
      element:<Protected><HOME/></Protected>
      },
      {
      path:"/interview/:interviewid",
      element:<Protected><Interview/></Protected>
      }
      
      

])