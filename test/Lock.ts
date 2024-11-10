import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre, {viem} from "hardhat";
import { getAddress, parseAbiItem } from "viem";

describe("CrowdfundingManager", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployCrowdfundManager() {
    const [Bob, Alice] = await hre.viem.getWalletClients();
    
    // USDC address that you want to use for testing
    const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

    const crowdfundingManager = await hre.viem.deployContract("CrowdfundingManager", [usdcAddress]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      Bob,
      Alice, 
      crowdfundingManager,
      publicClient,
      usdcAddress
    };
  }

  describe("CreateCampaign", function () {
    it("should create a campaign", async function () {
        const {Bob, Alice, crowdfundingManager, publicClient } = await loadFixture(deployCrowdfundManager);
        
        const expirationDate = await time.latest();
        const after1day = Number(expirationDate) + (24 * 60 * 60);
        
        // Create first campaign
        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        
        // Get campaign at index 1
        const campaign = await crowdfundingManager.read.s_campaigns([BigInt(1)]);
        
        // Verify the campaign details
        expect(campaign[0].toLowerCase()).to.be.equal(Bob.account.address.toLowerCase());
        expect(campaign[1]).to.be.equal(BigInt(after1day));
        
        // Create second campaign and verify
        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        const campaign2 = await crowdfundingManager.read.s_campaigns([BigInt(2)]);
        expect(campaign2[0].toLowerCase()).to.be.equal(Bob.account.address.toLowerCase());
    });

    it("should fail with invalid expiration date", async function () {
        const {crowdfundingManager} = await loadFixture(deployCrowdfundManager);
        
        const currentTime = await time.latest();
        const pastTime = Number(currentTime) - (24 * 60 * 60); // 1 day in the past
        
        await expect(
            crowdfundingManager.write.createCampaign([BigInt(pastTime), BigInt(1_000_000)])
        ).to.be.rejectedWith("CrowdfudingManager: invalid expiration date");
    });

    it("should increment campaign IDs correctly", async function () {
        const {Bob, crowdfundingManager} = await loadFixture(deployCrowdfundManager);
        
        const expirationDate = await time.latest();
        const after1day = Number(expirationDate) + (24 * 60 * 60);
        
        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        
        const campaign1 = await crowdfundingManager.read.s_campaigns([BigInt(1)]);
        expect(campaign1[0].toLowerCase()).to.be.equal(Bob.account.address.toLowerCase());
        
        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        
        const campaign2 = await crowdfundingManager.read.s_campaigns([BigInt(2)]);
        expect(campaign2[0].toLowerCase()).to.be.equal(Bob.account.address.toLowerCase());
        
        const campaign0 = await crowdfundingManager.read.s_campaigns([BigInt(0)]);
        expect(campaign0[0]).to.be.equal("0x0000000000000000000000000000000000000000");
    });

    it("should emit CampaignCreated event", async function () {
        const {Bob, crowdfundingManager} = await loadFixture(deployCrowdfundManager);

        const expirationDate = await time.latest();
        const after1day = Number(expirationDate) + (24 * 60 * 60);
        
        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        
        const publicClient = await hre.viem.getPublicClient();

        const unwatch = publicClient.watchEvent({
          address: crowdfundingManager.address,
          event: parseAbiItem('event CampaignCreated(address indexed creator, uint indexed campaignId, uint expirationDate)'),
          onLogs: (logs) => {
            const { creator, campaignId, expirationDate} = logs[0].args;
            expect(campaignId).to.equal(BigInt(1));
            expect(getAddress(creator!.toString().toLowerCase())).to.equal(getAddress(Bob.account.address.toLowerCase()));
            expect(expirationDate).to.equal(after1day);
          }
        });

        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        unwatch();
    });
  });

  describe("FundCampaign", function () {
    it("Should fail funding a campaign that does not exist", async function () {
        const {crowdfundingManager} = await loadFixture(deployCrowdfundManager);

        await expect(
            crowdfundingManager.write.fundCampaign([BigInt(10), BigInt(500_000)])
        ).to.be.rejectedWith("CrowdfudingManager: Campaign dosen't exist");
    });

    it("Should fail funding an expired campaign", async function () {
        const {crowdfundingManager} = await loadFixture(deployCrowdfundManager);
        
        const currentTime = await time.latest();
        const after1day = Number(currentTime) + (24 * 60 * 60);
        
        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        
        // Increase time to after expiration
        await time.increase(25 * 60 * 60); // 25 hours
        
        await expect(
            crowdfundingManager.write.fundCampaign([BigInt(1), BigInt(500_000)])
        ).to.be.rejectedWith("CrowdfudingManager: campaign expired");
    });
  });
});