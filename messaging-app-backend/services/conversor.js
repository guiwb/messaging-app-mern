import dotenv from "dotenv";
dotenv.config({ override: true });
import ILovePDFFile from "@ilovepdf/ilovepdf-nodejs/ILovePDFFile.js";
import ILovePDFApi from "@ilovepdf/ilovepdf-nodejs/ILovePDFApi.js";

const instance = new ILovePDFApi(
  process.env.ILOVEPDF_PUBLIC_KEY,
  process.env.ILOVEPDF_SECRET_KEY,
);

export async function convert(filePath) {
  const task = instance.newTask("officepdf");

  await task.start();

  const file = new ILovePDFFile(filePath);

  await task.addFile(file);

  await task.process();

  const data = await task.download();

  return data;
}
