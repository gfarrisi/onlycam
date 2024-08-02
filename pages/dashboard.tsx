import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Head from "next/head";
import { useSmartAccount } from "../hooks/SmartAccountContext";
import { BASE_GOERLI_SCAN_URL, NFT_ADDRESS } from "../lib/constants";
import { encodeFunctionData } from "viem";
import ABI from "../lib/nftABI.json";
import { ToastContainer, toast } from "react-toastify";
import { Alert } from "../components/AlertWithLink";
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  FormControl,
  Image,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();
  const {
    smartAccountAddress,
    smartAccountProvider,
    sendSponsoredUserOperation,
    eoa,
  } = useSmartAccount();
  const [myFoto, setMyFoto] = useState<string>("");
  const [fileImage, setFileImage] = useState<File>();
  // const toast = useToast();

  type MimeType = "image/jpeg" | "image/png";

  useEffect(() => {
    const myPhoto = localStorage.getItem("myPhoto");

    if (myPhoto && typeof myPhoto === "string") {
      setMyFoto(myPhoto);
      urltoFile(myPhoto, "myPhotos.jpeg", "image/jpeg").then((file) => {
        setFileImage(file);
      });
    }
  }, [myFoto]);

  // Convert from base64 format to image file
  function urltoFile(
    url: string,
    filename: string,
    mimeType: MimeType
  ): Promise<File> {
    return fetch(url)
      .then((res) => {
        return res.arrayBuffer();
      })
      .then((buf) => {
        return new File([buf], filename, { type: mimeType });
      });
  }

  function reSelfie() {
    router.push({
      pathname: "/camera",
    });
  }
  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
        headers: {
          "content-type": "multipart/form-data",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      // Assuming the server responds with the URL of the uploaded image
      // setMyFoto(data.url);
      toast({
        title: "Image uploaded successfully to " + data.url,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      toast({
        title: "Image upload failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }

  //css
  const imageResult = {
    "border-radius": "50%",
    "object-fit": "cover",
  };

  // If the user is not authenticated, redirect them back to the landing page
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const isLoading = !smartAccountAddress || !smartAccountProvider;
  const [isMinting, setIsMinting] = useState(false);

  const onMint = async () => {
    // The mint button is disabled if either of these are undefined
    if (!smartAccountProvider || !smartAccountAddress) return;

    // Store a state to disable the mint button while mint is in progress
    setIsMinting(true);
    const toastId = toast.loading("Minting...");

    try {
      // From a viem `RpcTransactionRequest` (e.g. calling an ERC-721's `mint` method),
      // build and send a user operation. Gas fees will be sponsored by the Base Paymaster.
      const userOpHash = await sendSponsoredUserOperation({
        from: smartAccountAddress,
        to: NFT_ADDRESS,
        data: encodeFunctionData({
          abi: ABI,
          functionName: "mint",
          args: [smartAccountAddress],
        }),
      });

      toast.update(toastId, {
        render: "Waiting for your transaction to be confirmed...",
        type: "info",
        isLoading: true,
      });

      // Once we have a hash for the user operation, watch it until the transaction has
      // been confirmed.
      const transactionHash =
        await smartAccountProvider.waitForUserOperationTransaction(userOpHash);

      toast.update(toastId, {
        render: (
          <Alert href={`${BASE_GOERLI_SCAN_URL}/tx/${transactionHash}`}>
            Successfully minted! Click here to see your transaction.
          </Alert>
        ),
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
    } catch (error) {
      console.error("Mint failed with error: ", error);
      toast.update(toastId, {
        render: (
          <Alert>
            There was an error sending your transaction. See the developer
            console for more info.
          </Alert>
        ),
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }

    setIsMinting(false);
    router.push("/camera");
  };

  return (
    <>
      <Head>
        <title>OnlyCam</title>
      </Head>

      <>
        {ready && authenticated && !isLoading ? (
          <>
            <Box
              bgImage={{ base: "none", md: "/112.png", lg: "/112.png" }}
              bgPosition="center"
              bgSize="cover"
              h="100vh"
            >
              <Center>
                <Box
                  maxW="sm"
                  mt={{ base: "0px", md: "10px", lg: "10px" }}
                  height={{ base: "100%", md: "50%", lg: "25%" }}
                  width={{ base: "600px", md: "50%", lg: "25%" }}
                  borderWidth={{ base: "0px", md: "1px", lg: "1px" }}
                  bg="teal.400"
                  justifyContent="center"
                  overflow="hidden"
                  borderRadius="lg"
                  rounded={24}
                >
                  <Flex direction="column" background="white" p={30}>
                    <Box>
                      <Box h="75px">
                        <Center>
                          <img
                            src="/favicons/icon.svg"
                            width="70px"
                            height="70px"
                            alt="Logo"
                          />
                        </Center>
                      </Box>
                      <Box mt={10}>
                        <Center>
                          <Image
                            borderRadius="full"
                            boxSize="60%"
                            objectPosition="-10% 10%"
                            src={myFoto.replace("data:image/jpeg;base64,:", "")}
                            objectFit={"cover"}
                            style={{
                              borderRadius: 10,
                            }}
                          />
                        </Center>
                      </Box>
                      <FormControl mt={14} mb={4}>
                        <Stack>
                          <Text
                            align={"center"}
                            fontSize="2xl"
                            color={"#black"}
                            as="b"
                          >
                            Check your verified selfie
                          </Text>
                        </Stack>
                      </FormControl>
                      <FormControl mt={4}>
                        <Stack spacing={0}>
                          <Text
                            align={"center"}
                            fontSize="sm"
                            color={"#707070"}
                          >
                            OnlyCam verifies the
                          </Text>
                          <Text
                            align={"center"}
                            fontSize="sm"
                            color={"#707070"}
                          >
                            authenticity of your photos.
                          </Text>
                        </Stack>
                      </FormControl>
                      <FormControl mt={10} mb={10}>
                        <Center>
                          <Button
                            colorScheme="blue"
                            width="60%"
                            variant="outline"
                            rounded={10}
                            onClick={reSelfie}
                            style={{
                              border: `2px solid #FFF3E7`,
                              padding: 5,
                              backgroundColor: "white",
                            }}
                          >
                            Retake photo
                          </Button>
                        </Center>
                      </FormControl>
                      <FormControl mt={6}>
                        <Center>
                          <button
                            onClick={onMint}
                            // onClick={() => fileImage && uploadImage(fileImage)}
                            className="text-sm bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 py-2 px-4 rounded-md text-white"
                            disabled={isLoading || isMinting}
                          >
                            Mint NFT
                          </button>
                        </Center>
                      </FormControl>
                    </Box>
                  </Flex>
                </Box>
              </Center>
            </Box>
          </>
        ) : null}
      </>
    </>
  );
}
