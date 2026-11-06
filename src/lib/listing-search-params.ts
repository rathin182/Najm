export const PAGE_SIZE = 15;

export function toListingApiParams(query: string, page: number, pageSize = PAGE_SIZE): URLSearchParams {
    const params = new URLSearchParams(query);
    params.set("paginated", "1");
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const budget = params.get("budget");
    if (budget) {
        const [min, max] = budget.split("-").map(Number);
        if (min && min > 0) params.set("minPrice", String(min));
        if (max && max < 999999999) params.set("maxPrice", String(max));
        params.delete("budget");
    }
    const beds = params.get("beds");
    if (beds) {
        if (beds === "0") params.set("studio", "1"); else params.set("minBeds", beds);
        params.delete("beds");
    }
    const baths = params.get("baths");
    if (baths) { params.set("minBaths", baths); params.delete("baths"); }
    const status = params.get("status");
    if (status) { params.set("readiness", status.toLowerCase() === "off-plan" ? "off-plan" : "ready"); params.delete("status"); }
    const sort = params.get("sort");
    const dir = params.get("dir");
    params.delete("dir");
    if (sort === "low") params.set("sort", "price-low");
    else if (sort === "high") params.set("sort", "price-high");
    else if (sort === "price") params.set("sort", dir === "desc" ? "price-high" : "price-low");
    else if (sort === "area") params.set("sort", dir === "asc" ? "size-small" : "size-large");
    else if (!sort && dir === "asc") params.set("sort", "oldest");
    return params;
}

/** Order-independent key so server and client agree on "same filters". */
export function normalizeQuery(query: string): string {
    return [...new URLSearchParams(query).entries()].map(([k, v]) => `${k}=${v}`).sort().join("&");
}