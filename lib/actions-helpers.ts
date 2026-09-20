import { query } from "@/lib/db";
import { getGoogleDrive } from "@/lib/google-server";

export async function getOrCreateFolder(folderName: string) {
  try {
    const drive = await getGoogleDrive();
    const response = await drive.files.list({
      q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
      spaces: "drive",
    });
    const folders = response.data.files;
    if (folders && folders.length > 0) return folders[0].id;
    const folder = await drive.files.create({
      requestBody: { name: folderName, mimeType: "application/vnd.google-apps.folder" },
      fields: "id",
    });
    return folder.data.id;
  } catch (error: any) {
    console.error("Folder Error:", error);
    return null;
  }
}

export async function ensureContactsSchema() {
  try {
    await query(`
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type VARCHAR(20)
    `);
    await query(`
      UPDATE contacts
      SET contact_type = CASE
        WHEN LOWER(COALESCE(type, '')) IN ('vendor', 'supplier') THEN 'SUPPLIER'
        WHEN LOWER(COALESCE(type, '')) = 'both' THEN 'BOTH'
        WHEN LOWER(COALESCE(type, '')) = 'customer' THEN 'CUSTOMER'
        ELSE 'CUSTOMER'
      END
      WHERE contact_type IS NULL OR contact_type = ''
    `);
  } catch (e) {}
}
