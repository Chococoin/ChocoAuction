const ChocoAuction = artifacts.require('ChocoAuction');
const Errors = require('./tools/errors.js');
const Utils = require('./tools/utils.js')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const Fri_Nov_01_00_00_UTC_2019 = 1572566400;

contract('ChocoAuction', (accounts) => {
  var chocoAuction, highestBid, highestBidder,
      pendingReturns, bid, rebid, myPendingFunds;
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
    assert(rebid);
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
          console.log(e.message);
          assert(e.message === Errors[3]);
      }
  });
  it('Not bidder user unable to rebidding', async () => {
      try {
        rebid = chocoAuction.rebid({ from: accounts[4], value: 500000000000 });
      } catch(e) {
          console.log('e.name');
          assert(e.name === 'Error');
      }
  })
});

