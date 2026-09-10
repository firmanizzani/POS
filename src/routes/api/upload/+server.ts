import { put } from "@vercel/blob";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file || typeof file === "string") {
      return json({ success: false, message: "Tidak ada file yang dikirim" }, { status: 400 });
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return json({ success: false, message: "Hanya file JPG, PNG, atau WEBP yang diizinkan" }, { status: 400 });
    }

    // Validasi ukuran (maks 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return json({ success: false, message: "Ukuran file maksimal 2MB" }, { status: 400 });
    }

    const filename = `products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const blob = await put(filename, file, {
      access: "public"
    });

    return json({ success: true, url: blob.url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return json({ success: false, message: error.message || "Gagal upload gambar" }, { status: 500 });
  }
};
