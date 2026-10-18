const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'WS Tarot scans');
const DEST_DIR = path.join(__dirname, '..', 'public', 'cards');

const DECKS = [
  { folder: '1909 (Pam A)', id: '1909' },
  { folder: '1910 (Pam A)', id: '1910' },
  { folder: '1920s (Pam B)', id: '1920s-b' },
  { folder: '1920s – 1930s (Pam C)', id: '1920s-c' },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function setupImages() {
  console.log('🔮 Starting Tarot image setup...');
  ensureDir(DEST_DIR);

  DECKS.forEach((deck) => {
    const srcPath = path.join(SOURCE_DIR, deck.folder);
    const destPath = path.join(DEST_DIR, deck.id);

    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠️ Source deck folder not found: ${srcPath}`);
      return;
    }

    ensureDir(destPath);
    console.log(`🎴 Processing deck: ${deck.id} (${deck.folder})`);

    const files = fs.readdirSync(srcPath);
    let copiedCount = 0;

    files.forEach((file) => {
      const filePath = path.join(srcPath, file);
      if (fs.statSync(filePath).isDirectory()) return;

      // Handle card back image for 1909
      if (file.toLowerCase() === 'back.jpg') {
        const destFile = path.join(DEST_DIR, 'back.jpg');
        fs.copyFileSync(filePath, destFile);
        console.log(`✅ Copied card back to public/cards/back.jpg`);
        return;
      }

      // Check card number using regex
      // Pattern: Matches a 2-digit index surrounded by underscores, e.g. _00_ or _02_
      const match = file.match(/_(\d{2})_/);
      if (!match) return;

      const imgIndex = parseInt(match[1], 10);
      let cardNumber;

      if (imgIndex === 0) {
        cardNumber = 0; // The Fool
      } else if (imgIndex >= 2 && imgIndex <= 78) {
        cardNumber = imgIndex - 1; // Cards 1 to 77
      } else {
        // Skip _01_ or any other index
        return;
      }

      const destFile = path.join(destPath, `${cardNumber}.jpg`);
      fs.copyFileSync(filePath, destFile);
      copiedCount++;
    });

    console.log(`✅ Copied ${copiedCount} cards for deck: ${deck.id}`);
  });

  console.log('🔮 Tarot image setup completed successfully!');
}

setupImages();
