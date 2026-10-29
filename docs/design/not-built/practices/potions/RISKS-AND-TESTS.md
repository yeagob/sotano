# Risks and the tests that catch them

Status: proposal. Index: [potions](README.md).

Ten risks of the potion system, each with the test that would catch it. None of these tests exists yet.

| # | Risk | Test |
|---|---|---|
| 1 | **Farming.** Challenge rooms give endless parts, so endless potions | A station test: a fourth brew at one alembic is refused whatever the bulb holds. A sandbox scenario with 500 parts on the floor ends the run with at most three brews per alembic |
| 2 | **Stat blow-ups** from potions stacked with practices and with each other | Extend the synergy matrix test: every potion alone, with every practice, and every pair of potions active together: no errors, finite stats within limits. Drinking the same potion twice leaves one source |
| 3 | **Effects that leak or vanish.** A rebuild removes a potion, or a floor change leaves one on | Inventory test: drink, gain and lose a practice, and the potion stays. Clear *N* sealed rooms, and it is gone. A floor entry removes room and floor potions and keeps the Distillate. A challenge room's waves do not tick it |
| 4 | **RNG drift.** Brewing or drinking shifts structure or drops | The random tests: the same seed with zero and with ten brews gives the same structure hash and the same drops sequence. The resolver returns the same potion for every order of the same contents |
| 5 | **Ambiguous recipes.** Two recipes tie, so the result depends on load order | A validator test: enumerate every multiset of up to three cubes (four kinds times 40 patterns times the recipe materials, plus ice). Assert that at most one recipe of the top specificity matches, and that unmatched sets give Plain Tonic |
| 6 | **Hand code assumes two kinds.** Toll, place, throw, Craving's pull or the hold-up breaks on a flask | Unit tests per path: the toll lists and takes a flask; place stands it as a pickup; throw shatters it with the splash; carry counts it; Craving returns it on release |
| 7 | **A positive splash kills.** The thrown flask lowers a projection to zero | Combat test: a splash on a projection at one hit point leaves it at one, with warmth up by 0.2; on a creature it heals |
| 8 | **Controls clash or a device is missing** | Controls test: the drink verb exists on all three devices, no shared input in play, and the touch arc stays at seven buttons or fewer with a flask in hand |
| 9 | **Missing words, or claims of cure** | Localisation test: every potion's name, description and effect exist in English and Spanish with the same numbers. A content test rejects "cure", "treatment", "therapy", "medicine" and "medication" in potion text |
| 10 | **The structure change breaks old seeds silently** | The golden hash test fails on purpose. The laboratory lands on the right floor of every zone for 200 seeds, and never blocks a door, the centre or the shaft |

The gates these tests belong to: [sotano-items](../../../../../.claude/skills/sotano-items/SKILL.md), [sotano-controls](../../../../../.claude/skills/sotano-controls/SKILL.md), [sotano-i18n](../../../../../.claude/skills/sotano-i18n/SKILL.md) and [sotano-levels](../../../../../.claude/skills/sotano-levels/SKILL.md).
