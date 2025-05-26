import { Gasless } from "./gasless";
import {
  BF_KEY,
  demoAssetMetadata,
  minADASponsorWallet,
  mintingWallet,
  sponsorWallet,
  userWallet,
} from "./config";
import {
  BlockfrostProvider,
  deserializeAddress,
  ForgeScript,
  MeshTxBuilder,
  MeshWallet,
  NativeScript,
  resolveScriptHash,
  stringToHex,
  UTxO,
} from "@meshsdk/core";

const provider = new BlockfrostProvider(BF_KEY);

/**
 * build the tx to be sponsored
 */

async function buildMintTx(changeAddress: string) {
  // minting wallet
  const wallet = new MeshWallet({
    networkId: 0,
    key: {
      type: "mnemonic",
      words: mintingWallet,
    },
  });

  const minWallet = new MeshWallet({
    networkId: 0,
    key: {
      type: "mnemonic",
      words: minADASponsorWallet,
    },
    fetcher: provider,
  });

  const { pubKeyHash: keyHash } = deserializeAddress(
    await wallet.getChangeAddress()
  );

  // create minting script
  const nativeScript: NativeScript = {
    type: "all",
    scripts: [
      {
        type: "before",
        slot: "99999999",
      },
      {
        type: "sig",
        keyHash: keyHash,
      },
    ],
  };
  const forgingScript = ForgeScript.fromNativeScript(nativeScript);

  // create metadata
  const policyId = resolveScriptHash(forgingScript);
  const tokenName = "MeshToken";
  const tokenNameHex = stringToHex(tokenName);
  const metadata = { [policyId]: { [tokenName]: { ...demoAssetMetadata } } };

  // create transaction
  const txBuilder = new MeshTxBuilder({
    fetcher: provider,
    verbose: true,
    isHydra: true
  });

  const inputs = await minWallet.getUtxos();
  

  const unsignedTx = await txBuilder
    .mint("1", policyId, tokenNameHex)
    .mintingScript(forgingScript)
    .metadataValue(721, metadata)
    .txOut(changeAddress, [{
      unit: policyId + tokenNameHex,
      quantity: "1"
    }, {
      unit: "lovelace",
      quantity: "1500000"
    }])
    .changeAddress(await minWallet.getChangeAddress())
    .invalidHereafter(99999999)
    .selectUtxosFrom(inputs)
    .setFee("0")
    .complete();

  return unsignedTx;
  // const signedTx = await wallet.signTx(unsignedTx, true);
  // return signedTx;
}

/**
 * setup the gasless components
 */

// Initialize a pool
const gaslessPool = new Gasless({
  mode: "pool",
  wallet: {
    network: 0,
    key: {
      type: "mnemonic",
      words: sponsorWallet,
    },
  },
  conditions: {
    tokenRequirements: [
      { unit: "lovelace", quantity: 1000000, comparison: "gte" },
    ],
  },
  apiKey: BF_KEY,
});
const poolAddress = await gaslessPool.inAppWallet?.getChangeAddress()!;

// Start the pool server
gaslessPool.listen(5050).then(() => console.log("Pool server started"));

// Initialize a sponsor client
const gaslessSponsor = new Gasless({
  mode: "sponsor",
  apiKey: BF_KEY,
});

// Sponsor a transaction
async function sponsorTransaction(txCbor: string) {
  const sponsoredTx = await gaslessSponsor.sponsorTx({
    txCbor,
    poolId: poolAddress,
  });

  console.log(sponsoredTx);

  // Validate and sign the transaction
  const validatedTx = await gaslessSponsor.validateTx({
    txCbor: sponsoredTx,
    poolSignServer: "http://localhost:5050",
  });

  console.log("Validated Transaction CBOR:", validatedTx);

  const wallet = new MeshWallet({
    networkId: 0,
    key: {
      type: "mnemonic",
      words: mintingWallet,
    },
  });

  const minWallet = new MeshWallet({
    networkId: 0,
    key: {
      type: "mnemonic",
      words: minADASponsorWallet,
    },
    fetcher: provider,
  });

  const signedTx = await wallet.signTx(validatedTx, true);
  const policySignedTx = await minWallet.signTx(signedTx, true);

  console.log(await provider.submitTx(policySignedTx));
}

/**
 * execute
 */

async function buildTx() {
  // this user do not have any UTXO in wallet
  const endUserWallet = new MeshWallet({
    networkId: 0,
    fetcher: provider,
    submitter: provider,
    key: {
      type: "mnemonic",
      words: userWallet,
    },
  });

  // const utxos = await wallet.getUtxos();
  const utxos = await gaslessPool.inAppWallet?.getUtxos()!;
  const changeAddress = await endUserWallet.getChangeAddress();

  const unsignedTx = await buildMintTx(changeAddress);


  sponsorTransaction(unsignedTx).catch(console.error);
}

buildTx();
