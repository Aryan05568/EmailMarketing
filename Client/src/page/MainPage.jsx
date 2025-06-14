import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../Components/Header";
import { useSelector } from "react-redux";

// export default function MainPage() {
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const navigate = useNavigate()
//   // Simple auth state simulation
//   const [isAuthenticated] = useState(false);

 

//   // If authenticated, redirect to dashboard
//   useEffect(() => {
//     if (isAuthenticated) {
//       window.location.href = "/";
//     }
//   }, [isAuthenticated]);

//   return (
//     <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
//       <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
//         {/* Header */}
//        <Header/>

//         {/* Hero Section */}
//         <div className="flex-grow flex items-center justify-center">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
//             <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
//               <span className="block">Modern Email Marketing</span>
//               <span className="block text-blue-600 dark:text-blue-400">For Modern Businesses</span>
//             </h1>
//             <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
//               Create, manage, and analyze your email campaigns with ease. Engage your audience with beautiful emails and track your success.
//             </p>
//             <div className="mt-10">
//               <div className="rounded-md shadow">
//                 <a >
//                   <button onClick={()=>navigate("/dashboard")} className="px-8 py-3 text-base font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
//                     Get Started
//                   </button>
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Features Section */}
//         <div className="bg-white dark:bg-gray-800 py-12">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="lg:text-center">
//               <h2 className="text-base text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase">Features</h2>
//               <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
//                 Everything you need for email success
//               </p>
//             </div>

//             <div className="mt-10">
//               <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
//                 <div className="flex flex-col items-center">
//                   <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                     </svg>
//                   </div>
//                   <div className="mt-5 text-center">
//                     <h3 className="text-lg font-medium text-gray-900 dark:text-white">Campaign Management</h3>
//                     <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
//                       Create and manage email campaigns with our intuitive dashboard.
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex flex-col items-center">
//                   <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//                     </svg>
//                   </div>
//                   <div className="mt-5 text-center">
//                     <h3 className="text-lg font-medium text-gray-900 dark:text-white">Subscriber Management</h3>
//                     <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
//                       Organize your audience with simple list management tools.
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex flex-col items-center">
//                   <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                     </svg>
//                   </div>
//                   <div className="mt-5 text-center">
//                     <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analytics Dashboard</h3>
//                     <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
//                       Track performance with detailed analytics and reporting.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <footer className="bg-gray-900 text-white">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//           {/* Company Info */}
//           <div className="col-span-1 md:col-span-2">
//             <h3 className="text-2xl font-bold text-blue-400 mb-4">EmailFlow</h3>
//             <p className="text-gray-300 mb-4 max-w-md">
//               Professional email marketing platform . 
//               Create, send, and track powerful email campaigns with ease.
//             </p>
//             <div className="flex space-x-4">
//               <a href="#" className="text-gray-400 hover:text-white transition-colors">
//                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
//                 </svg>
//               </a>
//               <a href="#" className="text-gray-400 hover:text-white transition-colors">
//                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                   <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
//                 </svg>
//               </a>
//               <a href="#" className="text-gray-400 hover:text-white transition-colors">
//                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
//                 </svg>
//               </a>
//             </div>
//           </div>

   

//           {/* Support & Legal */}
//           <div>
//             <h4 className="text-lg font-semibold mb-4">Support & Legal</h4>
//             <ul className="space-y-2">
           
//               <li>
//                 <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">
//                   Terms & Conditions
//                 </Link>
//               </li>
//               <li>
//                 <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">
//                   Privacy Policy
//                 </Link>
//               </li>
//             </ul>
//           </div>
//         </div>

//         {/* Bottom Section */}
//         <div className="border-t border-gray-800 mt-8 pt-8">
//           <div className="flex flex-col md:flex-row justify-between items-center">
//             <p className="text-gray-400 text-sm">
//               © {new Date().getFullYear()} EmailFlow. All rights reserved.
//             </p>
//             <div className="flex space-x-6 mt-4 md:mt-0">
//               <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
//                 Terms
//               </Link>
//               <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
//                 Privacy
//               </Link>
//               <a href="mailto:support@emailflow.com" className="text-gray-400 hover:text-white text-sm transition-colors">
//                 Support
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>
//     </footer>
//       </div>
//     </div>
//   );
// }



export default function MainPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const {userProfile, isAuthenticated} = useSelector((state)=>state.user)
  // const [userProfile] = useState(null);

  // Animation states
  const [isVisible, setIsVisible] = useState(true);

  // useEffect(() => {
  //   setIsVisible(true);
  //   if (isAuthenticated) {
  //     navigate("/dashboard")
  //   }
  // }, [isAuthenticated]);

 

  const features = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "Smart Campaign Management",
      description: "Create and manage email campaigns with AI-powered optimization and intuitive drag-and-drop editor.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: "Advanced Segmentation",
      description: "Target the right audience with powerful segmentation tools and behavioral triggers.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Real-time Analytics",
      description: "Track performance with detailed analytics, A/B testing, and conversion optimization.",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>

        <Header 
         
        />

        {/* Hero Section */}
        <div className="relative pt-20 pb-16 flex items-center justify-center min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 border border-blue-200 dark:border-blue-800">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                New: AI-Powered Email Optimization
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                <span className="block">Modern Email Marketing</span>
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  For Modern Businesses
                </span>
              </h1>
              
              <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Create stunning email campaigns that convert. Our AI-powered platform helps you engage your audience, 
                optimize performance, and grow your business with ease.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    Get Started 
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                
              </div>
              
              <div className="mt-12 flex justify-center items-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  No credit card required
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  14-day free trial
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase mb-4">
                Powerful Features
              </h2>
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Everything you need for
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  email success
                </span>
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Our comprehensive suite of tools helps you create, send, and optimize email campaigns that drive results.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to transform your
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                email marketing?
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
              Join thousands of businesses that trust EmailFlow to deliver results.
            </p>
            <button 
              onClick={() => navigate("/dashboard")}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
            >
              Start Your Free Trial
            </button>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="relative bg-gray-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              {/* Company Info */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    EmailFlow
                  </h3>
                </div>
                <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                  The most powerful email marketing platform for modern businesses. 
                  Create, send, and track beautiful email campaigns with ease.
                </p>
                <div className="flex space-x-4">
                  {[
                    { name: 'Facebook', icon: 'M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z' },
                    { name: 'Twitter', icon: 'M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84' },
                    { name: 'LinkedIn', icon: 'M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z' }
                  ].map((social, index) => (
                    <a 
                      key={index}
                      href="#" 
                      className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d={social.icon} clipRule="evenodd" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              {/* <div>
                <h4 className="text-lg font-semibold mb-6 text-white">Quick Links</h4>
                <ul className="space-y-3">
                  {['Features', 'Pricing', 'Templates', 'Integrations'].map((link, index) => (
                    <li key={index}>
                      <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div> */}

              {/* Support & Legal */}
              <div>
                <h4 className="text-lg font-semibold mb-6 text-white">Support & Legal</h4>
                <ul className="space-y-3">
                  <li>
                    <Link to="/terms" className="text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <a href="mailto:support@emailflow.com" className="text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                      Contact Support
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-800 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-400 text-sm">
                  © {new Date().getFullYear()} EmailFlow. All rights reserved.
                </p>
                <div className="flex items-center space-x-6 mt-4 md:mt-0">
                  <span className="text-gray-400 text-sm">Made with ❤️ for marketers</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}