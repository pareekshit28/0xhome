// src/App.js
import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import * as THREE from "three";
import { Vector3, RepeatWrapping, Box3 } from "three";
import {
  Box,
  Text,
  Image,
  Plane,
  Html,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { Interactive } from "@react-three/xr";
import { useFrame, useThree } from "@react-three/fiber";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useConnect,
  useWriteContract,
} from "wagmi";
import { upload, download } from "thirdweb/storage";
import {
  createCreatorClient,
  createCollectorClient,
} from "@zoralabs/protocol-sdk";
import { createThirdwebClient } from "thirdweb";

function Menu(props) {
  const [page, setPage] = useState("main");
  const { address } = useAccount();
  const { connectors, connect } = useConnect();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContract } = useWriteContract();

  async function createCollection(
    collectionName,
    collectionDesc,
    collectionThumbFile
  ) {
    try {
      //Upload Thumbnail
      const thumbUri = await upload({
        client: createThirdwebClient({
          clientId: "142a28a23bca6a20e72f4b7148066494",
        }),
        files: [collectionThumbFile],
      });

      //Create and Upload Collection Metadata
      const collectionMetaData = JSON.stringify({
        name: collectionName,
        description: collectionDesc,
        thumb_uri: thumbUri,
      });
      const collectionUri = await upload({
        client: createThirdwebClient({
          clientId: "142a28a23bca6a20e72f4b7148066494",
        }),
        files: [new File([collectionMetaData], "collection.json")],
      });

      //Create 1155 contract
      const creatorClient = createCreatorClient({ chainId, publicClient });
      const { parameters } = await creatorClient.create1155({
        contract: {
          name: collectionName,
          uri: collectionUri,
        },
        account: address,
      });
      writeContract(parameters);
    } catch (err) {
      console.error("Error setting up contract:", err);
    }
  }

  async function createToken(
    collectionName,
    tokenName,
    tokenGlbFile,
    tokenThumbFile
  ) {
    try {
      //Create and Upload Collection Metadata
      const collectionMetaData = JSON.stringify({
        name: collectionName,
      });
      const collectionUri = await upload({
        client: createThirdwebClient({
          clientId: "142a28a23bca6a20e72f4b7148066494",
        }),
        files: [new File([collectionMetaData], "collection.json")],
      });

      //Upload Token GLB
      const glbFileUri = await upload({
        client: createThirdwebClient({
          clientId: "142a28a23bca6a20e72f4b7148066494",
        }),
        files: [tokenGlbFile],
      });

      //Upload Token Thumb
      const thumbUri = await upload({
        client: createThirdwebClient({
          clientId: "142a28a23bca6a20e72f4b7148066494",
        }),
        files: [tokenThumbFile],
      });

      //Create and Upload token metadata
      const tokenMetaData = JSON.stringify({
        name: tokenName,
        animation_url: glbFileUri,
        image: thumbUri,
      });
      const tokenUri = await upload({
        client: createThirdwebClient({
          clientId: "142a28a23bca6a20e72f4b7148066494",
        }),
        files: [new File([tokenMetaData], "token.json")],
      });

      //Create token
      const creatorClient = createCreatorClient({ chainId, publicClient });
      const { parameters } = await creatorClient.create1155({
        contract: {
          // contract name
          name: collectionName,
          // contract metadata uri
          uri: collectionUri,
        },
        token: {
          tokenMetadataURI: tokenUri,
          createReferral: "0xd19a12bdE1B768957aab46F9eB1c6B9F498c32DC",
        },
        account: address,
      });
      writeContract(parameters);
    } catch (err) {
      console.error("Error setting up contract:", err);
    }
  }

  async function mintToken() {
    try {
      // set to the chain you want to interact with
      const collectorClient = createCollectorClient({ chainId, publicClient });

      // prepare the mint transaction
      const { parameters } = await collectorClient.mint({
        // 1155 contract address
        tokenContract: "0x4bdd276118e68be3263e7ef6f02cb5e44cd899ae",
        // type of item to mint
        mintType: "1155",
        // 1155 token id to mint
        tokenId: 1n,
        // quantity of tokens to mint
        quantityToMint: 1,
        // optional address that will receive a mint referral reward
        mintReferral: "0xd19a12bdE1B768957aab46F9eB1c6B9F498c32DC",
        // account that is to invoke the mint transaction
        minterAccount: address,
      });

      // write the mint transaction to the network
      writeContract(parameters);
    } catch (err) {
      console.error("Error minting token:", err);
    }
  }

  async function getTokensForCollection(collectionAddr) {
    try {
      const collectorClient = createCollectorClient({
        chainId,
        publicClient,
      });

      // get the item that can be minted, and a function to prepare
      // a mint transaction
      const { tokens, contract } = await collectorClient.getTokensOfContract({
        // collection address to mint
        tokenContract: collectionAddr,
      });
      return tokens;
    } catch (err) {
      console.error("Error getting tokens:", err);
    }
  }

  const ConnectWallet = () => {
    return (
      <div className=" bg-black text-white px-4 py-2 rounded">
        <button
          onClick={() => {
            connectors.map((connector) => connect({ connector }));
          }}
        >
          Connect Wallet
        </button>
      </div>
    );
  };

  return (
    <group {...props}>
      <Sidebar position={[-1.5, 0, 0]} setPage={setPage} />
      {page === "main" &&
        (address ? (
          <Suspense
            fallback={
              <Text color={"black"} fontSize={0.1} position={[0.5, -0.2, 0]}>
                Loading Collections...
              </Text>
            }
          >
            <Main
              setPage={setPage}
              addr={`${address.slice(0, 4)}....${address.slice(-4)}`}
            />
          </Suspense>
        ) : (
          <Html transform occlude scale={0.25} position={[0.5, 0, 0]}>
            {<ConnectWallet />}
          </Html>
        ))}
      {page === "collection" && (
        <Suspense
          fallback={
            <Text color={"black"} fontSize={0.1} position={[0.5, -0.2, 0]}>
              Loading Collection...
            </Text>
          }
        >
          <Collection setPage={setPage} />
        </Suspense>
      )}

      {page === "mint" && (
        <MintPage
          tokenName={"House Plant"}
          collectionName={"NeoNexus"}
          totalMints={932}
          setPage={setPage}
          mint={mintToken}
        />
      )}
      {page === "create" && (
        <CreatePage setPage={setPage} create={createToken} />
      )}
      {page === "account" && (
        <Suspense
          fallback={
            <Text color={"black"} fontSize={0.1} position={[0.5, -0.2, 0]}>
              Loading NFTs...
            </Text>
          }
        >
          <AccountPage
            tokenName={"Chair"}
            url={"chair.glb"}
            setPage={setPage}
            setModel={props.setModel}
          />
        </Suspense>
      )}
    </group>
  );
}

function Main({ setPage, addr }) {
  return (
    <>
      <Header position={[-0.8, 0.8, 0]} addr={addr} />
      <WeeklyTop40 position={[-0.8, 0.55, 0]} setPage={setPage} />
      <TrendingPlaylist position={[-0.8, -0.4, 0]} />
    </>
  );
}

function Collection({ setPage }) {
  return (
    <>
      <BackButton
        position={[-0.8, 1, 0]}
        onClick={() => {
          setPage("main");
        }}
      />
      <ArtistInfo
        position={[-0.7, 0.8, 0]}
        collectionName={"NeoNexus"}
        url={
          "https://cdn.ddecor.com/media/amasty/amoptmobile/wysiwyg/Bohemian_1_Main-opt.jpg"
        }
      />
      <TopPlaylist position={[-0.8, -0.45, 0]} setPage={setPage} />
    </>
  );
}

function MintPage({ tokenName, collectionName, totalMints, setPage, mint }) {
  return (
    <>
      <BackButton
        position={[-0.8, 1, 0]}
        onClick={() => {
          setPage("collection");
        }}
      />
      <Suspense
        fallback={
          <Text color={"black"} fontSize={0.08} position={[0, 0, 0]}>
            Loading Model...
          </Text>
        }
      >
        <Token
          position={[0.1, -0.3, 0.2]}
          url={"plant.glb"}
          scale={[1, 1, 1]}
        />
      </Suspense>
      <MintButton position={[1.78, 0, 0]} args={[1.35, 0.25, 0]} mint={mint} />
      <Text
        position={[1.12, 0.8, 0]}
        fontSize={0.09}
        color={"black"}
        anchorX="left"
      >
        {tokenName}
      </Text>
      <Text
        position={[1.12, 0.6, 0]}
        fontSize={0.06}
        color={"black"}
        anchorX="left"
      >
        Collection Name
      </Text>
      <Text
        position={[2.4, 0.6, 0]}
        fontSize={0.06}
        color={"black"}
        anchorX="right"
      >
        {collectionName}
      </Text>
      <Text
        position={[1.12, 0.5, 0]}
        fontSize={0.06}
        color={"black"}
        anchorX="left"
      >
        Total Mints
      </Text>
      <Text
        position={[2.4, 0.5, 0]}
        fontSize={0.06}
        color={"black"}
        anchorX="right"
      >
        {totalMints}
      </Text>
      <Text
        position={[1.12, 0.3, 0]}
        fontSize={0.06}
        color={"black"}
        anchorX="left"
      >
        Zora Sepolia
      </Text>
      <Text
        position={[2.4, 0.3, 0]}
        fontSize={0.06}
        color={"black"}
        anchorX="right"
      >
        0.000777 ETH
      </Text>
    </>
  );
}

function AccountPage({ setPage, setModel }) {
  const tokens = [
    {
      tokenName: "Chair",
      url: "chair.glb",
      model: "chair",
      position: [-0.4, 0.35, 0],
      tokenPos: [0, -0.1, 0.4],
      scale: [0.55, 0.55, 0.55],
    },
    {
      tokenName: "Table Tennis",
      url: "table_tennis.glb",
      model: "table_tennis",
      position: [0.6, 0.35, 0],
      tokenPos: [0, 0, 0.5],
      scale: [0.08, 0.08, 0.08],
    },
    {
      tokenName: "Gaming Desk",
      url: "gaming.glb",
      model: "gaming",
      position: [1.6, 0.35, 0],
      tokenPos: [0, 0, 0.5],
      scale: [0.1, 0.1, 0.1],
    },
    {
      tokenName: "House Plant",
      url: "plant.glb",
      model: "plant",
      position: [-0.4, -0.7, 0],
      tokenPos: [0, 0.15, 0.4],
      scale: [0.45, 0.45, 0.45],
    },
    // Add more tokens as needed
  ];
  return (
    <>
      <BackButton
        position={[-0.8, 1, 0]}
        onClick={() => {
          setPage("main");
        }}
      />
      {tokens.map((token, index) => (
        <group key={index} position={token.position}>
          <Token
            position={token.tokenPos}
            url={token.url}
            scale={token.scale}
          />
          <Text
            position={[-0.35, -0.2, 0]} // Adjust relative to the group position
            fontSize={0.07}
            color={"black"}
            anchorX="left"
          >
            {token.tokenName}
          </Text>
          <AddButton
            position={[0, -0.4, 0]}
            args={[0.7, 0.2, 0]}
            onClick={() => {
              setModel(token.model);
            }}
          />
        </group>
      ))}
    </>
  );
}

function CreatePage({ setPage, create }) {
  const [collName, setcollName] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [price, setPrice] = useState("");
  const [glbFile, setGlbFile] = useState();
  const [thumbFile, setThumbFile] = useState();
  const fileInputRef = useRef(null);
  const { gl } = useThree();

  const handleSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    setThumbFile(file);
  }, []);

  return (
    <>
      <BackButton position={[-0.8, 1, 0]} />
      <Suspense>
        <Token
          position={[0, -0.4, 0.3]}
          scale={[30, 30, 30]}
          setGlbFile={setGlbFile}
        />
      </Suspense>
      <CreateButton
        position={[1.78, -1, 0]}
        onClick={() => {
          create(collName, tokenName, glbFile, thumbFile);
        }}
      />
      <Text
        position={[1.12, 0.8, 0]}
        fontSize={0.09}
        color={"black"}
        anchorX="left"
      >
        Post
      </Text>
      <Text
        position={[1.12, 0.65, 0]}
        fontSize={0.06}
        color={"black"}
        anchorX="left"
      >
        Collection
      </Text>
      <TextInput
        position={[1.28, 0.47, 0]}
        text={collName}
        setText={setcollName}
        hint={"Enter Collection Name"}
      />
      <Text
        position={[1.12, 0.25, 0]}
        fontSize={0.06}
        color={"black"}
        anchorX="left"
      >
        Token Name
      </Text>
      <TextInput
        position={[1.28, 0.06, 0]}
        text={tokenName}
        setText={setTokenName}
        hint={"Enter Token Name"}
      />
      <Interactive onSelect={handleSelect}>
        <Text
          position={[1.8, -0.2, 0]}
          fontSize={0.06}
          color={"black"}
          anchorX="center"
          onClick={handleSelect}
        >
          {thumbFile ? thumbFile.name : "📷 Upload Thumbnail"}
        </Text>
      </Interactive>
      <Html portal={gl.domElement.parentNode}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </Html>
      <Text
        position={[1.12, -0.35, 0]}
        fontSize={0.06}
        color={"black"}
        anchorX="left"
      >
        Price
      </Text>
      <TextInput
        position={[1.28, -0.55, 0]}
        text={price}
        setText={setPrice}
        hint={"Enter Price in ETH"}
      />
      <Text
        position={[1.12, -0.75, 0]}
        fontSize={0.06}
        color={"black"}
        anchorX="left"
      >
        Zora Sepolia
      </Text>
      <Text
        position={[2.4, -0.75, 0]}
        fontSize={0.06}
        color={"black"}
        anchorX="right"
      >
        {`${Number.parseFloat(price) + 0.000777}  ETH`}
      </Text>
    </>
  );
}

function Token({ position, url, scale, setGlbFile }) {
  const [tokenFile, setTokenFile] = useState(url);
  const fileRef = useRef();

  function Upload() {
    const handleSelect = useCallback(() => {
      if (fileRef.current) {
        fileRef.current.click();
      }
    }, []);

    const handleFileChange = useCallback((event) => {
      const file = event.target.files[0];
      if (file) {
        setTokenFile(URL.createObjectURL(file));
        setGlbFile(file);
      }
    }, []);
    const { gl } = useThree();
    return (
      <>
        <Interactive onSelect={handleSelect}>
          <Text
            position={[0, -0.15, 0]}
            fontSize={0.08}
            color={"black"}
            anchorX="center"
            onClick={handleSelect}
          >
            ⬆️ Upload .glb/.gltf/.prefab
          </Text>
        </Interactive>
        <Html portal={gl.domElement.parentNode}>
          <input
            ref={fileRef}
            type="file"
            accept=".glb,.gltf"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </Html>
      </>
    );
  }

  function Model({ path }) {
    const { scene } = useGLTF(path);
    const modelRef = useRef();

    // Auto-rotate the model
    useFrame(() => {
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.005; // Adjust the speed of rotation here
      }
    });
    return (
      <>
        <pointLight
          position={[position[0], position[1] + 0.6, position[2] + 0.6]}
          intensity={2}
        />
        <group ref={modelRef} position={position} scale={scale}>
          <primitive object={scene} />
        </group>
      </>
    );
  }
  // Load texture for the plant (you can replace this with your own texture or model)
  // const texture = useLoader(TextureLoader, '/path/to/your/texture.jpg');
  return <>{tokenFile ? <Model path={tokenFile} /> : <Upload />}</>;
}

function MintButton(props) {
  return (
    <mesh position={props.position} onClick={props.mint}>
      <boxGeometry args={props.args} />
      <meshStandardMaterial color={"black"} />
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.07}
        color={"white"}
        anchorX="center"
        anchorY="middle"
      >
        Mint
      </Text>
    </mesh>
  );
}

function AddButton(props) {
  return (
    <Interactive onSelect={props.onClick}>
      <mesh position={props.position} onClick={props.onClick}>
        <boxGeometry args={props.args} />
        <meshStandardMaterial color={"black"} />
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.07}
          color={"white"}
          anchorX="center"
          anchorY="middle"
        >
          Add
        </Text>
      </mesh>
    </Interactive>
  );
}

function CreateButton(props) {
  return (
    <mesh {...props} onClick={props.onClick}>
      <boxGeometry args={[1.35, 0.25, 0]} />
      <meshStandardMaterial color={"black"} />
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.07}
        color={"white"}
        anchorX="center"
        anchorY="middle"
      >
        Create
      </Text>
    </mesh>
  );
}

function Sidebar({ position, setPage }) {
  const menuItems = [
    { label: "✨ Recently Added", position: [-0.25, 0.6, 0] },
    { label: "🔥 Trending", position: [-0.25, 0.4, 0], onClick: "main" },
    { label: "💅 Staff Picks", position: [-0.25, 0.2, 0] },
    { label: "🛋 Minted By You", position: [-0.25, 0, 0], onClick: "account" },
    { label: "➕ Create", position: [-0.25, -0.2, 0], onClick: "create" },
  ];

  const playlistItems = [
    { label: "🪟 Living Room", position: [-0.25, -0.6, 0] },
    { label: "🛌 Bedroom", position: [-0.25, -0.8, 0] },
    { label: "🎮 Gaming Room", position: [-0.25, -1, 0] },
    { label: "🐵 NFT Showcase", position: [-0.25, -1.2, 0] },
  ];

  return (
    <group position={position}>
      <Text
        position={[-0.25, 0.9, 0]}
        fontSize={0.15}
        color="black"
        anchorX="left"
      >
        0xhome
      </Text>

      {menuItems.map((item, index) => (
        <Interactive
          onSelect={(_) => {
            setPage(item.onClick);
          }}
        >
          <Text
            key={index}
            position={item.position}
            fontSize={0.08}
            color="black"
            anchorX="left"
            onClick={() => {
              setPage(item.onClick);
            }}
          >
            {item.label}
          </Text>
        </Interactive>
      ))}

      <Text
        position={[-0.25, -0.4, 0]}
        fontSize={0.08}
        color="gray"
        anchorX="left"
      >
        Categories
      </Text>

      {playlistItems.map((item, index) => (
        <Text
          key={index}
          position={item.position}
          fontSize={0.08}
          color="black"
          anchorX="left"
        >
          {item.label}
        </Text>
      ))}
    </group>
  );
}

function Header({ position, addr }) {
  return (
    <group position={position}>
      <Text
        position={[0, 0.09, 0]}
        fontSize={0.12}
        color="black"
        anchorX={"left"}
      >
        Good Morning
      </Text>
      <Text
        position={[0, -0.09, 0]}
        fontSize={0.09}
        color="black"
        anchorX={"left"}
      >
        Home / Trending
      </Text>
      <Text
        position={[2.55, -0.09, 0]}
        fontSize={0.09}
        color="black"
        anchorX={"left"}
      >
        {addr}
      </Text>
    </group>
  );
}

function ImagePlane(props) {
  const texture = useTexture(
    props.cors ? props.url : "https://cors-anywhere.herokuapp.com/" + props.url
  );

  useMemo(() => {
    if (texture) {
      const [width, height] = props.args;
      const imageAspect = texture.image.width / texture.image.height;
      const planeAspect = width / height;

      if (imageAspect > planeAspect) {
        // Image is wider than plane
        texture.repeat.set(planeAspect / imageAspect, 1);
        texture.offset.set((1 - planeAspect / imageAspect) / 2, 0);
      } else {
        // Image is taller than plane
        texture.repeat.set(1, imageAspect / planeAspect);
        texture.offset.set(0, (1 - imageAspect / planeAspect) / 2);
      }

      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
    }
  }, [texture, props.args]);

  const shadeConfig = useMemo(() => {
    const [width, height] = props.args;
    const shadeHeight = height * 0.3; // 30% of the image height
    const shadePosition = new Vector3(0, -height / 2 + shadeHeight / 2, 0.001);
    const shadeScale = new Vector3(width, shadeHeight, 1);
    return { position: shadePosition, scale: shadeScale };
  }, [props.args]);

  return (
    <group position={props.position} onClick={props.onClick}>
      <Plane args={props.args}>
        <meshBasicMaterial map={texture} />
      </Plane>
      <Plane scale={shadeConfig.scale} position={shadeConfig.position}>
        <meshBasicMaterial
          color="black"
          transparent
          opacity={props.opacity ?? 0.5}
        />
      </Plane>
    </group>
  );
}

function WeeklyTop40({ position, setPage }) {
  const trendingItems = [
    {
      label: "NeoNexus",
      position: [0.05, -0.73, 0],
      url: "https://cdn.ddecor.com/media/amasty/amoptmobile/wysiwyg/Bohemian_1_Main-opt.jpg",
    },
    {
      label: "Virtual Vistas",
      position: [0.85, -0.73, 0],
      url: "https://ashlos.com/cdn/shop/products/71HE7MD1yYL._AC_SL1500.jpg?v=1671198476",
    },

    {
      label: "Bitscape",
      position: [1.65, -0.73, 0],
      url: "https://thearchitectsdiary.com/wp-content/uploads/2020/09/manoj-patel-14-850x1024.jpg",
    },
    {
      label: "PixelPalace",
      position: [2.45, -0.73, 0],
      url: "https://www.granddesignsmagazine.com/wp-content/uploads/2021/04/Pluto-Dark-Blue-Pendant-Lamprecycled-paper-mache-header.jpg",
    },
  ];
  return (
    <group position={position}>
      <Text position={[0, 0, 0]} fontSize={0.08} color="black" anchorX={"left"}>
        Weekly Top 10
      </Text>
      {trendingItems.map((item, index) => (
        <Interactive onSelect={(_) => setPage("collection")}>
          <ImagePlane
            args={[0.7, 0.7]}
            url={item.url}
            position={[
              item.position[0] + 0.3,
              item.position[1] + 0.25,
              item.position[2] - 0.01,
            ]}
            onClick={() => {
              setPage("collection");
            }}
          />
          <Text
            position={item.position}
            fontSize={0.07}
            color="white"
            fontWeight={"bold"}
            anchorX={"left"}
          >
            {item.label}
          </Text>
        </Interactive>
      ))}
    </group>
  );
}

function TrendingPlaylist({ position }) {
  const trendingItems = [
    {
      label: "Living Room",
      position: [0.05, -0.73, 0],
      url: "https://designerapp.officeapps.live.com/designerapp/document.ashx?path=/a46ec49d-c2fe-4ad9-9bd0-b3e654e36de8/DallEGeneratedImages/dalle-ba399e1a-ece7-43ac-8a48-42528a95bdb40251682550105864744000.jpg&dcHint=JapanEast&fileToken=050df61d-5b04-4c58-a5d9-ae24d211d560",
    },
    {
      label: "Gaming Room",
      position: [0.85, -0.73, 0],
      url: "https://designerapp.officeapps.live.com/designerapp/document.ashx?path=/a46ec49d-c2fe-4ad9-9bd0-b3e654e36de8/DallEGeneratedImages/dalle-4cef252b-178d-479c-b3e4-053a5048b34c0251682550346854911900.jpg&dcHint=JapanEast&fileToken=050df61d-5b04-4c58-a5d9-ae24d211d560",
    },
    {
      label: "Office Space",
      position: [1.65, -0.73, 0],
      url: "https://designerapp.officeapps.live.com/designerapp/document.ashx?path=/a46ec49d-c2fe-4ad9-9bd0-b3e654e36de8/DallEGeneratedImages/dalle-0d70e315-67f1-4a54-b8a1-111d314f2d560251682550153193629500.jpg&dcHint=JapanEast&fileToken=050df61d-5b04-4c58-a5d9-ae24d211d560",
    },
    {
      label: "Bedroom",
      position: [2.45, -0.73, 0],
      url: "https://designerapp.officeapps.live.com/designerapp/document.ashx?path=/a46ec49d-c2fe-4ad9-9bd0-b3e654e36de8/DallEGeneratedImages/dalle-31473018-bddd-40bb-8699-4cad63a1be6a0251682550205386723300.jpg&dcHint=JapanEast&fileToken=050df61d-5b04-4c58-a5d9-ae24d211d560",
    },
  ];
  return (
    <group position={position}>
      <Text position={[0, 0, 0]} fontSize={0.08} color="black" anchorX={"left"}>
        Trending Categories
      </Text>
      {trendingItems.map((item, index) => (
        <>
          <ImagePlane
            args={[0.7, 0.7]}
            url={item.url}
            position={[
              item.position[0] + 0.3,
              item.position[1] + 0.25,
              item.position[2] - 0.01,
            ]}
          />
          <Text
            position={item.position}
            fontSize={0.07}
            color="white"
            fontWeight={"bold"}
            anchorX={"left"}
          >
            {item.label}
          </Text>
        </>
      ))}
    </group>
  );
}

function ArtistInfo({ position, collectionName, url }) {
  return (
    <group position={position}>
      <Text
        position={[-0.05, -0.53, 0]}
        fontSize={0.09}
        color="white"
        fontWeight={"bold"}
        anchorX={"left"}
      >
        {collectionName}
      </Text>
      <ImagePlane args={[3, 0.8]} url={url} position={[1.4, -0.3, -0.01]} />
      <Text
        position={[-0.05, -0.63, 0]}
        fontSize={0.06}
        color="white"
        anchorX={"left"}
      >
        241 tokens total
      </Text>
    </group>
  );
}

function TopPlaylist({ position, setPage }) {
  const playlists = [
    {
      id: 1,
      title: "House Plant",
      mints: "932",
      price: "0.000777",
      chain: "Zero Sepolia",
      imgSrc: "plant.png",
    },
    {
      id: 2,
      title: "Cozy Sofa",
      mints: "756",
      price: "0.000777",
      chain: "Zero Sepolia",
      imgSrc:
        "https://i0.wp.com/www.melaniejadedesign.com/wp-content/uploads/2023/07/cozy-living-6.png?resize=896%2C1344&ssl=1",
    },
    {
      id: 3,
      title: "Lamp",
      mints: "471",
      price: "0.000777",
      chain: "Zero Sepolia",
      imgSrc:
        "https://anantadesigns.in/cdn/shop/products/Lifestyleimage4_74d950a3-4bd2-40fe-a70d-125469264f9f.jpg?v=1681451514",
    },
    {
      id: 4,
      title: "Center Table",
      mints: "127",
      price: "0.000777",
      chain: "Zero Sepolia",
      imgSrc: "https://kartgo.in/wp-content/uploads/2023/03/4-4.jpg",
    },
  ];

  return (
    <group position={position}>
      <Text
        position={[0, 0.43, 0]}
        fontSize={0.08}
        color="black"
        anchorX={"left"}
      >
        Top Mints
      </Text>
      {playlists.map((playlist, index) => (
        <Interactive
          onSelect={(_) => {
            setPage("mint");
          }}
        >
          <group
            key={playlist.id}
            position={[0.53, 0.2 - index * 0.3, 0]}
            onClick={() => {
              setPage("mint");
            }}
          >
            <ImagePlane
              url={playlist.imgSrc}
              position={[-0.4, 0, 0.01]}
              args={[0.25, 0.25]}
              opacity={0}
              cors={playlist.id === 1 ? true : false}
            />
            <Text
              position={[-0.2, 0, 0]}
              fontSize={0.065}
              color="black"
              anchorX={"left"}
            >
              {playlist.title}
            </Text>

            <Text
              position={[0.6, 0, 0]}
              fontSize={0.05}
              color="black"
              anchorX={"left"}
            >
              {playlist.mints} Total Mints
            </Text>
            <Text
              position={[1.4, 0, 0]}
              fontSize={0.05}
              color="black"
              anchorX={"left"}
            >
              {playlist.chain}
            </Text>
            <Text
              position={[2, 0, 0]}
              fontSize={0.05}
              color="black"
              anchorX={"left"}
            >
              {playlist.price} ETH
            </Text>
          </group>
        </Interactive>
      ))}
    </group>
  );
}

function BackButton({ position, onClick }) {
  return (
    <group position={position} onClick={onClick}>
      <Interactive onSelect={onClick}>
        <Text
          position={[0, 0, 0]}
          fontSize={0.07}
          color="black"
          anchorX={"left"}
        >
          {"< Back"}
        </Text>
      </Interactive>
    </group>
  );
}

function Key({ label, onClick, position }) {
  return (
    <group position={position} onPointerDown={() => onClick(label)}>
      <Plane args={[0.2, 0.2]}>
        <meshStandardMaterial
          color="white"
          roughness={0.9}
          transparent={true}
          opacity={0.8}
          metalness={0}
        />
      </Plane>
      <Text position={[0, 0, 0.01]} fontSize={0.08} color="black">
        {label}
      </Text>
    </group>
  );
}

function VirtualKeyboard({ onKeyPress, caps }) {
  const keys = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "Q",
    "W",
    "E",
    "R",
    "T",
    "Y",
    "U",
    "I",
    "O",
    "P",
    "A",
    "S",
    "D",
    "F",
    "G",
    "H",
    "J",
    "K",
    "L",
    "Z",
    "X",
    "C",
    "V",
    "B",
    "N",
    "M",
    "SP",
    "DEL",
    "ENT",
    "CAPS",
  ];

  function getActualKey(caps, key) {
    if (key === "SP" || key === "DEL" || key === "ENT" || key === "CAPS") {
      return key;
    }
    if (caps) {
      return key.toUpperCase();
    } else {
      return key.toLowerCase();
    }
  }

  return (
    <group position={[2, -1.7, 0]}>
      {keys.map((key, index) => {
        const x = (index % 10) * 0.2 - 2.7;
        const y = -Math.floor(index / 10) * 0.2;
        const actualKey = getActualKey(caps, key);
        return (
          <Interactive onSelect={() => onKeyPress(actualKey)}>
            <Key
              key={actualKey}
              label={actualKey}
              onClick={onKeyPress}
              position={[x, y, 0]}
            />
          </Interactive>
        );
      })}
    </group>
  );
}

function TextInput({ position, text, setText, hint }) {
  const [active, setActive] = useState(false);
  const [caps, setCaps] = useState(true);
  const handleKeyPress = (key) => {
    setCaps(false);
    if (key === "DEL") {
      setText(text.slice(0, -1));
    } else if (key === "SP") {
      setText(text + " ");
    } else if (key === "ENT") {
      setActive(false);
    } else if (key === "CAPS") {
      setCaps(!caps);
    } else {
      setText(text + key);
    }
  };

  const RoundedPlane = ({ width, height, radius, position, color }) => {
    const geometry = useMemo(() => {
      const shape = new THREE.Shape();
      const x = -width / 2;
      const y = -height / 2;

      shape.moveTo(x + radius, y);
      shape.lineTo(x + width - radius, y);
      shape.quadraticCurveTo(x + width, y, x + width, y + radius);
      shape.lineTo(x + width, y + height - radius);
      shape.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      shape.lineTo(x + radius, y + height);
      shape.quadraticCurveTo(x, y + height, x, y + height - radius);
      shape.lineTo(x, y + radius);
      shape.quadraticCurveTo(x, y, x + radius, y);

      const extrudeSettings = {
        steps: 1,
        depth: 0.01,
        bevelEnabled: false,
      };

      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, [width, height, radius]);

    return (
      <mesh geometry={geometry} position={position}>
        <meshBasicMaterial color={color} />
      </mesh>
    );
  };

  return (
    <group>
      <Interactive
        onSelect={(_) => {
          setActive(true);
        }}
      >
        <RoundedPlane
          width={1.35}
          height={0.25}
          radius={0.05}
          position={[position[0] + 0.5, position[1], position[2] - 0.02]}
          color="white"
        />
        <Text
          position={position}
          fontSize={0.06}
          color={text ? "black" : "gray"}
          anchorX={"left"}
          onClick={() => {
            setActive(true);
          }}
        >
          {text || hint}
        </Text>
      </Interactive>
      {active && <VirtualKeyboard onKeyPress={handleKeyPress} caps={caps} />}
    </group>
  );
}

export default Menu;
