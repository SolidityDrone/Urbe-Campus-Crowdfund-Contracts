import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre, {viem} from "hardhat";
import { getAddress, parseAbiItem, parseGwei } from "viem";
import CrowdfundingManager from "../ignition/modules/CrowdfundingManager";

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCrowdfundManager() {
    // Contracts are deployed using the first signer/account by default
    const [Bob, Alice] = await hre.viem.getWalletClients();

    const crowdfundingManager = await hre.viem.deployContract("CrowdfundingManager");

    const publicClient = await hre.viem.getPublicClient();

    return {
      Bob,
      Alice, 
      crowdfundingManager,
      publicClient,
    };
  }

  describe("CreateCampaign", function () {
    it("should create a campaign", async function () {
        const {Bob, Alice, crowdfundingManager, publicClient } = await loadFixture(deployCrowdfundManager)
        
        const expirationDate = await time.latest();
        const after1day = Number(expirationDate) + ( 24* 60 * 60);
        
        // Create first campaign
        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        
        // Get campaign at index 1 (since counter starts at 0 and increments before creation)
        const campaign = await crowdfundingManager.read.s_campaigns([BigInt(1)]);
        
        // Verify the campaign details
        expect(campaign[0].toLowerCase()).to.be.equal(Bob.account.address.toLowerCase());
        expect(campaign[1]).to.be.equal(BigInt(after1day));
        
        // Optional: Create second campaign and verify it's at index 2
        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        const campaign2 = await crowdfundingManager.read.s_campaigns([BigInt(2)]);
        expect(campaign2[0].toLowerCase()).to.be.equal(Bob.account.address.toLowerCase());
    });

    // Add test for campaign ID sequence
    it("should increment campaign IDs correctly", async function () {
        const {Bob, crowdfundingManager} = await loadFixture(deployCrowdfundManager);
        
        const expirationDate = await time.latest();
        const after1day = Number(expirationDate) + (24 * 60 * 60);
        
        // Create first campaign
        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        
        // This should work - campaign ID 1
        const campaign1 = await crowdfundingManager.read.s_campaigns([BigInt(1)]);
        expect(campaign1[0].toLowerCase()).to.be.equal(Bob.account.address.toLowerCase());
        
        // Create second campaign
        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        
        // This should work - campaign ID 2
        const campaign2 = await crowdfundingManager.read.s_campaigns([BigInt(2)]);
        expect(campaign2[0].toLowerCase()).to.be.equal(Bob.account.address.toLowerCase());
        
        // Campaign ID 0 should be empty
        const campaign0 = await crowdfundingManager.read.s_campaigns([BigInt(0)]);
        expect(campaign0[0]).to.be.equal("0x0000000000000000000000000000000000000000");



    });


    it("should emit CampaignCreated event", async function () {
        const {Bob, crowdfundingManager} = await loadFixture(deployCrowdfundManager);

        const expirationDate = await time.latest();
        const after1day = Number(expirationDate) + (24 * 60 * 60);
        
        // Create first campaign 1
        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        
        const publicClient = await hre.viem.getPublicClient();




        const unwatch = publicClient.watchEvent({
          address: crowdfundingManager.address,
          event: parseAbiItem('event CampaignCreated(address founder, uint indexed campaignId, uint expirationDate)'),
          onLogs: (logs) => {
            const { founder, campaignId, expirationDate} = logs[0].args;
            expect(campaignId).to.equal(BigInt(1));
            expect(getAddress(founder!.toString().toLowerCase())).to.equal(getAddress(Bob.account.address.toLowerCase()));
            expect(expirationDate).to.equal(after1day);
          }
        });


        await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
        unwatch();
    })

});


describe("FundCampaign", function () {
  it("Should fund a campaign that does not exist", async function () {
      const {Bob, Alice, crowdfundingManager, publicClient } = await loadFixture(deployCrowdfundManager);

      const expirationDate = await time.latest();
      const after1day = Number(expirationDate) + (24 * 60 * 60);
    
      // Create first campaign
      await crowdfundingManager.write.createCampaign([BigInt(after1day), BigInt(1_000_000)]);
    
      await expect(
          crowdfundingManager.write.fundCampaign([BigInt(10), BigInt(500_000)])
      ).to.be.rejectedWith("Campaign dosen't exist");
  });

  
});
  // describe("Deployment", function () {
  //   it("Should set the right unlockTime", async function () {
  //     const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

  //     expect(await lock.read.unlockTime()).to.equal(unlockTime);
  //   });

  //   it("Should set the right owner", async function () {
  //     const { lock, owner } = await loadFixture(deployOneYearLockFixture);

  //     expect(await lock.read.owner()).to.equal(
  //       getAddress(owner.account.address)
  //     );
  //   });

  //   it("Should receive and store the funds to lock", async function () {
  //     const { lock, lockedAmount, publicClient } = await loadFixture(
  //       deployOneYearLockFixture
  //     );

  //     expect(
  //       await publicClient.getBalance({
  //         address: lock.address,
  //       })
  //     ).to.equal(lockedAmount);
  //   });

  //   it("Should fail if the unlockTime is not in the future", async function () {
  //     // We don't use the fixture here because we want a different deployment
  //     const latestTime = BigInt(await time.latest());
  //     await expect(
  //       hre.viem.deployContract("Lock", [latestTime], {
  //         value: 1n,
  //       })
  //     ).to.be.rejectedWith("Unlock time should be in the future");
  //   });
  // });

  
});
