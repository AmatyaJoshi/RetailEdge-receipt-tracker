"use client";

import PDFDropzone from "@/components/PDFDropzone";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart, Check, Search, Shield, Upload, Sparkles, Zap, TrendingUp, Users, Globe, Lock, Database, Cpu, BarChart3 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY } = e;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      
      const x = (clientX - left) / width;
      const y = (clientY - top) / height;
      
      containerRef.current.style.setProperty('--mouse-x', `${x}`);
      containerRef.current.style.setProperty('--mouse-y', `${y}`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden" ref={containerRef}>
      {/* Professional Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        
        {/* Subtle mesh gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x,_0.5)_var(--mouse-y,_0.5),_rgba(30,64,175,0.15)_0%,_transparent_50%)]" />
        
        {/* Professional pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%233B82F6%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-blue-600/5" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-blue-600/5" />
      </div>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 min-h-screen flex items-center">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div 
            className="flex flex-col items-center space-y-6 text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >

            {/* Main Heading */}
            <motion.div className="space-y-4 max-w-5xl" variants={fadeInUp}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white">
                Intelligent Receipt
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Processing Platform
                </span>
              </h1>
              <p className="mx-auto max-w-3xl text-xl md:text-2xl text-slate-300 leading-relaxed">
                Transform your expense management with enterprise-grade AI technology. 
                <span className="font-semibold text-white"> Process, analyze, and extract</span> data from receipts with unmatched accuracy and speed.
              </p>
            </motion.div>



            {/* CTA Buttons */}
            <motion.div className="flex flex-col sm:flex-row gap-6 items-center mt-12" variants={fadeInUp}>
              <Link href="/receipts">
                <Button className="group relative px-10 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 border border-blue-500/20">
                  Start Processing
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="px-10 py-4 text-lg font-semibold border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 rounded-xl transition-all duration-300 backdrop-blur-sm">
                  View Capabilities
                </Button>
              </Link>
            </motion.div>

            {/* Enterprise Stats */}
            <motion.div className="flex flex-wrap justify-center gap-12 mt-16" variants={fadeInUp}>
              {[
                { number: "99.9%", label: "Accuracy Rate", icon: Shield },
                { number: "10M+", label: "Documents Processed", icon: Database },
                { number: "24/7", label: "AI Processing", icon: Cpu },
                { number: "500+", label: "Enterprise Clients", icon: Users }
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-600 group-hover:border-blue-500 transition-colors duration-300">
                    <stat.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Professional Floating Elements */}
        <motion.div 
          className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-slate-600/20 to-blue-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
      </section>



      {/* Enterprise Features Section */}
      <section id="features" className="py-24 relative z-10">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Enterprise-Grade
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Capabilities
              </span>
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-slate-300">
              Built for scale, security, and performance. Trusted by Fortune 500 companies worldwide.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Upload,
                title: "Advanced OCR Processing",
                description: "State-of-the-art optical character recognition with 99.9% accuracy across all document types and formats.",
                color: "from-blue-500 to-blue-600",
                bgColor: "from-slate-800/80 to-slate-700/80"
              },
              {
                icon: Search,
                title: "AI-Powered Analysis",
                description: "Machine learning algorithms that automatically categorize, tag, and extract relevant financial data from receipts.",
                color: "from-cyan-500 to-cyan-600",
                bgColor: "from-slate-800/80 to-slate-700/80"
              },
              {
                icon: BarChart3,
                title: "Business Intelligence",
                description: "Comprehensive reporting and analytics dashboard providing insights into spending patterns and expense optimization.",
                color: "from-blue-500 to-cyan-500",
                bgColor: "from-slate-800/80 to-slate-700/80"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="group relative p-8 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm hover:backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10"
                variants={fadeInUp}
                whileHover={{ y: -10 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-6 shadow-lg`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enterprise Pricing Section */}
      <section className="py-24 bg-gradient-to-br from-slate-800/50 to-slate-900/50 relative z-10">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Enterprise
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Pricing Plans
              </span>
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-slate-300">
              Scalable solutions designed for businesses of all sizes. No hidden fees, enterprise-grade support included.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                name: "Professional",
                price: "₹299",
                description: "Perfect for growing businesses",
                features: ["50 Scans per month", "Advanced OCR processing", "30-day data retention", "Email support", "Basic analytics"],
                buttonText: "Start Professional",
                buttonVariant: "outline" as const,
                popular: false
              },
              {
                name: "Enterprise",
                price: "₹599",
                description: "For established organizations",
                features: ["300 Scans per month", "AI-powered analysis", "Unlimited retention", "Priority support", "Advanced analytics", "Custom integrations"],
                buttonText: "Get Enterprise",
                buttonVariant: "default" as const,
                popular: true
              },
              {
                name: "Custom",
                price: "Contact",
                description: "Tailored enterprise solutions",
                features: ["Unlimited processing", "Custom AI models", "Dedicated support", "White-label options", "API access", "SLA guarantees"],
                buttonText: "Contact Sales",
                buttonVariant: "outline" as const,
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                className={`relative p-8 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                  plan.popular 
                    ? 'border-blue-500 bg-gradient-to-br from-slate-800 to-slate-700 shadow-2xl shadow-blue-500/20' 
                    : 'border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm'
                }`}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 mb-6">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    {plan.price !== "Contact" && (
                      <span className="text-slate-400 ml-2">/month</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.name === "Custom" ? "/contact" : "/manage-plans"}>
                  <Button 
                    className={`w-full py-3 text-lg font-semibold rounded-xl transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl' 
                        : 'border-2 hover:bg-slate-700 hover:border-slate-500 text-slate-300'
                    }`}
                    variant={plan.buttonVariant}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enterprise CTA Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Transform Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Expense Management?
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of enterprises that trust our platform for their document processing needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/receipts">
                <Button className="px-12 py-4 text-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 border border-blue-500/20">
                  Start Processing Today
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="px-12 py-4 text-xl font-semibold border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 rounded-xl transition-all duration-300 backdrop-blur-sm">
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">
                RetailEdge
              </span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-slate-300 mb-2">
                Enterprise-grade receipt processing platform
              </p>
              <p className="text-sm text-slate-500">
                © 2024 RetailEdge. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
