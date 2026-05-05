"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"

export function MemoProof() {
  return (
    <section data-section="proof" className="relative border-b border-bone-0/[0.06] py-32 md:py-48">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-2">
            <p className="mono-caption">{microcopy.proof.eyebrow}</p>
          </div>
          <div className="md:col-span-10">
            <motion.blockquote
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.8, ease: ease.editorial }}
              className="font-serif text-[clamp(36px,5.5vw,72px)] leading-[1.05] tracking-[-0.025em] text-bone-0"
            >
              <span aria-hidden className="mr-2 text-bone-0/30">&ldquo;</span>
              {microcopy.proof.quote}
              <span aria-hidden className="ml-1 text-bone-0/30">&rdquo;</span>
            </motion.blockquote>
            <p className="mono-caption mt-8">— {microcopy.proof.attribution}</p>

            <div className="mt-20 grid grid-cols-2 gap-px border border-bone-0/10 bg-bone-0/10 md:grid-cols-4">
              {microcopy.proof.stats.map((s, i) => (
                <Stat key={s.label} value={s.value} label={s.label} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label, index }: { value: string; label: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-10%" })
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (!inView) return
    const numericMatch = value.match(/^(\d+)(\D*)$/)
    if (!numericMatch) return
    const target = Number(numericMatch[1])
    const suffix = numericMatch[2]
    let frame = 0
    const duration = 30
    const id = setInterval(() => {
      frame += 1
      const eased = 1 - Math.pow(1 - frame / duration, 3)
      const v = Math.round(target * eased)
      setDisplay(`${v}${suffix}`)
      if (frame >= duration) clearInterval(id)
    }, 24)
    return () => clearInterval(id)
  }, [inView, value])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: ease.editorial }}
      className="flex flex-col justify-between gap-6 bg-ink-0 p-8 md:p-10"
    >
      <span className="tabular font-sans text-[clamp(40px,4vw,64px)] font-medium leading-none tracking-[-0.03em] text-bone-0">
        {display}
      </span>
      <span className="mono-caption">{label}</span>
    </motion.div>
  )
}
