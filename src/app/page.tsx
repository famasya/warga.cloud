"use server";

import { db } from "@/db";
import HandleSelection from "./handle-selection";

async function selectDid(did: string, handle: string) {
  "use server";

  const query = await db.execute({
    sql: "SELECT count(1) as count FROM handles WHERE did = ?",
    args: [did]
  })
  const result = query.rows[0] as unknown as { count: number }

  // update new handle
  if (result.count > 0) {
    await db.execute({
      sql: "UPDATE handles SET handle_name = ? WHERE did = ?",
      args: [handle, did]
    })
    return { did, handle }
  }

  // insert new handle
  await db.execute({
    sql: "INSERT INTO handles (did, handle_name) VALUES (?, ?)",
    args: [did, handle]
  })
  return { did, handle }
}

export default async function Home() {
  return <HandleSelection selectDid={selectDid} />
}
