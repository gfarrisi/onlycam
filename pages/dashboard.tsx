import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Head from "next/head";
import { useSmartWallet } from "../hooks/SmartWalletContext";
import {
  BASE_GOERLI_ENTRYPOINT_ADDRESS,
  BASE_GOERLI_SCAN_URL,
  NFT_ADDRESS,
} from "../lib/constants";
import { Client, createPublicClient, encodeFunctionData, http } from "viem";
import ABI from "../lib/nftABI.json";
import {
  createPublicErc4337Client,
  PublicErc4337Client,
  type UserOperationStruct,
} from "@alchemy/aa-core";
import { baseGoerli } from "viem/chains";
import {
  addPaymasterAndDataToUserOp,
  bufferUserOpWithVerificationGas,
  signUserOp,
} from "../lib/userOperations";
import { ToastContainer, toast } from "react-toastify";

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();
  const { address: smartWalletAddress, provider } = useSmartWallet();

  const basePaymasterRpc: Client = useMemo(
    () =>
      createPublicClient({
        chain: baseGoerli,
        transport: http("https://paymaster.base.org"),
      }),
    []
  );

  const baseBundlerRpc: PublicErc4337Client = useMemo(
    () =>
      createPublicErc4337Client({
        chain: baseGoerli,
        rpcUrl: process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC_URL as string,
      }),
    []
  );

  const isLoading =
    !provider || !smartWalletAddress || !baseBundlerRpc || !basePaymasterRpc;
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
    console.log("address", smartWalletAddress);
  }, [ready, authenticated, router]);

  const onMint = async () => {
    if (
      !provider ||
      !smartWalletAddress ||
      !baseBundlerRpc ||
      !basePaymasterRpc
    )
      return;
    setIsMinting(true);
    const toastId = toast.loading("Minting...");
    // Build the initial user op by calling the NFT's `mint` method
    const initialUserOp: UserOperationStruct =
      await provider.buildUserOperationFromTx({
        from: smartWalletAddress as `0x${string}`,
        to: NFT_ADDRESS,
        data: encodeFunctionData({
          abi: ABI,
          functionName: "mint",
          args: [smartWalletAddress],
        }),
      });

    // Add the gas bumps needed for paymaster verification
    const bufferedUserOp = bufferUserOpWithVerificationGas(initialUserOp);
    // Query Base Paymaster and add `paymasterAndData` field to user op
    const userOpWithPaymaster = await addPaymasterAndDataToUserOp(
      bufferedUserOp,
      basePaymasterRpc
    );

    // Sign the user op
    const signedUserOp = await signUserOp(userOpWithPaymaster, provider);

    // Send user op and get hash
    const userOpHash = await baseBundlerRpc.sendUserOperation(
      signedUserOp,
      BASE_GOERLI_ENTRYPOINT_ADDRESS
    );
    toast.update(toastId, {
      render: (
        <a
          href={`${BASE_GOERLI_SCAN_URL}/address/${smartWalletAddress}#tokentxnsErc721`}
          target="_blank"
          color="#FF8271"
        >
          Successfully minted! Click here to see your NFTs.
        </a>
      ),
      type: "success",
      isLoading: false,
      autoClose: 5000,
    });

    // TODO: This does not seem to find the user op by hash for some reason, even though
    // by inspecting it, I can tell that it is valid.
    const receipt = await baseBundlerRpc.getUserOperationReceipt(userOpHash);
    setIsMinting(false);
    console.log(receipt);
  };

  return (
    <>
      <Head>
        <title>Privy Auth Demo</title>
      </Head>

      <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
        {ready && authenticated && !isLoading ? (
          <>
            <ToastContainer />
            <div className="flex flex-row justify-between">
              <h1 className="text-2xl font-semibold">Privy Auth Demo</h1>
              <button
                onClick={logout}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Logout
              </button>
            </div>
            <div className="mt-12 flex gap-4 flex-wrap">
              <button
                onClick={onMint}
                className="text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 py-2 px-4 rounded-md text-white"
                disabled={isLoading || isMinting}
              >
                Mint NFT
              </button>
            </div>
            <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              Your Smart Wallet Address
            </p>
            <a
              className="mt-2 text-sm text-gray-500 hover:text-violet-600"
              href={`${BASE_GOERLI_SCAN_URL}/address/${smartWalletAddress}`}
            >
              {smartWalletAddress}
            </a>
            <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              Your Signer Address
            </p>
            <a
              className="mt-2 text-sm text-gray-500 hover:text-violet-600"
              href={`${BASE_GOERLI_SCAN_URL}/address/${user?.wallet?.address}`}
            >
              {user?.wallet?.address}
            </a>
            <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              User object
            </p>
            <textarea
              value={JSON.stringify(user, null, 2)}
              className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2"
              rows={20}
              disabled
            />
          </>
        ) : null}
      </main>
    </>
  );
}