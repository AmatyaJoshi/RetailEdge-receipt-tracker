"use client";

import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { SignedIn, SignInButton, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Header() {
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
                    ? 'bg-slate-950/90 text-white backdrop-blur-xl border-b border-white/10 shadow-[0_12px_40px_rgba(15,23,42,0.22)]' 
                    : 'bg-transparent text-slate-950'
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
                            className={`p-2 rounded-xl mr-3 transition-transform duration-300 group-hover:scale-105 ${
                                isScrolled ? "bg-white text-slate-950" : "bg-slate-950 text-white"
                            }`}
                            whileHover={{ rotate: 5 }}
                        >
                            <Shield className="w-6 h-6" />
                        </motion.div>
                        <motion.h1 
                            className={`text-xl md:text-2xl font-semibold ${isScrolled ? "text-white" : "text-slate-950"}`}
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            RetailEdge
                        </motion.h1>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-3">
                        <Link href={'/receipts'}>
                            <Button 
                                variant={'outline'} 
                                className={`rounded-full px-5 py-2 ${
                                    isScrolled
                                        ? "border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                            >
                                My Receipts
                            </Button>
                        </Link>

                        <Link href={'/manage-plan'}>
                            <Button className={`rounded-full px-5 py-2 ${isScrolled ? "bg-white text-slate-950 hover:bg-slate-100" : "bg-slate-950 text-white hover:bg-slate-800"}`}>
                                Manage Plan
                            </Button>
                        </Link>

                        <SignedIn>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <UserButton 
                                appearance={{
                                    elements: {
                                        avatarBox: `w-10 h-10 rounded-full border ${isScrolled ? "border-white/15" : "border-slate-200"}`
                                    }
                                }}
                            />
                            </motion.div>
                        </SignedIn>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <Button className={`rounded-full px-5 py-2 ${isScrolled ? "bg-white text-slate-950 hover:bg-slate-100" : "bg-slate-950 text-white hover:bg-slate-800"}`}>
                                    Get Started
                                </Button>
                            </SignInButton>
                        </SignedOut>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className={`md:hidden p-2 rounded-lg transition-colors duration-200 ${
                            isScrolled ? "hover:bg-white/10" : "hover:bg-slate-100"
                        }`}
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
                                    <X className={`w-6 h-6 ${isScrolled ? "text-white" : "text-slate-700"}`} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Menu className={`w-6 h-6 ${isScrolled ? "text-white" : "text-slate-700"}`} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className={`md:hidden border-t backdrop-blur ${
                                isScrolled
                                    ? "border-white/10 bg-slate-950/95 text-white"
                                    : "border-slate-200 bg-white/95 text-slate-950"
                            }`}
                            initial={{ opacity: 0, scaleY: 0.96, transformOrigin: "top" }}
                            animate={{ opacity: 1, scaleY: 1, transformOrigin: "top" }}
                            exit={{ opacity: 0, scaleY: 0.96, transformOrigin: "top" }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="py-6 space-y-4">
                                <div className="space-y-3">
                                    <Link href={'/receipts'} onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button 
                                            variant={'outline'} 
                                            className={`w-full justify-start rounded-xl px-6 py-3 text-left ${
                                                isScrolled
                                                    ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            My Receipts
                                        </Button>
                                    </Link>

                                    <Link href={'/manage-plan'} onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className={`w-full justify-start rounded-xl px-6 py-3 text-left ${isScrolled ? "bg-white text-slate-950 hover:bg-slate-100" : "bg-slate-950 text-white hover:bg-slate-800"}`}>
                                            Manage Plan
                                        </Button>
                                    </Link>
                                </div>

                                <SignedIn>
                                    <div className="flex justify-center pt-4">
                                        <UserButton 
                                            appearance={{
                                                elements: {
                                                    avatarBox: "w-12 h-12 rounded-full border border-slate-200"
                                                }
                                            }}
                                        />
                                    </div>
                                </SignedIn>
                                <SignedOut>
                                    <div className="pt-4">
                                        <SignInButton mode="modal">
                                            <Button 
                                                className={`w-full rounded-xl px-6 py-3 ${isScrolled ? "bg-white text-slate-950 hover:bg-slate-100" : "bg-slate-950 text-white hover:bg-slate-800"}`}
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
