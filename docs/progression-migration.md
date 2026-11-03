# Engine-based progression migration

The active kwon-to-clown and clown-to-dice routes now use encounterStore and progression-gate instead of reading the result-kicker text. The result element's hidden attribute remains a presentation-ready signal: it does not determine who won. This is not yet a complete removal of DOM observers or a full BattleSession controller.

Each automatic route can start once for each encounterId. Failure may be retried manually. Dice transition tickets are validated after the cutscene and again after the dynamic import; a new game, loss or another boss invalidates the old ticket. Weapon selection for the dice transition comes from the engine snapshot, not HUD data attributes.

The first-boss transition checks its ticket again before the first weapon confirmation. Once that confirmation authorizes entry, the open selection can still be reused after returning from the clown encounter, preserving the existing unlocked-boss behavior. Preview remains separate from an automatic engine victory.

The text-based shouldStartTransition/shouldStartDice utilities are retained only for compatibility with their old unit tests. These active route files no longer import them. Further work should remove the deprecated utilities and move initialization out of transition-data.mjs.

The encounter store currently tracks the last shared createGame state. It derives clown identity from the existing clown marker, and does not yet register the separate dice simulation as a terminal progression encounter. No next boss exists after dice. An eventual multi-session/coop implementation must replace this singleton with explicit per-session ownership and boss IDs.

Regression tests cover eligibility, wrong-boss rejection, duplicate prevention, manual retry, stale tickets and source wiring. Full npm test and browser validation have not been run here. Verify both boss victories, losses, retries, skip/cancel, and an encounter change during a pending dice transition.
