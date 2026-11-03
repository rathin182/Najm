export type OrderRow = { id: string; sortOrder: number };

export function planOrderShifts( others: OrderRow[], targetOrder: number, previousOrder: number | null, ): OrderRow[] {
    const conflicts = others.filter((row) => row.sortOrder === targetOrder);
    if (conflicts.length === 0) return [];

    const canSwap =
    previousOrder !== null &&
    previousOrder !== targetOrder &&
    !others.some((row) => row.sortOrder === previousOrder);

    let last = Math.max(targetOrder, ...others.map((row) => row.sortOrder));
    return conflicts.map((row, index) => index === 0 && canSwap && previousOrder !== null ? { id: row.id, sortOrder: previousOrder } : { id: row.id, sortOrder: ++last },);
}