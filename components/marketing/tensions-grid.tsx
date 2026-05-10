"use client"

import { motion } from "framer-motion"
import { ease, timing } from "@/lib/motion"

/**
 * TensionsGrid — four classes of strategic problem the system surfaces.
 *
 * Plain hairline list. No alternating alignment, no Roman numerals, no
 * blur-on-hover focus pulling. The information is the design.
 */
export function TensionsGrid() {
  const scenes: Scene[] = [
    {
      n: "01",
      label: "ICP / pricing mismatch",
      title: "Your ICP does not match your pricing.",
      idea: "B2B procurement automation, $499/mo",
      trace:
        "ICP is named as solo operators, but $499/mo lands above their discretionary spend. Buyer cannot purchase without procurement, which adds 6 to 12 months of cycle. Pricing or ICP must move.",
      severity: "pricing",
    },
    {
      n: "02",
      label: "build cost vs wedge",
      title: "Integration cost is larger than the wedge.",
      idea: "vertical CRM for solo immigration lawyers",
      trace:
        "Integration surface (state-bar APIs, USCIS forms, e-filing) is 6 to 9 months of build. The wedge itself is one workflow primitive. The moat thickens with each integration, but capital efficiency is at risk.",
      severity: "build cost",
    },
    {
      n: "03",
      label: "buyer / user mismatch",
      title: "The buyer you describe is not the actual user.",
      idea: "AI copilot for clinical operations",
      trace:
        "Brief names the practice owner as buyer. Wedge UX is built for the front-desk staff. Owner has purchase authority but no daily contact with the product. Adoption stalls inside the first 30 days.",
      severity: "wedge mismatch",
    },
    {
      n: "04",
      label: "retention assumption",
      title: "Retention depends on behavior that rarely repeats.",
      idea: "yearly tax-prep tool for solo creators",
      trace:
        "Core action (file taxes) repeats once a year. Retention model assumes monthly engagement. Either the product needs adjacent monthly value, or pricing needs to absorb the annual reality.",
      severity: "retention",
    },
  ]

  return (
    <section
      id="tensions"
      data-section="tensions"
      className="relative isolate bg-ink-1 py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: timing.section.mid, ease: ease.editorial }}
          className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end md:gap-10"
        >
          <div className="md:col-span-7">
            <p className="marketing-label">Examples</p>
            <h2 className="marketing-title mt-4 font-sans">
              Four mismatches we often flag in drafts.
            </h2>
          </div>
          <div className="md:col-span-5 md:pb-1">
            <p className="marketing-body max-w-[560px]">
              Illustrative excerpts — yours will cite the wording you supplied.
            </p>
          </div>
        </motion.div>

        <ul className="divide-y divide-bone-0/[0.08] border-y border-bone-0/[0.08]">
          {scenes.map((scene, i) => (
            <SceneRow key={scene.n} scene={scene} index={i} />
          ))}
        </ul>

        <p className="mt-10 max-w-[68ch] text-[15px] leading-[1.6] text-bone-2">
          Every flag links back to the specific line in your brief that
          triggered it.
        </p>
      </div>
    </section>
  )
}

interface Scene {
  n: string
  label: string
  title: string
  idea: string
  trace: string
  severity: string
}

function SceneRow({ scene, index }: { scene: Scene; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: timing.section.min, delay: index * 0.04, ease: ease.editorial }}
      className="grid grid-cols-1 gap-6 py-10 md:grid-cols-12 md:gap-10"
    >
      {/* Index + label column */}
      <div className="md:col-span-3">
        <div className="flex items-baseline gap-3">
          <span className="mono-caption tabular text-bone-2">{scene.n}</span>
          <span className="mono-caption text-bone-2">·</span>
          <span className="mono-caption text-bone-2">{scene.severity}</span>
        </div>
        <p className="mt-2 mono-caption text-bone-1">{scene.label}</p>
      </div>

      {/* Body column */}
      <div className="md:col-span-9">
        <h3 className="font-sans font-medium text-bone-0 text-[clamp(20px,2.2vw,28px)] leading-[1.2] tracking-[-0.02em]">
          {scene.title}
        </h3>

        <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-[200px_1fr]">
          <div>
            <p className="mono-caption text-bone-2">example brief</p>
            <p className="mt-1.5 text-[14.5px] leading-[1.5] text-bone-1">
              {scene.idea}
            </p>
          </div>
          <div className="border-l-2 border-ember/40 pl-5">
            <p className="mono-caption text-bone-2">trace</p>
            <p className="mt-1.5 text-[15px] leading-[1.6] text-bone-0">
              {scene.trace}
            </p>
          </div>
        </div>
      </div>
    </motion.li>
  )
}
