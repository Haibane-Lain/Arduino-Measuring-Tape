# Shopping list — bare-minimum prototype

Parts needed to get a live distance reading from the node onto the phone, plus
what to defer until later milestones.

**Version:** 0.1.0
**Date:** 11 October 2026
**Related:** [`PROTOTYPE-PLAN.md`](PROTOTYPE-PLAN.md) · [`REQUIREMENTS.md`](REQUIREMENTS.md) · [`PLAN.md`](PLAN.md)

---

## 1 · Scope

Target: **sensor → phone app**, end to end. Move the sensor, see the number on
the phone within ~500 ms over Bluetooth SPP. Prototype is **USB-powered** and
**solderless** (breadboard), so the battery/boost/charger and the enclosure are
not bought yet.

---

## 2 · Buy now — prototype essentials

| ✓ | Item | Qty | Notes |
| - | ---- | --- | ----- |
| ☐ | HC-05 (or HC-06) classic Bluetooth SPP module | 1 | The one real missing part. Buy the **base-board/backplane variant with header already soldered** (or a listing that states "header soldered"). HC-06 is cheaper/simpler (pair-only); HC-05 lets you change baud/name. |
| ☐ | HC-SR04 ultrasonic sensor | 1 | Confirm you already have one (HR-5). |
| ☐ | Arduino UNO R3 | 1 | Confirm you already have one (HR-1); UNO R3 uses a USB-B port. |
| ☐ | Resistor 1 kΩ | 1 | HC-05 RX divider, series leg (HR-10). |
| ☐ | Resistor 2 kΩ | 1 | HC-05 RX divider, to GND (HR-10). |
| ☐ | Piezo buzzer (pins or module) | 1 | FR-3 is a must-have. Buy one **with pins** — not a bare disc with flying leads. |
| ☐ | /Ω | 1 | Buzzer series resistor (HR-13). |
| ☐ | Breadboard (830-point) | 1 | No soldering for the prototype. |
| ☐ | Jumper wires, M–M and M–F | ~20 | HC-05 pins are male; the sensor uses female headers. |
| ☐ | USB-A → USB-B cable | 1 | Flashes **and** powers the UNO. |

> ⚠️ **Do not skip the divider.** Put 1 kΩ in series and 2 kΩ to GND on the
> UNO TX (D3) → HC-05 RX line. Direct 5 V into a 3.3 V input degrades the module
> over time (HR-10).

Optional but sensible:

| ✓ | Item | Notes |
| - | ---- | ----- |
| ☐ | Second HC-SR04 | Cheap spare in case one is miswired. |
| ☐ | HM-10 (BLE) module | Fallback if `react-native-bluetooth-classic` will not build on RN 0.86 (risk R1). |

**No soldering iron is required for this list**, provided the HC-05 has its
header pre-soldered and the buzzer has pins.

---

## 3 · Buy later — M3–M6, not needed to "work"

| Item | Qty | Milestone / ref |
| ---- | --- | --------------- |
| Li-ion/LiPo cell ≥ 2000 mAh (or 18650 + holder) | 1 | M4 · HR-16 |
| TP4056 + protection, **or** combined charge/boost module | 1 | M4 · HR-17 |
| Physical power switch (slide) | 1 | M4 · HR-18 |
| 2-pin JST battery connector | 1 | M4 |
| Project box ≈ 120 × 80 × 50 mm (Hammond 1591-class) | 1 | M5 · ER-2 |
| M3 screws + standoffs | set | M5 · ER-3 |
| Perfboard / protoboard | 1 | M4 (final soldered circuit) |
| 100 µF + 100 nF capacitors | few | M4 · HR-20 (decoupling) |
| Heat-shrink tubing + stranded hook-up wire | — | M4 assembly |

---

## 4 · Nice-to-have / later

| Item | Why |
| ---- | --- |
| DS18B20 + 4.7 kΩ pull-up | Temperature compensation (HR-7, "should") |
| Ferrite bead | Radio supply noise (risk R4) |
| Tactile pushbutton | Manual reset / pair |
| Status LED + resistor | Power/connection indicator (HR-4/15, "could") |
| Soldering iron + solder | Needed for M4/M5 (perfboard, cutouts); **not** for the prototype |
| Wire strippers, multimeter, small screwdrivers, drill + step bits | Tools for M4/M5 |

---

## 5 · Notes

- The **essentials** total roughly **$15–30** if you already own the UNO and
  HC-SR04; the HC-05 is the main purchase.
- Phase A of the plan (flash the sketch, verify `DIST:` over a generic Bluetooth
  serial terminal) needs only the essentials — no app code required yet.
- Soldering enters at **M4 (hardware bring-up)**, not before.
