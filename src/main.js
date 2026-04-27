import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

export async function run() {
  try {
    // 1. Gather inputs
    const rawApiUrl = core.getInput("api_base_url", { required: true });
    const apiBaseUrl = rawApiUrl.replace(/\/$/, ""); // Remove the trailing slash if present
    const serviceAccountId = core.getInput("service_account_id", {
      required: true,
    });
    const serviceAccountKey = core.getInput("service_account_key", {
      required: true,
    });
    const filePath = core.getInput("file_path", { required: true });
    const changelog = core.getInput("changelog");

    // Validate and read file stats
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found at path: ${resolvedPath}`);
    }

    const stats = fs.statSync(resolvedPath);
    const fileSize = stats.size;
    const fileName = path.basename(resolvedPath);

    const baseHeaders = {
      "X-MWM-SERVICE-ACCOUNT-ID": serviceAccountId,
      "X-MWM-SERVICE-ACCOUNT-KEY": serviceAccountKey,
      "Content-Type": "application/json",
    };

    // --- STEP 1: Get a signed upload URL ---
    core.info(`🚧 Generating upload url for ${fileName} with size ${fileSize}`);

    const urlResponse = await fetch(
      `${apiBaseUrl}/api/delivery-package/generate-upload-url`,
      {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({ name: fileName, size: fileSize }),
      },
    );

    if (!urlResponse.ok) {
      throw new Error(
        `Failed to generate URL: ${urlResponse.status} ${urlResponse.statusText}`,
      );
    }

    const { upload_id, upload_url } = await urlResponse.json();

    // --- STEP 2: Upload the IPA file ---
    core.info(`🚧 Uploading for id ${upload_id}`);

    const fileBuffer = fs.readFileSync(resolvedPath);

    // Note: upload_url comes directly from the API response, so we don't prepend apiBaseUrl here
    const uploadResponse = await fetch(upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": fileSize.toString(),
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `Failed to upload IPA: ${uploadResponse.status} ${uploadResponse.statusText}`,
      );
    }
    core.info("🚧 Upload completed");

    // --- STEP 3: Create a new delivery package ---
    core.info("🚧 Creating delivery package");

    const packageResponse = await fetch(
      `${apiBaseUrl}/api/delivery-package/create-from-uploaded-ipa`,
      {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({ upload_id, changelog }),
      },
    );

    if (!packageResponse.ok) {
      throw new Error(
        `Failed to create package: ${packageResponse.status} ${packageResponse.statusText}`,
      );
    }

    core.info("✅ Package created");
    core.setOutput("upload_id", upload_id);
  } catch (error) {
    core.setFailed(error.message);
  }
}
