"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";

type Params = {
	selectDid: (did: string, handle: string) => Promise<{ did: string, handle: string }>
}

const colorVariants: Record<string, string> = {
	green: "text-green-500 border-green-500 bg-green-50",
	red: "text-red-500 border-red-500 bg-red-50",
};


export default function HandleSelection({ selectDid }: Params) {
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
		<main className="flex min-h-screen flex-col items-center px-4 py-8 sm:p-20">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="text-2xl font-bold">
						free <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">*.warga.cloud</span> handle
					</h1>
					<p className="text-sm">Tired of your default Bluesky handle? Claim your swag handle now, warga sekalian!</p>
				</div>

				<div>
					{alert && (
						<p className={`${colorVariants[alert.type]} text-sm border px-2 py-1 rounded mb-4`}>{alert.message}</p>
					)}

					{/* STEP 1: Check current handle */}
					<Card className="p-4">
						<div className="flex flex-col">
							<p><span className="font-bold bg-black text-white px-1 rounded-full">1</span> Type your current handle</p>
							<p className="text-sm text-muted-foreground mb-2 mt-1">i.e. <span className="bg-gray-200 px-1">anyone.bsky.social</span></p>
							<div className="flex flex-col sm:flex-row gap-2">
								<Input ref={currentHandleRef} placeholder="*.bsky.social" disabled={selectedHandle.did !== ""} />
								<Button disabled={loading || selectedHandle.did !== ""} onClick={async () => {
									if (currentHandleRef.current) {
										const did = await checkDid(currentHandleRef.current.value)
										if (did !== null) {
											selectHandle({ ...selectedHandle, currentHandle: currentHandleRef.current.value, did: did });
											setAlert({ type: "green", message: "Handle is valid. Now pick your warga handle" })
										} else {
											selectHandle({ ...selectedHandle, currentHandle: "", did: "" });
											setAlert({ type: "red", message: "Oops, couldn't able to find your current handle" });
										}
									}
								}}>
									Check handle
								</Button>
							</div>
						</div>
					</Card>
				</div>

				{/* STEP 2: Check new handle */}
				<div className="flex flex-col gap-4">
					<Card className="p-4">
						<p className="mb-2"><span className="font-bold bg-black text-white px-1 rounded-full">2</span> Pick your <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">warga</span> handle</p>
						<div className="flex flex-col sm:flex-row gap-2">
							<Input ref={newHandleRef} endAdornment=".warga.cloud" disabled={disabledState} />
							<Button disabled={disabledState}
								onClick={async () => {
									if (newHandleRef.current) {
										const did = await checkDid(`${newHandleRef.current.value}.warga.cloud`)
										console.log(did)
										if (did === null) {
											selectHandle({
												...selectedHandle,
												newHandle: newHandleRef.current.value,
											})
											setAlert({ type: "green", message: "Nice, handle is available" })
										} else {
											selectHandle({
												...selectedHandle,
												newHandle: "",
											})
											setAlert({ type: "red", message: "Oops, handle was already taken" })
										}
									}
								}}>Check handle</Button>
						</div>
					</Card>

					{/* STEP 3: Book handle */}
					{(!disabledState && selectedHandle.newHandle !== "") && (
						<Button
							onClick={async () => {
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
										setAlert(null);
										setLoading(false);
									}
								}
							}}>Book <strong>{selectedHandle.newHandle}.warga.cloud</strong> as your handle</Button>
					)}
				</div>

				{(selectedHandle.handleClaimed) && (
					<div className="text-sm bg-blue-50 border-blue-200 border rounded p-4">
						<div className="font-semibold "><span className="text-lg">🥳</span> Handle is booked successfully!</div>
						<p className="mb-2">Now here's what you need to do to claim your handle</p>
						<div>
							<ol className="list-decimal list-inside space-y-1">
								<li>Go to <strong>Bluesky</strong> &gt; <strong>Settings</strong> &gt; <strong>Handle</strong></li>
								<li>Choose <strong>I have my own domain</strong></li>
								<li>Type <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">{selectedHandle.newHandle}.warga.cloud</span>, then click <strong>No DNS Panel</strong> button</li>
								<li>Finally click <strong>Verify Text File</strong></li>
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
