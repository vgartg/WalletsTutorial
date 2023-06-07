import { beginCell } from "ton";
import { toNano, Address } from "ton";
import { TonClient } from "ton";
import { mnemonicToWalletKey } from "ton-crypto";
import { sign } from 'ton-crypto';

async function main() {
    console.log("Hello, TON!");

    let internalMessageBody = beginCell().
  storeUint(0, 32). // write 32 zero bits to indicate that a text comment will follow
  storeStringTail("Hello, TON!"). // write our text comment
  endCell();

  const walletAddress = Address.parse('EQDV7E-B5zQc55p8zJpcT1j4WrjPv8iIbJJ-lCNRXymdV4qw');

  let internalMessage = beginCell().
  storeUint(0, 1). // indicate that it is an internal message -> int_msg_info$0
  storeBit(1). // IHR Disabled
  storeBit(1). // bounce
  storeBit(0). // bounced
  storeUint(0, 2). // src -> addr_none
  storeAddress(walletAddress).
  storeCoins(toNano("0.2")). // amount
  storeBit(0). // Extra currency
  storeCoins(0). // IHR Fee
  storeCoins(0). // Forwarding Fee
  storeUint(0, 64). // Logical time of creation
  storeUint(0, 32). // UNIX time of creation
  storeBit(0). // No State Init
  storeBit(1). // We store Message Body as a reference
  storeRef(internalMessageBody). // Store Message Body as a reference
  endCell();

    const client = new TonClient({
      endpoint: "https://toncenter.com/api/v2/jsonRPC",
      apiKey: "8c612414dae845503b6e056454e34c972ac136959010d6c22dc7474f2fd99195" // you can get an api key from @tonapibot bot in Telegram
    });
    

    const mnemonic = 'huge another such vote kite middle quality delay attract lazy era add army rare melt talent sail opinion gossip curtain visual estate best speed'; // word1 word2 word3
    let getMethodResult = await client.runMethod(walletAddress, "seqno"); // run "seqno" GET method from your wallet contract
    let seqno = getMethodResult.stack.readNumber(); // get seqno from response
    
    const mnemonicArray = mnemonic.split(' '); // get array from string
    const keyPair = await mnemonicToWalletKey(mnemonicArray); // get Secret and Public keys from mnemonic 

    let toSign = beginCell().
  storeUint(698983191, 32). // subwallet_id | We consider this further
  storeUint(Math.floor(Date.now() / 1e3) + 60, 32). // Transaction expiration time, +60 = 1 minute
  storeUint(seqno, 32). // store seqno
  storeUint(3, 8). // store mode of our internal transaction
  storeRef(internalMessage); // store our internalMessage as a reference

let signature = sign(toSign.endCell().hash(), keyPair.secretKey); // get the hash of our message to wallet smart contract and sign it to get signature

let body = beginCell().
  storeBuffer(signature). // store signature
  storeBuilder(toSign). // store our message
  endCell();

  let externalMessage = beginCell().
  storeUint(0b10, 2). // 0b10 -> 10 in binary
  storeUint(0, 2). // src -> addr_none
  storeAddress(walletAddress). // Destination address
  storeCoins(0). // Import Fee
  storeBit(0). // No State Init
  storeBit(1). // We store Message Body as a reference
  storeRef(body). // Store Message Body as a reference
  endCell();

  console.log(externalMessage.toBoc().toString("base64"))

  client.sendFile(externalMessage.toBoc());
  }
  
  
  main().finally(() => console.log("Exiting..."));