const ChocoAuction = artifacts.require('ChocoAuction');
const Errors = require('./tools/errors.js');
const Utils = require('./tools/utils.js')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const now = Math.floor((Date.now()) / 1000);
const Fri_Nov_01_00_00_UTC_2019 = 1572566400;

contract('ChocoAuction', (accounts) => {
  var chocoAuction, highestBid, highestBidder, auctionEnd,
      pendingReturns, bid, rebid, myPendingFunds, isClosed,
      balance, snapShot;
  it('Deploy the Smart Contract', async () => {
      chocoAuction = await ChocoAuction.deployed();
      assert(chocoAuction.address !== '');
  });
  it('Beneficiary is sender', async () => {
      const beneficiary = await chocoAuction.beneficiary()
      assert(beneficiary == accounts[0]);
  });
  it('Higgest Bid must be 0', async () => {
      highestBid = await chocoAuction.highestBid.call({ from: accounts[2] });
      assert(highestBid.toNumber() === 0);
  });
  it('Higgest Bidder must be undefined', async () => {
      highestBidder = await chocoAuction.highestBidder.call({ from: accounts[1] });
      assert(highestBidder === ZERO_ADDR);
  });
  it('Receiving properly a bid', async () => {
      await chocoAuction.bid({from: accounts[1], value: 100000000000});
      highestBid = await chocoAuction.highestBid.call({ from: accounts[2] });
      assert(highestBid.toNumber() === 100000000000);
  })
  it('Set properly the highest bidder', async () => {
      highestBidder = await chocoAuction.highestBidder.call({ from: accounts[2] });
      assert(highestBidder === accounts[1]);
  });
  it('Receiving a new highest bid', async () => {
      await chocoAuction.bid({from: accounts[2], value: 200000000000});
      highestBid = await chocoAuction.highestBid.call({ from: accounts[0] });
      assert(highestBid.toNumber() === 200000000000);
  });
  it('Set properly new highest bidder', async () => {
      highestBidder = await chocoAuction.highestBidder.call({ from: accounts[0] });
      assert(highestBidder === accounts[2]);
  });
  it('Set properly Pending returns', async () => {
      pendingReturns = await chocoAuction.myPendingFunds.call({ from: accounts[1] });
      assert(pendingReturns.toNumber() === 100000000000);
  });
  it('Overcame bidder unable to make a bid', async () => {
    try {
    bid = await chocoAuction.bid({ from: accounts[1], value: 300000000000 });
    } catch(e) {
      assert(e.message == Errors[1]);
    }
  });
  it('Overcame bidder make a rebid', async () => {
      rebid = await chocoAuction.rebid({ from: accounts[1], value: 100000000001 });
      assert(rebid.receipt.status);
  });
  it('Check pendings funds', async () => {
      myPendingFunds = await chocoAuction.myPendingFunds({ from: accounts[2] });
      assert(myPendingFunds.toNumber() === 200000000000);
  });
  it('New bidder unable to bid with lower amount', async () => {
    try{
      bid = await chocoAuction.bid({ from: accounts[3], value: 200000000000 });
    } catch(e) {
        assert(e.message == Errors[2]);
    }
  });
  it('New bidder unable to bid with equal amount', async () => {
    try{
      bid = await chocoAuction.bid({ from: accounts[3], value: 200000000001 });
    } catch(e) {
        assert(e.message == Errors[2]);
    }
  });
  it('No bidder has not pending funds', async () => {
      myPendingFunds = await chocoAuction.myPendingFunds({ from: accounts[3] });
      assert(myPendingFunds.toNumber() === 0);
  });
  it('Highest bidder has not change', async () => {
      highestBidder = await chocoAuction.highestBidder.call({ from: accounts[0] });
      assert(highestBidder === accounts[1]);
  });
  it('Highest bidder has not pending funds', async () => {
      myPendingFunds = await chocoAuction.myPendingFunds({ from: accounts[1] });
      assert(myPendingFunds.toNumber() === 0);
  });
  it('Lower bidder withdraw pendings funds', async () => {
      withdrawPendings = await chocoAuction.withdrawPendings({ from: accounts[2] });
      assert(withdrawPendings);
  });
  it('Exit bidder has not pendings funds', async () => {
      myPendingFunds = await chocoAuction.myPendingFunds({ from: accounts[2] });
      assert(myPendingFunds.toNumber() === 0);
  });
  it('Higher bidder cannot make a new highest bid', async () => {
    try {
        myPendingFunds = await chocoAuction.bid({ from: accounts[1], value:200000000002 });
    } catch(e) {
        assert(e.message === Errors[3]);
    }
  });
  it('Not bidder user unable to rebidding', async () => {
    try {
      rebid = await chocoAuction.rebid({ from: accounts[4], value: 500000000000 });
    } catch(e) {
        assert(e.message === Errors[4]);
    }
  });
  it('Admin cannot withdraw and close before end', async () => {
    try {
      auctionEnd = await chocoAuction.auctionEnd();
    } catch(e) {
      assert(e.message === Errors[5]);
    }
  });
  it('Auction remains open', async () => {
      isClosed = await chocoAuction.isClosed.call();
      assert(!isClosed);
  });
  it('Ex nuovo bidder reenter', async () => {
      bid = await chocoAuction.bid({ from: accounts[2], value: 400000000000 });
      assert(bid.receipt.status);
  });
  it('Overcame bidder withdraw funds', async () => {
      bid = await chocoAuction.bid({ from: accounts[3], value: 500000000000 });
      withdrawPendings = await chocoAuction.withdrawPendings({ from: accounts[2] });
      assert(withdrawPendings.receipt.status);
  });
  it('New balance of exit bidder', async () => {
      balance = await chocoAuction.myPendingFunds({ from: accounts[2] });
      assert(balance.toNumber() === 0);
  });
  it('Set moment before end of auction', async () => {
    snapShot =  await Utils.takeSnapshot();
    console.log(snapShot)
    assert(snapShot);
  }); 
   it('After End of Auction', async () => {
    await Utils.advanceTimeAndBlock(Fri_Nov_01_00_00_UTC_2019 - now);
    let time = await Utils.getCurrentTime();
    console.log(time); 
    assert(time);
  });
  it('Revert to snapshot', async () => {
    await Utils.revertToSnapShot(snapShot.result);
    let time = await Utils.getCurrentTime();
    console.log(time); 
  })
});
