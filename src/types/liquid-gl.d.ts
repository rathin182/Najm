declare module "liquid-gl" {
  const liquidGL: ((options: Record<string, unknown>) => unknown) & { syncWith?: (o: Record<string, unknown>) => void };
  export default liquidGL;
}
