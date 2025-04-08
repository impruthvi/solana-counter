import { expect, test } from "bun:test";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { COUNTER_SIZE, CounterAccount, schema } from "./types";
import * as borsh from "borsh";


let adminAccount: Keypair = Keypair.generate();
let dataAccount: Keypair = Keypair.generate();

const PROGRAM_ID = new PublicKey("H2cjEfqNBkKbBuo2J8U4xRgumUKwdouhGsXgDEp2BpG2");
const connection = new Connection("http://127.0.0.1:8899", "confirmed");

test("Account is initialized", async () => {
    const account = await connection.getAccountInfo(adminAccount.publicKey);
    expect(account).toBeNull();

    const txn = await connection.requestAirdrop(adminAccount.publicKey, 1000_000_000);
    await connection.confirmTransaction(txn);

    const data = await connection.getAccountInfo(adminAccount.publicKey);

    expect(data).not.toBeNull();
    expect(data?.lamports).toBe(1000_000_000);

    const lamports = await connection.getMinimumBalanceForRentExemption(COUNTER_SIZE);

    const ix = SystemProgram.createAccount({
        fromPubkey: adminAccount.publicKey,
        newAccountPubkey: dataAccount.publicKey,
        lamports,
        space: COUNTER_SIZE,
        programId: PROGRAM_ID,
    });

    const createAccountTxn = new Transaction();
    createAccountTxn.add(ix);

    const signature = await connection.sendTransaction(createAccountTxn, [adminAccount, dataAccount]);
    await connection.confirmTransaction(signature);

    const dataAccountInfo = await connection.getAccountInfo(dataAccount.publicKey);
    if (!dataAccountInfo) {
        throw new Error("dataAccountInfo is null");
    }
    const deserializeCounter = borsh.deserialize(schema, dataAccountInfo?.data) as CounterAccount;

    expect(deserializeCounter.count).toBe(0);



});