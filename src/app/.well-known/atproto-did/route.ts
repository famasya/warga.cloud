import { type NextRequest, NextResponse } from "next/server";
import { db } from "../../../db"; // it's not working using alias (!!!)

export const GET = async (req: NextRequest) => {
  const host = req.headers.get('host')
  if (!host) {
    return new NextResponse(null, { status: 404 })
  }
  const [handle] = host.split(".")

  const { rows } = await db.execute({
    sql: "SELECT did FROM handles WHERE handle_name = ?",
    args: [handle]
  })
  if (rows.length === 0) {
    return new NextResponse(null, { status: 404 })
  }

  const result = rows[0] as unknown as { did: string }
  return new NextResponse(result.did)
}
