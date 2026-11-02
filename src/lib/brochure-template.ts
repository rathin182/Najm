import { formatSAR, propertyDetails, type Property } from "@/data/properties";

type Details = ReturnType<typeof propertyDetails>;

const esc = (v: string | number) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const abs = (src: string, origin: string) => (/^(https?:|data:)/.test(src) ? src : origin + src);

/**
 * Print-ready A4 brochure. Opened in a new tab, it triggers the browser's print dialog,
 * where the visitor picks "Save as PDF". Edit the markup/CSS below to restyle it.
 */
export function buildBrochureHtml(p: Property, d: Details, origin: string): string {
  const [cover, ...rest] = p.images;
  const gallery = rest.slice(0, 2);
  const facts: [string, string][] = [
    ["Built-up area", `${p.area} m²`],
    ["Plot size", `${d.plot} m²`],
    ["Bedrooms", p.beds ? String(p.beds) : "—"],
    ["Bathrooms", String(p.baths)],
    ["Parking", String(d.parking)],
    ["Levels", d.floors],
    ["Type", p.type],
    ["Completion", `${p.year} · ${p.status}`],
    ["Furnishing", d.furnishing],
    ["Facing", d.facing],
    ["Developer", d.developer],
    ["Title deed", d.deed],
  ];
  const pairs = (rows: string[][]) => rows.map(([a, b]) => `<tr><td>${esc(a ?? "")}</td><td>${esc(b ?? "")}</td></tr>`).join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(p.title)} — Najm Estate brochure</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  :root { --green: #2c5b40; --ink: #161616; --cream: #f6f2e9; --muted: #6b6b66; }
  body { margin: 0; font-family: "Helvetica Neue", Arial, sans-serif; color: var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; page-break-after: always; position: relative; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
  h1, h2, .serif { font-family: Georgia, "Times New Roman", serif; font-weight: 400; margin: 0; }
  .cover { background: var(--green); color: #fff; display: flex; flex-direction: column; height: 297mm; }
  .cover .photo { flex: 1; min-height: 120mm; background: #ddd center/cover no-repeat; }
  .cover .body { padding: 14mm 16mm; }
  .brand { letter-spacing: .35em; font-size: 10pt; text-transform: uppercase; opacity: .85; }
  .cover h1 { font-size: 34pt; line-height: 1.1; margin-top: 6mm; }
  .loc { margin-top: 3mm; font-size: 13pt; opacity: .85; }
  .price { margin-top: 10mm; font-size: 24pt; font-family: Georgia, serif; }
  .price small { display: block; font-size: 10pt; font-family: "Helvetica Neue", Arial, sans-serif; opacity: .75; margin-top: 1mm; }
  .tag { position: absolute; top: 12mm; right: 12mm; background: #fff; color: var(--green); padding: 2mm 5mm; border-radius: 99px; font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; }
  .inner { padding: 16mm; }
  h2 { font-size: 20pt; color: var(--green); margin-bottom: 5mm; }
  .sec { margin-top: 10mm; }
  .sec:first-child, .cols .sec { margin-top: 0; }
  .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
  .fact { background: var(--cream); border-radius: 4mm; padding: 4mm 5mm; }
  .fact span { display: block; font-size: 8pt; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); }
  .fact b { display: block; margin-top: 1mm; font-size: 12pt; font-weight: 600; }
  p.desc { font-size: 11pt; line-height: 1.65; margin: 0; color: #2a2a28; }
  .gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 8mm; }
  .gallery div { height: 55mm; border-radius: 4mm; background: #ddd center/cover no-repeat; }
  .amen { display: flex; flex-wrap: wrap; gap: 3mm; }
  .amen span { border: .3mm solid var(--green); color: var(--green); border-radius: 99px; padding: 1.6mm 4.5mm; font-size: 10pt; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
  td { padding: 2.6mm 0; border-bottom: .3mm solid #e4e0d6; }
  td:last-child { text-align: right; font-weight: 600; }
  .yield { background: var(--green); color: #fff; border-radius: 4mm; padding: 6mm; margin-top: 8mm; display: flex; align-items: baseline; gap: 5mm; }
  .yield b { font-family: Georgia, serif; font-size: 26pt; font-weight: 400; }
  .foot { position: absolute; left: 0; right: 0; bottom: 0; background: var(--ink); color: #fff; padding: 7mm 16mm; font-size: 10pt; display: flex; justify-content: space-between; }
  .note { margin-top: 8mm; font-size: 8pt; color: var(--muted); }
  .bar { display: none; }
  @media screen {
    body { background: #d9d6cd; padding: 0 0 24px; }
    .bar { display: flex; position: sticky; top: 0; z-index: 10; justify-content: space-between; align-items: center; background: var(--ink); color: #fff; padding: 10px 24px; font-size: 14px; }
    .bar button { background: var(--green); color: #fff; border: 0; border-radius: 99px; padding: 8px 20px; font-size: 14px; cursor: pointer; }
    .page { margin: 24px auto 0; box-shadow: 0 6px 30px rgba(0,0,0,.18); }
  }
  @media print { body { zoom: 1 !important; padding: 0; background: #fff; } .bar { display: none !important; } .page { margin: 0; box-shadow: none; } }
</style></head>
<body>
<div class="bar"><span>${esc(p.title)} · Najm Estate brochure</span><button onclick="window.print()">Save as PDF</button></div>
<section class="page cover">
  <div class="photo" style="background-image:url('${esc(abs(cover ?? "", origin))}')"></div>
  <span class="tag">${esc(p.status)} · ${esc(p.type)}</span>
  <div class="body">
    <div class="brand">Najm Estate</div>
    <h1>${esc(p.title)}</h1>
    <div class="loc">${esc(p.district)}, ${esc(p.city)}</div>
    <div class="price">${esc(formatSAR(p.price))}<small>${esc(formatSAR(d.pricePerM2))} per m²</small></div>
  </div>
</section>

<section class="page">
  <div class="inner">
    <div class="sec"><h2>The property</h2><p class="desc">${esc(p.description)}</p></div>
    <div class="sec"><h2>Key facts</h2>
      <div class="facts">${facts.map(([k, v]) => `<div class="fact"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}</div>
    </div>
    ${gallery.length ? `<div class="gallery">${gallery.map((g) => `<div style="background-image:url('${esc(abs(g, origin))}')"></div>`).join("")}</div>` : ""}
    <div class="sec"><h2>Amenities</h2><div class="amen">${p.amenities.map((a) => `<span>${esc(a)}</span>`).join("")}</div></div>
  </div>
  <div class="foot"><span>Najm Estate · hello@najmestate.sa</span><span>+966 11 000 0000</span></div>
</section>

<section class="page">
  <div class="inner">
    <div class="cols">
      <div class="sec"><h2>Layout</h2><table>${pairs(d.rooms)}</table></div>
      <div class="sec"><h2>Nearby</h2><table>${pairs(d.nearby)}</table></div>
    </div>
    <div class="sec"><h2>Payment plan</h2><table>${pairs(d.plan)}</table></div>
    <div class="sec"><h2>Costs</h2>
      <table>
        <tr><td>Estimated real-estate transaction tax (5%)</td><td>${esc(formatSAR(d.tax))}</td></tr>
        <tr><td>Estimated brokerage fee (2.5%)</td><td>${esc(formatSAR(d.fee))}</td></tr>
        <tr><td>Indicative monthly mortgage (80% LTV, 25 yrs)</td><td>${esc(formatSAR(d.mortgage))}</td></tr>
      </table>
    </div>
    ${p.investment ? `<div class="yield"><b>${esc(p.investment.yield)}%</b><span>Projected yield · ${esc(p.investment.label)}</span></div>` : ""}
    <p class="note">Figures are indicative and subject to change. Please contact Najm Estate to confirm availability, pricing and terms.</p>
  </div>
  <div class="foot"><span>Najm Estate · hello@najmestate.sa</span><span>+966 11 000 0000</span></div>
</section>
<script>
  // On screen, scale the A4 pages up to use the window width (print is unaffected)
  function fit() { var z = Math.max(1, Math.min(1.5, (window.innerWidth - 48) / 794)); document.body.style.zoom = z; }
  window.addEventListener("resize", fit); fit();
  window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 500); });
</script>
</body></html>`;
}