"use client";

import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { SignedIn, SignInButton, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Header() {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    
    return (
        <motion.header 
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled 
                    ? 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl' 
                    : 'bg-transparent'
            }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex justify-between items-center h-16 md:h-20">
                    {/* Logo */}
                    <Link href={'/'} className="flex items-center group">
                        <motion.div 
                            className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-300"
                            whileHover={{ rotate: 5 }}
                        >
                            <Shield className="w-6 h-6 text-white" />
                        </motion.div>
                        <motion.h1 
                            className="text-xl md:text-2xl font-bold text-white"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            RetailEdge
                        </motion.h1>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <SignedIn>
                            <Link href={'/receipts'}>
                                <Button 
                                    variant={'outline'} 
                                    className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 rounded-xl px-6 py-2 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                                >
                                    My Receipts
                                </Button>
                            </Link>

                            <Link href={'/manage-plan'}>
                                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-500/20">
                                    Manage Plan
                                </Button>
                            </Link>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <UserButton 
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-10 h-10 rounded-xl border-2 border-slate-600"
                                        }
                                    }}
                                />
                            </motion.div>
                        </SignedIn>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-500/20">
                                    Get Started
                                </Button>
                            </SignInButton>
                        </SignedOut>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors duration-200"
                        onClick={toggleMobileMenu}
                        aria-label="Toggle mobile menu"
                    >
                        <AnimatePresence mode="wait">
                            {isMobileMenuOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <X className="w-6 h-6 text-slate-300" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Menu className="w-6 h-6 text-slate-300" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className="md:hidden border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-xl"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="py-6 space-y-4">
                                <SignedIn>
                                    <div className="space-y-3">
                                        <Link href={'/receipts'} onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button 
                                                variant={'outline'} 
                                                className="w-full justify-start border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 rounded-xl px-6 py-3 text-left backdrop-blur-sm"
                                            >
                                                My Receipts
                                            </Button>
                                        </Link>

                                        <Link href={'/manage-plan'} onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl px-6 py-3 text-left border border-blue-500/20">
                                                Manage Plan
                                            </Button>
                                        </Link>

                                        <div className="flex justify-center pt-4">
                                            <UserButton 
                                                appearance={{
                                                    elements: {
                                                        avatarBox: "w-12 h-12 rounded-xl border-2 border-slate-600"
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </SignedIn>
                                <SignedOut>
                                    <div className="pt-4">
                                        <SignInButton mode="modal">
                                            <Button 
                                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-500/20"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Get Started
                                            </Button>
                                        </SignInButton>
                                    </div>
                                </SignedOut>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    )
}

export default Header