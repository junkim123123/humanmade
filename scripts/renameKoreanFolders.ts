import * as fs from "fs";
import * as path from "path";

// Define the mapping manually to avoid import issues in this script
const photoNameMap: Record<string, string> = {
  "$0.5 장난감": "$0.50 Toy",
  "3d젤리": "3D Jelly",
  "고슴도치 데스크탑 청소기": "Hedgehog Desk Cleaner",
  "곰돌이 껌": "Teddy Bear Gum",
  "과일먹은 마시멜로우": "Fruit Marshmallow",
  "과일을 탐하는 마시멜로우": "Fruit Lover Marshmallow",
  "귀멸의 칼날 키링": "Demon Slayer Keyring",
  "귀멸의칼날 오뚝이": "Demon Slayer Tumbler Toy",
  "귀요미 곤충 채집 통": "Cute Bug Catcher Jar",
  "긱스 캔디": "Geeks Candy",
  "까먹는 젤리": "Peel Jelly",
  "나의히어로아카데미아 해피캔디": "My Hero Academia Happy Candy",
  "낚시왕 놀이": "Fishing King Game",
  "너콜나사": "Neocol Screw",
  "눈오리만들기 달콤캔디": "Snow Duck Maker Sweet Candy",
  "다이노 5단 합체로봇 스톤캔디": "Dino 5-Tier Combine Robot Stone Candy",
  "도라에몽 선풍기": "Doraemon Fan",
  "돌고래비눗방울": "Dolphin Bubble Blower",
  "드럼스틱 더블 젤리": "Drumstick Double Jelly",
  "디너초코 공구박스": "Dinner Chocolate Tool Box",
  "딸기모양 마시멜로": "Strawberry-Shaped Marshmallow",
  "라이센스 선풍기": "Licensed Character Fan",
  "라인 캐리어": "LINE Suitcase",
  "라인프렌즈 오뚝이 달콤캔디": "LINE FRIENDS Tumbler Sweet Candy",
  "라인프렌즈스탠드": "LINE FRIENDS Stand",
  "로보사우루스 스톤캔디": "RoboSaurus Stone Candy",
  "롤젤리": "Roll Jelly",
  "루와버블껌": "Luwa Bubble Gum",
  "리본젤리": "Ribbon Jelly",
  "마스크맨 오뚝이": "Mask Man Tumbler Toy",
  "마스크모양 마시멜로": "Mask-Shaped Marshmallow",
  "마시멜로우 벌크": "Marshmallow Bulk Pack",
  "말랑달콤 젤리 마시멜로우": "Soft Sweet Jelly Marshmallow",
  "말차캔디": "Matcha Candy",
  "맛있는 과일젤리": "Tasty Fruit Jelly",
  "망고맛 푸딩": "Mango Pudding",
  "망고맛집": "Best Mango",
  "매직빈즈달콤젤리빈": "Magic Beans Sweet Jelly Beans",
  "먼작귀 매직미러": "Chiikawa Magic Mirror",
  "먼작귀 스탬프": "Chiikawa Stamp",
  "먼작귀 아크릴": "Chiikawa Acrylic",
  "메롱마시멜로우": "Tongue-Out Marshmallow",
  "모듬젤리": "Assorted Jelly",
  "미니니쮸": "Minini Chew",
  "미니바둑": "Mini Go Set",
  "미키마우스 대스크탑 청소기": "Mickey Mouse Desk Cleaner",
  "밀크소프페과자": "Milk Soufflé Snack",
  "밀크치즈바캐트": "Milk Cheese Baguette",
  "밀크하이스퍼프스": "Milk Hi-Puffs",
  "바베큐 마시멜로": "BBQ Marshmallow",
  "바베큐 마시멜로우": "BBQ Marshmallow",
  "버블버블 심쿵덕": "Bubble Bubble Heart Duck",
  "보들키링": "Plush Keyring",
  "부방용품 장난감": "Household Toy Accessories",
  "부엉이 저금통": "Owl Piggy Bank",
  "불빛라이트닝 캔디": "Light-Up Lightning Candy",
  "브레드 이발소 오뚝이": "Bread Barbershop Tumbler Toy",
  "브레드이발소 키링": "Bread Barbershop Keyring",
  "브롤샷다트건": "Brawl Shot Dart Gun",
  "빠삭달콤캔디": "Crunchy Sweet Candy",
  "뽀로로 달콤캔디 키링": "Pororo Sweet Candy Keyring",
  "뽀로로매직미러": "Pororo Magic Mirror",
  "사이다 콜라 환타 병 젤리빈": "Soda Cola Fanta Bottle Jelly Beans",
  "새콤팡팡 젤리빈": "Sour Pop Jelly Beans",
  "선풍기 모음": "Fans Collection",
  "소리까지담은캔디": "Sound Candy",
  "숲속마을 죽순 버섯모양": "Forest Village Bamboo Shoot Mushroom Shape",
  "슈퍼파워 버틀킹": "Superpower Battle King",
  "스위트 과일모양 젤리": "Sweet Fruit-Shaped Jelly",
  "시즌 마시멜로우": "Seasonal Marshmallow",
  "시크릿 쥬쥬 달콤캔디 키링": "Secret Jouju Sweet Candy Keyring",
  "시크릿 쥬쥬 칫솔모양 캔디": "Secret Jouju Toothbrush-Shaped Candy",
  "시크릿쥬쥬 스탠드": "Secret Jouju Stand",
  "시크릿쥬쥬 오뚝이": "Secret Jouju Tumbler Toy",
  "신묘한 캔뱃지": "Mystery Can Badge",
  "심쿵룰렛": "Heart-Pound Roulette",
  "아이스크림 선풍기": "Ice Cream Fan",
  "악마의열매 마시멜로우": "Devil Fruit Marshmallow",
  "악어 룰렛": "Crocodile Roulette",
  "앙핑거다이노": "Finger Dino",
  "애니멀 버블스틱": "Animal Bubble Stick",
  "야미젤리빈": "Yummy Jelly Beans",
  "에그타르트젤리": "Egg Tart Jelly",
  "옥스포드 선풍기": "Oxford Fan",
  "왕셔요 풍선껌": "Wang Shio Bubble Gum",
  "왕큐브팝": "Giant Cube Pop",
  "요요": "Yo-Yo",
  "우주팝": "Space Pop",
  "원피스 그립톧": "One Piece Phone Grip",
  "원피스 마그넷": "One Piece Magnet",
  "원피스 오뚝이": "One Piece Tumbler Toy",
  "윙윙 바람개비 비눗방을": "Whirring Pinwheel Bubbles",
  "육회젤리": "Yukhoe Jelly",
  "자이언트 버블 스틱": "Giant Bubble Stick",
  "저스디스 리그 달콤 캔디키링": "Justice League Sweet Candy Keyring",
  "정수기 장난감": "Water Dispenser Toy",
  "주사위껌": "Dice Gum",
  "짱구 캐릭미러 달콤젤리": "Crayon Shin-chan Character Mirror Sweet Jelly",
  "짱구마그넷": "Crayon Shin-chan Magnet",
  "짱셔요 마시멜로우": "Jjang Shio Marshmallow",
  "초코킥": "Choco Kick",
  "초코펜": "Choco Pen",
  "캐로로 오뚝이 달콤캔디": "Keroro Tumbler Sweet Candy",
  "캐로로키링": "Keroro Keyring",
  "캐릭터 마시멜로우": "Character Marshmallow",
  "캐릭터 초코스틱 미니언즈 짱구": "Character Choco Sticks Minions and Shin-chan",
  "코코펀치": "Coco Punch",
  "콜라 파인애플맛 캔디": "Cola Pineapple Candy",
  "콩순이 캔디샵": "Kongsuni Candy Shop",
  "쿠키 앤 중장비": "Cookies and Construction Vehicles",
  "크리스탈캔디": "Crystal Candy",
  "탐나정수기": "Tamna Water Dispenser",
  "탕후루젤리": "Tanghulu Jelly",
  "펑리수 비스킷": "Pineapple Cake Biscuits",
  "펭귄톡톡 얼음깨기": "Penguin Tap Tap Ice Breaker",
  "포켓몬 매직미러": "Pokémon Magic Mirror",
  "포켓몬 미니 캐리어": "Pokémon Mini Suitcase",
  "포켓몬 손풍기": "Pokémon Hand Fan",
  "포켓몬 컬랙션 키링 달콤젤리": "Pokémon Collection Keyring Sweet Jelly",
  "푸푸 마시멜로우": "Pupu Marshmallow",
  "프루츠사워젤리": "Fruits Sour Jelly",
  "피넛밀크라이스롤과자": "Peanut Milk Rice Roll Snack",
  "피크민 휘슬": "Pikmin Whistle",
  "하리보 캐리어": "Haribo Suitcase",
  "한입마시멜로우": "Bite-Sized Marshmallow",
  "한입쌀과자": "Bite-Sized Rice Snack",
  "햄토리하우스": "Hamtori House",
  "활쏘기 장난감": "Archery Toy Set",
  "후루츄": "Furuchu",
  "DIY 달콤 모나카": "DIY Sweet Monaka",
  "LED 불빛 반지캔디": "LED Light-Up Ring Candy",
};

const PRODUCT_PHOTOS_DIR = path.join(process.cwd(), "public", "product-photos");

function sanitizeFolderName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "") // Remove invalid characters
    .trim();
}

function renameFolders() {
  console.log("📂 Renaming Korean product photo folders to English...\n");

  if (!fs.existsSync(PRODUCT_PHOTOS_DIR)) {
    console.error("❌ Directory not found:", PRODUCT_PHOTOS_DIR);
    return;
  }

  const items = fs.readdirSync(PRODUCT_PHOTOS_DIR, { withFileTypes: true });

  for (const item of items) {
    if (!item.isDirectory()) continue;

    const folderName = item.name;
    const englishName = photoNameMap[folderName];

    if (englishName) {
      const sanitizedEnglishName = sanitizeFolderName(englishName);
      const oldPath = path.join(PRODUCT_PHOTOS_DIR, folderName);
      const newPath = path.join(PRODUCT_PHOTOS_DIR, sanitizedEnglishName);

      if (oldPath === newPath) {
        console.log(`⏩ Skipping "${folderName}" (already correct)`);
        continue;
      }

      if (fs.existsSync(newPath)) {
        console.warn(`⚠️ Destination already exists, skipping: "${sanitizedEnglishName}"`);
        continue;
      }

      try {
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Renamed: "${folderName}" → "${sanitizedEnglishName}"`);
      } catch (e) {
        console.error(`❌ Failed to rename "${folderName}":`, e);
      }
    } else {
      if (/[^\x00-\x7F]/.test(folderName)) {
        console.log(`❓ No mapping found for Korean folder: "${folderName}"`);
      }
    }
  }

  console.log("\n✨ Done renaming folders.");
}

renameFolders();
