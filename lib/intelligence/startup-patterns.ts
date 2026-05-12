/** Explicit startup intelligence primitives — not embeddings-first RAG */

export type MarketType =
  | "marketplace"
  | "developer_tool"
  | "consumer_social"
  | "b2b_saas"
  | "fintech"
  | "creator_tool"
  | "infra"
  | "ecommerce"
  | "workflow"
  | "ai_wrapper"

export type DistributionModel =
  | "bottom_up"
  | "sales_led"
  | "viral"
  | "creator_led"
  | "seo"
  | "community"
  | "paid_acquisition"
  | "supply_side_first"

export type NetworkEffectType = "none" | "direct" | "cross_side" | "data" | "workflow_lockin"

export type SwitchTier = "low" | "medium" | "high"

export type BehavioralDependency =
  | "habit"
  | "utility"
  | "status"
  | "trust"
  | "identity"
  | "fear"
  | "social_validation"

export type RiskTier = "low" | "medium" | "high"

/** Full structured pattern — synthesized from idea copy + curated anchors */
export type StartupPattern = {
  id: string
  marketType: MarketType
  distributionModel: DistributionModel
  networkEffectType: NetworkEffectType
  switchingCost: SwitchTier
  behavioralDependency: BehavioralDependency
  timingSensitivity: RiskTier
  platformRisk: RiskTier
  operationalComplexity: RiskTier
  monetizationRisk: RiskTier
  /** Narrative tags for prompts (counter-positioning, trust mechanics, etc.) */
  patternTags?: string[]
}

export type HistoricalMechanismProfile = {
  id: string
  aliases: string[]
  marketType: MarketType
  /** Seed primitives — mapper refines against idea text when unclear */
  distributionModel: DistributionModel
  networkEffectType: NetworkEffectType
  switchingCost: SwitchTier
  behavioralDependency: BehavioralDependency
  timingSensitivity: RiskTier
  platformRisk: RiskTier
  operationalComplexity: RiskTier
  monetizationRisk: RiskTier
  patternTags: string[]
  /** Mechanism bullets — terse, causal, usable in prompts */
  whyWorkedOneLiner: string
  nearDeathOneLiner: string
  distributionAdvantageOneLiner: string
  behavioralInsightOneLiner: string
  timingOneLiner: string
  operationalBottleneckOneLiner: string
  monetizationModelOneLiner: string
  moatOneLiner: string
}

/** Curated anchors — avoids logo-chasing; emphasizes mechanisms */
export const HISTORICAL_MECHANISM_LIBRARY: HistoricalMechanismProfile[] = [
  {
    id: "airbnb",
    aliases: [
      "airbnb",
      "air bnb",
      "rent spare rooms",
      "homes to travelers",
      "reviews build trust",
      "trust between strangers",
      "short-term rental marketplace",
      "vacation rental",
    ],
    marketType: "marketplace",
    distributionModel: "supply_side_first",
    networkEffectType: "cross_side",
    switchingCost: "low",
    behavioralDependency: "trust",
    timingSensitivity: "high",
    platformRisk: "medium",
    operationalComplexity: "high",
    monetizationRisk: "medium",
    patternTags: [
      "low_trust_substitute_for_hotels",
      "urban_density_requires_local_liquidity",
      "behavioral_reframe_guest_as_local",
      "supply_quality_variance_is_the_product",
      "trust_bottleneck_not_listings_count",
      "photography_and_standards_supply_unlock",
    ],
    whyWorkedOneLiner:
      "Homes competed when hotel UX felt institutional and homogeneous while supply quality variance made trust legible.",
    nearDeathOneLiner:
      "Early chicken-and-egg plus illegal gray markets could have stalled repeat cross-side liquidity city by city.",
    distributionAdvantageOneLiner:
      "Inventory bootstrapped from Craigslist-era supply surplus and traveler demand clustered in choke cities.",
    behavioralInsightOneLiner:
      "Travelers tolerated stranger homes when photos + reviews shrunk perceived variance faster than boutique hotels iterated.",
    timingOneLiner:
      "Mobile photo sharing plus online payments lowered coordination cost right as hotel RevPAR tightened post-crisis demand shifts.",
    operationalBottleneckOneLiner:
      "Neighbor regulation, cleanliness variance, payout fraud — ops not search — scales the bottleneck.",
    monetizationModelOneLiner:
      "Take rate on scarce nights with dynamic pricing anchored to comps, not SaaS seats.",
    moatOneLiner:
      "Dense two-sided repetition plus review reputation — not UX chrome — anchors retention.",
  },
  {
    id: "uber",
    aliases: ["uber", "lyft", "rideshare", "ride-hailing", "matching drivers and riders", "drivers and riders"],
    marketType: "marketplace",
    distributionModel: "supply_side_first",
    networkEffectType: "cross_side",
    switchingCost: "low",
    behavioralDependency: "utility",
    timingSensitivity: "high",
    platformRisk: "medium",
    operationalComplexity: "high",
    monetizationRisk: "medium",
    patternTags: [
      "utilitarian_trips_local_density_monopoly",
      "subsidy_wars_until_ride_eta_becomes_entropy",
      "regulatory_ambush_city_by_city",
      "dispatch_graph_not_brand_is_wedge_days_zero",
      "supply_churn_via_multihoming_driver_apps",
    ],
    whyWorkedOneLiner:
      "Black-car reliability plus map UX collapsed wait uncertainty vs legacy taxi dispatch opacity.",
    nearDeathOneLiner:
      "Unit economics drowned when subsidies chased rider habit before driver supply elasticity stabilized.",
    distributionAdvantageOneLiner:
      "City concentration plus driver incentives compounded ETA advantage until liquidity became existential for competitors.",
    behavioralInsightOneLiner:
      "Riders churn quietly on variance of ETA and price shocks — habit lives in dispatch certainty, not marketing.",
    timingOneLiner:
      "Smartphones + ubiquitous GPS made metering trips legible overnight; taxis could not refactor dispatch graphs fast enough.",
    operationalBottleneckOneLiner:
      "Insurance, vetting churn, harassment incidents — localized safety tails decide brand, not HQ PR.",
    monetizationModelOneLiner:
      "Take rate atop thin driver margins plus surge as capacity pricing valve.",
    moatOneLiner:
      "Hyperlocal liquidity graph > national brand awareness once ETAs converge.",
  },
  {
    id: "stripe",
    aliases: ["stripe", "paddle", "payments api", "developer-first payments", "onboarding in minutes"],
    marketType: "developer_tool",
    distributionModel: "bottom_up",
    networkEffectType: "workflow_lockin",
    switchingCost: "medium",
    behavioralDependency: "utility",
    timingSensitivity: "medium",
    platformRisk: "medium",
    operationalComplexity: "high",
    monetizationRisk: "low",
    patternTags: [
      "payments_apis_that_feel_like_software_not_banking_cosplay",
      "docs_and_webhooks_migration_friction_engine",
      "bundle_threat_from_cloud_hyperscaler_payments_tabs",
      "seven_lines_of_integration_moment_vs_rfp_molasses",
    ],
    whyWorkedOneLiner:
      "Stripe won when developer time cost dominated merchant fee debates — tooling beat bank paperwork latency.",
    nearDeathOneLiner:
      "Fraud underwriting + chargebacks can erase margin if onboarding loosens for growth.",
    distributionAdvantageOneLiner:
      "Bottom-up integrations inside repos spread faster than top-down issuer partnerships sold decks.",
    behavioralInsightOneLiner:
      "Engineers adopt tools that shorten time-to-money-event; euphemisms about synergy lose to runnable examples.",
    timingOneLiner:
      "Explosion of SaaS billing plus card-not-present ecommerce turned payments into a nightly pager problem.",
    operationalBottleneckOneLiner:
      "Compliance, global acquiring rails, outage SEV response — infra credibility is the SKU.",
    monetizationModelOneLiner:
      "Take rate plus premium risk products anchored to GMV uplift and decline recovery.",
    moatOneLiner:
      "Switching churns payouts + finance ops — migrating provider touches every refund path.",
  },
  {
    id: "shopify",
    aliases: ["shopify", "ecommerce", "hosted store builder", "app ecosystem for merchants"],
    marketType: "ecommerce",
    distributionModel: "community",
    networkEffectType: "data",
    switchingCost: "medium",
    behavioralDependency: "utility",
    timingSensitivity: "medium",
    platformRisk: "high",
    operationalComplexity: "medium",
    monetizationRisk: "low",
    patternTags: [
      "merchant_operating_system_not_storefront_widgets",
      "app_ecosystem_data_loop_on_catalog_performance",
      "channel_risk_via_meta_amazon_substitution",
    ],
    whyWorkedOneLiner:
      "SMBs centralized catalog + fulfillment ops when storefront hosting alone stopped compounding marginal dollars.",
    nearDeathOneLiner:
      "Platform traffic taxes (ads/OS fees) hollow GMV narratives if cohort ROAS slips.",
    distributionAdvantageOneLiner:
      "Partner/channel plus founder word-of-flywheel inside merchant communities seeded vertical templates.",
    behavioralInsightOneLiner:
      "Owners pay for dashboards that quantify cash bleed — vibes decks fail against P&L line items.",
    timingOneLiner:
      "DTC wave plus dropshipping matured enough that tooling depth beat landing-page novelty.",
    operationalBottleneckOneLiner:
      "Fulfillment SLA + returns policy enforcement — storefront code is trivial vs ops choreography.",
    monetizationModelOneLiner:
      "Subscription + GMV-derived payments + ecosystem rev share layering.",
    moatOneLiner:
      "App surface area + payouts integration creates workflow depth generic site builders mimic slowly.",
  },
  {
    id: "figma",
    aliases: ["figma", "figjam", "browser-native collaborative", "multiplayer editing", "collaborative ui design"],
    marketType: "creator_tool",
    distributionModel: "bottom_up",
    networkEffectType: "direct",
    switchingCost: "high",
    behavioralDependency: "identity",
    timingSensitivity: "medium",
    platformRisk: "medium",
    operationalComplexity: "medium",
    monetizationRisk: "low",
    patternTags: [
      "multiplayer_canvas_replaces_zip_files",
      "designer_identity_signal_through_assets",
      "plugin_graph_threat_via_platform_api",
      "migration_cost_is_file_format_plus_comment_graph",
    ],
    whyWorkedOneLiner:
      "Realtime multiplayer collapsed review latency vs shipping heavy binaries that forked truth.",
    nearDeathOneLiner:
      "Incumbents bundling gratis editing during enterprise renewals squeezed PLG corridors.",
    distributionAdvantageOneLiner:
      "Free student + team workspaces seeded comment graphs that CIO could not unscramble later.",
    behavioralInsightOneLiner:
      "Designers evangelize artifacts that visibly raise craft status — tooling is wardrobe for talent brands.",
    timingOneLiner:
      "Remote critiques normalized async video + browser perf made canvas latency tolerable internationally.",
    operationalBottleneckOneLiner:
      "Realtime infra + deterministic rendering under collaboration storms — correctness > features.",
    monetizationModelOneLiner:
      "Seat expansion after design system embed crosses security review threshold.",
    moatOneLiner:
      "Comment + component graph lock-in outweighs parity feature checklist cloning.",
  },
  {
    id: "slack",
    aliases: ["slack", "team chat replacing email", "integrations and search"],
    marketType: "workflow",
    distributionModel: "bottom_up",
    networkEffectType: "workflow_lockin",
    switchingCost: "high",
    behavioralDependency: "habit",
    timingSensitivity: "medium",
    platformRisk: "high",
    operationalComplexity: "medium",
    monetizationRisk: "low",
    patternTags: [
      "integrations_as_retention_sinews",
      "team_invite_multiplication_loop",
      "suite_bundle_collision_microsoft_google",
    ],
    whyWorkedOneLiner:
      "Async chat plus integrations replaced email archaeology when teams fragmented across SaaS silos.",
    nearDeathOneLiner:
      "Incumbent suites copied channels while enterprises demanded data residency + governance parity.",
    distributionAdvantageOneLiner:
      "Grassroots bottoms-up installs inside pods created paid conversion events faster than CIO pilots.",
    behavioralInsightOneLiner:
      "Persistent presence channels become habit infra — quitting feels like quitting colleagues, not tabs.",
    timingOneLiner:
      "Distributed teams mainstreamed before native collaboration suites matured across mobile + search.",
    operationalBottleneckOneLiner:
      "Enterprise security + eDiscovery scalability — uptime plus compliance backlog caps land-and-expand velocity.",
    monetizationModelOneLiner:
      "Freemium to paid gates on searchable history plus SSO + granular admin.",
    moatOneLiner:
      "Integration mesh + searchable message archive — migration tax explodes nonlinearly.",
  },
  {
    id: "discord",
    aliases: [
      "discord",
      "persistent voice channels",
      "voice-first community servers",
      "always-on guild voice",
      "server invite links seed growth",
      "gaming friends stay in voice rooms",
      "creator community hangs out daily",
    ],
    marketType: "consumer_social",
    distributionModel: "community",
    networkEffectType: "workflow_lockin",
    switchingCost: "high",
    behavioralDependency: "habit",
    timingSensitivity: "medium",
    platformRisk: "high",
    operationalComplexity: "high",
    monetizationRisk: "medium",
    patternTags: [
      "presence_graph_replaces_fragile_friend_lists",
      "bot_ecosystem_and_rich_presence_deepen_tabs",
      "trust_and_safety_moderation_at_community_scale",
    ],
    whyWorkedOneLiner:
      "Persistent rooms made lightweight voice + meme culture the default hanging place — quitting felt like ghosting friends, not uninstalling Skype.",
    nearDeathOneLiner:
      "Platform policy, teen safety optics, and feature parity clones pressure retention when novelty cools.",
    distributionAdvantageOneLiner:
      "Invite links seeded micro-communities; social graph compounded inside servers faster than Rolodexes in traditional chat.",
    behavioralInsightOneLiner:
      "Belonging + ambient co-presence beat punctuated calls — always-on lowered coordination cost versus calendar formalism.",
    timingOneLiner:
      "Gaming headsets + broadband voice quality-crossover window made synchronous hangouts sane before incumbent messengers prioritized async.",
    operationalBottleneckOneLiner:
      "Spam, raids, moderation backlog, regional compliance — infra for safe chaos at planetary scale decides credibility.",
    monetizationModelOneLiner:
      "Nitro and server boosts monetize flair and vanity without taxing core presence — SKU must dodge paywall killing hop-in.",
    moatOneLiner:
      "Role graphs, bots, lore, uploads — migrating a server's culture heap costs narrative rupture beyond JSON export.",
  },
  {
    id: "notion",
    aliases: ["notion"],
    marketType: "workflow",
    distributionModel: "bottom_up",
    networkEffectType: "workflow_lockin",
    switchingCost: "medium",
    behavioralDependency: "identity",
    timingSensitivity: "medium",
    platformRisk: "medium",
    operationalComplexity: "low",
    monetizationRisk: "low",
    patternTags: [
      "documents_as_lightweight_apps",
      "flexible_blank_canvas_vs_rigid_vertical_saas_tables",
      "workspace_graph_replaces_drive_folders_entropy",
      "template_marketplaces_as_vertical_entry",
    ],
    whyWorkedOneLiner:
      "Blank-slate relational docs swallowed wikis + lightweight PM tools when SaaS fragmentation exhausted teams.",
    nearDeathOneLiner:
      "Entropy from unconstrained workspaces plus permissions sprawl corrodes retrieval — tool becomes swamp.",
    distributionAdvantageOneLiner:
      "PLG workspaces virally spawned via shared templates embedding brand rituals inside operating docs.",
    behavioralInsightOneLiner:
      "Knowledge workers fetishize tasteful canvases — Notion marketed craft + control, not 'another database'.",
    timingOneLiner:
      "Remote teams needed living docs bridging async video + ticketing without enterprise IT delays.",
    operationalBottleneckOneLiner:
      "Governance UX for permissions inheritance at scale beats net-new widgets.",
    monetizationModelOneLiner:
      "Seat expansion gated on collaborative blocks plus admin SSO once graph density crosses teams.",
    moatOneLiner:
      "Migrating intertwined linked databases + rituals costs narrative disruption, not CSV export.",
  },
  {
    id: "zoom",
    aliases: ["zoom", "videoconferencing", "video conferencing", "web conferencing"],
    marketType: "workflow",
    distributionModel: "bottom_up",
    networkEffectType: "none",
    switchingCost: "low",
    behavioralDependency: "utility",
    timingSensitivity: "high",
    platformRisk: "medium",
    operationalComplexity: "medium",
    monetizationRisk: "medium",
    patternTags: [
      "marginal_audio_video_reliability_beats_incumbent_bundle_polish",
      "freemium_timeboxed_meetings_for_bottoms_up_calendar_adoption",
      "enterprise_buy_after_shadow_it_meeting_graph",
      "calendar_integrations_are_distribution_sinew",
      "privacy_backlash_moves_security_to_SKU_not_footer",
    ],
    whyWorkedOneLiner:
      "Zoom compounded when jittery unreliable incumbents made meetings feel professionally hazardous.",
    nearDeathOneLiner:
      "Security narrative blowups + suite bundling can commoditize differentiated codec stories overnight.",
    distributionAdvantageOneLiner:
      "Calendar integrations + effortless guest links seeded enterprise usage before procurement noticed.",
    behavioralInsightOneLiner:
      "Users forgive ugly UI until audio drops — fidelity is emotionally charged embarrassment avoidance.",
    timingOneLiner:
      "Remote shock plus global HQ travel bans forced instant rollout windows legacy suites serviced slowly.",
    operationalBottleneckOneLiner:
      "SOC2-scale logging + moderation tooling under regulatory microscope once usage saturates regulated sectors.",
    monetizationModelOneLiner:
      "Freemium land-and-expand to paid hubs with telephony bundles + webinars upsell ladders.",
    moatOneLiner:
      "Reliability SLA under load plus compliance posture outweighs novelty features post-commoditization.",
  },
  {
    id: "clubhouse",
    aliases: ["clubhouse"],
    marketType: "consumer_social",
    distributionModel: "viral",
    networkEffectType: "direct",
    switchingCost: "low",
    behavioralDependency: "status",
    timingSensitivity: "high",
    platformRisk: "high",
    operationalComplexity: "low",
    monetizationRisk: "high",
    patternTags: [
      "novelty_wave_and_scarcity_by_invites",
      "creator_status_without_long_tail_content_moat",
      "feature_copy_by_incumbents_faster_than_habit_entrench",
    ],
    whyWorkedOneLiner:
      "Ephemeral voice + invite scarcity compounded FOMO when everyone was doomscrolling muted video.",
    nearDeathOneLiner:
      "No durable habit loop survived once clones shipped rooms inside apps people already lived in nightly.",
    distributionAdvantageOneLiner:
      "Invite graph plus celebrity rooms created burst density without content moderation depth.",
    behavioralInsightOneLiner:
      "Status feeds on being early inside the room label — brittle when novelty half-life collapses quarterly.",
    timingOneLiner:
      "Pandemic boredom window aligned with synchronous audio resurgence ahead of burnout.",
    operationalBottleneckOneLiner:
      "Moderation + harassment at scale arrives late with audio — legal tail risk.",
    monetizationModelOneLiner:
      "Ticketing/subscriptions stalled because habit depth never survived platform imitation.",
    moatOneLiner:
      "Thin — social graph ported quickly to incumbent surfaces with distribution leverage.",
  },
  {
    id: "quibi",
    aliases: ["quibi"],
    marketType: "consumer_social",
    distributionModel: "paid_acquisition",
    networkEffectType: "none",
    switchingCost: "low",
    behavioralDependency: "habit",
    timingSensitivity: "high",
    platformRisk: "low",
    operationalComplexity: "high",
    monetizationRisk: "high",
    patternTags: [
      "content_capex_without_distribution_ritual_slots",
      "vertical_video_format_not_substitute_for_behavioral_occasion",
      "subscription_hypothesis_vs_free_short_form_incumbents",
    ],
    whyWorkedOneLiner:
      "Never — thesis assumed attention slots existed that YouTube/TikTok already rationed ruthlessly.",
    nearDeathOneLiner:
      "Marketing spend accelerated negative selection because product failed daily habit hooks versus incumbents.",
    distributionAdvantageOneLiner:
      "Paid UA without organic ritual density — doomed LTV narratives vs zero marginal cost substitutes.",
    behavioralInsightOneLiner:
      "Mobile video habits anchor to infinite feeds + parasocial familiarity — scripted episodes mismatched dopamine pacing.",
    timingOneLiner:
      "Misread pandemic as permanent mobile commute replacement while attention reverted inward to incumbents.",
    operationalBottleneckOneLiner:
      "Original content ops burn without repeatable creation flywheel amortizing CAPEX.",
    monetizationModelOneLiner:
      "Flat subscription capped scale because catalog depth never matched habitual discovery engines.",
    moatOneLiner:
      "None — interchangeable studio deals absent workflow or social graph residues.",
  },
  {
    id: "juicero",
    aliases: ["juicero"],
    marketType: "ecommerce",
    distributionModel: "sales_led",
    networkEffectType: "none",
    switchingCost: "low",
    behavioralDependency: "utility",
    timingSensitivity: "low",
    platformRisk: "low",
    operationalComplexity: "high",
    monetizationRisk: "high",
    patternTags: [
      "hardware_subsidy_story_without_lab_proven_daily_wedge",
      "premium_appliance_substitutable_without_device",
      "operations_heavy_without_network_effects_escape_hatch",
    ],
    whyWorkedOneLiner:
      "Capital narrated a wedge that physics + consumer laziness invalidated — squeezed by hand yielded same juice.",
    nearDeathOneLiner:
      "Laugh-test demos destroyed trust faster than drip marketing rebuilt it.",
    distributionAdvantageOneLiner:
      "None repeatable — depended on affluent novelty buyers without ritual density refill.",
    behavioralInsightOneLiner:
      "Utility collapses when secret sauce is spectacle not measurable daily relief vs cheaper substitutes.",
    timingOneLiner:
      "Healthy living cultural tailwind could not overpower unit economics betrayal once mocked publicly.",
    operationalBottleneckOneLiner:
      "SKU complexity + refrigeration logistics + churn on pouches cratered runway.",
    monetizationModelOneLiner:
      "Blade-and-razor pouch subscription without habitual consumption cadence parity vs grocery.",
    moatOneLiner:
      "Negative — teardown videos converted curiosity into hostility overnight.",
  },
  {
    id: "zynga",
    aliases: ["zynga"],
    marketType: "consumer_social",
    distributionModel: "paid_acquisition",
    networkEffectType: "data",
    switchingCost: "low",
    behavioralDependency: "habit",
    timingSensitivity: "high",
    platformRisk: "high",
    operationalComplexity: "medium",
    monetizationRisk: "medium",
    patternTags: [
      "distribution_rent_from_facebook_newsfeed_arbitrage_until_taxed",
      "metrics_velocity_without_ip_moat_when_channel_owner moves goalposts",
    ],
    whyWorkedOneLiner:
      "Exploited open social graph viral coefficients before platform throttled organic reach overnight.",
    nearDeathOneLiner:
      "Algorithm rent extracted overnight — franchises decayed faster than replacement cohort economics.",
    distributionAdvantageOneLiner:
      "Paid CPI arbitrage disguised as product growth until attribution truth surfaced post-throttle.",
    behavioralInsightOneLiner:
      "Casual gamers chase frictionless novelty loops — churn accelerates once feed oxygen thins.",
    timingOneLiner:
      "Blue ocean Facebook Canvas window shut once platform prioritized time-on-site rents vs third-party parasites.",
    operationalBottleneckOneLiner:
      "Live-ops treadmill + UA bidding wars — creative fatigue killed margins before sequel IP compounded.",
    monetizationModelOneLiner:
      "IAP treadmill plus aggressive retargeting — LTV brittle under channel shocks.",
    moatOneLiner:
      "Data loop without IP reservoirs — imitation costs near zero vs channel owner policy.",
  },
  {
    id: "basecamp",
    aliases: ["basecamp", "37signals"],
    marketType: "workflow",
    distributionModel: "bottom_up",
    networkEffectType: "workflow_lockin",
    switchingCost: "medium",
    behavioralDependency: "utility",
    timingSensitivity: "low",
    platformRisk: "medium",
    operationalComplexity: "low",
    monetizationRisk: "low",
    patternTags: [
      "contrarian_small_team_operating_manual_as_product_skin",
      "anti_enterprise_sale_complexity_positions_as_clarity_asset",
      "slow_growth_but_high_margin_by_scope_discipline",
    ],
    whyWorkedOneLiner:
      "SMBs adopted because scope stayed legible versus enterprise PM suites that required full-time admins.",
    nearDeathOneLiner:
      "Category ceiling when teams outgrow minimalism but before cross-tool mesh becomes mandatory.",
    distributionAdvantageOneLiner:
      "Founder voice + essay distribution created trust before sales touch — marketing as philosophy.",
    behavioralInsightOneLiner:
      "Operators buy calm — promise of fewer tabs beats feature maximalism for thin management layers.",
    timingOneLiner:
      "Remote async documentation cultural shift rewarded opinionated defaults over infinite configuration.",
    operationalBottleneckOneLiner:
      "Support load when edge-case teams demand enterprise rails without enterprise DNA.",
    monetizationModelOneLiner:
      "Flat pricing simplicity that converts via operational clarity, not seat expansion games alone.",
    moatOneLiner:
      "Philosophy + operational ritual lock-in — switching costs are workflow muscle memory, not exports.",
  },
  {
    id: "dropbox",
    aliases: ["dropbox", "cloud folder sync", "sync across devices", "referral loop for growth"],
    marketType: "developer_tool",
    distributionModel: "viral",
    networkEffectType: "data",
    switchingCost: "medium",
    behavioralDependency: "utility",
    timingSensitivity: "medium",
    platformRisk: "high",
    operationalComplexity: "medium",
    monetizationRisk: "low",
    patternTags: [
      "folder_sync_magic_demo_beats_feature_checklists",
      "storage_commoditization_risk_from_cloud_incumbents",
      "referral_loop_drove_acquisition_before_suite_bundles_copied",
    ],
    whyWorkedOneLiner:
      "Sync that simply worked across OS boundaries beat corporate VPN friction for cross-team file truth.",
    nearDeathOneLiner:
      "Suite bundles (OS + productivity) gave away storage — standalone folder UX lost pricing power at scale.",
    distributionAdvantageOneLiner:
      "Referral credits + dead-simple onboarding turned users into infecting agents across companies.",
    behavioralInsightOneLiner:
      "People endure paying for reliability on invisible plumbing — embarrassment of version chaos funds renewals.",
    timingOneLiner:
      "Pre-cloud-native enterprises still emailed attachments — sync demo created instant delta vs status quo.",
    operationalBottleneckOneLiner:
      "Edge-case sync conflicts + enterprise DLP — reliability tax decides renewals, not GB marketing.",
    monetizationModelOneLiner:
      "Freemium storage caps + team plans once folder graph embedded into payroll workflows.",
    moatOneLiner:
      "Switching means re-wiring shared folder URLs + permissions — collaboration graph sticky until suites subsume.",
  },
  {
    id: "calendly",
    aliases: ["calendly"],
    marketType: "workflow",
    distributionModel: "bottom_up",
    networkEffectType: "none",
    switchingCost: "low",
    behavioralDependency: "utility",
    timingSensitivity: "medium",
    platformRisk: "high",
    operationalComplexity: "low",
    monetizationRisk: "low",
    patternTags: [
      "viral_scheduling_links_embedded_in_outbound_email_signatures",
      "calendar_graph_as_bottoms_up_distribution_not_ads",
      "incumbent_calendar_bundles_can_replicate_core_if_api_access_stays_open",
    ],
    whyWorkedOneLiner:
      "Scheduling coordination tax was emotional + caloric — one link removed reply ping-pong from sales + recruiting.",
    nearDeathOneLiner:
      "Calendar OS owners can ship parity scheduling tabs — differentiation must move upstack to revenue workflows.",
    distributionAdvantageOneLiner:
      "Every invitee touched a Calendly-branded flow — recipient-side activation loop without paid UA.",
    behavioralInsightOneLiner:
      "Utility products win on seconds-to-value and social proof of politeness — lateness anxiety funds adoption.",
    timingOneLiner:
      "Remote revenue teams scaled outbound velocity — scheduling became throughput bottleneck worth paying to remove.",
    operationalBottleneckOneLiner:
      "Timezone + enterprise calendar policy edge cases — reliability under executive assistants matter more than UI.",
    monetizationModelOneLiner:
      "Team billing for pooled availability + routing rules once link density crosses org chart.",
    moatOneLiner:
      "Thin alone — moat is workflow embed depth (CRM, payments) not the slot picker widget.",
  },
  {
    id: "linear",
    aliases: ["linear app", "linear issue tracking", "keyboard-first issues"],
    marketType: "developer_tool",
    distributionModel: "bottom_up",
    networkEffectType: "workflow_lockin",
    switchingCost: "medium",
    behavioralDependency: "utility",
    timingSensitivity: "medium",
    platformRisk: "medium",
    operationalComplexity: "medium",
    monetizationRisk: "low",
    patternTags: [
      "speed_as_product_ethos_vs_legacy_pm_suite_viscosity",
      "workflow_keyboard_native_slice_through_issue_entropy",
    ],
    whyWorkedOneLiner:
      "Issue tracking won when velocity + defaults replaced enterprise configuration theater for product-led teams.",
    nearDeathOneLiner:
      "Incumbent suites bundle adjacent modules — differentiation must climb upstack into project intelligence.",
    distributionAdvantageOneLiner:
      "Bottom-up repo-shaped adoption inside eng orgs spreads faster than procurement-led ALM rip-and-replace.",
    behavioralInsightOneLiner:
      "Engineers pay for calm throughput — latency shame beats slide decks.",
    timingOneLiner:
      "Remote+distributed product orgs made async issue truth the heartbeat metric.",
    operationalBottleneckOneLiner:
      "Reliability + permissions depth under enterprise scale decides retention.",
    monetizationModelOneLiner:
      "Seat expansion plus enterprise controls once workflow graph embeds.",
    moatOneLiner:
      "Issue graph + integrations — switching churns sprint rituals and CI glue.",
  },
  {
    id: "canva",
    aliases: ["canva", "design templates", "drag drop design"],
    marketType: "creator_tool",
    distributionModel: "viral",
    networkEffectType: "data",
    switchingCost: "low",
    behavioralDependency: "social_validation",
    timingSensitivity: "medium",
    platformRisk: "high",
    operationalComplexity: "medium",
    monetizationRisk: "low",
    patternTags: [
      "template_marketplace_lowers_skill_floor_for_output_velocity",
      "brand_safe_design_defaults_reduce_review_cycles",
    ],
    whyWorkedOneLiner:
      "Democratized acceptable design outputs — templates beat blank canvas anxiety.",
    nearDeathOneLiner:
      "Incumbent suites bundle creative cloud — must climb brand systems + collaboration depth.",
    distributionAdvantageOneLiner:
      "Viral template surfaces + education channels recruited non-design buyers.",
    behavioralInsightOneLiner:
      "People pay to avoid shame — output quality as identity protection.",
    timingOneLiner:
      "Social marketing explosion raised baseline visual literacy expectations overnight.",
    operationalBottleneckOneLiner:
      "Moderation + IP risk on community templates.",
    monetizationModelOneLiner:
      "Freemium plus seat/brand kits + stock marketplace rake.",
    moatOneLiner:
      "Brand kit + asset library lock-in across teams once campaigns live in files.",
  },
  {
    id: "loom",
    aliases: ["loom video", "async video messages", "screen recording share"],
    marketType: "workflow",
    distributionModel: "bottom_up",
    networkEffectType: "none",
    switchingCost: "low",
    behavioralDependency: "utility",
    timingSensitivity: "medium",
    platformRisk: "high",
    operationalComplexity: "low",
    monetizationRisk: "low",
    patternTags: [
      "recipient_side_activation_via_share_links",
      "async_video_replaces_meeting_tax_when_tone_matters",
    ],
    whyWorkedOneLiner:
      "Replaced meetings with low-friction explainers — human tone scales knowledge transfer.",
    nearDeathOneLiner:
      "OS + suite embeds copy loom-shaped UX — commodity unless workflow depth follows.",
    distributionAdvantageOneLiner:
      "Every external share carried brand — recipient onboarding loop embedded acquisition.",
    behavioralInsightOneLiner:
      "People tolerate watching video when reading latency feels higher risk.",
    timingOneLiner:
      "Remote-first teams blew meeting calendars — async video became coordination valve.",
    operationalBottleneckOneLiner:
      "Transcription + search quality determines replay behavior.",
    monetizationModelOneLiner:
      "Team seats + admin once links saturate internal comms.",
    moatOneLiner:
      "Thin alone — moat is embed depth + CRM/project graph attachments.",
  },
  {
    id: "plaid",
    aliases: ["plaid", "bank linking", "financial account aggregation"],
    marketType: "fintech",
    distributionModel: "bottom_up",
    networkEffectType: "workflow_lockin",
    switchingCost: "high",
    behavioralDependency: "trust",
    timingSensitivity: "high",
    platformRisk: "high",
    operationalComplexity: "high",
    monetizationRisk: "medium",
    patternTags: [
      "regulated_plumbing_wins_on_uptime_and_coverage_not_ui",
      "bank_relationship_graph_becomes_switching_moat",
    ],
    whyWorkedOneLiner:
      "Bank linking became table stakes for fintech UX — reliability beat novelty.",
    nearDeathOneLiner:
      "Policy shocks + bank API friction can sever coverage overnight.",
    distributionAdvantageOneLiner:
      "Developer-led integrations spread inside apps that moved money.",
    behavioralInsightOneLiner:
      "Founders pay for fewer auth failures — trust is measured in decline rates.",
    timingOneLiner:
      "Open banking tailwinds + mobile-first money apps demanded uniform rails.",
    operationalBottleneckOneLiner:
      "Compliance, fraud, institution-specific edge cases — ops not slides.",
    monetizationModelOneLiner:
      "Per-use + tiered premium data products once traffic compounds.",
    moatOneLiner:
      "Coverage breadth + institutional relationships — rewiring routes is expensive.",
  },
  {
    id: "toast",
    aliases: ["toast pos", "restaurant pos", "toast tab"],
    marketType: "fintech",
    distributionModel: "sales_led",
    networkEffectType: "none",
    switchingCost: "high",
    behavioralDependency: "utility",
    timingSensitivity: "medium",
    platformRisk: "medium",
    operationalComplexity: "high",
    monetizationRisk: "medium",
    patternTags: [
      "vertical_saas_plus_payments_take_rate_in_physical_ops",
      "hardware_plus_service_installation_constraint",
    ],
    whyWorkedOneLiner:
      "Owned restaurants end-to-end workflow — payments + labor + inventory in one throat.",
    nearDeathOneLiner:
      "Macro shocks to dining traffic expose fixed cost stacks.",
    distributionAdvantageOneLiner:
      "Field sales + onboarding muscle in fragmented SMB long tail.",
    behavioralInsightOneLiner:
      "Operators buy uptime — downtime is existential, not annoyance.",
    timingOneLiner:
      "Digital ordering acceleration rewired guest journeys faster than legacy POS could iterate.",
    operationalBottleneckOneLiner:
      "Support load across heterogeneous venues + hardware returns.",
    monetizationModelOneLiner:
      "SaaS + payments rake anchored to GMV throughput.",
    moatOneLiner:
      "Embedded payments + labor data — rip-out risks revenue nights.",
  },
  {
    id: "duolingo",
    aliases: ["duolingo", "language learning app", "gamified lessons"],
    marketType: "consumer_social",
    distributionModel: "viral",
    networkEffectType: "data",
    switchingCost: "low",
    behavioralDependency: "habit",
    timingSensitivity: "medium",
    platformRisk: "high",
    operationalComplexity: "medium",
    monetizationRisk: "medium",
    patternTags: [
      "streak_psychology_and_micro_wins_anchor_daily_retention",
      "freemium_with_ads_then_subscription_plus_family_plans",
    ],
    whyWorkedOneLiner:
      "Turned language practice into a lightweight habit loop with shame-proof onboarding.",
    nearDeathOneLiner:
      "LLM tutors commoditize drills — must own longitudinal motivation graph.",
    distributionAdvantageOneLiner:
      "App-store organic + cultural meme loops recruited learners globally.",
    behavioralInsightOneLiner:
      "Retention follows streak architecture — guilt + micro rewards beat curriculum purity.",
    timingOneLiner:
      "Mobile-first global workforce mobility raised baseline desire for language upsides.",
    operationalBottleneckOneLiner:
      "Content scaling across locales + moderation on social features.",
    monetizationModelOneLiner:
      "Ads + subscription plus gamified currency purchases.",
    moatOneLiner:
      "Longitudinal learner graph + brand trust — switching loses streak equity.",
  },
  {
    id: "robinhood",
    aliases: ["robinhood", "commission free trades", "retail trading app"],
    marketType: "fintech",
    distributionModel: "viral",
    networkEffectType: "none",
    switchingCost: "low",
    behavioralDependency: "status",
    timingSensitivity: "high",
    platformRisk: "high",
    operationalComplexity: "high",
    monetizationRisk: "high",
    patternTags: [
      "behavioral_options_retention_amid_regulatory_and_outage_risk",
      "payment_for_order_flow_controversy_dependent_unit_economics",
    ],
    whyWorkedOneLiner:
      "Collapsed friction to participate — mobile UX plus zero-commission narrative recruited retail.",
    nearDeathOneLiner:
      "Market shocks + outages destroy trust faster than brand rebuilds.",
    distributionAdvantageOneLiner:
      "Referral loops + cultural zeitgeist moments concentrated adoption bursts.",
    behavioralInsightOneLiner:
      "Retail investors chase agency feelings — UX latency matters more than education.",
    timingOneLiner:
      "Zero-rate era + meme-stock culture widened top-of-funnel dramatically.",
    operationalBottleneckOneLiner:
      "Clearing, regulatory scrutiny, customer service load during volatility.",
    monetizationModelOneLiner:
      "Net interest + payment for order flow + subscriptions.",
    moatOneLiner:
      "Thin — differentiation shifts to trust + product breadth under stress.",
  },
  {
    id: "coinbase",
    aliases: ["coinbase", "crypto exchange retail", "custody wallet"],
    marketType: "fintech",
    distributionModel: "community",
    networkEffectType: "data",
    switchingCost: "medium",
    behavioralDependency: "trust",
    timingSensitivity: "high",
    platformRisk: "high",
    operationalComplexity: "high",
    monetizationRisk: "medium",
    patternTags: [
      "regulated_on_ramp_brand_as_feature_amid_scam_density",
      "fee_compression_when_cycle_turns",
    ],
    whyWorkedOneLiner:
      "Became default compliant on-ramp when crypto UX felt unsafe elsewhere.",
    nearDeathOneLiner:
      "Cycle turns crater transaction revenue — diversification mandatory.",
    distributionAdvantageOneLiner:
      "Brand trust + fiat rails integrations beat long-tail exchanges during retail influx.",
    behavioralInsightOneLiner:
      "Retail buys reassurance — simplicity beats coin breadth for mainstream.",
    timingOneLiner:
      "Institutional curiosity plus ETF narratives expanded acceptable adoption.",
    operationalBottleneckOneLiner:
      "Compliance + fraud + custody security — incidents are existential.",
    monetizationModelOneLiner:
      "Trading fees + spread + subscriptions + staking services.",
    moatOneLiner:
      "Regulatory licensing + fiat plumbing depth — slow to replicate responsibly.",
  },
  {
    id: "substack",
    aliases: ["substack", "paid newsletters", "creator subscriptions"],
    marketType: "creator_tool",
    distributionModel: "creator_led",
    networkEffectType: "cross_side",
    switchingCost: "medium",
    behavioralDependency: "identity",
    timingSensitivity: "medium",
    platformRisk: "high",
    operationalComplexity: "low",
    monetizationRisk: "low",
    patternTags: [
      "relationship_direct_to_reader_without_algorithmic_rent_first",
      "simple_monetization_surface_reduces_creator_anxiety",
    ],
    whyWorkedOneLiner:
      "Made paid newsletters Legible — billing + publishing without building stack.",
    nearDeathOneLiner:
      "Audience aggregation platforms can tax reach once dependency forms.",
    distributionAdvantageOneLiner:
      "Writers carried audiences cross-platform — portability narrative attracted talent.",
    behavioralInsightOneLiner:
      "Creators pay for sovereignty feelings — brand ownership matters emotionally.",
    timingOneLiner:
      "News fatigue + newsletter renaissance created supply-side readiness.",
    operationalBottleneckOneLiner:
      "Moderation + legal exposure at scale for controversial writers.",
    monetizationModelOneLiner:
      "Take rate on subscriptions plus discovery upsells.",
    moatOneLiner:
      "Writer relationships + payouts UX — switching risks subscriber churn workflow.",
  },
  {
    id: "vercel",
    aliases: ["vercel", "next.js hosting", "edge deployment"],
    marketType: "infra",
    distributionModel: "bottom_up",
    networkEffectType: "workflow_lockin",
    switchingCost: "medium",
    behavioralDependency: "utility",
    timingSensitivity: "medium",
    platformRisk: "medium",
    operationalComplexity: "high",
    monetizationRisk: "low",
    patternTags: [
      "git_sha_as_deploy_unit_reduces_release_theatre",
      "framework_coupling_as_distribution_via_developer_gravity",
    ],
    whyWorkedOneLiner:
      "Frontend deploy became invisible plumbing — git push to URL crushed ops theatre.",
    nearDeathOneLiner:
      "Hyperscalers bundle competing DX — must expand edge + data surfaces.",
    distributionAdvantageOneLiner:
      "Framework gravity + OSS ecosystem pulled repos into hosted paths.",
    behavioralInsightOneLiner:
      "Devs adopt what removes pager noise — DX wins when incidents drop.",
    timingOneLiner:
      "Jamstack + edge compute wave rewarded instant preview flows.",
    operationalBottleneckOneLiner:
      "Multi-tenant reliability + abuse + edge policy complexity.",
    monetizationModelOneLiner:
      "Seat-adjacent usage billing on bandwidth + serverless + enterprise controls.",
    moatOneLiner:
      "Workflow embed + edge network — migrating breaks preview + CI rituals.",
  },
]