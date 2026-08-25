const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const carsDir = path.join(rootDir, 'cars');

function parseDescription(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const data = {
    name: '',
    model: '',
    color: '',
    variant: '',
    fuel: '',
    transmission: '',
    drivetrain: '',
    seating: '',
    specs: {},
    features: []
  };

  let inFeatures = false;

  for (const line of lines) {
    if (/^features\s*:?$/i.test(line)) {
      inFeatures = true;
      continue;
    }

    if (inFeatures) {
      // Remove leading bullet if any
      const feat = line.replace(/^[-*•]\s*/, '').trim();
      if (feat) {
        data.features.push(feat);
      }
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      const val = line.slice(colonIndex + 1).trim();
      const keyLower = key.toLowerCase();

      if (keyLower === 'name') data.name = val;
      else if (keyLower === 'model' || keyLower === 'year') data.model = val;
      else if (keyLower === 'color' || keyLower === 'colour') data.color = val;
      else if (keyLower === 'variant' || keyLower === 'trim' || keyLower === 'grade') data.variant = val;
      else if (keyLower === 'fuel') data.fuel = val;
      else if (keyLower === 'transmission') data.transmission = val;
      else if (keyLower === 'drivetrain' || keyLower === 'drive') data.drivetrain = val;
      else if (keyLower === 'seating' || keyLower === 'seats') data.seating = val;
      else {
        data.specs[key] = val;
      }
    } else {
      // Line without colon before Features: header
      if (!data.name) {
        data.name = line;
      } else {
        data.features.push(line);
      }
    }
  }

  return data;
}

const folders = fs.readdirSync(carsDir).filter(f => fs.statSync(path.join(carsDir, f)).isDirectory());

const catalog = [];

for (const folder of folders) {
  const folderPath = path.join(carsDir, folder);
  const files = fs.readdirSync(folderPath);

  let descText = '';
  if (files.includes('description.txt')) {
    descText = fs.readFileSync(path.join(folderPath, 'description.txt'), 'utf8');
  }

  const parsed = parseDescription(descText);
  if (!parsed.name) {
    parsed.name = folder;
  }

  // Find images
  const imageExts = ['.jpeg', '.jpg', '.png', '.webp', '.avif', '.gif'];
  const allImages = files.filter(f => imageExts.includes(path.extname(f).toLowerCase()));

  // Find Main_image
  const mainImage = allImages.find(f => /^main_image\./i.test(f)) || allImages.find(f => /^main\./i.test(f)) || allImages[0] || '';

  // Sort other images: 1.jpeg, 2.jpeg, 3.jpeg ... 10.jpeg, 11.jpeg
  const otherImages = allImages.filter(f => f !== mainImage).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const orderedImages = mainImage ? [mainImage, ...otherImages] : otherImages;

  catalog.push({
    folder,
    name: parsed.name,
    model: parsed.model,
    color: parsed.color,
    variant: parsed.variant,
    fuel: parsed.fuel,
    transmission: parsed.transmission,
    drivetrain: parsed.drivetrain,
    seating: parsed.seating,
    specs: parsed.specs,
    features: parsed.features,
    mainImage,
    images: orderedImages,
    descriptionRaw: descText
  });
}

const catalogPath = path.join(carsDir, 'catalog.json');
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`Generated catalog.json with ${catalog.length} cars at ${catalogPath}`);
console.log(JSON.stringify(catalog, null, 2));
