"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import SchematicComponent from "@/components/schematic/SchematicComponent";
import Link from "next/link";

export default function ManagePlan() {
  const fadeInUp = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" },
  };

  const invoiceRows = [
    { id: "INV-1042", date: "2026-04-28", amount: "$29.00", status: "Paid" },
    { id: "INV-1038", date: "2026-03-28", amount: "$29.00", status: "Paid" },
    { id: "INV-1032", date: "2026-02-28", amount: "$29.00", status: "Paid" },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f5f7] text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-slate-950/5 blur-3xl" />
        <div className="absolute right-[-8%] top-[22%] h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <section className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
          className="mx-auto max-w-7xl"
        >
          <motion.div variants={fadeInUp} className="mb-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 text-sm text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
              <Sparkles className="h-4 w-4 text-slate-900" />
              Billing and plan controls
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Manage your plan with a cleaner, calmer workspace.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Review your subscription, open the billing portal, and keep your account in sync from one polished dashboard.
            </p>
          </motion.div>

          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-6">
              <motion.aside
                variants={fadeInUp}
                className="surface-card border-white/60 bg-white/90 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Plan status</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">Current account overview</h2>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Active
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {[
                    {
                      icon: BadgeCheck,
                      title: "Receipt scanning",
                      text: "PDF uploads and summaries are enabled for your workspace.",
                    },
                    {
                      icon: CreditCard,
                      title: "Billing details",
                      text: "Update payment methods and review invoices in the portal.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Protected access",
                      text: "Plan changes stay inside the secure billing flow.",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.title}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.35, delay: index * 0.05 }}
                    >
                      <item.icon className="h-5 w-5 text-slate-900" />
                      <h3 className="mt-3 font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-slate-200" />
                    <div>
                      <p className="text-sm font-medium text-white/80">Need a quick reset?</p>
                      <p className="text-sm text-white/55">
                        You can return here anytime to review or adjust your subscription settings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/receipts"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Back to receipts
                  </Link>
                  <a
                    href="#billing-portal"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Open billing portal
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </motion.aside>

              <motion.section
                variants={fadeInUp}
                className="surface-card overflow-hidden border-white/60 bg-white/90 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur"
              >
                <div className="border-b border-slate-200 px-6 py-5 md:px-8">
                  <p className="section-label">Usage</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Your current usage snapshot</h2>
                </div>

                <div className="grid gap-4 p-6 md:grid-cols-3">
                  {[
                    { label: "Scans used", value: "18" },
                    { label: "This month", value: "29" },
                    { label: "Remaining", value: "11" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <p className="text-sm text-slate-500">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="px-6 pb-6 md:px-8">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[62%] rounded-full bg-slate-950" />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    62% of your current allocation is in use.
                  </p>
                </div>
              </motion.section>
            </div>

            <motion.section
              variants={fadeInUp}
              className="surface-card overflow-hidden border-white/60 bg-white/90 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur"
              id="billing-portal"
            >
              <div className="border-b border-slate-200 px-6 py-5 md:px-8">
                <p className="section-label">Billing portal</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Manage your subscription</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Open the embedded portal below to update billing, review invoices, or change plans.
                </p>
              </div>

              <div className="grid gap-6 p-4 md:grid-cols-[0.75fr_1.25fr] md:p-6">
                <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
                  <div className="flex items-center gap-3">
                    <ReceiptText className="h-5 w-5 text-white/80" />
                    <div>
                      <p className="text-sm font-medium text-white/85">Recent invoices</p>
                      <p className="text-sm text-white/55">A quick view of the last billing cycles.</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {invoiceRows.map((row, index) => (
                      <motion.div
                        key={row.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">{row.id}</p>
                            <p className="text-xs text-white/55">{row.date}</p>
                          </div>
                          <p className="text-sm font-semibold text-white">{row.amount}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-white/65">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {row.status}
                          </span>
                          <span>Monthly plan</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 shadow-inner">
                  <SchematicComponent
                    componentId={process.env.NEXT_PUBLIC_SCHEMATIC_CUSTOMER_PORTAL_COMPONENT_ID}
                  />
                </div>
              </div>
            </motion.section>
          </div>

          <motion.div variants={fadeInUp} className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Update billing in seconds",
              "Keep receipts and subscription in one place",
              "Switch plans without leaving the dashboard",
            ].map((item) => (
              <div key={item} className="surface-card p-4 text-sm text-slate-600">
                <BadgeCheck className="mb-2 h-4 w-4 text-emerald-500" />
                {item}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
