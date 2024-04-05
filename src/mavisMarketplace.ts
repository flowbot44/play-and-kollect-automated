import * as dotenv from 'dotenv'
dotenv.config();

const QUERYSIZE = 50; //50 is max size

const queryVxKongz = ` query MyKongz($address: String, $querySize: Int!, $startFrom:Int!) {
                            erc721Tokens(
                            size: $querySize
                            tokenAddress: "0x241a81fc0d6692707dad2b5025a3a7cf2cf25acf"
                            owner: $address
                            from: $startFrom
                            ) {
                            results {
                                tokenId
                            }
                            total
                            }
                        }`

export async function getVxKongz(address:string){
    
    const vxArray: number[] = []
    let totalVX = 0;
    let position = 0;
    do{
        if(totalVX !== 0){ //not the first time get next batch
            position = position + QUERYSIZE;
        }

        const variables = {
            address: address.toLowerCase(),
            querySize: QUERYSIZE,
            startFrom: position
        }
        
        const vxData = await fetchApi(queryVxKongz,variables);
        const vxResults = (vxData as any).data?.erc721Tokens?.results
        //console.log(vxResults)
        totalVX = (vxData as any).data?.erc721Tokens?.total
        //console.log(vxData)
        if (!vxResults) {
            console.log(`Failed to fetch VX Kongz`, vxData)
            return []
        } 

        vxResults.forEach((token: { tokenId: string; }) => {
            vxArray.push(+token.tokenId)
        });
    } while(vxArray.length < totalVX)
    
    return vxArray
}                        




async function fetchApi<T>(query: string, variables: { [key: string]: any }, headers?: { [key: string]: any }): Promise<T | null> {
  try {
    const response = await fetch('https://api-gateway.skymavis.com/graphql/mavis-marketplace', {
      method: 'POST',
      headers: new Headers({
        'content-type': 'application/json',
        'X-API-Key': process.env.SKYMAVIS_DAPP_KEY || '',
        ...headers
      }),
      body: JSON.stringify({ query, variables })
    })

    const res: T = await response.json()
    return res
  } catch (error) {
    console.log(error)
    return null
  }
}