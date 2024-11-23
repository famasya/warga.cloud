"use server";

import { db } from "@/db";
import HandleSelection from "./handle-selection";

async function claimHandle(did: string, handle: string) {
  "use server";

  const stripedHandle = handle.replaceAll(/[^a-zA-Z0-9-]/g, "")
  const query = await db.execute({
    sql: "SELECT count(1) as count FROM handles WHERE did = ?",
    args: [did]
  })
  const result = query.rows[0] as unknown as { count: number }

  // update new handle
  if (result.count > 0) {
    await db.execute({
      sql: "UPDATE handles SET handle_name = ? WHERE did = ?",
      args: [stripedHandle, did]
    })
    return { did, handle: stripedHandle }
  }

  // insert new handle
  await db.execute({
    sql: "INSERT INTO handles (did, handle_name) VALUES (?, ?)",
    args: [did, stripedHandle]
  })
  return { did, handle: stripedHandle }
}

async function checkHandle(handle: string) {
  "use server";
  const banlist = process.env.BAN_LIST || "";

  if (banlist.includes(handle)) {
    throw new Error("Ups, handle ini sudah terdaftar untuk sistem :(");
  }

  const req = await fetch(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`)
  if (!req.ok) {
    return true
  }
  throw new Error("Ups, handle ini sudah diambil");
}

export default async function Home() {
  return <HandleSelection claimHandle={claimHandle} checkHandle={checkHandle} />
}
