/**
 * Kids'-encyclopedia articles for Element Campaign.
 * Handcrafted layers for H–Ca; composed fallback for the rest.
 * Tone: honest, vivid, no jargon dump — deeper layers on demand.
 */
(function (global) {
  const CATEGORY_LORE = {
    nonmetal: {
      family:
        "Nonmetals are the shape-shifters of chemistry. Many are gases or brittle solids. They grab electrons instead of giving them away, which is why they build water, air, plastics, and living tissue.",
      behave:
        "When a nonmetal meets a metal, electrons often leave the metal and stick to the nonmetal. That tug-of-war makes salts, oxides, and a lot of the compounds in your kitchen and your body."
    },
    "noble-gas": {
      family:
        "Noble gases sit at the far right of the table with full outer shells. They almost never form compounds under normal conditions — not because they are “lazy,” but because their electron setup is already stable.",
      behave:
        "Chemists call them inert, which means “won’t react easily.” Helium and neon basically refuse chemistry. Xenon and radon can be forced into compounds with extreme methods — proof that “never” in science often means “almost never.”"
    },
    "alkali-metal": {
      family:
        "Alkali metals (Group 1) are soft, shiny, and dangerously eager. Each has one lonely outer electron it will practically throw away. That makes them react violently with water and air.",
      behave:
        "In nature you never find pure sodium metal lying around — it would have already reacted. Instead you meet alkali metals locked inside salts like table salt (NaCl) or dissolved as charged ions in oceans and cells."
    },
    "alkaline-earth": {
      family:
        "Alkaline earth metals (Group 2) have two outer electrons. They are harder and a bit less explosive than alkali metals, but still reactive enough that pure chunks are lab curiosities, not sidewalk finds.",
      behave:
        "They love forming +2 ions. Calcium and magnesium in that form build bones, chalk, ocean chemistry, and the hard stuff in your water pipes."
    },
    metalloid: {
      family:
        "Metalloids sit on the stair-step border between metals and nonmetals. They can conduct electricity a little (or a lot when doped), which is why silicon runs computers and boron shows up in tough glass.",
      behave:
        "Think of them as negotiators: sometimes metal-like, sometimes nonmetal-like, depending on partners and temperature. That in-between personality is exactly why technology hunts them."
    },
    halogen: {
      family:
        "Halogens (Group 17) are one electron short of a full shell — and they know it. Fluorine and chlorine are aggressive; iodine is milder but still chemically hungry.",
      behave:
        "They form salts with metals (halogen + metal → salt is the classic school demo). Chlorine disinfects water. Fluorine hardens tooth enamel in tiny doses and will wreck almost anything in large ones."
    },
    "post-transition": {
      family:
        "Post-transition metals sit after the big transition block. Softer than iron-group metals, often lower melting points, still excellent at forming alloys and useful compounds.",
      behave:
        "Aluminum, tin, and lead live here. They conduct, they bend, and they have long human histories — from soda cans to old pipes to solder."
    },
    "transition-metal": {
      family:
        "Transition metals fill the wide middle of the table. Many are tough, colorful in compounds, and great at catalysis — speeding up reactions without being used up.",
      behave:
        "Their d-electrons let them wear several “charge costumes” (oxidation states). Iron can be Fe²⁺ or Fe³⁺; that flexibility powers blood chemistry and rust alike."
    },
    lanthanide: {
      family:
        "Lanthanides are the rare-earth row tucked under the main table. Soft metals, often magnetic or fluorescent in compounds, critical in phones, magnets, and screens.",
      behave:
        "“Rare earth” is a historical name — they aren’t always rare in the crust, but they are hard to separate cleanly, which is why mining and refining them is a geopolitical story as much as a chemistry one."
    },
    actinide: {
      family:
        "Actinides include uranium and plutonium. Most are radioactive: their nuclei are unstable and spit out particles or energy as they change into other elements.",
      behave:
        "Radioactivity is not “evil magic.” It is a nucleus rearranging. Useful in dating rocks, medicine, and power — and dangerous when dose, containment, or weapons misuse go wrong. Respect the nucleus."
    },
    unknown: {
      family:
        "The heaviest synthetic elements exist only as a few atoms made in particle accelerators. We predict their chemistry from the table’s patterns, then test what we can before they decay.",
      behave:
        "“Unknown” on a kids’ chart often means “we have almost no bulk sample.” The science is real; the sample size is microscopic and short-lived."
    }
  };

  /** Extra depth for notable Z > 20 when no full override exists */
  const NOTABLE = {
    26: {
      lead: "Iron is the quiet giant of civilization — the metal in your blood and the skeleton of bridges, cars, and skyscrapers.",
      extra: [
        {
          title: "Blood and rust — same element, different story",
          paras: [
            "Hemoglobin uses iron to ferry oxygen through your body. Rust is iron combining with oxygen and water in air — a slow burn that turns strong metal into flaky oxide.",
            "Earth’s core is mostly iron and nickel. Without that molten metal dynamo, we might not have a magnetic field shielding the planet from solar wind."
          ]
        }
      ]
    },
    29: {
      lead: "Copper is the reddish metal of wires, pennies (once), and the Statue of Liberty’s green skin.",
      extra: [
        {
          title: "Why wires love copper",
          paras: [
            "Copper’s outer electrons move easily, so electric current flows with less waste heat than in many other metals. That’s why house wiring and motor coils lean on Cu.",
            "Left outside, copper forms a green patina (mostly copper carbonate). The metal underneath is still doing its job — the green is a weathered coat, not the pure element."
          ]
        }
      ]
    },
    47: {
      lead: "Silver is the brightest common metal — mirrors, jewelry, and (historically) photography all leaned on its tricks with light and chemistry.",
      extra: [
        {
          title: "Antimicrobial and conductive",
          paras: [
            "Silver ions can disrupt microbes, which is why some wound dressings and water filters use silver compounds. It is also an outstanding electrical conductor — even better than copper — but costs more, so copper usually wins in walls."
          ]
        }
      ]
    },
    79: {
      lead: "Gold does not rust, does not tarnish easily, and humans have fought wars over it for thousands of years.",
      extra: [
        {
          title: "Why gold stays gold",
          paras: [
            "Gold’s chemistry is stubbornly unreactive in air and water, so ancient jewelry still looks like jewelry. That same nobility makes gold useful in electronics where corrosion would kill a circuit.",
            "All the gold ever mined would fit in a cube tens of meters on a side — rare enough to stay precious, common enough that every smartphone carries a little."
          ]
        }
      ]
    },
    92: {
      lead: "Uranium is a heavy, slightly radioactive metal that can fuel reactors — or, in refined form, weapons. The difference is engineering, enrichment, and human choice.",
      extra: [
        {
          title: "Nuclei, not electron gossip",
          paras: [
            "Most chemistry is about electrons. Nuclear power and bombs are about the nucleus splitting (fission) and releasing enormous energy. Uranium-235 is the isotope that fission reactors usually rely on.",
            "Natural uranium is mostly U-238, which does not fission as easily. Enrichment raises the fraction of U-235. That process is tightly controlled worldwide for obvious reasons."
          ]
        }
      ]
    }
  };

  /**
   * Handcrafted encyclopedia packs for the default study scope (H–Ca).
   * chapters[0] always visible; later chapters unlock via “Go deeper”.
   */
  const ARTICLES = {
    1: {
      lead: "Hydrogen is the lightest element in the universe — and the most common. Stars are giant hydrogen furnaces. Your body is packed with it, mostly tied up in water.",
      chapters: [
        {
          title: "Meet hydrogen",
          paras: [
            "As a pure element on Earth, hydrogen is an invisible gas (H₂). You cannot see it, smell it, or taste it. It is so light that leftover free hydrogen tends to drift upward and can even escape Earth’s gravity over long timescales.",
            "Almost all the hydrogen you actually meet is bonded to something else. Water is H₂O: two hydrogens glued to one oxygen. Oils, plastics, sugars, DNA — carbon frameworks wearing hydrogen like a coat of buttons."
          ]
        },
        {
          title: "Where it shows up in your world",
          paras: [
            "Drink water and you drink hydrogen. Breathe out water vapor and you exhale it. Rocket engineers chill hydrogen into a liquid so it packs tighter, then burn it with oxygen for thrust — the exhaust is mostly steam.",
            "Stars fuse hydrogen into helium. That is not a metaphor. Gravity squeezes the core until nuclei merge, releasing the light and heat that make daylight. Every heavier element in your pinky finger was built later in stars or supernovas — but the story starts with H."
          ]
        },
        {
          title: "How it behaves (no soft pedaling)",
          paras: [
            "Hydrogen has one proton and, as a neutral atom, one electron. That single electron is why chemists nicknamed it hungry: it can share, lose, or gain depending on the partner. In water and organic molecules it usually shares.",
            "Mix hydrogen gas with air and add a spark and you get a sharp pop — the Hindenburg disaster was a brutal public lesson that hydrogen burns hard. Modern hydrogen systems treat leak detection and ventilation as life-critical, not optional."
          ]
        },
        {
          title: "Go deeper — acids, fusion, and isotopes",
          paras: [
            "When chemists say “acid,” they often mean a compound that can donate H⁺ — a naked proton. That tiny charged speck is ferocious in water: it sticks to H₂O and makes H₃O⁺, which is what makes lemon juice and battery acid feel sharp (in very different strengths).",
            "Hydrogen has isotopes: same chemistry-ish, different mass. Protium (¹H) is normal. Deuterium (²H) has a neutron — used in heavy water reactors and research. Tritium (³H) is radioactive and used in some luminous paints and fusion research.",
            "Fusion energy research tries to bottle star physics on Earth — usually deuterium and tritium — because fusing light nuclei releases huge energy without the same long-lived waste profile as fission. The engineering problem is keeping a 100-million-degree plasma from touching the walls."
          ]
        }
      ]
    },
    2: {
      lead: "Helium is the party-balloon gas that also cools MRI magnets and refuses to make normal chemical friends. It is the second-lightest element and the second most abundant in the universe — just not in Earth’s air.",
      chapters: [
        {
          title: "Meet helium",
          paras: [
            "Helium is a colorless, odorless noble gas. Its outer shell is full with two electrons — the smallest “happy” shell in chemistry. That is why helium almost never forms compounds under ordinary conditions.",
            "It was discovered in the Sun’s spectrum before it was found on Earth (the name comes from Helios, the Sun). That is a flex unique in the element storybook: we met it as sunlight’s fingerprint first."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Party balloons float because helium is less dense than air. The squeaky voice trick works because sound travels faster in helium — your vocal tract resonates higher. Do that from a balloon, never from a pressurized tank: pure helium can displace oxygen and knock you out without warning.",
            "Hospitals and labs use liquid helium (about −269 °C) to cool superconducting magnets in MRI machines. No helium chill, no everyday MRI as we know it. Divers sometimes breathe helium mixes for deep work because it reduces nitrogen narcosis."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Chemically, helium is a ghost. It does not burn. It does not support breathing. It just sits there being full-shelled. Earth’s atmosphere loses helium to space over geologic time; we get most commercial helium from natural gas wells where it got trapped underground from radioactive alpha decay (an alpha particle is a helium nucleus)."
          ]
        },
        {
          title: "Go deeper — scarcity and superfluid weirdness",
          paras: [
            "Helium is a non-renewable resource on human timescales once it vents to air. Scientists have warned for years about wasting it on single-use balloons while research and medicine need the liquid stuff.",
            "Below about 2.2 K, liquid helium-4 becomes a superfluid: it can climb walls and flow without friction. That is quantum mechanics throwing a party you can almost see with your eyes — and it is one of the strangest “everyday” lab substances on Earth."
          ]
        }
      ]
    },
    3: {
      lead: "Lithium is a soft, silvery metal soft enough to cut with a knife — and reactive enough that you should not try. It powers the rechargeable batteries in phones, laptops, and EVs.",
      chapters: [
        {
          title: "Meet lithium",
          paras: [
            "Lithium is the lightest metal. In air it tarnishes fast; in water it reacts (less violently than sodium, still not a toy). In nature it hides inside minerals and salt-lake brines, not as shiny bars on the beach.",
            "As an alkali metal it has one outer electron it gladly gives away, becoming Li⁺ — the form that does the real work in batteries and in some medicines."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Every modern rechargeable slab in your pocket is a negotiation between lithium ions, graphite, metal oxides, and careful engineering. Lithium-ion does not mean a chunk of lithium metal sloshing around — metal lithium anodes are a research frontier because they can be unstable.",
            "Some psychiatric medicines use lithium salts. That is a different dose and purpose than a battery — same element, totally different context. Never treat battery materials like medicine or vice versa."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Give lithium a path to dump its outer electron and it will. That eagerness is useful in electrochemistry and dangerous if water or air gets where designers did not plan. Battery fires are rare relative to devices sold, but they are fierce when thermal runaway starts — which is why device makers obsess over separators, sensors, and chargers."
          ]
        },
        {
          title: "Go deeper — mining, nerves, and the table’s edge",
          paras: [
            "Lithium extraction from brines and hard rock has real environmental and community costs — water use, landscape disruption, geopolitics. The element that frees cars from gasoline still leaves a footprint.",
            "In the body, lithium ions can modulate nerve signaling. The therapeutic window is narrow: too little does nothing; too much is toxic. That is pharmacology’s recurring lesson — dose makes the difference between tool and poison."
          ]
        }
      ]
    },
    4: {
      lead: "Beryllium is a steel-gray metal that is light, stiff, and toxic as dust. Aerospace loves it. Your lungs do not.",
      chapters: [
        {
          title: "Meet beryllium",
          paras: [
            "Beryllium is an alkaline earth metal with two outer electrons. It is unusually strong for its weight and transparent to X-rays, which makes it useful in windows for X-ray tubes and in high-end aerospace alloys.",
            "Emerald and aquamarine are beryllium-bearing gem minerals (beryl). Pretty rocks; still not candy."
          ]
        },
        {
          title: "Where you meet it (mostly you don’t)",
          paras: [
            "You rarely touch pure beryllium at home. It shows up in specialized gears, satellites, and scientific instruments. If a material data sheet screams about beryllium dust, believe it."
          ]
        },
        {
          title: "How it behaves — honesty first",
          paras: [
            "Inhaled beryllium dust can cause chronic beryllium disease, an immune attack on the lungs that can be permanent. Machinists and lab workers follow strict controls for a reason. This is not “maybe wash your hands” caution — it is industrial hygiene territory.",
            "Chemically, beryllium is smaller and more “clingy” with its electrons than its Group 2 cousins, so its compounds behave a bit differently than magnesium or calcium analogs. Size matters in chemistry."
          ]
        },
        {
          title: "Go deeper",
          paras: [
            "Beryllium’s X-ray transparency comes from low atomic number: fewer electrons to scatter or absorb those photons. Same low-Z logic that makes carbon and hydrogen hard to see on medical X-rays compared with calcium in bone.",
            "In stellar physics, beryllium isotopes are fragile stepping-stones in fusion chains — another reminder that “light element” does not mean “simple story.”"
          ]
        }
      ]
    },
    5: {
      lead: "Boron is a hard, dark metalloid — the bridge personality between metals and nonmetals. You meet it as borax in cleaners and as the secret toughness in heat-resistant glass.",
      chapters: [
        {
          title: "Meet boron",
          paras: [
            "Pure boron is a tough crystalline solid. On the table it sits with the metalloids: not a classic metal, not a classic nonmetal. It has three valence electrons and forms clever bonding networks instead of simple little molecules all the time.",
            "Borax (a sodium borate) and boric acid are the household faces of boron chemistry."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Pyrex-style borosilicate glass resists thermal shock because boron oxide changes how the glass network expands when heated. Laundry boosters, slime recipes, and some pest treatments also lean on borates — always read labels; “natural mineral” is not a synonym for “harmless in any dose.”"
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Boron’s electron shortage makes it a magnet for electron-rich partners. Chemists call many boron compounds Lewis acids — hungry for a pair of electrons. That hunger is a tool for building molecules in research labs."
          ]
        },
        {
          title: "Go deeper — plants, armor, and odd bonds",
          paras: [
            "Plants need tiny amounts of boron for cell walls; too much burns them. Humans need trace boron too, but supplements are not a playground.",
            "Boron carbide is one of the hardest materials known — used in armor and abrasion applications. Boron’s bonding can involve multicenter bonds that look wrong if you only learned “two atoms, two electrons.” Nature did not sign that contract."
          ]
        }
      ]
    },
    6: {
      lead: "Carbon is the backbone of life, the graphite in pencils, the diamond on rings, and the CO₂ changing Earth’s climate. Same element — wildly different arrangements.",
      chapters: [
        {
          title: "Meet carbon",
          paras: [
            "Carbon atoms form up to four strong bonds, and they bond to other carbons in chains, rings, sheets, and cages. That Lego-like flexibility is why organic chemistry is basically the kingdom of carbon.",
            "Diamond is a 3D network of carbon — hardest natural material most people know. Graphite is stacked sheets that slide — soft enough to write. Buckyballs and nanotubes are carbon folded into soccer balls and cylinders."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Your body is a carbon scaffold with hydrogen, oxygen, nitrogen, and friends attached. Plastics are long carbon chains. Steel is iron tuned with carbon. Pencil “lead” is graphite, not Pb.",
            "Burning wood or gasoline attaches carbon to oxygen as CO₂. Plants pull CO₂ back into sugars. The climate fight is about how fast humans dig up ancient buried carbon and throw it into the air versus how fast nature can re-bury it."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Carbon does not “want” in a human sense — but its bonding sweet spot creates millions of stable molecules. Add oxygen in fire and you get oxides and heat. Starve a hydrocarbon of oxygen and you get soot — tiny carbon particles."
          ]
        },
        {
          title: "Go deeper — allotropes, dating, and climate math",
          paras: [
            "Allotropes are different structural forms of the same element. Carbon’s allotropes teach a core lesson: arrangement can matter as much as identity.",
            "Carbon-14 dating works because cosmic rays make a radioactive carbon isotope in the air that living things absorb. When they die, the clock of decay starts. It does not date rocks from the age of dinosaurs — wrong isotope, wrong range — but it revolutionized archaeology.",
            "CO₂ is a greenhouse gas: it lets visible sunlight in and slows infrared heat trying to leave. That physics is not controversial. The policy fight is about costs, fairness, and speed — not about whether the molecule traps heat."
          ]
        }
      ]
    },
    7: {
      lead: "Nitrogen makes up most of the air you breathe — about 78% — yet pure N₂ is oddly chill. The drama starts when nitrogen gets ripped out of that triple bond and built into fertilizers, explosives, and proteins.",
      chapters: [
        {
          title: "Meet nitrogen",
          paras: [
            "Nitrogen gas is two nitrogen atoms triple-bonded (N≡N). That bond is extremely strong, which is why air does not spontaneously turn into fertilizer. Lightning, certain microbes, and the industrial Haber–Bosch process are the main ways to “fix” nitrogen into useful forms.",
            "In your body, nitrogen is essential in amino acids and DNA bases. No nitrogen, no proteins as we know them."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Every breath is mostly nitrogen doing almost nothing chemically in your lungs — it dilutes oxygen. Liquid nitrogen (−196 °C) flash-freezes food and demos; it can also destroy tissue on contact. Respect the cold.",
            "Farm fertilizers (ammonia, nitrates) feed billions of people. The same reactive nitrogen chemistry shows up in explosives like TNT and gunpowder relatives — high-energy nitrogen compounds are a double-edged sword."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Once nitrogen is fixed into ammonia (NH₃) or nitrates, plants and microbes move it through the nitrogen cycle. Too much runoff fertilizes algae blooms that can choke rivers and coasts — a planetary-scale side effect of feeding humanity."
          ]
        },
        {
          title: "Go deeper — Haber–Bosch and the triple bond",
          paras: [
            "Haber–Bosch forces N₂ and H₂ into ammonia with heat, pressure, and catalysts. It is one of the most important industrial reactions ever industrialized — and it consumes huge energy. Critics and fans both agree: it rewrote Earth’s nitrogen budget.",
            "That triple bond is why nitrogen gas is used to blanket flammable chemistry — it crowds out oxygen without reacting. “Inert” here means “not eager,” not “magic safety foam.”"
          ]
        }
      ]
    },
    8: {
      lead: "Oxygen is the reason fire happens in air and the reason your cells can burn food for energy. Roughly one-fifth of every breath is O₂ — colorless, odorless, and absolutely not optional for humans.",
      chapters: [
        {
          title: "Meet oxygen",
          paras: [
            "Oxygen is a reactive nonmetal. As O₂ it supports combustion: fuels do not “contain fire,” they release energy when they combine with oxygen. Water is the calm leftover of hydrogen meeting oxygen; rust is the slow leftover of iron meeting oxygen.",
            "Ozone (O₃) is a different allotrope — protective in the stratosphere, irritating down in smog."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Lungs, lakes, and leaves. Photosynthesis dumps O₂ as a byproduct while building sugars. Early Earth had little free oxygen until microbes changed the atmosphere — a revolution that both enabled animal life and wiped out organisms poisoned by the new air.",
            "Hospitals pipe oxygen carefully. Pure O₂ makes fires vastly worse; Apollo 1 taught that lesson in the worst way."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Oxygen loves electrons. In water it helps make the molecule bent and polar — the reason water is such a good solvent. In your mitochondria, oxygen is the final electron acceptor in the chain that makes ATP, the energy currency of cells. That is controlled burning."
          ]
        },
        {
          title: "Go deeper — radicals and the ozone story",
          paras: [
            "Some oxygen-containing molecules are radicals — incomplete electron pairs that damage DNA and cell membranes. Life uses antioxidants as partial defense; breathing itself is a calculated risk that pays off in energy.",
            "CFCs once chewed stratospheric ozone; international bans let the ozone hole begin recovering. It is proof that planetary chemistry can be damaged — and sometimes repaired — by coordinated human action."
          ]
        }
      ]
    },
    9: {
      lead: "Fluorine is the most aggressive element in the reactive sense — it will attack almost anything to complete its outer shell. In tiny, controlled amounts as fluoride, it hardens teeth. As free fluorine gas, it is a monster.",
      chapters: [
        {
          title: "Meet fluorine",
          paras: [
            "Fluorine is a pale halogen gas (F₂) that chemists handle with specialized equipment. It is the most electronegative element: in a tug-of-war for electrons, fluorine wins.",
            "Teflon-like materials use carbon–fluorine bonds that are extremely stable — great for nonstick pans, persistent in the environment when the molecules are designed badly."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Toothpaste and some water supplies add fluoride ions (F⁻), not fluorine gas. The ion can incorporate into tooth enamel and make it harder for acids to dissolve. Dose still matters: too much during tooth development causes fluorosis (mottled enamel).",
            "Fluorine chemistry also shows up in some pharmaceuticals and refrigerants — always as controlled compounds, never as “add green gas for fun.”"
          ]
        },
        {
          title: "How it behaves — no punches pulled",
          paras: [
            "F₂ reacts with glass, water, metals, organic tissue — basically the universe’s rude guest. Early chemists were injured or killed learning that. Modern labs treat it like the hazard class it is.",
            "Hydrofluoric acid (HF) is especially nasty: it can penetrate skin and wreck deeper tissue and bone calcium. It needs specific first aid (calcium gluconate), not just water-and-hope."
          ]
        },
        {
          title: "Go deeper — electronegativity and forever chemicals",
          paras: [
            "Electronegativity is a scale of electron greed. Fluorine sits at the top. That is why C–F bonds are strong and why some fluorinated pollutants (PFAS) last so long in soil and blood — the bonds do not break easily.",
            "Useful permanence vs. environmental permanence is the design tension of modern fluorine chemistry."
          ]
        }
      ]
    },
    10: {
      lead: "Neon is the glow in “neon” signs — a noble gas that barely reacts, but sings in electric color when you excite it.",
      chapters: [
        {
          title: "Meet neon",
          paras: [
            "Neon is a colorless noble gas until electricity runs through a tube of it — then it emits that trademark red-orange glow. Other “neon signs” often use different gases or coatings for other colors; true neon has its own hue.",
            "Like helium, neon has a full outer shell (eight electrons in its case). Chemistry? Almost none under normal conditions."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Advertising tubes, some lasers, and cryogenic applications. Neon is rarer in air than you might think — fractional distillation of liquid air is how industry peels it out."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Noble-gas discharge tubes work by slamming electrons into gas atoms, kicking electrons up energy levels; when they fall back, light pops out at specific wavelengths. That is quantized energy made visible — Bohr’s model in a shop window."
          ]
        },
        {
          title: "Go deeper",
          paras: [
            "Neon’s spectral lines helped fingerprint the element and still show up in teaching demos about atomic emission. The universe makes neon in stars; Earth’s air only holds a trace."
          ]
        }
      ]
    },
    11: {
      lead: "Sodium is a soft metal that explodes into drama with water — and the quieter half of table salt that your nerves cannot live without.",
      chapters: [
        {
          title: "Meet sodium",
          paras: [
            "Pure sodium metal is silvery, soft, and stored under oil because air and moisture attack it. Drop it in water and it skitters, melts, and can ignite the hydrogen it makes. That demo is famous because it is honest about alkali metal reactivity.",
            "In your body and ocean, sodium exists as Na⁺ ions, not metal chunks."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Table salt is NaCl. Baking soda, pickles, sports drinks, and street-melting rock salt all lean on sodium compounds. Streetlights once used sodium vapor for that harsh yellow glow."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Sodium dumps its one outer electron easily, becoming Na⁺. Nerve cells use sodium and potassium gradients like a battery to fire signals. Too little or too much sodium in blood is a medical emergency — electrolytes are not a marketing slogan; they are physics in meat."
          ]
        },
        {
          title: "Go deeper — salt, blood pressure, and stars",
          paras: [
            "Public health debates about dietary salt are about population averages and risk — not about whether Na⁺ is essential (it is). Context and kidneys matter.",
            "Sodium lines in spectra are the bright yellow “D lines” you see in flame tests — a classic lab fingerprint."
          ]
        }
      ]
    },
    12: {
      lead: "Magnesium is the lightweight structural metal of bike frames and the spark in some fireworks — and a core atom in chlorophyll, the green engine of plants.",
      chapters: [
        {
          title: "Meet magnesium",
          paras: [
            "Magnesium is an alkaline earth metal: two outer electrons, reactive enough to burn with a brilliant white flame when powdered or ribbon-thin. In bulk it can form a protective oxide coat.",
            "Seawater holds vast magnesium. Plants put Mg at the heart of chlorophyll."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Alloys in cars and aircraft, Epsom salt (magnesium sulfate) baths, antacids, and dark leafy greens. Flash powders and some emergency flares use magnesium’s bright burn."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Mg²⁺ is a common ion in biology — it stabilizes DNA/RNA and powers many enzymes that handle ATP. Chemically it sits between “reactive metal” and “life mineral.”"
          ]
        },
        {
          title: "Go deeper",
          paras: [
            "Chlorophyll without magnesium is not chlorophyll. That single atomic choice links Group 2 chemistry to every salad and every forest.",
            "Magnesium fires are tricky: water can make things worse with hot metal; class D methods exist for a reason."
          ]
        }
      ]
    },
    13: {
      lead: "Aluminum is the silver skin of soda cans and airplanes — Earth’s most abundant metal in the crust, yet never found as a free shiny nugget in nature.",
      chapters: [
        {
          title: "Meet aluminum",
          paras: [
            "Aluminum (Al) is a post-transition metal: light, conducts heat and electricity well, and resists corrosion because a tough oxide skin forms instantly in air. Scratch a can and the skin rebuilds.",
            "Before industrial electricity, aluminum was rarer than gold in practical terms. The Hall–Héroult process made it cheap — and energy hungry."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Cans, foil, bikes, window frames, phone chassis, baseball bats. Rubies and sapphires are aluminum oxide (corundum) with impurity colors."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Thermite reactions mix aluminum powder with iron oxide to make molten iron — welding and demolition territory, not kitchen science. Aluminum’s love of oxygen is the secret: it steals O from other oxides hard."
          ]
        },
        {
          title: "Go deeper — recycling and brain myths",
          paras: [
            "Recycling aluminum saves a huge fraction of the energy of making it from ore (bauxite → alumina → metal). Tossing cans is burning electricity you already spent.",
            "Cookware aluminum is not a proven “cause of Alzheimer’s” in the cartoon-internet sense; the disease is complex. Still, pitted aluminum and highly acidic foods are a reason many cooks prefer anodized or stainless."
          ]
        }
      ]
    },
    14: {
      lead: "Silicon is the element of sand, glass, and the chips that run computers. It is a metalloid that learned to be the backbone of the information age.",
      chapters: [
        {
          title: "Meet silicon",
          paras: [
            "Silicon sits under carbon on the table, also with four valence electrons — but it prefers networked solids (silica, silicates) over the endless organic zoo carbon builds. Quartz is SiO₂. Beach sand is mostly silica.",
            "Ultra-pure silicon crystals, doped with tiny impurities, become semiconductors: materials that switch between insulating and conducting on command."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Windows, bottles, phone glass, concrete (silicates), silicone kitchen tools (yes, different spelling — those are polymers with Si–O backbones), and every computer chip."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Doping silicon with phosphorus or boron adds or removes electrons in the crystal’s band structure. That is the lever behind transistors. No transistors, no modern computing."
          ]
        },
        {
          title: "Go deeper — why not silicon life?",
          paras: [
            "Sci-fi loves silicon-based life because Si is under C. Real chemistry is harsher: silicon–silicon chains are less stable in water-rich worlds, and SiO₂ is a solid rock, not a flexible waste gas like CO₂. Carbon won Earth’s biology fair and square.",
            "Making chip-grade silicon is a purity Olympics — parts-per-billion impurities matter."
          ]
        }
      ]
    },
    15: {
      lead: "Phosphorus is the element of matches, DNA’s backbone, and fertilizer — discovered as a glowing white solid that could set you on fire. It still deserves respect.",
      chapters: [
        {
          title: "Meet phosphorus",
          paras: [
            "Phosphorus has several allotropes. White phosphorus is waxy, glows faintly (chemiluminescence), and ignites easily — handled as a serious hazard. Red phosphorus is stabler and shows up on match strike strips.",
            "In life, phosphate groups link DNA and store energy in ATP. Bones and teeth use calcium phosphate."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Matches, fertilizers (phosphate rock), soft drinks (phosphoric acid), and every cell in your body. Agricultural phosphorus runoff, like nitrogen, can feed toxic algae blooms."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "White phosphorus burns and can cause deep burns; military history includes grim uses. Modern chemistry education treats it as controlled substance territory in many places — not a party trick."
          ]
        },
        {
          title: "Go deeper — ATP and peak phosphorus",
          paras: [
            "ATP is not “energy” stored like syrup; it is a rechargeable molecular battery that enzymes can spend. Phosphate chemistry is the currency exchange.",
            "Phosphate rock is finite on human timescales. Farming’s phosphorus supply chain is a quiet strategic issue alongside oil and lithium."
          ]
        }
      ]
    },
    16: {
      lead: "Sulfur is the yellow of matches and hot springs — the stink in rotten eggs (as H₂S) and a building block of some amino acids. Volcanoes belch it; industry mines it.",
      chapters: [
        {
          title: "Meet sulfur",
          paras: [
            "Sulfur is a yellow nonmetal that forms funky rings (S₈ in the common crystalline form). It burns with a blue flame to sulfur dioxide — the sharp smell of struck matches and some volcanic air.",
            "Two amino acids (cysteine and methionine) contain sulfur — it helps proteins fold with disulfide “staples.”"
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Matches, vulcanized rubber (tires), gunpowder history, sulfuric acid (the industrial king of acids), and eggs. Hot springs and some mud baths advertise sulfur; your nose already knew."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Hydrogen sulfide (H₂S) smells like rotten eggs at low concentration and can shut off your smell at higher — then kill you by cellular asphyxiation. Oil and sewer workers treat H₂S alarms as life gear.",
            "Sulfuric acid (H₂SO₄) dehydrates sugar into carbon columns in classic demos: it steals water so violently that carbs collapse to charcoal."
          ]
        },
        {
          title: "Go deeper — acid rain and ores",
          paras: [
            "SO₂ from burning sulfur-bearing fuels helps make acid rain. Scrubbers and cleaner fuels cut that problem dramatically in many countries — another “chemistry policy works” story.",
            "Many metal ores are sulfides; roasting them is how humans historically got metals — and air pollution."
          ]
        }
      ]
    },
    17: {
      lead: "Chlorine is the green-yellow gas that can kill in trenches and clean in swimming pools. Same hunger for electrons — different dose, different delivery, different ethics.",
      chapters: [
        {
          title: "Meet chlorine",
          paras: [
            "Chlorine is a halogen, one electron short of a full shell. As Cl₂ gas it is toxic and choking. As chloride ion (Cl⁻) in salt, it is essential and ordinary.",
            "World War I weaponized chlorine. Water treatment plants dose carefully to kill microbes. Both facts can be true without cartoon morality replacing understanding."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Pool “chlorine” smell is often chloramines from chlorine meeting sweat and urine — chemistry calling you out. Bleach is sodium hypochlorite. PVC pipe is a chlorine-containing polymer. Table salt is half chloride by partner."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Chlorine oxidizes — it steals electrons and wrecks the molecules microbes need to live. That is disinfection. It also wrecks lung tissue if you breathe the gas. Concentration and exposure time decide the story."
          ]
        },
        {
          title: "Go deeper — CFCs and bleach safety",
          paras: [
            "Never mix bleach with ammonia or acids — you can make chloramines or chlorine gas at home by accident. Cleaning-product labels are not nagging; they are hazard maps.",
            "Chlorinated refrigerants (CFCs) once threatened ozone; replacements are a continuing engineering story."
          ]
        }
      ]
    },
    18: {
      lead: "Argon is the quiet bulk of the noble gases in air — about 0.93% of every breath. It welds, it fills bulbs, and it ignores almost all chemical invitations.",
      chapters: [
        {
          title: "Meet argon",
          paras: [
            "Argon is colorless, odorless, and chemically snobby in the noble-gas tradition. Its name means “lazy” or “inactive” in Greek — a reputation earned by a full outer shell.",
            "It is the third most abundant gas in dry air after nitrogen and oxygen."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "MIG/TIG welding uses argon to blanket hot metal from oxygen. Incandescent bulbs were often argon-filled to protect filaments. Museums sometimes store oxygen-sensitive artifacts under argon."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Argon does not keep you alive — it just takes up space. In a closed room, leaking argon can displace oxygen and asphyxiate without a warning smell. Industrial sites monitor O₂ for that reason."
          ]
        },
        {
          title: "Go deeper",
          paras: [
            "Argon dating (K–Ar, Ar–Ar) helps geologists age rocks because radioactive potassium decays to argon that gets trapped in crystals. Noble gases as clocks — not just as “do-nothing” fillers.",
            "A few exotic argon compounds have been made under extreme conditions, proving “inert” is a practical word, not an absolute law."
          ]
        }
      ]
    },
    19: {
      lead: "Potassium is sodium’s bigger alkali cousin — reactive metal in the lab, essential ion in your nerves and bananas.",
      chapters: [
        {
          title: "Meet potassium",
          paras: [
            "Potassium metal makes sodium’s water reaction look polite. It is stored carefully and demos are done with tiny amounts behind shields. In life you meet K⁺ everywhere.",
            "The symbol K comes from kalium (Latin/Arabic roots), not from the English name — a reminder that the table is a multilingual museum."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Bananas, potatoes, salt substitutes (KCl), plant fertilizers (the “K” in N–P–K), and soap history (potash). Your cells pump sodium out and potassium in — the sodium–potassium pump — to keep nerve batteries charged."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Blood potassium that goes too low or too high can stop a heart. That is why hospitals watch K⁺ like hawks. Dietary potassium is usually fine for healthy kidneys; concentrated pills and disease states are different games."
          ]
        },
        {
          title: "Go deeper — radioactivity in bananas?",
          paras: [
            "Bananas contain a tiny bit of potassium-40, a natural radioisotope. The “banana equivalent dose” is a teaching joke about how small some radiation doses are — not a reason to fear fruit.",
            "Potassium flame tests burn lilac. Once you see it, you do not forget."
          ]
        }
      ]
    },
    20: {
      lead: "Calcium is the element of bones, teeth, chalk, limestone, and the plaster in walls. It is the structural alkaline-earth metal of both geology and vertebrate bodies.",
      chapters: [
        {
          title: "Meet calcium",
          paras: [
            "Calcium metal is reactive and silvery; you do not meet it that way in the kitchen. You meet Ca²⁺ in milk, cheese, leafy greens, and the carbonate rocks that make cliffs and coral skeletons.",
            "Chalk, limestone, and marble are mostly calcium carbonate (CaCO₃). Drop acid on them and they fizz CO₂ — a classic rock test."
          ]
        },
        {
          title: "Where you meet it",
          paras: [
            "Bones and teeth are living mineral: calcium phosphate in a protein matrix. Antacids chew calcium carbonate. Cement and drywall live in the calcium-compound universe. Hard water is often calcium and magnesium ions leaving crusty gifts on faucets."
          ]
        },
        {
          title: "How it behaves",
          paras: [
            "Muscles fire using calcium signals. Blood clotting needs calcium. If blood Ca²⁺ drifts wrong, nerves and muscles misbehave — which is why parathyroid hormone and vitamin D exist as calcium regulators.",
            "Vitamin D helps you absorb calcium; without it, bones soften (rickets/osteomalacia). Sunshine chemistry meets Group 2 chemistry in your skeleton."
          ]
        },
        {
          title: "Go deeper — reefs, cement, and the first 20",
          paras: [
            "Coral reefs are calcium carbonate cities built by living things. Ocean acidification makes that construction harder — CO₂ chemistry landing on biology.",
            "Cement production releases CO₂ both from fuel and from cooking limestone. Building civilization has a carbon price tag.",
            "Calcium closes the classic “first twenty” teaching set: enough elements to tell the story of air, water, rock, life, and salt — without drowning you in the whole table at once."
          ]
        }
      ]
    }
  };

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shellSentence(e) {
    const parts = e.shells || [];
    if (!parts.length) return "Its electron shells are still being mapped in detail.";
    const labeled = parts.map((n, i) => `${"KLMN"[i] || `shell ${i + 1}`}: ${n}`).join(", ");
    const outer = parts[parts.length - 1];
    return `In the school shell model it stacks as ${labeled}. The outer shell holds ${outer} electron${outer === 1 ? "" : "s"} — that outer count is the main character in bonding stories.`;
  }

  function stateSentence(e) {
    const st = (e.state || "").toLowerCase();
    if (st === "gas") return "At everyday temperature and pressure it is a gas — invisible unless something else (glow, smoke, frost) gives it away.";
    if (st === "liquid") return "It is one of the rare elements that is liquid near room temperature — a celebrity quirk on the table.";
    if (st === "solid") return "As a free element under ordinary conditions it is a solid — though in nature it may be locked inside compounds instead of sitting out as pure metal or crystal.";
    return "Its everyday state is uncertain or not well measured — common for the lab-made superheavies.";
  }

  function composeArticle(e) {
    const lore = CATEGORY_LORE[e.category] || CATEGORY_LORE.unknown;
    const cat = (global.CATEGORY_LABELS && global.CATEGORY_LABELS[e.category]) || e.category;
    const notable = NOTABLE[e.z];
    const gLabel = e.group != null ? `group ${e.group}` : "the f-block";

    const chapters = [
      {
        title: "Meet " + e.name,
        paras: [
          `${e.name} (${e.symbol}) is element #${e.z} on the periodic table — a ${String(cat).toLowerCase()} in period ${e.period}, ${gLabel}. ${e.feel}`,
          stateSentence(e),
          shellSentence(e)
        ]
      },
      {
        title: "Where you meet it",
        paras: [
          e.world,
          e.youTouch,
          "If a fact feels abstract, look at the photos and icons above — the table sticks when your eyes agree with your brain."
        ]
      },
      {
        title: "Family on the table",
        paras: [lore.family, lore.behave]
      },
      {
        title: "How it behaves",
        paras: [
          e.hook,
          "Mass number on school charts is a weighted average of isotopes — real atoms come in slightly different neutron counts. Chemists care when they date rocks, run reactors, or tune NMR; for symbol drills, Z and the symbol still rule."
        ]
      }
    ];

    if (notable && notable.extra) {
      notable.extra.forEach((ch) => chapters.push(ch));
    } else {
      chapters.push({
        title: "Go deeper",
        paras: [
          `Atomic mass ≈ ${e.mass} u (unified atomic mass units). That number is tiny per atom and enormous in aggregate — a mole of ${e.symbol} atoms tips the scale at about ${e.mass} grams.`,
          "Want more? Compare neighbors on the table (left/right = groups behaving alike; up/down = size and reactivity trends), then rebuild it in Atom Build to feel protons vs electrons."
        ]
      });
    }

    return {
      lead: notable && notable.lead
        ? notable.lead
        : `${e.name} is element #${e.z}. ${e.feel} ${e.world}`,
      chapters,
      handcrafted: false
    };
  }

  function buildElementArticle(e) {
    const packed = ARTICLES[e.z];
    if (packed) {
      return {
        lead: packed.lead,
        chapters: packed.chapters,
        handcrafted: true
      };
    }
    return composeArticle(e);
  }

  function articleDepthMax(article) {
    return article.chapters.length;
  }

  function renderArticleHTML(article, depth) {
    const max = articleDepthMax(article);
    const d = Math.max(1, Math.min(depth || 1, max));
    const chapters = article.chapters.slice(0, d);
    const chapterHTML = chapters
      .map((ch, i) => {
        const paras = (ch.paras || []).map((p) => `<p>${esc(p)}</p>`).join("");
        const depthTag = i === 0 ? "" : `<span class="ency-tag">Depth ${i + 1}</span>`;
        return `<section class="ency-chapter" data-depth="${i + 1}">
          <header class="ency-chapter-head">
            <h3>${esc(ch.title)}</h3>
            ${depthTag}
          </header>
          ${paras}
        </section>`;
      })
      .join("");

    const deeperLabel =
      d >= max
        ? "You’re at the bottom of this article"
        : d === 1
          ? "Go deeper — where it shows up"
          : d === 2
            ? "Go deeper — how it behaves"
            : "Go deeper still";

    return {
      html: `
        <article class="ency">
          <p class="ency-kicker">${article.handcrafted ? "Encyclopedia" : "Encyclopedia · composed"} · read as far as you want</p>
          <p class="ency-lead">${esc(article.lead)}</p>
          ${chapterHTML}
          <div class="ency-controls">
            <div class="ency-depth-meter" aria-hidden="true">
              ${article.chapters
                .map((_, i) => `<i class="${i < d ? "on" : ""}"></i>`)
                .join("")}
            </div>
            <span class="ency-level">Depth ${d} of ${max}</span>
            <div class="ency-btns">
              <button type="button" class="btn" id="ency-shallower" ${d <= 1 ? "disabled" : ""}>← Pull back</button>
              <button type="button" class="btn primary" id="ency-deeper" ${d >= max ? "disabled" : ""}>${deeperLabel}${d >= max ? "" : " →"}</button>
            </div>
          </div>
          <p class="ency-footnote">Written like a kids’ encyclopedia that tells the truth — including danger, history, and unfinished science. Technical dumps stay behind the next depth button.</p>
        </article>
      `,
      depth: d,
      max
    };
  }

  global.CATEGORY_LORE = CATEGORY_LORE;
  global.buildElementArticle = buildElementArticle;
  global.renderArticleHTML = renderArticleHTML;
  global.articleDepthMax = articleDepthMax;
})(typeof window !== "undefined" ? window : globalThis);
