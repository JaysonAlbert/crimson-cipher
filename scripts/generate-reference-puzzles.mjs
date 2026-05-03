import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public", "reference-puzzles");
mkdirSync(outDir, { recursive: true });

const palette = {
  bg: "#140c0b",
  panel: "#211514",
  panel2: "#2b1a18",
  line: "#5a3a34",
  text: "#f4e7d8",
  muted: "#b99f8d",
  amber: "#f5b84b",
  red: "#cf3e32",
  blue: "#69c7ff",
  green: "#78d37f",
  stone: "#867262",
  darkStone: "#53463e",
};

function svg(title, subtitle, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">${subtitle}</desc>
  <rect width="1200" height="760" fill="${palette.bg}"/>
  <rect x="42" y="42" width="1116" height="676" rx="34" fill="${palette.panel}" stroke="${palette.line}" stroke-width="3"/>
  <text x="82" y="106" fill="${palette.text}" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800">${title}</text>
  <text x="84" y="148" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="22">${subtitle}</text>
  ${body}
</svg>
`;
}

function save(name, content) {
  writeFileSync(join(outDir, `${name}.svg`), content);
}

save(
  "pillar-height-equalizer",
  svg(
    "Pillar Height Equalizer",
    "Coupled controls raise or lower multiple pillars until every column matches the target height.",
    `
  <line x1="150" y1="610" x2="900" y2="610" stroke="${palette.line}" stroke-width="8"/>
  <line x1="150" y1="382" x2="900" y2="382" stroke="${palette.amber}" stroke-width="5" stroke-dasharray="16 14"/>
  <text x="922" y="390" fill="${palette.amber}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700">target</text>
  ${[300, 210, 360, 260, 420].map((h, i) => {
    const x = 172 + i * 138;
    const y = 610 - h;
    const fill = i === 0 ? palette.amber : palette.stone;
    return `<rect x="${x}" y="${y}" width="82" height="${h}" rx="10" fill="${fill}" stroke="${palette.darkStone}" stroke-width="4"/>
    <text x="${x + 41}" y="650" fill="${palette.text}" font-family="Inter, Arial, sans-serif" font-size="24" text-anchor="middle">P${i + 1}</text>`;
  }).join("")}
  <g transform="translate(835 260)">
    <circle cx="90" cy="90" r="72" fill="${palette.panel2}" stroke="${palette.line}" stroke-width="4"/>
    <path d="M90 24v132M24 90h132" stroke="${palette.red}" stroke-width="12" stroke-linecap="round"/>
    <text x="90" y="190" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="20" text-anchor="middle">stab slots affect sets</text>
  </g>
  <text x="84" y="694" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="21">Solver model: bounded integer search, BFS, or linear constraints over height deltas.</text>`
  )
);

save(
  "push-block-circuit-grid",
  svg(
    "Push Block Circuit Grid",
    "An M x N wall/floor matrix where pushing tiles forms one continuous powered route.",
    `
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="${palette.amber}"/></marker>
  </defs>
  ${Array.from({ length: 5 }).map((_, r) => Array.from({ length: 7 }).map((_, c) => {
    const x = 160 + c * 92;
    const y = 210 + r * 76;
    const active = [[0,0],[0,1],[1,1],[2,1],[2,2],[2,3],[3,3],[3,4],[4,4],[4,5],[4,6]].some(([rr, cc]) => rr === r && cc === c);
    return `<rect x="${x}" y="${y}" width="72" height="56" rx="8" fill="${active ? palette.panel2 : "#372622"}" stroke="${active ? palette.amber : palette.line}" stroke-width="${active ? 5 : 3}"/>`;
  }).join("")).join("")}
  <polyline points="196,238 288,238 288,314 288,390 380,390 472,390 472,466 564,466 564,542 656,542 748,542" fill="none" stroke="${palette.amber}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow)"/>
  <circle cx="118" cy="238" r="28" fill="${palette.green}"/><text x="118" y="246" fill="${palette.bg}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" text-anchor="middle">S</text>
  <circle cx="824" cy="542" r="28" fill="${palette.blue}"/><text x="824" y="550" fill="${palette.bg}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" text-anchor="middle">T</text>
  <text x="84" y="694" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="21">Solver model: route search + toggle/press effects; BFS/A* over bitmasks, with graph connectivity checks.</text>`
  )
);

save(
  "rotating-tile-picture-puzzle",
  svg(
    "Rotating Tile Picture Puzzle",
    "Tiles rotate in place; the target is valid when edges, symbols, or image fragments align.",
    `
  ${Array.from({ length: 4 }).map((_, r) => Array.from({ length: 4 }).map((_, c) => {
    const x = 230 + c * 130;
    const y = 185 + r * 105;
    const rot = [0, 90, 180, 270][(r * 2 + c) % 4];
    return `<g transform="translate(${x + 52} ${y + 42}) rotate(${rot}) translate(-52 -42)">
      <rect x="${x}" y="${y}" width="104" height="84" rx="10" fill="${palette.panel2}" stroke="${palette.line}" stroke-width="4"/>
      <path d="M${x + 15} ${y + 63} C${x + 35} ${y + 14}, ${x + 68} ${y + 96}, ${x + 90} ${y + 24}" fill="none" stroke="${palette.amber}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="${x + 78}" cy="${y + 28}" r="9" fill="${palette.blue}"/>
    </g>`;
  }).join("")).join("")}
  <text x="84" y="694" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="21">Solver model: finite rotations per tile; score by edge continuity, symbol matching, or image similarity.</text>`
  )
);

save(
  "sliding-block-puzzle",
  svg(
    "Sliding Block Puzzle",
    "A board with one empty cell; move tiles until route segments or fragments reach a target order.",
    `
  ${Array.from({ length: 4 }).map((_, r) => Array.from({ length: 4 }).map((_, c) => {
    const empty = r === 3 && c === 2;
    const x = 270 + c * 120;
    const y = 190 + r * 100;
    return empty
      ? `<rect x="${x}" y="${y}" width="98" height="78" rx="10" fill="#100908" stroke="${palette.line}" stroke-width="3" stroke-dasharray="10 8"/>`
      : `<rect x="${x}" y="${y}" width="98" height="78" rx="10" fill="${palette.panel2}" stroke="${palette.line}" stroke-width="4"/>
        <text x="${x + 49}" y="${y + 49}" fill="${palette.text}" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" text-anchor="middle">${r * 4 + c + 1}</text>`;
  }).join("")).join("")}
  <path d="M785 390h80m-25-24 25 24-25 24" fill="none" stroke="${palette.amber}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="84" y="694" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="21">Solver model: A*, IDA*, parity checks; visual target optional if tile IDs or route edges are detected.</text>`
  )
);

save(
  "light-reflection-routing",
  svg(
    "Light Reflection Routing",
    "Rotate mirrors, prisms, or cubes so a beam reaches one or more activation nodes.",
    `
  <defs><filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <circle cx="170" cy="430" r="38" fill="${palette.amber}" filter="url(#glow)"/>
  <polyline points="210,430 410,430 410,300 640,300 640,500 890,500" fill="none" stroke="${palette.amber}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
  ${[[410,430,45],[410,300,-45],[640,300,45],[640,500,-45]].map(([x,y,rot]) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-42" y="-8" width="84" height="16" rx="8" fill="${palette.blue}" stroke="${palette.text}" stroke-width="3"/></g>`).join("")}
  <circle cx="930" cy="500" r="34" fill="${palette.green}" stroke="${palette.text}" stroke-width="4"/>
  <circle cx="1010" cy="500" r="22" fill="${palette.panel2}" stroke="${palette.line}" stroke-width="4"/>
  <text x="84" y="694" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="21">Solver model: enumerate mirror angles; ray-trace or graph-search beam paths to target nodes.</text>`
  )
);

save(
  "dial-symbol-alignment",
  svg(
    "Dial Symbol Alignment",
    "Circular dials or rings rotate until symbols point to required slots or all rings illuminate.",
    `
  ${[0,1,2].map((i) => {
    const x = 310 + i * 210;
    const rot = [25, 145, 280][i];
    return `<g transform="translate(${x} 385)">
      <circle r="82" fill="${palette.panel2}" stroke="${palette.line}" stroke-width="5"/>
      <circle r="44" fill="${palette.panel}" stroke="${palette.line}" stroke-width="4"/>
      <g transform="rotate(${rot})">
        <path d="M0 -68 L18 -24 L0 -35 L-18 -24 Z" fill="${palette.amber}"/>
      </g>
      <text y="132" fill="${palette.text}" font-family="Inter, Arial, sans-serif" font-size="24" text-anchor="middle">D${i + 1}</text>
    </g>`;
  }).join("")}
  <line x1="310" y1="244" x2="310" y2="194" stroke="${palette.green}" stroke-width="8" stroke-linecap="round"/>
  <line x1="520" y1="244" x2="470" y2="244" stroke="${palette.green}" stroke-width="8" stroke-linecap="round"/>
  <line x1="730" y1="526" x2="680" y2="576" stroke="${palette.green}" stroke-width="8" stroke-linecap="round"/>
  <text x="84" y="694" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="21">Solver model: small Cartesian product of dial states; validate with symbols, lit-state OCR, or target marks.</text>`
  )
);

save(
  "strongbox-cylinder-combo",
  svg(
    "Strongbox Cylinder Combo",
    "Buttons rotate linked cylinders, pistons, or picture bands inside a mechanical lock.",
    `
  ${[0,1,2,3].map((i) => {
    const x = 290 + i * 125;
    return `<g>
      <rect x="${x}" y="215" width="95" height="280" rx="18" fill="${palette.panel2}" stroke="${palette.line}" stroke-width="5"/>
      <path d="M${x + 12} ${280 + i * 18} C${x + 32} ${250}, ${x + 60} ${335}, ${x + 83} ${295}" fill="none" stroke="${palette.amber}" stroke-width="9" stroke-linecap="round"/>
      <path d="M${x + 12} ${390 - i * 16} C${x + 38} ${430}, ${x + 55} ${340}, ${x + 83} ${385}" fill="none" stroke="${palette.blue}" stroke-width="8" stroke-linecap="round"/>
    </g>`;
  }).join("")}
  ${[1,2,3,4].map((n, i) => `<circle cx="${335 + i * 125}" cy="570" r="32" fill="${palette.darkStone}" stroke="${palette.line}" stroke-width="4"/><text x="${335 + i * 125}" y="579" fill="${palette.text}" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="800" text-anchor="middle">${n}</text>`).join("")}
  <text x="84" y="694" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="21">Solver model: sequence search over linked rotations; BFS with reset support and short-depth pruning.</text>`
  )
);

save(
  "continuous-path-tiles",
  svg(
    "Continuous Path Tiles",
    "Step on marked tiles to connect paired symbols in one non-overlapping route.",
    `
  ${Array.from({ length: 6 }).map((_, r) => Array.from({ length: 6 }).map((_, c) => {
    const x = 255 + c * 78;
    const y = 190 + r * 68;
    return `<rect x="${x}" y="${y}" width="58" height="50" rx="8" fill="${palette.panel2}" stroke="${palette.line}" stroke-width="3"/>`;
  }).join("")).join("")}
  <polyline points="284,215 362,215 440,215 440,283 440,351 518,351 596,351 596,419 674,419" fill="none" stroke="${palette.amber}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="284" cy="215" r="20" fill="${palette.green}"/><circle cx="674" cy="419" r="20" fill="${palette.green}"/>
  <circle cx="518" cy="215" r="17" fill="${palette.blue}"/><circle cx="284" cy="487" r="17" fill="${palette.blue}"/>
  <text x="84" y="694" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="21">Solver model: Hamiltonian/pathfinding constraints; exact cover, DFS, or SAT for no-repeat paths.</text>`
  )
);

console.log(`Generated reference SVGs in ${outDir}`);
