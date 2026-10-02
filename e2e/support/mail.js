import { readFile } from "node:fs/promises";
import { backendLogFile } from "./env.js";

const verificationUrlPattern = /https?:\/\/\S*\/api\/email\/verify\/\d+\/[a-f0-9]+\?[^\s"']+/;

/**
 * Devuelve el enlace de verificacion que el backend acaba de enviar por email.
 *
 * El entorno E2E usa el mailer `log`, asi que el enlace firmado queda escrito en
 * `backend/storage/logs/laravel.log`. Se busca solo dentro del mensaje cuyo
 * destinatario es el correo indicado para no depender del orden de la suite.
 */
export async function readVerificationLink(email) {
  let log = "";

  try {
    log = await readFile(backendLogFile, "utf8");
  } catch {
    return null;
  }

  const recipientIndex = log.lastIndexOf(`To: ${email}`);

  if (recipientIndex === -1) return null;

  const match = log.slice(recipientIndex).match(verificationUrlPattern);

  return match ? match[0].replace(/&amp;$/, "") : null;
}