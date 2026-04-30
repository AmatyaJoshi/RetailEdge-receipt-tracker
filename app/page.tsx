"use client";

import PDFDropzone from "@/components/PDFDropzone";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  BadgeCheck,
  Clock3,
  Receipt,
  Shield,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: "easeOut" },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f5f7] text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-slate-950/5 blur-3xl" />
        <div className="absolute right-[-8%] top-[18%] h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[24%] h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <section className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 text-sm text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur"
            >
              <Sparkles className="h-4 w-4 text-slate-900" />
              Receipt workspace for modern teams
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-4 max-w-2xl">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl lg:text-6xl">
                A cleaner way to upload, read, and review receipts.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                Capture documents in one place, surface the important details instantly, and keep the review flow polished enough to feel like a real product experience.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
              <Link href="/receipts">
                <Button className="rounded-full bg-slate-950 px-6 text-white shadow-lg shadow-slate-950/10 hover:bg-slate-800">
                  View receipts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#upload">
                <Button
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white px-6 text-slate-700 hover:bg-slate-50"
                >
                  Upload a PDF
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="grid gap-3 sm:grid-cols-3">
              {["Fast upload", "Readable summaries", "Convex sync"].map((item) => (
                <div key={item} className="surface-card px-4 py-3 text-sm text-slate-600">
                  {item}
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="grid gap-3 sm:grid-cols-3">
              {[
                "Upload",
                "Process",
                "Review",
              ].map((step, index) => (
                <div key={step} className="surface-card p-4">
                  <div className="text-sm font-semibold text-slate-950">0{index + 1}</div>
                  <div className="mt-1 text-sm text-slate-600">{step}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            id="upload"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="surface-card border-white/60 bg-white/90 p-4 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="section-label">Upload</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">Add a receipt</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                <Shield className="h-3.5 w-3.5" />
                Secure
              </div>
            </div>
            <PDFDropzone />
          </motion.div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            "Upload a PDF receipt",
            "Extract merchant, totals, and items",
            "Review the saved record in Convex",
          ].map((item) => (
            <div key={item} className="surface-card p-4 text-sm text-slate-600">
              <Check className="mb-2 h-4 w-4 text-slate-400" />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.section
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.35 }}
            className="surface-card p-6 md:p-8"
          >
            <p className="section-label">Product highlights</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Built to feel like a polished app, not a form.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              The layout now uses more space, stronger hierarchy, and motion that guides the eye from upload to review.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: Receipt,
                  title: "Receipt workspace",
                  copy: "An organized place to upload, inspect, and revisit saved documents.",
                },
                {
                  icon: Clock3,
                  title: "Live status",
                  copy: "The list updates as receipts move from pending to processed.",
                },
                {
                  icon: BarChart3,
                  title: "Readable detail",
                  copy: "Summary, totals, and items are grouped in an easy flow.",
                },
                {
                  icon: UploadCloud,
                  title: "Fast entry",
                  copy: "The upload card stays prominent while the rest of the page gives it context.",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                >
                  <item.icon className="h-5 w-5 text-slate-900" />
                  <h3 className="mt-3 font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.copy}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.35 }}
            className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] md:p-8"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.18),transparent_30%)]" />
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.24em] text-white/50">Scroll story</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                A page that keeps going and feels worth exploring.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                The landing page now continues below the fold with layered sections, clear structure, and a dark visual break so the header’s color shift feels natural.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Deliberate scrolling rhythm",
                  "Layered cards and clear hierarchy",
                  "Responsive layout from mobile to desktop",
                  "A visual break before the next section",
                ].map((item, index) => (
                  <motion.div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 backdrop-blur-sm"
                    initial={{ opacity: 0, x: 14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.35, delay: index * 0.06 }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.section
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-[2rem] bg-slate-950 p-6 text-white md:p-8"
          >
            <p className="text-sm uppercase tracking-[0.24em] text-white/50">Workflow</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
              The review flow stays calm from start to finish.
            </h2>
            <div className="mt-6 space-y-4">
              {[
                {
                  step: "01",
                  title: "Upload a PDF",
                  copy: "Drop a receipt into the workspace or choose one manually.",
                },
                {
                  step: "02",
                  title: "Review the record",
                  copy: "Open the receipt page and see the summary, the extracted fields, and the item table.",
                },
                {
                  step: "03",
                  title: "Clear history",
                  copy: "Start fresh any time with a single action from the receipts list.",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, delay: index * 0.07 }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-semibold text-slate-950">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/70">{item.copy}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="surface-card p-6 md:p-8"
          >
            <p className="section-label">More to explore</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              The page is now long enough to feel like a full website.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              More vertical space means the header has a clear scroll state change, the upload section has room to breathe, and the app feels deliberate instead of cramped.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Scroll-aware header color shift",
                "Balanced spacing across the page",
                "Subtle motion on each section",
                "A clearer story from top to bottom",
              ].map((item, index) => (
                <motion.div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <BadgeCheck className="h-4 w-4 text-emerald-500" />
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </section>
    </div>
  );
}
