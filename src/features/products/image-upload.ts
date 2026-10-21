import { ProductError } from "./validation.ts";
export function imageExtension(bytes: Uint8Array): "png" | "jpg" | "webp" {
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x89 &&
    Buffer.from(bytes.subarray(1, 8)).equals(
      Buffer.from([80, 78, 71, 13, 10, 26, 10]),
    )
  )
    return "png";
  if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "jpg";
  if (
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP"
  )
    return "webp";
  throw new ProductError(
    "Choose a PNG, JPEG or WebP image. SVG and other file types are not supported.",
  );
}
