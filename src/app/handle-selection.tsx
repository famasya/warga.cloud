"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";

type Params = {
	claimHandle: (did: string, handle: string) => Promise<{ did: string, handle: string }>
	checkHandle: (handle: string) => Promise<boolean>
}

const colorVariants: Record<string, string> = {
	green: "text-green-500 border-green-500 bg-green-50",
	red: "text-red-500 border-red-500 bg-red-50",
};


export default function HandleSelection({ claimHandle, checkHandle }: Params) {
	const currentHandleRef = useRef<HTMLInputElement>(null);
	const newHandleRef = useRef<HTMLInputElement>(null);
	const [selectedHandle, selectHandle] = useState({
		did: "",
		currentHandle: "",
		newHandle: "",
		handleClaimed: false,
	});
	const [alert, setAlert] = useState<{ type: string, message: string } | null>(null);
	const [loading, setLoading] = useState(false);

	const checkDid = async (handle: string): Promise<null | string> => {
		if (handle.length === 0) return null;
		setLoading(true);
		const req = await fetch(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`)
		if (!req.ok) {
			setLoading(false);
			return null;
		}
		setAlert(null);
		const res = await req.json() as { did: string }
		setLoading(false);
		return res.did
	}

	const disabledState = selectedHandle.did === "" || loading || selectedHandle.handleClaimed;

	return (
		<main className="flex min-h-screen flex-col items-center px-4 py-8 sm:p-20 ">
			<div className="flex flex-col gap-8 max-w-lg">
				<div>
					<h1 className="text-2xl font-bold">
						free <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">*.warga.cloud</span> handle
					</h1>
					<p className="text-sm">Handle gratis buat warga bluesky sekalian</p>
				</div>

				<div>
					{alert && (
						<p className={`${colorVariants[alert.type]} text-sm border px-2 py-1 rounded mb-4`}>{alert.message}</p>
					)}

					{/* STEP 1: Check current handle */}
					<Card className="p-4">
						<div className="flex flex-col">
							<p><span className="font-bold bg-black text-white px-1 rounded-full">1</span> Masukkan handle saat ini</p>
							<p className="text-sm text-muted-foreground mb-2 mt-1">misal <span className="bg-gray-200 px-1">sriwedari.bsky.social</span></p>
							<div className="flex flex-col sm:flex-row gap-2">
								<Input ref={currentHandleRef} placeholder="*.bsky.social" disabled={selectedHandle.did !== ""} />
								<Button disabled={loading || selectedHandle.did !== ""} onClick={async () => {
									if (currentHandleRef.current) {
										const did = await checkDid(currentHandleRef.current.value)
										if (did !== null) {
											selectHandle({ ...selectedHandle, currentHandle: currentHandleRef.current.value, did: did });
											setAlert({ type: "green", message: "Handle valid, sekarang pilih handle warga" })
										} else {
											selectHandle({ ...selectedHandle, currentHandle: "", did: "" });
											setAlert({ type: "red", message: "Handle tidak valid, typo?" });
										}
									}
								}}>
									Check
								</Button>
							</div>
						</div>
					</Card>
				</div>

				{/* STEP 2: Check new handle */}
				<div className="flex flex-col gap-4">
					<Card className="p-4">
						<p className="mb-2"><span className="font-bold bg-black text-white px-1 rounded-full">2</span> Masukkan handle <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">warga</span> yang ingin dipakai</p>
						<div className="flex flex-col sm:flex-row gap-2">
							<Input ref={newHandleRef} endAdornment=".warga.cloud" disabled={disabledState} />
							<Button disabled={disabledState}
								onClick={async () => {
									if (newHandleRef.current) {
										try {
											setLoading(true);
											await checkHandle(`${newHandleRef.current.value}.warga.cloud`);
											selectHandle({
												...selectedHandle,
												newHandle: newHandleRef.current.value,
											})
											setAlert({ type: "green", message: "Oke, handle bisa dipakai" })
										} catch (error) {
											selectHandle({
												...selectedHandle,
												newHandle: "",
											})
											const { message } = error as { message: string }
											setAlert({ type: "red", message: message })
										} finally {
											setLoading(false);
										}
									}
								}}>Check</Button>
						</div>
					</Card>

					{/* STEP 3: Book handle */}
					{(!disabledState && selectedHandle.newHandle !== "") && (
						<Button
							onClick={async () => {
								if (selectedHandle.did !== "" && newHandleRef.current) {
									try {
										setLoading(true);
										await claimHandle(selectedHandle.did, newHandleRef.current.value);
										selectHandle({
											...selectedHandle,
											handleClaimed: true
										})
										setAlert(null);
									} catch (error) {
										const { message } = error as { message: string }
										setAlert({ type: "red", message: message });
										selectHandle({
											...selectedHandle,
											handleClaimed: false
										})
									} finally {
										setLoading(false);
									}
								}
							}}>Klaim <strong>{selectedHandle.newHandle}.warga.cloud</strong></Button>
					)}
				</div>

				{(selectedHandle.handleClaimed) && (
					<div className="text-sm bg-blue-50 border-blue-200 border rounded p-4">
						<div className="font-semibold "><span className="text-lg">🥳</span> Satu langkah lagi!</div>
						<p className="mb-2">Untuk menggunakan handle ini, silahkan lakukan langkah berikut:</p>
						<div>
							<ol className="list-decimal list-inside space-y-1">
								<li>Buka <strong>Bluesky</strong> &gt; <strong>Settings</strong> &gt; <strong>Handle</strong></li>
								<li>Pilih <strong>I have my own domain</strong></li>
								<li>Ketikkan <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">{selectedHandle.newHandle}.warga.cloud</span>, lalu klik tombol <strong>No DNS Panel</strong></li>
								<li>Klik <strong>Verify Text File</strong></li>
							</ol>
						</div>
					</div>
				)}
			</div>

			<div className="text-sm text-muted-foreground mt-8">
				Bug? Suggestion? <a href="https://github.com/famasya/warga.cloud/issues/new" target="_blank" rel="noopener noreferrer" className="underline">Open an issue</a>
			</div>
		</main>
	);
}
