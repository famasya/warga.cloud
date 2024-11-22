"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";

type Params = {
  selectDid: (did: string, handle: string) => Promise<{ did: string, handle: string }>
}

const colorVariants: Record<string, string> = {
  green: 'text-green-500 border-green-500 bg-green-50',
  red: 'text-red-500 border-red-500 bg-red-50',
};


export default function HandleSelection({ selectDid }: Params) {
  const currentHandleRef = useRef<HTMLInputElement>(null);
  const newHandleRef = useRef<HTMLInputElement>(null);
  const [currentDid, setCurrentDid] = useState<null | string>(null);
  const [newHandle, setNewHandle] = useState<null | string>(null);
  const [handleClaimed, setHandleClaimed] = useState<null | string>(null);
  const [alert, setAlert] = useState<{ message: string, color: string } | null>();
  const [loading, setLoading] = useState(false);

  const checkDid = async (handle: string): Promise<null | string> => {
    if (handle.length === 0) return null;
    setLoading(true);
    const req = await fetch(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`)
    if (!req.ok) {
      setLoading(false);
      return null;
    }
    const res = await req.json() as { did: string }
    setLoading(false);
    return res.did
  }

  const disableNewDidSelection = currentDid === null || loading;

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-96 flex flex-col gap-8">
        <h1 className="text-2xl font-bold">
          free <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">*.warga.cloud</span> handle
        </h1>
        <div className="flex flex-col">

          {alert && <p className={`text-sm border ${colorVariants[alert.color]} mb-2 p-2 rounded`}>{alert.message}</p>}

          {/* STEP 1: Check current handle */}
          <Card className="p-4">
            <p><span className="font-bold bg-black text-white px-1 rounded-full">1</span> Cek handle saat ini</p>
            <p className="text-sm text-muted-foreground mb-2 mt-1">Masukkan handle saat ini, misal <span className="bg-gray-200 px-1">anyone.bsky.social</span></p>
            <div className="flex flex-row gap-2">
              <Input ref={currentHandleRef} placeholder="*.bsky.social" disabled={currentDid !== null} />
              <Button className="bg-blue-500 hover:bg-blue-600" disabled={loading || currentDid !== null} onClick={async () => {
                if (currentHandleRef.current) {
                  const did = await checkDid(currentHandleRef.current.value)
                  if (did !== null) {
                    setCurrentDid(did);
                    setAlert(null);
                  } else {
                    setCurrentDid(null);
                    setAlert({
                      message: "Handle tidak ditemukan",
                      color: "red"
                    });
                  }
                }
              }}>
                {loading ? "Loading..." : "Cek handler"}
              </Button>
            </div>
          </Card>

          {currentDid !== null && (
            <p className="font-mono text-xs mt-2 bg-slate-200 px-2 py-1 rounded">
              Handle ditemukan
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-2">
            <Input ref={newHandleRef} endAdornment=".warga.cloud" disabled={disableNewDidSelection} />
            <Button disabled={disableNewDidSelection}
              onClick={async () => {
                if (newHandleRef.current) {
                  const did = await checkDid(newHandleRef.current.value)
                  if (did === null) {
                    setAlert({
                      message: "Handle tersedia",
                      color: "green"
                    })
                    setNewHandle(newHandleRef.current.value);
                  } else {
                    setAlert({
                      message: "Handle tidak tersedia",
                      color: "red"
                    })
                    setNewHandle(null);
                  }
                }
              }}>Cek ketersediaan</Button>
          </div>
          <Button className="bg-blue-700 hover:bg-blue-800 font-semibold" disabled={disableNewDidSelection || newHandle === null || loading} onClick={async () => {
            if (currentDid && newHandleRef.current) {
              try {
                setLoading(true);
                const { handle } = await selectDid(currentDid, newHandleRef.current.value);
                setHandleClaimed(handle);
              } catch (error) {
                setHandleClaimed(null);
                setAlert({
                  message: "Klaim gagal",
                  color: "red"
                })
              } finally {
                setLoading(false);
              }
            }
          }}>Klaim</Button>
        </div>

        {(handleClaimed !== null) && (
          <div>
            <div>Handle berhasil di-klaim</div>
            <div>Sekarang arahkan handle Anda ke https://{handleClaimed}.warga.cloud/.well-known/atproto-did</div>
          </div>
        )}
      </div>
    </main>
  );
}
