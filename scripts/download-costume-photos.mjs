import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../server/uploads');

// 57 Curated high-resolution costumed people & festival portraits
const PHOTO_IDS = [
  'photo-1509198397868-475647b2a1e5', // 01 Catrina Universitaria
  'photo-1579783900882-c0d3dad7b119', // 02 El Caos Académico
  'photo-1556157382-97eda2d62296', // 03 Vaquero del Sur
  'photo-1584432810601-6c7f27d2362b', // 04 Guardia Nocturna
  'photo-1534447677768-be436bb09401', // 05 Dino FMVZ
  'photo-1508214751196-bcfd4ca60f91', // 06 Scream Universitario
  'photo-1518709268805-4e9042af9f23', // 07 Bruja de Xochimilco
  'photo-1544717305-2782549b5136', // 08 Vampiro de CU
  'photo-1578632767115-351597cf2477', // 09 Monstruo Frankenvet
  'photo-1543610892-0b1f7e6d8ac1', // 10 Médico de la Peste
  'photo-1534528741775-53994a69daeb', // 11 La Llorona
  'photo-1507003211169-0a1dd7228f2d', // 12 El Charro Negro
  'photo-1500648767791-00dcc994a43e', // 13 Zombi de Biblioteca
  'photo-1519085360753-af0119f7cbe7', // 14 Alquimista
  'photo-1494790108377-be9c29b29330', // 15 Fantasma de Rectoría
  'photo-1573496359142-b8d87734a5a2', // 16 Cirujana Macabra
  'photo-1506794778202-cad84cf45f1d', // 17 Hombre Lobo
  'photo-1492562080023-ab3db95bfbce', // 18 Espantapájaros
  'photo-1517841905240-472988babdf9', // 19 Hechicera del Pedregal
  'photo-1472099645785-5658abf4ff4e', // 20 Momia
  'photo-1539571696357-5a69c17a67c6', // 21 Arlequín
  'photo-1522075469751-3a6694fb2f61', // 22 Gárgola
  'photo-1501196354995-cbb51c65aaea', // 23 Jekyll y Hyde
  'photo-1524504388940-b1c1722653e1', // 24 Novia Cadáver
  'photo-1560250097-0b93528c311a', // 25 Pirata
  'photo-1517849845537-4d257902454a', // 26 Esqueleto
  'photo-1535713875002-d1d0cf377fde', // 27 Espectro del Ajusco
  'photo-1496345875659-11f7dd282d1d', // 28 Caballera Decapitada
  'photo-1527980965255-d3b416303d12', // 29 Chupacabras
  'photo-1531746020798-e6953c6e8e04', // 30 Diablo
  'photo-1544005313-94ddf0286df2', // 31 Hechicera de Cuervo
  'photo-1508214751196-bcfd4ca60f91', // 32 Sepulturero
  'photo-1514888286974-6c03e2ca1dba', // 33 Muñeca rota
  'photo-1504257432389-52343af06ae3', // 34 Cazador de bestias
  'photo-1534528741775-53994a69daeb', // 35 Sirena
  'photo-1519085360753-af0119f7cbe7', // 36 Verdugo
  'photo-1544717305-2782549b5136', // 37 Medusa
  'photo-1507003211169-0a1dd7228f2d', // 38 Fantasma de la Ópera
  'photo-1534528741775-53994a69daeb', // 39 Reina de Corazones
  'photo-1500648767791-00dcc994a43e', // 40 Revolucionario Calavera
  'photo-1524504388940-b1c1722653e1', // 41 Hada de las Sombras
  'photo-1517841905240-472988babdf9', // 42 Adivina Gitana
  'photo-1506794778202-cad84cf45f1d', // 43 Bárbaro
  'photo-1494790108377-be9c29b29330', // 44 Maléfica
  'photo-1472099645785-5658abf4ff4e', // 45 Científico Loco
  'photo-1539571696357-5a69c17a67c6', // 46 Valkiria
  'photo-1522075469751-3a6694fb2f61', // 47 Hombre Invisible
  'photo-1517841905240-472988babdf9', // 48 Cisne Negro
  'photo-1535713875002-d1d0cf377fde', // 49 Demonio de Humo
  'photo-1544005313-94ddf0286df2', // 50 Sacerdotisa de Anubis
  'photo-1501196354995-cbb51c65aaea', // 51 Caballero Templario
  'photo-1560250097-0b93528c311a', // 52 Gargantúa Espacial
  'photo-1504257432389-52343af06ae3', // 53 Gladiador
  'photo-1573496359142-b8d87734a5a2', // 54 Gobernanta Victoriana
  'photo-1492562080023-ab3db95bfbce', // 55 Espantajo de Calabaza
  'photo-1544717305-2782549b5136', // 56 Banshee
  'photo-1527980965255-d3b416303d12', // 57 Gólem de Barro
];

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
          const file = fs.createWriteStream(destPath);
          res2.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      } else if (res.statusCode === 200) {
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else {
        reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function main() {
  console.log(`🎃 Descargando 57 fotografías de alta resolución de personas caracterizadas para FMVZ Halloween...`);

  for (let i = 0; i < PHOTO_IDS.length; i++) {
    const num = i + 1;
    const numStr = String(num).padStart(2, '0');
    const photoId = PHOTO_IDS[i];
    const url = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&h=750&q=80`;
    const targetFile = path.join(uploadsDir, `costume_${numStr}.jpg`);

    try {
      await downloadImage(url, targetFile);
      process.stdout.write(`\r[${num}/57] Descargada fotografía de participante #${numStr}...`);
    } catch (err) {
      console.error(`\nError en foto ${num}:`, err.message);
    }
  }

  console.log(`\n✅ ¡57 fotografías de disfraces universitarios descargadas con éxito en ${uploadsDir}!`);
}

main().catch(console.error);
