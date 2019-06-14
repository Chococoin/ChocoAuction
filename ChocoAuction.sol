pragma solidity ^0.5.8;

contract ChocoAuction{
    address payable public beneficiary;
    address public highestBidder;
    uint public highestBid;
    uint public biddingTime;
    uint public sixmonth;
    bool open = true;

    mapping(address => uint) pendingReturns;

    modifier isOpen(){
        require(open == true,
        "Is too late to make a bid. The auction has ended."
        );
        _;
    }

    modifier isHigh(){
        require(msg.value + pendingReturns[msg.sender] > highestBid,
        "The amount is not enough to overcome the previous bid."
        );
        _;
    }

    event HighestBidIncreased(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);

    constructor() public payable {
        // El beneficiario es el cacao cultor.
        beneficiary = msg.sender;
        // Cantidad de segundo que durara la subasta (Seis meses)
        sixmonth = 500;
        // Señala la fecha de culminacion de la subasta.
        biddingTime = now + sixmonth;
    }

    function bid() public payable isOpen isHigh returns(bool){
        closeIt();
        require(msg.sender != highestBidder,
        "HighestBidder cannot make rebidding."
        );
        require(pendingReturns[msg.sender] == 0,
        "You have a pending found, make rebidding");
        pendingReturns[highestBidder] = highestBid;
        highestBid = msg.value;
        highestBidder = msg.sender;
        return true;
    }

    function rebidding() public payable isOpen isHigh returns(bool){
        closeIt();
        require(msg.sender != highestBidder,
        "HighestBidder cannot make rebidding."
        );
        require(pendingReturns[msg.sender] > 0,
        "This function only work if you have a overcame bid."
        );
        pendingReturns[highestBidder] = highestBid;
        highestBid = msg.value + pendingReturns[msg.sender];
        pendingReturns[msg.sender] = 0;
        highestBidder = msg.sender;
        return true;
    }

    function auctionEnd() public returns(bool){
        require(msg.sender == beneficiary,
        "Only beneficiary can call this function."
        );
        require(block.timestamp > biddingTime,
        "Auction isn't ended yet."
        );
        emit AuctionEnded(highestBidder, highestBid);
        beneficiary.transfer(highestBid);
        closeIt();
    }

    function myPendingFunds() public view returns (uint){
        return pendingReturns[msg.sender];
    }
    
    function closeIt() internal returns (bool) {
        if (biddingTime < block.timestamp) {
            open = false;
            return open;
        } 
    }
    
    function isClosed () public view returns(bool) {
        return !open;
    }

    function withdrawPendings() public returns(bool){
        require(pendingReturns[msg.sender] > 0,
        "You don't have any funds on this contract."
        );
        uint amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0;
            if (!msg.sender.send(amount)) {
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }
}