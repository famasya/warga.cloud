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
	const [selectedHandle, selectHandle] = useState({
		did: '',
		currentHandle: '',
		newHandle: '',
		handleClaimed: false,
	});
	const [alert, setAlert] = useState<{ type: string, message: string } | null>(null);
	const [loading, setLoading] = useState(false);

	const checkDid = async (handle: string, errorMessage?: string): Promise<null | string> => {
		if (handle.length === 0) return null;
		setLoading(true);
		setAlert(null);
		const req = await fetch(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`)
		if (!req.ok) {
			setLoading(false);
			if (errorMessage) {
				setAlert({ type: 'red', message: errorMessage });
			}
			return null;
		}
		const res = await req.json() as { did: string }
		setLoading(false);
		return res.did
	}

	const disableNewDidSelection = selectedHandle.did === "" || loading || selectedHandle.handleClaimed;

	return (
		<main className="flex min-h-screen flex-col items-center px-4 py-8 sm:p-20">
			<div className="flex flex-col gap-8">
				<h1 className="text-2xl font-bold">
					free <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">*.warga.cloud</span> handle
				</h1>

				<div>
					{alert && (
						<p className={`${colorVariants[alert.type]} border px-2 py-1 rounded mb-4`}>{alert.message}</p>
					)}

					{/* STEP 1: Check current handle */}
					<Card className="p-4">
						<div className="flex flex-col">
							<p><span className="font-bold bg-black text-white px-1 rounded-full">1</span> Cek handle saat ini</p>
							<p className="text-sm text-muted-foreground mb-2 mt-1">Masukkan handle saat ini, misal <span className="bg-gray-200 px-1">anyone.bsky.social</span></p>
							<div className="flex flex-col sm:flex-row gap-2">
								<Input ref={currentHandleRef} placeholder="*.bsky.social" disabled={selectedHandle.did !== ""} />
								<Button disabled={loading || selectedHandle.did !== ""} onClick={async () => {
									if (currentHandleRef.current) {
										const did = await checkDid(currentHandleRef.current.value, "Handle tidak ditemukan")
										if (did !== null) {
											selectHandle({ ...selectedHandle, currentHandle: currentHandleRef.current.value, did: did });
										} else {
											selectHandle({ ...selectedHandle, currentHandle: '', did: '' });
										}
									}
								}}>
									Cek handler
								</Button>
							</div>
						</div>
					</Card>
				</div>

				<div className="flex flex-col gap-4">

					<Card className="p-4">
						<p className="mb-2"><span className="font-bold bg-black text-white px-1 rounded-full">2</span> Pilih handle warga</p>
						<div className="flex flex-col sm:flex-row gap-2">
							<Input ref={newHandleRef} endAdornment=".warga.cloud" disabled={disableNewDidSelection} />
							<Button disabled={disableNewDidSelection}
								onClick={async () => {
									if (newHandleRef.current) {
										const did = await checkDid(newHandleRef.current.value)
										if (did === null) {
											selectHandle({
												...selectedHandle,
												newHandle: newHandleRef.current.value,
											})
										} else {
											selectHandle({
												...selectedHandle,
												newHandle: '',
											})
										}
									}
								}}>Cek ketersediaan</Button>
						</div>
					</Card>

					<Button className="bg-blue-700 hover:bg-blue-800 font-semibold" disabled={disableNewDidSelection || selectedHandle.newHandle === ""} onClick={async () => {
						if (selectedHandle.did !== "" && newHandleRef.current) {
							try {
								setLoading(true);
								await selectDid(selectedHandle.did, newHandleRef.current.value);
								selectHandle({
									...selectedHandle,
									handleClaimed: true
								})
							} catch (error) {
								selectHandle({
									...selectedHandle,
									handleClaimed: false
								})
							} finally {
								setLoading(false);
							}
						}
					}}>Klaim</Button>
				</div>

				{(selectedHandle.handleClaimed) && (
					<div className="text-sm bg-blue-50 border-blue-200 border rounded p-4">
						<div className="font-semibold mb-2"><span className="text-lg">🥳</span> Handle berhasil di-klaim!</div>
						<div>
							<ol className="list-decimal list-inside space-y-1">
								<li>Masuk ke <strong>Bluesky</strong> &gt; <strong>Settings</strong> &gt; <strong>Handle</strong></li>
								<li>Pilih <strong>I have my own domain</strong></li>
								<li>Masukkan <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">{selectedHandle.newHandle}.warga.cloud</span>, lalu klik tombol <strong>No DNS Panel</strong></li>
								<li>Klik tombol <strong>Verify Text File</strong></li>
							</ol>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
