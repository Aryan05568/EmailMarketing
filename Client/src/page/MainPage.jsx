// import { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Header from "../Components/Header";
// import { useSelector } from "react-redux";





// export default function MainPage() {
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const navigate = useNavigate();
//   const { userProfile, isAuthenticated } = useSelector((state) => state.user)
//   // const [userProfile] = useState(null);

//   // Animation states
//   const [isVisible, setIsVisible] = useState(true);

//   // useEffect(() => {
//   //   setIsVisible(true);
//   //   if (isAuthenticated) {
//   //     navigate("/dashboard")
//   //   }
//   // }, [isAuthenticated]);



//   const features = [
//     {
//       icon: (
//         <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//         </svg>
//       ),
//       title: "Smart Campaign Management",
//       description: "Create and manage email campaigns with optimization and intuitive drag-and-drop editor.",
//       gradient: "from-blue-500 to-cyan-500"
//     },
//     {
//       icon: (
//         <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//         </svg>
//       ),
//       title: "Advanced Segmentation",
//       description: "Target the right audience with powerful segmentation tools and behavioral triggers.",
//       gradient: "from-purple-500 to-pink-500"
//     },
//     {
//       icon: (
//         <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//         </svg>
//       ),
//       title: "Real-time Analytics",
//       description: "Track performance with detailed analytics, A/B testing, and conversion optimization.",
//       gradient: "from-green-500 to-emerald-500"
//     }
//   ];

//   return (
//     <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900">
//         {/* Background Elements */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
//           <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
//         </div>

//         <Header

//         />

//         {/* Hero Section */}
//         <div className="relative pt-20 pb-16 flex items-center justify-center min-h-screen">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//             <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
//               {/* <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 border border-blue-200 dark:border-blue-800">
//                 <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
//                 Smart Campaigns, Real Results
//               </div> */}

//               <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
//                 <span className="block">Modern Email Marketing</span>
//                 <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
//                   For Modern Businesses
//                 </span>
//               </h1>

//               <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
//                 Create stunning email campaigns that convert. Our platform helps you engage your audience,
//                 optimize performance, and grow your business with ease.
//               </p>

//               <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
//                 <button
//                   onClick={() => navigate("/dashboard")}
//                   className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 overflow-hidden"
//                 >
//                   <span className="relative z-10 flex items-center">
//                     Get Started
//                     <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                     </svg>
//                   </span>
//                   <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//                 </button>


//               </div>

//               {/* <div className="mt-12 flex justify-center items-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
//                 <div className="flex items-center">
//                   <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                   No credit card required
//                 </div>
//                 <div className="flex items-center">
//                   <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                   14-day free trial
//                 </div>
//               </div> */}
//             </div>
//           </div>
//         </div>

//         {/* Features Section */}
//         <div className="relative py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="text-center mb-16">
//               <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase mb-4">
//                 Powerful Features
//               </h2>
//               <h3 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
//                 Everything you need for
//                 <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                   email success
//                 </span>
//               </h3>
//               <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
//                 Our comprehensive suite of tools helps you create, send, and optimize email campaigns that drive results.
//               </p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//               {features.map((feature, index) => (
//                 <div
//                   key={index}
//                   className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700"
//                 >
//                   <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
//                     {feature.icon}
//                   </div>
//                   <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
//                     {feature.title}
//                   </h4>
//                   <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
//                     {feature.description}
//                   </p>
//                   <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* CTA Section */}
//         <div className="relative py-20">
//           <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
//             <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
//               Ready to transform your
//               <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                 email marketing?
//               </span>
//             </h2>
//             <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
//               Join thousands of businesses that trust EmailFlow to deliver results.
//             </p>
//             <button
//               onClick={() => navigate("/dashboard")}
//               className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
//             >
//               Start Your Free Trial
//             </button>
//           </div>
//         </div>

//         {/* Enhanced Footer */}
//         <footer className="relative bg-gray-900 text-white overflow-hidden">
//           <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20"></div>
//           <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
//               {/* Company Info */}
//               <div className="col-span-1 md:col-span-2">
//                 <div className="flex items-center space-x-2 mb-6">
//                   <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
//                     <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                     </svg>
//                   </div>
//                   <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
//                     Brainaura Marketing Tool
//                   </h3>
//                 </div>
//                 <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
//                   The most powerful email marketing platform for modern businesses.
//                   Create, send, and track beautiful email campaigns with ease.
//                 </p>
//                 <div className="flex space-x-4">
//                   {[
//                     { name: 'Facebook', link: "https://www.facebook.com/jimcorbettwedding", icon: 'M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z' },
//                     { name: 'Instagram', link: "https://www.instagram.com/brain_09_aura/?igsh=bzdjcDV6bTdmaGo5#", icon: "M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.75-.88a.88.88 0 1 1-1.75 0 .88.88 0 0 1 1.75 0Z" },
//                     // { name: 'LinkedIn',link:"https://www.facebook.com/jimcorbettwedding", icon: 'M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z' }
//                   ].map((social, index) => (
//                     <a
//                       key={index}
//                       target="_blank"
//                       href={social.link}
//                       className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
//                     >
//                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d={social.icon} clipRule="evenodd" />
//                       </svg>
//                     </a>
//                   ))}
//                 </div>
//               </div>

//               {/* Quick Links */}
//               {/* <div>
//                 <h4 className="text-lg font-semibold mb-6 text-white">Quick Links</h4>
//                 <ul className="space-y-3">
//                   {['Features', 'Pricing', 'Templates', 'Integrations'].map((link, index) => (
//                     <li key={index}>
//                       <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
//                         {link}
//                       </a>
//                     </li>
//                   ))}
//                 </ul>
//               </div> */}

//               {/* Support & Legal */}
//               <div>
//                 <h4 className="text-lg font-semibold mb-6 text-white">Support & Legal</h4>
//                 <ul className="space-y-3">
//                   <li>
//                     <Link to="/terms" className="text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
//                       Terms & Conditions
//                     </Link>
//                   </li>
//                   <li>
//                     <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
//                       Privacy Policy
//                     </Link>
//                   </li>
//                   <li>
//                     <a href="mailto:brain09aura@gmail.com" className="text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
//                       Contact Support
//                     </a>
//                   </li>
//                   <li>
//                     <a  className="text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
//                       Phone Support: +91 8532062775
//                     </a>
//                   </li>
//                 </ul>
//               </div>
//             </div>

//             {/* Bottom Section */}
//             <div className="border-t border-gray-800 pt-8">
//               <div className="flex flex-col md:flex-row justify-between items-center">
//                 <p className="text-gray-400 text-sm">
//                   © {new Date().getFullYear()} Brainaura Marketing Tool. All rights reserved.
//                 </p>
//                 {/* <div className="flex items-center space-x-6 mt-4 md:mt-0">
//                   <span className="text-gray-400 text-sm">Made with ❤️ for marketers</span>
//                 </div> */}
//               </div>
//             </div>
//           </div>
//         </footer>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const navigate = useNavigate();

  const features = [
    {
      title: "Smart Campaign Builder",
      description: "Create professional email campaigns with our intuitive drag-and-drop editor. No coding required.",
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1z" /></svg>,
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      title: "Advanced Analytics",
      description: "Track opens, clicks, and conversions with detailed analytics and insights to optimize your campaigns.",
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "AI-Powered Optimization",
      description: "Let our AI suggest the best send times, subject lines, and content to maximize engagement.",
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
      gradient: "from-violet-500 to-purple-600"
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Main Container with New Color Scheme */}
      <div className="min-h-screen bg-white">
        
        {/* Geometric Background Pattern */}
        {/* <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/10 rounded-full"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-orange-400/10 rotate-45 rounded-lg"></div>
            <div className="absolute bottom-40 left-20 w-40 h-40 bg-violet-400/10 rounded-full"></div>
            <div className="absolute bottom-20 right-10 w-28 h-28 bg-red-400/10 rotate-12 rounded-lg"></div>
          </div>
        </div> */}

        {/* Header with New Design */}
        <header className="relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Brainaura Marketing
                </h1>
              </div>
              
            </div> */}
            <Header/>
          </div>
        </header>

        {/* Hero Section with Split Layout */}
        <section className="relative pt-16 pb-24 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Column - Content */}
              <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
                {/* <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-8">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                  Next-Gen Email Marketing
                </div> */}
                
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                  Email Marketing
                  <span className="block bg-black bg-clip-text text-transparent">
                    That Actually Works
                  </span>
                </h1>
                
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                  Transform your business with intelligent email campaigns. Our platform combines powerful automation, 
                  deep analytics, and AI-driven insights to deliver results that matter.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
                  >
                    Get Started
                    <svg className="inline ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                 
                </div>
                
              
              </div>

              {/* Right Column - Visual */}
              <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
                <div className="relative">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">Campaign Performance</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Real-time analytics</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Open Rate</span>
                          <span className="text-sm font-semibold text-emerald-600">78.3%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full" style={{width: '78.3%'}}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Click Rate</span>
                          <span className="text-sm font-semibold text-orange-600">45.2%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{width: '45.2%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with Cards Layout */}
        {/* <section className="py-20 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase mb-4">
                Features That Drive Results
              </h2>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Why Choose Our Platform?
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Every feature is designed to help you create better campaigns, engage your audience, and grow your business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200 dark:border-slate-700"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    {feature.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* CTA Section */}
        {/* <section className="py-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-orange-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Supercharge Your Email Marketing?
            </h2>
            <p className="text-lg text-emerald-100 mb-8">
              Join over 10,000 businesses already using our platform to grow their audience and increase revenue.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-10 py-4 bg-white text-emerald-600 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Get Started Today
            </button>
          </div>
        </section> */}

        {/* Footer with New Design */}
        {/* <footer className="bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
           
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Brainaura Marketing
                  </h3>
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Empowering businesses with intelligent email marketing solutions that drive real results.
                </p>
                <div className="flex space-x-4">
                  {[
                    { name: 'Facebook', link: "https://www.facebook.com/jimcorbettwedding", icon: 'M18.77 7.46H15.5v-1.9c0-.9.6-1.1 1-.1h2.2v-3.4h-3c-3.3 0-4 2.5-4 4.1v1.3h-2v3.4h2v8.6h3.5v-8.6h2.97l.3-3.4z' },
                    { name: 'Instagram', link: "https://www.instagram.com/brain_09_aura/?igsh=bzdjcDV6bTdmaGo5#", icon: "M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.3 2.2-.4 1.3-.1 1.7-.1 4.9-.1zm0-2.2c-3.3 0-3.7 0-5 .1-1.3.1-2.2.2-3 .5-.8.3-1.5.7-2.2 1.4-.7.7-1.1 1.4-1.4 2.2-.3.8-.4 1.7-.5 3-.1 1.3-.1 1.7-.1 5s0 3.7.1 5c.1 1.3.2 2.2.5 3 .3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.7.4 3 .5 1.3.1 1.7.1 5 .1s3.7 0 5-.1c1.3-.1 2.2-.2 3-.5.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.4-1.7.5-3 .1-1.3.1-1.7.1-5s0-3.7-.1-5c-.1-1.3-.2-2.2-.5-3-.3-.8-.7-1.5-1.4-2.2-.7-.7-1.4-1.1-2.2-1.4-.8-.3-1.7-.4-3-.5-1.3-.1-1.7-.1-5-.1zm0 5.4c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 9.9c-2.1 0-3.9-1.7-3.9-3.9s1.7-3.9 3.9-3.9 3.9 1.7 3.9 3.9-1.8 3.9-3.9 3.9zm7.8-10.1c0 .8-.6 1.4-1.4 1.4s-1.4-.6-1.4-1.4.6-1.4 1.4-1.4 1.4.6 1.4 1.4z" }
                  ].map((social, index) => (
                    <a
                      key={index}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-slate-800 hover:bg-gradient-to-br hover:from-emerald-600 hover:to-teal-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d={social.icon} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

             
              <div>
                <h4 className="text-lg font-semibold mb-6 text-white">Contact Us</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="mailto:brain09aura@gmail.com" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      brain09aura@gmail.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+918532062775" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      +91 8532062775
                    </a>
                  </li>
                </ul>
              </div>

            
              <div>
                <h4 className="text-lg font-semibold mb-6 text-white">Legal</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200">
                      Terms & Conditions
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200">
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            
            <div className="border-t border-slate-800 pt-8">
              <div className="text-center">
                <p className="text-slate-400 text-sm">
                  © {new Date().getFullYear()} Brainaura Marketing Tool. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer> */}
      </div>
    </div>
  );
};

export default LandingPage;