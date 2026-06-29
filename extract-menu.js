const fs = require('fs');
const html = fs.readFileSync('C:/Users/matio/.gemini/antigravity/brain/0d82bea2-5258-4450-bc1b-c0aaf8acaeda/.system_generated/steps/285/content.md', 'utf8');

const items = [];
let id = 1;

// Find all menu sections
const sectionRegex = /<span class="m-list__title-text">([^<]+)<\/span>/g;
const sections = [];
let m;
while (m = sectionRegex.exec(html)) {
  sections.push({ name: m[1].trim(), pos: m.index });
}

for (let s = 0; s < sections.length; s++) {
  const catName = sections[s].name;
  const catId = catName.toLowerCase()
    .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e').replace(/ł/g,'l')
    .replace(/ń/g,'n').replace(/ó/g,'o').replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const start = sections[s].pos;
  const end = s < sections.length - 1 ? sections[s + 1].pos : html.length;
  const chunk = html.substring(start, end);

  const itemRegex = /class="m-item__title restaurant-menu__dish-name">\s*\n?\s*([^\n<]+)/g;
  let item;
  let itemPositions = [];
  while (item = itemRegex.exec(chunk)) {
    itemPositions.push({ name: item[1].trim(), pos: item.index });
  }

  for (let i = 0; i < itemPositions.length; i++) {
    const iStart = itemPositions[i].pos;
    const iEnd = i < itemPositions.length - 1 ? itemPositions[i + 1].pos : chunk.length;
    const itemChunk = chunk.substring(Math.max(0, iStart - 3000), iEnd);
    const name = itemPositions[i].name;

    let desc = '';
    const descMatch = itemChunk.match(/<span class="muted">([^]*?)<\/span>/);
    if (descMatch) {
      desc = descMatch[1].replace(/<br\s*\/?>/g, ', ').replace(/<[^>]+>/g, '').trim();
    }

    let price = 0;
    const priceMatch = itemChunk.match(/(\d+),(\d+)\s*zł/);
    if (priceMatch) price = parseFloat(priceMatch[1] + '.' + priceMatch[2]);

    let image = null;
    // Try: src="..." ... class="m-item__image-img"
    const imgMatch = itemChunk.match(/src="(https:\/\/restaumatic-production\.imgix\.net\/uploads\/accounts\/27045\/media_library\/[^"]+)"\s[^>]*class="m-item__image-img"/);
    if (imgMatch) {
      image = imgMatch[1].split('?')[0] + '?auto=compress,format&w=400&h=300&fit=crop';
    }

    items.push({ id: id++, name, category: catId, catLabel: catName, price, description: desc, image });
  }
}

// Build categories
const catOrder = [];
const seen = new Set();
items.forEach(i => {
  if (!seen.has(i.category)) { seen.add(i.category); catOrder.push({ id: i.category, label: i.catLabel }); }
});

// Build JS
let js = `/**
 * OCH! SUSHI - Menu Data
 * Pelne menu skopiowane z sushiamai.pl (${items.length} pozycji, ${catOrder.length} kategorii)
 */

window.menuData = [\n`;

items.forEach((item, idx) => {
  js += `  { id: ${item.id}, name: ${JSON.stringify(item.name)}, category: ${JSON.stringify(item.category)}, price: ${item.price}, description: ${JSON.stringify(item.description)}, image: ${item.image ? JSON.stringify(item.image) : 'null'} }`;
  js += idx < items.length - 1 ? ',\n' : '\n';
});

js += `];\n\nwindow.menuCategories = [\n  { id: "wszystko", label: "Wszystko" },\n`;
catOrder.forEach((c, idx) => {
  js += `  { id: ${JSON.stringify(c.id)}, label: ${JSON.stringify(c.label)} }`;
  js += idx < catOrder.length - 1 ? ',\n' : '\n';
});
js += '];\n';

fs.writeFileSync('c:/Users/matio/Desktop/Agent Marketing/OchSushi/public/js/menu-data.js', js, 'utf8');

console.log(`Done! ${items.length} items, ${catOrder.length} categories`);
console.log('Categories:', catOrder.map(c => c.label).join(', '));
const withImg = items.filter(i => i.image);
console.log(`Items with images: ${withImg.length} / ${items.length}`);
