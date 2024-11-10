import { viem } from "hardhat";

async function main() {
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  const CrowdfundingManager = await viem.deployContract("CrowdfundingManager", [usdcAddress]);
  
  console.log("Contract deployed to:", CrowdfundingManager.address);
  console.log("USDC address used:", usdcAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});