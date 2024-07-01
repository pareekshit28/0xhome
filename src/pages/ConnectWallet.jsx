// import {
//   useAccount,
//   useChainId,
//   usePublicClient,
//   useConnect,
//   useWriteContract,
// } from "wagmi";
// import { React, useState, useEffect } from "react";
// import { upload, download } from "thirdweb/storage";
// import {
//   createCreatorClient,
//   createCollectorClient,
// } from "@zoralabs/protocol-sdk";
// import { createThirdwebClient } from "thirdweb";

// const ConnectWallet = () => {
//   const { connectors, connect } = useConnect();
//   const { address } = useAccount();
//   const chainId = useChainId();
//   const publicClient = usePublicClient();
//   const { writeContract } = useWriteContract();

//   async function createCollection(
//     collectionName,
//     collectionDesc,
//     collectionThumbFile
//   ) {
//     try {
//       //Upload Thumbnail
//       const thumbUri = await upload({
//         client: createThirdwebClient({
//           clientId: "142a28a23bca6a20e72f4b7148066494",
//         }),
//         files: [collectionThumbFile],
//       });

//       //Create and Upload Collection Metadata
//       const collectionMetaData = JSON.stringify({
//         name: collectionName,
//         description: collectionDesc,
//         thumb_uri: thumbUri,
//       });
//       const collectionUri = await upload({
//         client: createThirdwebClient({
//           clientId: "142a28a23bca6a20e72f4b7148066494",
//         }),
//         files: [new File([collectionMetaData], "collection.json")],
//       });

//       //Create 1155 contract
//       const creatorClient = createCreatorClient({ chainId, publicClient });
//       const { parameters } = await creatorClient.create1155({
//         contract: {
//           name: collectionName,
//           uri: collectionUri,
//         },
//         account: address,
//       });
//       writeContract(parameters);
//     } catch (err) {
//       console.error("Error setting up contract:", err);
//     }
//   }

//   async function createToken(
//     collectionAddress,
//     tokenName,
//     tokenGlbFile,
//     tokenThumbFile
//   ) {
//     try {
//       //Upload Token GLB
//       const glbFileUri = await upload({
//         client: createThirdwebClient({
//           clientId: "142a28a23bca6a20e72f4b7148066494",
//         }),
//         files: [tokenGlbFile],
//       });

//       //Upload Token Thumb
//       const thumbUri = await upload({
//         client: createThirdwebClient({
//           clientId: "142a28a23bca6a20e72f4b7148066494",
//         }),
//         files: [tokenThumbFile],
//       });

//       //Create and Upload token metadata
//       const tokenMetaData = JSON.stringify({
//         name: tokenName,
//         uri: glbFileUri,
//         thumb_uri: thumbUri,
//       });
//       const tokenUri = await upload({
//         client: createThirdwebClient({
//           clientId: "142a28a23bca6a20e72f4b7148066494",
//         }),
//         files: [new File([tokenMetaData], "token.json")],
//       });

//       //Create token
//       const creatorClient = createCreatorClient({ chainId, publicClient });
//       const { parameters } = await creatorClient.create1155({
//         contract: collectionAddress,
//         token: {
//           tokenMetadataURI: tokenUri,
//           createReferral: "0xd19a12bdE1B768957aab46F9eB1c6B9F498c32DC",
//         },
//         account: address,
//       });
//       writeContract(parameters);
//     } catch (err) {
//       console.error("Error setting up contract:", err);
//     }
//   }

//   async function mintToken(token) {
//     try {
//       // The `prepareMint` function of the any returned token
//       // can be used to prepare a transaction to mint x quantity of
//       // that token to a recipient
//       const { parameters, costs } = token.prepareMint({
//         minterAccount: address,
//         quantityToMint: 1n,
//       });

//       // write the mint transaction to the network
//       writeContract(parameters);
//     } catch (err) {
//       console.error("Error minting token:", err);
//     }
//   }

//   async function getTokensForCollection(collectionAddr) {
//     try {
//       const collectorClient = createCollectorClient({ chainId, publicClient });

//       // get the item that can be minted, and a function to prepare
//       // a mint transaction
//       const { tokens, contract } = await collectorClient.getTokensOfContract({
//         // collection address to mint
//         tokenContract: collectionAddr,
//       });
//       return tokens;
//     } catch (err) {
//       console.error("Error getting tokens:", err);
//     }
//   }

//   return (
//     <div>
//       <p>{address}</p>
//       <button
//         onClick={() => {
//           connectors.map((connector) => connect({ connector }));
//         }}
//       >
//         Connect To Metamask
//       </button>
//       <br />
//       <input
//         type="file"
//         accept=".glb"
//         onChange={(event) => {
//           const glbFile = event.target.files[0];
//           createToken(
//             "Demo Collection 2",
//             "Demo Description",
//             "Demo Token 2",
//             glbFile
//           );
//         }}
//       />
//       <br />
//       <button
//         onClick={() => {
//           getTokensForCollection("0xcabd662216664b90c358b0e3a4927be85ba9fa3b");
//         }}
//       >
//         Mint Token
//       </button>
//     </div>
//   );
// };

// export default ConnectWallet;
