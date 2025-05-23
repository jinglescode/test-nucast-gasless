import dotenv from "dotenv";
dotenv.config();

export const BF_KEY = process.env.BLOCKFROST_API_KEY || "";

export const demoAssetMetadata = {
  name: "Mesh Token",
  image: "ipfs://QmRzicpReutwCkM6aotuKjErFCUD213DpwPq6ByuzMJaua",
  mediaType: "image/jpg",
  description: "This NFT was minted by Mesh (https://meshjs.dev/).",
};

export const sponsorWallet = "solution,".repeat(24).split(",").slice(0, 24);

export const mintingWallet = [
  "access",
  "spawn",
  "taxi",
  "prefer",
  "fortune",
  "sword",
  "nerve",
  "price",
  "valid",
  "panther",
  "sure",
  "hello",
  "layer",
  "try",
  "grace",
  "seven",
  "fossil",
  "voice",
  "tobacco",
  "circle",
  "measure",
  "solar",
  "pride",
  "together",
];

export const minADASponsorWallet = "wood bench lock genuine relief coral guard reunion follow radio jewel cereal actual erosion recall".split(" ");

export const userWallet = [
  "roast",
  "public",
  "connect",
  "fatigue",
  "vault",
  "match",
  "knock",
  "style",
  "uncover",
  "fat",
  "dentist",
  "garbage",
  "prefer",
  "canyon",
  "total",
  "assume",
  "better",
  "since",
  "old",
  "tribe",
  "icon",
  "monster",
  "echo",
  "merit",
];