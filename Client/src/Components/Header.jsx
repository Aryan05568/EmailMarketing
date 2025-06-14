// import React from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import { getProfile, setAuthentication } from '../redux/userSlice';
// import { toast } from 'react-toastify';
// import { Link, useNavigate } from 'react-router-dom';

// const Header = () => {

//     const {userProfile, isAuthenticated} = useSelector((state)=>state.user)
//     const dispatch = useDispatch();
//     const navigate = useNavigate()

//     const onLogout = () => {
//         dispatch(setAuthentication(false));
//         dispatch(getProfile(null));
//         toast.success('Logout successfully!', {
//           duration: 4000,
//           position: 'top-right',
//         });
//         navigate("/");
//       };

//   return (
//    <header className="bg-white dark:bg-gray-800 shadow">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
//         <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">EmailFlow</h1>
//         <div className="flex items-center space-x-2">
//           {/* Theme Toggle Button */}
          
//           {/* User Authentication Section */}
//           {userProfile ? (
//             // Logged in state
//             <div className="flex items-center space-x-3">
//               <span className="text-gray-700 dark:text-gray-300 font-medium">
//                 Welcome, {userProfile.name}
//               </span>
            
//                 <button 
//                   onClick={onLogout}
//                   className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
//                 >
//                   Logout
//                 </button>
          
//             </div>
//           ) : (
//             // Logged out state
//             <Link to="/login">
//               <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
//                 Sign In
//               </button>
//             </Link>
//           )}
//         </div>
//       </div>
//     </header>
//   )
// }

// export default Header

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux'
import { getProfile, setAuthentication } from '../redux/userSlice';
import { toast } from 'react-toastify';

// Enhanced Header Component
const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
   const {userProfile, isAuthenticated} = useSelector((state)=>state.user)
    const dispatch = useDispatch();
    const navigate = useNavigate()

    const onLogout = () => {
        dispatch(setAuthentication(false));
        dispatch(getProfile(null));
        toast.success('Logout successfully!', {
          duration: 4000,
          position: 'top-right',
        });
        navigate("/");
      };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-lg border-b border-gray-200/20 dark:border-gray-700/20' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            EmailFlow
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {userProfile ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userProfile.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {userProfile.name}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-red-500/25 hover:scale-105"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25 hover:scale-105">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;