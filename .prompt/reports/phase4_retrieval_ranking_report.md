# Phase 4 Retrieval And Ranking Report

## Volume Summary
- Total merchants loaded: 539
- Total nearby queries: 12
- Total on-route queries: 8
- Average candidate count per nearby query: 28.42
- Average candidate count per on-route query: 45.25

## Top Merchants By Appearance
- `ChIJR49LHcItdTERIiTJj8DLsa0` / XE ĐẸP DETAILING - ĐỘ XE Ô TÔ - ĐỖ XE 24/24 - RỬA XE: 7 appearances
- `ChIJCQmWVNMvdTERNLWPf_PE3WE` / An Khang Detailing - Xưởng chăm xe vui vẻ: 6 appearances
- `ChIJdxjE8JMpdTERnAUyvPtxWuo` / Car and motorcycle detailing: 6 appearances
- `ChIJeUtNRwAvdTEReYPFG0EmXTA` / Rửa xe oto xe máy SBS: 5 appearances
- `ChIJsUb44OErdTERLZRoEGZHttc` / Rửa xe tự động Tiến Bộ: 5 appearances
- `ChIJLeRnKbUpdTERnp0hBlwn0es` / TIỆM RỬA XE HỒNG PHÚC: 5 appearances
- `ChIJW4knxqEvdTERhuMXJ4-RYL8` / Tiệm rửa xe, sửa xe, bảo dưỡng xe 2 bánh - TN Detailing-Motorcycle wash: 5 appearances
- `ChIJGfU0Z-ovdTERc2ehGxgW5Os` / Tiệm Sửa Xe Rửa Xe Máy 528: 5 appearances
- `ChIJa0Ioe3kvdTERneUe8H-ItFc` / Rửa xe bọt tuyết 34: 5 appearances
- `ChIJE15xZR8pdTERjhHTMKfts8c` / Trung tâm chăm sóc xe Phước Thắng: 5 appearances

## Ranking Score Distribution

| metric | nearby_final_rank_score | on_route_final_rank_score |
| --- | --- | --- |
| count | 341.0 | 362.0 |
| mean | 0.4994 | 0.624714 |
| std | 0.101434 | 0.133549 |
| min | 0.253613 | 0.307091 |
| 25% | 0.426514 | 0.5242 |
| 50% | 0.486371 | 0.632142 |
| 75% | 0.567708 | 0.735302 |
| max | 0.790197 | 0.919584 |

## Route Approximation Assumptions
- Route search uses a straight-line corridor between origin and destination because no routing engine is available in this phase.
- Point-to-route distance uses a local kilometer projection around the route segment midpoint for a lightweight corridor approximation.
- Detour proxy is estimated as origin-to-merchant plus merchant-to-destination minus direct origin-to-destination distance.

## Known Limitations
- Synthetic queries are representative but not grounded in real user logs, so demand patterns and filter combinations may differ from production behavior.
- Straight-line routing ignores road topology, traffic flow, bridges, rivers, and one-way constraints.
- Rule-based service tagging inherits Phase 3 heuristic limitations and may under-detect niche services like ceramic or EV-safe handling.
- Nearby and route rankers are deterministic baselines and do not yet use clickthrough, booking conversion, or personalized preferences.
