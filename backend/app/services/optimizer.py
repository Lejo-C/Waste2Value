import pulp


def optimize_dispatch(horizon_hours=24, storage_start_kwh=40, storage_capacity_kwh=100, heat_pump_capacity_kwh=25, erf_minimum=0.10):
    heat = [max(3, 10 + 4 * ((h % 8) / 8) + (5 if 8 <= h <= 18 else 2)) for h in range(horizon_hours)]
    price = [4.0 + (4.5 if 18 <= (h % 24) <= 21 else 1.0 if 8 <= (h % 24) <= 17 else 0.0) for h in range(horizon_hours)]
    demand = [8 + (8 if 7 <= (h % 24) <= 20 else 3) for h in range(horizon_hours)]

    prob = pulp.LpProblem("Waste2Value_Dispatch", pulp.LpMinimize)
    charge = pulp.LpVariable.dicts("charge", range(horizon_hours), lowBound=0)
    release = pulp.LpVariable.dicts("release", range(horizon_hours), lowBound=0)
    boost = pulp.LpVariable.dicts("boost", range(horizon_hours), lowBound=0)
    vent = pulp.LpVariable.dicts("vent", range(horizon_hours), lowBound=0)
    storage = pulp.LpVariable.dicts("storage", range(horizon_hours), lowBound=0, upBound=storage_capacity_kwh)

    prob += pulp.lpSum(price[h] * boost[h] - 3.8 * release[h] + 0.2 * vent[h] for h in range(horizon_hours))

    for h in range(horizon_hours):
        prob += charge[h] + release[h] + boost[h] + vent[h] <= heat[h]
        prev = storage_start_kwh if h == 0 else storage[h - 1]
        prob += storage[h] == prev + charge[h] - release[h]
        prob += boost[h] <= heat_pump_capacity_kwh
        prob += release[h] <= demand[h]
    prob += pulp.lpSum(release[h] for h in range(horizon_hours)) >= erf_minimum * pulp.lpSum(heat[h] for h in range(horizon_hours))
    prob.solve(pulp.PULP_CBC_CMD(msg=False))

    points = []
    for h in range(horizon_hours):
        points.append({
            "hour": h,
            "heat_available": round(heat[h], 2),
            "charge": round(pulp.value(charge[h]) or 0, 2),
            "release": round(pulp.value(release[h]) or 0, 2),
            "boost": round(pulp.value(boost[h]) or 0, 2),
            "vent": round(pulp.value(vent[h]) or 0, 2),
            "storage": round(pulp.value(storage[h]) or 0, 2),
            "price": round(price[h], 2),
            "demand": round(demand[h], 2),
        })
    total_heat = sum(p["heat_available"] for p in points)
    released = sum(p["release"] for p in points)
    boosted = sum(p["boost"] for p in points)
    baseline_cost = sum(price[h] * demand[h] for h in range(horizon_hours))
    optimized_cost = sum(price[h] * points[h]["boost"] - 3.8 * points[h]["release"] for h in range(horizon_hours))
    optimized_cost = max(0, optimized_cost)
    avoided = max(0, baseline_cost - optimized_cost)
    return {
        "horizon_hours": horizon_hours,
        "points": points,
        "total_heat_available": round(total_heat, 2),
        "total_stored": round(sum(p["charge"] for p in points), 2),
        "total_released": round(released, 2),
        "total_boosted": round(boosted, 2),
        "total_vented": round(sum(p["vent"] for p in points), 2),
        "baseline_cost": round(baseline_cost, 2),
        "optimized_cost": round(optimized_cost, 2),
        "cost_saved": round(avoided, 2),
        "carbon_avoided_kg": round(avoided * 0.42, 2),
    }
