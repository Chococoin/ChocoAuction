pragma solidity ^0.5.9;

contract ChocoAuction{
    address payable public first_beneficiary;
    address payable public second_beneficiary;
    address public highestBidder;
    uint public highestBid;
    uint public auctionStart;
    uint public biddingTime;
    uint public sixmonth;
    bool public ended = false;
    uint secondstage = 1000;

    mapping(address => uint) pendingReturns;

    modifier isEnded(){
        require(biddingTime >= now && ended == false,
        "Is too late to make a bid. The auction has ended."
        );
        _;
    }

    modifier isHigh(){
        require(msg.value + pendingReturns[msg.sender] > highestBid,
        "The amount is not enough to overcome the bid."
        );
        _;
    }

    event HighestBidIncreased(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);

    constructor() public payable {
        // El primer beneficiario es el cacao cultor.
        // Mientras la subasta no supera el precio indicado para la segunda
        // fase el dinero llegará solo a él unicamente por el cacao sin costos de envio.

        first_beneficiary = 0xB3DbFAe156c57eb3eD094e29DaFE981dd84c1AF6;

        // El segundo Beneficiario es la fundacion Bit&Nibs (Creadores del contrato)
        // Si el monto de la subasta supera o iguala el monto de la segunda face
        // El cacao sera enviado a Italia para la creacion del primer Batch del ChocoCrypto
        // El dinero se utilizara para realizar el envio del cacao producir las barras
        // chococrypto y gastos de promocion
        second_beneficiary = msg.sender;
        // Marca el inicio de la subasta al momento de la creacion del contrato.
        auctionStart = block.timestamp;
        // Cantidad de segundo que durara la subasta (Seis meses)
        sixmonth = now + 600;
        // Señala la fecha de culminacion de la subasta.
        biddingTime = now + sixmonth;
    }

    function bid() public payable isEnded isHigh {
        pendingReturns[highestBidder] = highestBid;
        highestBid = msg.value;
        highestBidder = msg.sender;
    }

    function auctionEnd() public {
        emit AuctionEnded(highestBidder, highestBid);
        if(highestBid < secondstage) {
            first_beneficiary.transfer(highestBid);
        } else {
            first_beneficiary.transfer(secondface - 1);
            second_beneficiary.transfer(highestBid-(secondstage - 1));
        }
        ended = true;
    }
}