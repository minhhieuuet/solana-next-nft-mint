import * as anchor from "@project-serum/anchor";
import * as spl from '@solana/spl-token';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { env } from "./data";
const tokenMint = new anchor.web3.PublicKey(env.swap_token);
import { Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";


interface PDAParam {
  key: anchor.web3.PublicKey,
  bump: number
}
const endpoint = "https://explorer-api.devnet.solana.com";

const connection = new anchor.web3.Connection(endpoint);
const getAtaAccount = async (wallet: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> => {

  let userAssociatedTokenAccount = getAssociatedTokenAddressSync(
    tokenMint,
    wallet
  )
  return userAssociatedTokenAccount
}

export const getUserData = async ({ program, wallet }) => {
  const [user_storage_pda] = await PublicKey.findProgramAddress(
    [Buffer.from("user_storage"), wallet.publicKey.toBuffer()],
    program.programId
  );
  let user_storage_data;
  try {
    user_storage_data = await program.account.userStorage.fetch(
      user_storage_pda
    );
  } catch (err) {
    user_storage_data = null;
  }
  return user_storage_data
}

export const mint = async ({
  program,
  wallet,
  amount,
  referrer_code
}) => {
  const token_x_mint = new PublicKey(
    "Y5d4m2u3spAE5cgfT3RYbjozTSR4MVTMsAnPiQH7USZ"
  );


  const [user_storage_pda] = await PublicKey.findProgramAddress(
    [Buffer.from("user_storage"), wallet.publicKey.toBuffer()],
    program.programId
  );
  let user_storage_data;
  try {
    console.log(program.account.userStorage)
    user_storage_data = await program.account.userStorage.fetch(
      user_storage_pda
    );
  } catch (err) {
    user_storage_data = null;
  }
  // random my refcode with 5 char length
  let my_ref_code = Math.random().toString(36).substring(2, 7);
  const mint_amount = amount;
  const mint_type = new anchor.BN(1);
  if (user_storage_data && user_storage_data.refCode != "") {
    my_ref_code = user_storage_data.refCode;
    const [referrer_storage_pda] = await PublicKey.findProgramAddress(
      [Buffer.from("user_storage"), user_storage_data.refBy.toBuffer()],
      program.programId
    );
    let referrer_storage_data = await program.account.userStorage.fetch(
      referrer_storage_pda
    );
    referrer_code = referrer_storage_data.refCode;
  }

  const [config_pda] = await PublicKey.findProgramAddress(
    [Buffer.from("config")],
    program.programId
  );

  const [base_referral_ref_code_account_pda] =
    await PublicKey.findProgramAddress(
      [Buffer.from("referral"), Buffer.from(referrer_code, "utf8")],
      program.programId
    );

  const [vault_x_pda] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("vault"), token_x_mint.toBuffer()],
    program.programId
  );


  let user_token_x_ata: any;
  try {
    user_token_x_ata = getAssociatedTokenAddressSync(
      token_x_mint,
      wallet.publicKey)

  } catch (err) {
    user_token_x_ata = null;
  }
  let balance: any;
  try {
    balance = await connection.getTokenAccountBalance(user_token_x_ata);
  } catch(err) {
    balance = null
  }
  if (!balance || balance.value.amount == 0) {
    alert("balance is 0")
    return
  }
  console.log(`User balance ` + balance.value.amount)

  const refCodeAccountData = await program.account.refCode.fetch(
    base_referral_ref_code_account_pda
  );
  const [my_referral_code_account_pda] = await PublicKey.findProgramAddress(
    [Buffer.from("referral"), Buffer.from(my_ref_code, "utf8")],
    program.programId
  );

  const referrer_token_x_ata = getAssociatedTokenAddressSync(
    token_x_mint,
    refCodeAccountData.owner
  );
  console.log({
    tokenX: token_x_mint,
    signer: wallet.publicKey,
    userStorage: user_storage_pda,
    vaultX: vault_x_pda,
    senderTokenX: user_token_x_ata,
    tokenProgram: TOKEN_PROGRAM_ID,
    config: config_pda,
    referralRefCodeAccount: base_referral_ref_code_account_pda,
    myRefCodeAccount: my_referral_code_account_pda,
    referrerTokenX: referrer_token_x_ata,
    systemProgram: anchor.web3.SystemProgram.programId,
    associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  })
  let ix = await program.instruction.mintNft(mint_amount, mint_type, referrer_code, my_ref_code, {
    accounts: {
      tokenX: token_x_mint,
      signer: wallet.publicKey,
      userStorage: user_storage_pda,
      vaultX: vault_x_pda,
      senderTokenX: user_token_x_ata,
      tokenProgram: TOKEN_PROGRAM_ID,
      config: config_pda,
      referralRefCodeAccount: base_referral_ref_code_account_pda,
      myRefCodeAccount: my_referral_code_account_pda,
      referrerTokenX: referrer_token_x_ata,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    },
    signers: [],
  });
  const tx = new Transaction().add(ix);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  const signedTx = await wallet.signTransaction(tx);
  const txId = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(txId);
  console.log("Tx Id: " + `https://solscan.io/tx/${txId}?cluster=devnet`);
  alert("Mint success")
};

export const claim = async ({
  program,
  wallet,
}) => {
  const token_x_mint = new PublicKey(
    "Y5d4m2u3spAE5cgfT3RYbjozTSR4MVTMsAnPiQH7USZ"
  );

  const [user_storage_pda] = await PublicKey.findProgramAddress(
    [Buffer.from("user_storage"), wallet.publicKey.toBuffer()],
    program.programId
  );

  const user_storage_data = await program.account.userStorage.fetch(
    user_storage_pda
  );

  const [config_pda, _] = await PublicKey.findProgramAddress(
    [Buffer.from("config")],
    program.programId
  );

  const [vault_x_pda] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("vault"), token_x_mint.toBuffer()],
    program.programId
  );

  const user_token_x_ata = getAssociatedTokenAddressSync(
    token_x_mint,
    wallet.publicKey
  );

  let ix = await program.instruction.claimReward({
    accounts: {
      tokenX: token_x_mint,
      signer: wallet.publicKey,
      userStorage: user_storage_pda,
      vaultX: vault_x_pda,
      tokenProgram: TOKEN_PROGRAM_ID,
      config: config_pda,
      receiverTokenX: user_token_x_ata,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    },
    signers: [],
  });
  const tx = new Transaction().add(ix);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  const signedTx = await wallet.signTransaction(tx);
  const txId = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(txId);
  console.log("Tx Id: " + `https://solscan.io/tx/${txId}?cluster=devnet`);
  alert("Claim success")

};

export const getCurrentInterest = async ({
  program,
  wallet,
}) => {
  const [config_pda] = await PublicKey.findProgramAddress(
    [Buffer.from("config")],
    program.programId
  );
  const config_account_data = await program.account.config.fetch(config_pda);

  const nft_bonus_percentages = config_account_data.nftBonusPercentages.map(
    (el) => Number(el.toString())
  );
  const nft_balance_thresholds = config_account_data.nftBalanceThresholds.map(
    (el) => Number(el.toString())
  );
  const nft_speed_earnings = config_account_data.nftSpeedEarnings.map((el) =>
    Number(el.toString())
  );

  const [user_storage_pda] = await PublicKey.findProgramAddress(
    [Buffer.from("user_storage"), wallet.publicKey.toBuffer()],
    program.programId
  );
  let user_storage_data: any;
  try {

    user_storage_data = await program.account.userStorage.fetch(
      user_storage_pda
    );
  } catch (err) {

  }
  if (!user_storage_data) return 0;

  let pendingClaim = Number(user_storage_data.pendingClaim.toString());
  const nft_balances = user_storage_data.nftBalances.map((el) =>
    Number(el.toString())
  );
  let duration =
    Math.floor(Date.now() / 1000) -
    Number(user_storage_data.lastClaimAt.toString());
  let total_nft = nft_balances.reduce((acc, el) => acc + el, 0);
  let bonus_percent = 0;
  for (let i = nft_balance_thresholds.length - 1; i >= 0; i--) {
    if (total_nft >= nft_balance_thresholds[i]) {
      bonus_percent = nft_bonus_percentages[i];
      break;
    }
  }
  for (let i = 0; i < nft_balances.length; i++) {
    if (nft_balances[i] > 0) {
      let second_earn = nft_speed_earnings[i] / (60 * 60);
      pendingClaim +=
        (nft_balances[i] * duration * second_earn * (10000 + bonus_percent)) /
        10000;
    }
  }

  return pendingClaim / LAMPORTS_PER_SOL;
}