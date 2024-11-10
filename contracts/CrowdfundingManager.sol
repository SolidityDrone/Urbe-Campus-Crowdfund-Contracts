// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27; 
// 1. The founder creates a campaign 
// 2. Supportes can fund the campapign 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CrowdfundingManager {

    event CampaignCreated(
        address indexed creator,
        uint indexed campaignId,
        uint expirationDate
    ); 

    event CampaignFunded(
        address indexed funder, 
        uint indexed campaignId,
        uint amount, 
        uint amountRaised
    );

    event CampaignFundsWithdrawed(
        address indexed funder,
        uint indexed campaignId
    );

    struct Campaign{
        address creator;
        uint expirationDate;
        uint prizeGoal;
        uint amountRaised;
        bool isOngoing;
    }

    mapping(uint campaignId => Campaign) public s_campaigns;
    mapping(address user=>mapping(uint campaignId=> uint amountFunded)) public s_allocatedFunds;


    uint internal campaignCounter;
    IERC20 internal usdc;

    constructor(address _usdc){
        usdc = IERC20(_usdc);
    }

    function createCampaign(uint _expirationDate, uint _prizeGoal) public {
        increment();
        require(_expirationDate >= block.timestamp, "CrowdfudingManager: invalid expiration date"); 

        Campaign memory campaign = Campaign({
            creator: msg.sender,
            expirationDate: _expirationDate,
            prizeGoal: _prizeGoal,
            amountRaised: 0,
            isOngoing: true
        });
        
        s_campaigns[campaignCounter] = campaign;

        emit CampaignCreated(msg.sender, campaignCounter, _expirationDate);
    }

    function fundCampaign(uint campaignId, uint amount) public {
        Campaign storage campaign = s_campaigns[campaignId];
        require(campaign.creator != address(0), "CrowdfudingManager: Campaign dosen't exist");
        require(campaign.expirationDate > block.timestamp, "CrowdfudingManager: campaign expired");

        
        uint newAmount = checkForGoal(campaign, amount);
        if (amount != newAmount) {
            campaign.isOngoing = false;
        }
        campaign.amountRaised += newAmount;
        //usdc.transferFrom(msg.sender, address(this), newAmount);
        s_allocatedFunds[msg.sender][campaignId] += newAmount;

        emit CampaignFunded(msg.sender, campaignId, amount, campaign.amountRaised);
    }

    function collectFunds(uint campaignId) external {
        // 1. the user is the creator of the campaign
        // 2. the campaign is not ongoing
        // 3. call function transfer(to, value)
        Campaign storage campaign = s_campaigns[campaignId];
        require(campaign.creator == msg.sender, "CrowdfudingManager: you're not the creator");
        require(campaign.isOngoing == false, "CrowdfudingManager: is not expired yet");
        //usdc.transfer(msg.sender, campaign.amountRaised);

        emit CampaignFundsWithdrawed(msg.sender, campaignId);
    } 

    function withdrawFunds(uint campaignId) external {
        Campaign storage campaign = s_campaigns[campaignId];
        require(campaign.isOngoing == false, "CrowdfudingManager: campaign is not expired yet");
        require(campaign.prizeGoal > campaign.amountRaised, "CrowdfundingManager: campaign was succesful");
        //usdc.transfer(msg.sender, s_allocatedFunds[msg.sender][campaignId]);
        delete s_allocatedFunds[msg.sender][campaignId];
    }

      function increment() internal {
        ++campaignCounter;
    }

    function checkForGoal(
        Campaign memory campaign,
        uint amount
    ) internal pure returns (uint) {
        if (campaign.amountRaised + amount > campaign.prizeGoal) {
            return campaign.prizeGoal - campaign.amountRaised;  // Cap the amount to reach the goal
        } 
        return amount;  // If the goal is not exceeded, accept the full amount
    }
}

