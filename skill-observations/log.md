# Skill Observation Log

Observations captured during task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue — resolved statuses always carry their resolution date

---

## 2026-08-31

### Observation 1: Map shared inheritance before a full-product redesign

**Status:** OPEN
**Date:** 2026-08-31
**Session context:** Redesigning a multi-app product with many route families and a shared UI package.
**Skill:** redesign-existing-projects
**Type:** open-source
**Phase/Area:** Scan and Fix

**Issue:** A page-by-page visual pass does not scale reliably when dozens of routes inherit most of their appearance from shared tokens, shells, and component primitives. The existing skill says to scan patterns but does not require an explicit inheritance map before editing.

**Suggested improvement:** Require a short route-family and style-inheritance map during Scan, then redesign shared primitives first and validate one representative route from every family before pursuing local exceptions.

**Principle:** In large interface systems, redesign coverage is proven through shared inheritance plus representative family checks, not by counting edited page files.

### Observation 2: Classify surfaces before redesigning cards

**Status:** OPEN
**Date:** 2026-08-31
**Session context:** Reworking repeated card patterns across marketing, form, portal, metric, empty-state, and admin surfaces.
**Skill:** redesign-existing-projects
**Type:** open-source
**Phase/Area:** Component Patterns

**Issue:** Treating every bordered container as the same card produces visual monotony even when the shared primitive is polished. Content discovery, data metrics, forms, admin rows, and empty states communicate different relationships and should not inherit identical geometry.

**Suggested improvement:** Add a mandatory surface-taxonomy step to the card audit: identify content cards, working panels, metrics, data rows, and system states, then assign each family distinct geometry, density, and interaction behavior.

**Principle:** A coherent interface system comes from related but differentiated surface families, not one universal card style.
