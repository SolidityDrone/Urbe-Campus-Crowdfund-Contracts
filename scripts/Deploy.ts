import { viem } from "hardhat";

async function main() {
  const CrowdfundingManager = await viem.deployContract("CrowdfundingManager");
  console.log("Contract deployed to:", CrowdfundingManager.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});