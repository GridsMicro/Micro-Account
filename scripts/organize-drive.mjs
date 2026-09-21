import { googleAuth, drive } from "./google-auth.mjs";

const TARGETS = [
  {
    folder: "01-ธุรกิจ",
    items: [
      "Microtronic Account",
      "01_Engineering_&_IoT",
      "Backup-Auto",
      "MICROTRONIC TH.pdf",
      "MICROTRONIC TH Copy",
      "Micro Account Documents",
      "Microtronic Corporate Archive",
      "micro-account-db",
      "สำเนาของ micro-accounts-db",
      "Micro-Account Dashboard (Auto)",
      "Accounting Reports",
      "ใบแจ้งชำระเงิน",
      "ใบแจ้งชำระเงิน (การตอบกลับ)",
      "ใบแจ้งชำระเงิน (File responses)",
      "Invoice-816918.pdf",
      "Journal_Export_2026-03-17.xlsx",
      "account",
      "รายการเสนอราคา by leng",
      "ใบเสนอรราคาต่ออายุ Acobat",
      "ตารางสอน: \"AI for Accounting Transformation\" (2 วัน)",
      "ตารางสอนหลักสูตร: \"AI Mastery for Productivity\"",
      "Classroom",
      "Nuc7Server",
      "NUC7 Connect Initial Setup Form",
      "Orchestrator Script",
      "Manual Orchestrator Script",
      "UI Dashboard",
      "Gemini Web Generator",
      "คู่มือการติดตั้ง Gemini CLI v1",
      "Saved from Chrome",
      "หนังสือรับรองเงินเดือน",
      "หนังสือยืนยันยอดธนาคาร",
      "ใบแจ้งขอเบิกเงิน",
    ],
  },
  {
    folder: "02-ส่วนตัว",
    items: [
      "โหราศาสตร์",
      "ShareLeng",
      "Google AI Studio",
      "Share2Candles4/2",
      "Gemini ส่งออก 1 กันยายน ค.ศ. 2026 เวลา 15 นาฬิกา 02 นาที 21 วินาที GMT+7",
      "Gemini ส่งออก 27 มกราคม ค.ศ. 2026 เวลา 14 นาฬิกา 37 นาที 31 วินาที GMT+7",
      "รายงานพอร์ต Crypto พี่จักร",
      "Takeout",
      "ภพ 20",
      "กาลชะตา",
      "สูตรยาม",
      "อิติปิโส 108",
      "ปลากัด",
      "ยามอัฏฐกาล",
      "ทิพยจักขุ",
      "สูตรหาร 7",
      "สูตาจาก AI",
      "ชาตาประจำวัน",
      "พอร์ต",
      "สถาปัตยกรรม Harvard และ สถาปัตยกรรม von Neumann ต...",
      "สำเนาของ SSR - LFIA - Date_SL_01",
      "พอร์ทัล",
      "LanmarkForum",
      "4. Operating System.ppsx",
      "วิดีโอไม่มีชื่อ",
      "Untitled document",
      "Untitled document.pdf",
      "เอกสารไม่มีชื่อ",
      "สเปรดชีตไม่มีชื่อ",
      "ปฏิทิน 100 ปี",
      "BlackBirdV1.3.T",
      "สำเนาของ Request and approve time off Apps Script Enhancement [Public]",
      "02_Computer_Science_&_IT",
      "03_Traditional_Medicine_&_Wellness",
      "04_Personal_&_Finance",
      "05_Creative_&_Media",
      "06_Active_Projects",
      "07_Archives_&_Software",
      "08_Academic_&_Docs",
      "09_Miscellaneous",
      "jWSvz4aUVA",
      "ชาตาประจำวัน ",
    ],
  },
];

const isApply = process.argv.includes("--apply");
const includeShared = process.argv.includes("--include-shared");

async function ensureFolder(service, name) {
  const find = await service.files.list({
    q: `name='${name.replaceAll("'", "\\'")}' and 'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    pageSize: 1,
  });
  if (find.data.files?.length) return find.data.files[0].id;
  const created = await service.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [] },
    fields: "id",
  });
  return created.data.id;
}

async function listChildren(service, folderId) {
  const res = await service.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id,name,mimeType)",
    pageSize: 100,
  });
  return res.data.files || [];
}

async function main() {
  const auth = await googleAuth();
  const service = await drive(auth);

  const list = await service.files.list({
    q: "'root' in parents and trashed=false",
    fields: "files(id,name,mimeType,shared)",
    pageSize: 100,
  });
  const rootItems = list.data.files || [];
  const groups = new Map();
  for (const f of rootItems) {
    const arr = groups.get(f.name) || [];
    arr.push(f);
    groups.set(f.name, arr);
  }

  console.log(`---- Drive root: ${rootItems.length} items ----`);
  for (const f of rootItems) {
    const kind = f.mimeType.includes("folder") ? "[DIR]" : "[FILE]";
    console.log(`  ${kind} ${f.name}${f.shared ? "  (shared)" : ""}`);
  }

  const folderIds = {};
  const moves = [];
  let skippedShared = 0;
  let missing = 0;

  for (const target of TARGETS) {
    const folderId = await ensureFolder(service, target.folder);
    folderIds[target.folder] = folderId;
    console.log(`\n>> ${target.folder}`);

    for (const name of target.items) {
      const items = groups.get(name);
      if (!items?.length) {
        console.log(`   ! missing in root: "${name}"`);
        missing++;
        continue;
      }
      for (const item of items) {
        if (item.shared && !includeShared) {
          console.log(`   ~ skip (shared): "${name}"`);
          skippedShared++;
          continue;
        }
        console.log(`   -> move: "${name}"`);
        moves.push({ name, id: item.id, folderId });
      }
    }
  }

  if (!isApply) {
    console.log(`\n[DRY-RUN] plan: move=${moves.length}, skip-shared=${skippedShared}, missing=${missing}`);
    console.log("Pass --apply to perform the moves.");
    return;
  }

  console.log("\n[APPLY] moving items...");
  for (const move of moves) {
    try {
      await service.files.update({
        fileId: move.id,
        requestBody: {},
        addParents: [move.folderId],
        removeParents: ["root"],
        fields: "id,parents",
      });
      console.log(`   moved OK: "${move.name}"`);
    } catch (err) {
      console.error(`   FAILED: "${move.name}" -> ${err.message}`);
    }
  }

  console.log("\n[VERIFY] contents after move:");
  for (const target of TARGETS) {
    const children = await listChildren(service, folderIds[target.folder]);
    console.log(`  ${target.folder} (${children.length}): ${children.map((c) => c.name).join(", ") || "-"}`);
  }
  const leftRoot = await service.files.list({
    q: "'root' in parents and trashed=false",
    fields: "files(id,name)",
    pageSize: 100,
  });
  console.log(`\nRoot remaining: ${(leftRoot.data.files || []).map((f) => f.name).join(", ") || "(empty)"}`);
}

main().catch((e) => {
  console.error("ORGANIZE FAILED:", e.message);
  process.exit(1);
});