import Link from "next/link";
import { FC, useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { HomeIcon, UserIcon } from "@heroicons/react/outline";
import orderBy from "lodash.orderby";

import { Loader, SelectAndConnectWalletButton } from "components";
import * as anchor from "@project-serum/anchor";

import { SolanaLogo } from "components";
import styles from "./index.module.css";
import { mint, getCurrentInterest, claim, getUserData } from "./functions";
import { useProgram } from "./useProgram";

const endpoint = "https://explorer-api.devnet.solana.com";

const connection = new anchor.web3.Connection(endpoint);

export const SolanaSwapView: FC = ({ }) => {
  const [isAirDropped, setIsAirDropped] = useState(false);

  const wallet = useAnchorWallet();

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <div className="navbar mb-2 shadow-lg bg-neutral text-neutral-content rounded-box">
          <div className="flex-none">
            <button className="btn btn-square btn-ghost">
              <span className="text-4xl">🌔</span>
            </button>
          </div>
          <div className="flex-1 px-2 mx-2">
            <div className="text-sm breadcrumbs">
              <ul className="text-xl">
              </ul>
            </div>
          </div>

          <div className="flex-none">
            <WalletMultiButton className="btn btn-ghost" />
          </div>
        </div>

        <div className="text-center pt-2">
          <div className="hero min-h-16 pt-4">
            <div className="text-center hero-content">
              <div className="max-w-lg">
                <h1 className="mb-5 text-5xl">
                  MINT NFT DEMO <SolanaLogo />
                </h1>
              </div>
            </div>
          </div>
        </div>



        <div className="flex justify-center">
          {!wallet ? (
            <SelectAndConnectWalletButton onUseWalletClick={() => { }} />
          ) : (
            <SwapScreen />
          )}
        </div>
      </div>
    </div>
  );
};

const SwapScreen = () => {
  const wallet: any = useAnchorWallet();
  const [swaps, setSwaps] = useState<unknown[]>([]);
  const { program } = useProgram({ connection, wallet });
  const [lastUpdatedTime, setLastUpdatedTime] = useState<number>();
  const [currentInterest, setCurrentInterest] = useState(0);
  const [userData, setUserData] = useState<any>();
  useEffect(() => {
  }, [wallet, lastUpdatedTime]);


  useEffect(() => {
    if (!wallet) return;
    //@ts-ignore
    const intervalId = setInterval(async () => {
      if (program && wallet) {
        const interest = await getCurrentInterest({ program, wallet });
        setCurrentInterest(interest);
        const userData = await getUserData({ program, wallet });
        setUserData(userData);
      }
    }, 1 * 1000)
    return function cleanup() {
      clearInterval(intervalId);
    };

  }, [wallet]);


  const onSwapSent = (swapEvent: unknown) => {
    setSwaps((prevState) => ({
      ...prevState,
      swapEvent,
    }));
  };

  return (
    <div className="rounded-lg flex justify-center">

      <div className="flex flex-col items-center justify-center">
        <div className="text-xs">
          <p>
            {`Current Interest: ` + currentInterest}
          </p>
          <p>
            {JSON.stringify(userData)}
          </p>
          <p>
            {"balances: " + JSON.stringify(userData?.nftBalances.map(el => el.toString()))}
          </p>
        </div>
        <div className="text-xs">
          <NetSwap onSwapSent={onSwapSent} />

        </div>

      </div>
    </div>
  );
};

type NetSwap = {
  onSwapSent: (t: any) => void;
};

const NetSwap: FC<NetSwap> = ({ onSwapSent }) => {
  const wallet: any = useAnchorWallet();
  const { program } = useProgram({ connection, wallet });
  const [content, setContent] = useState<string>("");
  const [value, setValue] = useState<any>(5)
  const [referrer_code, setReferrerCode] = useState<any>("ABCDE")
  const onContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (value) {
      setContent(value);
    }
  };

  const onMintClick = async () => {
    if (!program) return;

    const amount = new anchor.BN(Number(value));

    const mint_result = await mint({
      program,
      wallet,
      amount,
      referrer_code
    });


    console.log("New swap transaction succeeded: ", mint_result);
    setContent("");
    onSwapSent(mint_result);
  };

  const onClaimClick = async () => {
    if (!program) return;

    const claim_result = await claim({
      program,
      wallet
    });
  };

  console.log(value)
  function isNumeric(value: any) {
    return /^[0-9]{0,9}(\.[0-9]{1,2})?$/.test(value);
  }

  return (
    <div style={{ minWidth: 240 }} className="mb-8 pb-4 border-b border-gray-500 flex ">

      <div className="w-full">
        <input value={value} onChange={(e) => {
          const value = e.target.value
          console.log(value)
          setValue(value)
        }
        } placeholder="Enter the Referrer Code" className="mb-4"></input>
        <input value={referrer_code} onChange={(e) => {
          const value = e.target.value
          setReferrerCode(value)
        }
      } 
      type="text"
        placeholder="Enter referrer code" className="mb-4"></input>

        <button
          className="btn btn-primary rounded-full normal-case	w-full"
          onClick={onMintClick}
          style={{ minHeight: 0, height: 40 }}
        >
          Mint
        </button>
        <br />
        <br />
        <button
          className="btn btn-primary rounded-full normal-case	w-full"
          onClick={onClaimClick}
          style={{ minHeight: 0, height: 40 }}
        >
          Claim
        </button>
      </div>
    </div>
  );
};
