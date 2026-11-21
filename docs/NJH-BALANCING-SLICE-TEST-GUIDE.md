# NJH balancing slice-1.0 — test guide (New Bot)

Preview branch `preview/njh-balancing-20261122`, sw v44, assets `?v=njh-balancing-r3-20261122`.
All numbers come from `content/balancing.json` (contentRevision `slice-1.0-r3`). Edit that file + reload to retune; nothing is hardcoded.

## Start from zero
1. Open the preview with `?fresh=1` (if the fresh-start stream is on your build). If not: use an incognito window / Guest, or clear site data — an empty save starts the same way (Day 1, 06:30, Rp15.000, energy 80, fullness 50, hygiene 50, moral 50, no kos — values from `start.*` in the table).
2. Hard-refresh once so sw v44 takes over (DevTools → Application → Service Workers shows v44).

## Checklist
- **One clock:** the HUD clock moves 1 game minute every 0.5 real s (1 hour = 30 s, 1 day = 12 min). Stats tick on the same clock.
- **Hold to work:** Parkir 8 s, Pak Ogah 12 s, Manusia Silver 20 s (slightly faster with experience). Pay Rp5.000 / Rp7.500 / Rp12.500 per session.
- **Daily quota:** each job stops at Rp150.000 per day — message “Kuota … hari ini habis. Buka lagi besok 06:00.”; resumes after 06:00 next game day.
- **Kantor (premium):** shows “Belum buka” (frozen for this slice).
- **Warung Kopi door:** “Belum buka”. Coffee is bought at the Warteg (button in the warteg panel / interior).
- **Prices:** Warteg Rp12.000, Loak buys Rp4.000, fish per v2.1 (Pasar Ikan pays more than Bang Siomay). Fish rot after 720 game min (= 6 real min). Fishing minigame time runs on the live clock and is not counted twice.
- **Sleep (r2):** one *Tidur* = 60 game minutes on the normal clock (30 real s) with a progress bar; *Bangun* (or walking) wakes you anytime, counting only the minutes slept. *Tidur sampai pagi* repeats hour by hour until 06:00 or full energy, 8× faster (each hour ≈ 3.75 s, 8 hours ≈ 30 s; `sleep.untilMorningSpeed`), still applying energy/hygiene/hunger per hour. Tent: energy +30, hygiene −2 per hour. **Faint** (energy 0): 2 real minutes bed rest, wallet −10% (max Rp20.000).
- **No softlock:** with Rp0, Mulung → Babeh Loak (Rp4.000/item) always works; quest 5 shows “Belum cukup uang? Mulung dulu, jual ke Babeh Loak.” while you can't pay the shower. After a faint at Rp0 you can still mulung.
- **Drain (r3):** energy −2/hour, hunger −4/hour (−2 every 30 min), hygiene −1.5/hour; walking costs 1 energy per 16 tiles (`movement.walkEnergyTilesPerUnit`). Walk speed unchanged (`movement.walkSpeedMultiplier` = 1).
- **Toilet accident:** hygiene penalty only, no moral loss.
- **Quests:** 10 in a chain (each unlocks the next): Makan → WC → Parkir → Loak → Mandi → Ogah → Ikan → Silver → Tabungan Rp450.000 total wages → Kos. Rewards total Rp114.000.
- **Kos:** Rp750.000 once, permanent; the room includes a stove.
- Target (r3 sim): normal player median ≈ 48 real minutes to kos, slow player ≈ 98.
