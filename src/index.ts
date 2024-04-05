import { ethers } from "ethers";
import * as fs from 'fs';
import * as cron from 'node-cron';
import * as mavisMarket from "./mavisMarketplace"

require("dotenv").config();

//daily at 06:04 UTC
cron.schedule('04 6 * * *', () => {
    console.log("Trying to Claim Daily Kredits")
    claimDailyKredits();
}, {
    timezone: "UTC"
}); 

const rpc = 'https://api.roninchain.com/rpc';
// Limit batchMaxCount to 1, new Ronin RPC does not support batching yet
const provider = new ethers.JsonRpcProvider(rpc, 2020, { batchMaxCount: 1 });
const vxDispenserAbi = JSON.parse(fs.readFileSync('abis/vxSliceDispenser.abi.json', 'utf8'))
const vxDispenserContract = new ethers.Contract('0xd9696466ca9c3211643e4f150917776d940e7faf',vxDispenserAbi, provider)


async function claimDailyKredits() {
    try{
        if(!process.env.PRIVATE_KEY ){
            console.log("add a private key to the .env file")
            return
        }
        if(!process.env.SKYMAVIS_DAPP_KEY ){
            console.log("add a SkyMavis dapp key to the .env file")
            return
        }

        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

        const vxResults = await mavisMarket.getVxKongz(signer.address)
    
        const canClaim: boolean[] = await vxDispenserContract.canClaim(vxResults)
        const claimableArray: number[] = []

        for (let index = 0; index < canClaim.length; index++) {
            if(canClaim[index]){
                claimableArray.push(vxResults[index]) 
            }
        }
        const totalKongz = vxResults.length
        const claimableSize = claimableArray.length
        if(claimableSize === 0){
            console.log(`All ${totalKongz} VX Kongz kredits have been claimed`)
            return
        }

        console.log(`Claiming for ${claimableSize} of ${totalKongz} VX Kongz`)
                
        const connectedContract = <ethers.Contract>vxDispenserContract.connect(signer)
        const claimResult = await connectedContract.claim(claimableArray)
        if(claimResult){
            console.log(`Successful claim ${claimResult.hash}`)
        }
        
    } catch (e: Error | any) {
        console.log(e)
        e.code && e.info && console.error(`⚠️ ${e.code} (${e.info.error.shortMessage})`)
    }
    
}

async function start(){
    await claimDailyKredits()
}

start()


